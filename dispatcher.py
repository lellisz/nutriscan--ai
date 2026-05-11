"""
dispatcher.py — PRAXIS Autonomous Agent Loop v5
Substitui dispatcher.py v4 + agent_loop.sh

Fluxo:
  1. Lê TASKS.json a cada ciclo
  2. Despacha task pelo agente correto
  3. Gate: tsc --noEmit antes de marcar done
  4. Git commit automático após cada task
  5. Encerra limpo quando não há mais tasks pending

Agentes suportados:
  codex    → Codex CLI
  gemini   → Gemini CLI
  *        → Claude headless + bootstrap_prompt.md (Director autônomo)

Inicie com: python dispatcher.py
"""

import json
import subprocess
import time
import logging
import sys
import os
from pathlib import Path
from datetime import datetime, timezone

# ─── CONFIG ───────────────────────────────────────────────────────────────────
PROJECT_DIR     = Path("C:/projetos/praxis")
TASKS_FILE      = PROJECT_DIR / "TASKS.json"
LOG_FILE        = PROJECT_DIR / "dispatch.log"

CLAUDE_PATH = Path("C:/Users/felip/.local/bin/claude")
CODEX_PATH  = Path("C:/Users/felip/AppData/Roaming/npm/codex.cmd")
GEMINI_PATH = Path("C:/Users/felip/AppData/Roaming/npm/gemini.cmd")

RUNNING_TIMEOUT_SEC = 20 * 60   # 20 min — reseta tasks travadas
IDLE_EXIT_CYCLES    = 6         # encerra após N ciclos idle consecutivos (~60s)
CYCLE_SLEEP_SEC     = 10

# ─── LOGGING ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("dispatcher")


# ─── AMBIENTE ─────────────────────────────────────────────────────────────────
def clean_env() -> dict:
    """Remove ANTHROPIC_API_KEY para Claude usar OAuth (subscription)."""
    env = os.environ.copy()
    env.pop("ANTHROPIC_API_KEY", None)
    env.pop("ANTHROPIC_API_KEY_HELPER", None)
    return env


# ─── TASKS ────────────────────────────────────────────────────────────────────
def load_tasks() -> list:
    return json.loads(TASKS_FILE.read_text(encoding="utf-8"))


def save_tasks(tasks: list):
    TASKS_FILE.write_text(
        json.dumps(tasks, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def get_done_ids(tasks: list) -> set:
    return {t["id"] for t in tasks if t["status"] == "done"}


def reset_stale_running(tasks: list) -> bool:
    changed = False
    now = datetime.now(timezone.utc)
    for t in tasks:
        if t["status"] != "running":
            continue
        ts = t.get("updated_at") or t.get("completed_at")
        if not ts:
            t["status"] = "pending"
            changed = True
            log.warning(f"Reset travada (sem timestamp): {t['id']}")
            continue
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if (now - dt).total_seconds() > RUNNING_TIMEOUT_SEC:
                t["status"] = "pending"
                changed = True
                log.warning(f"Reset travada ({int((now-dt).total_seconds())}s): {t['id']}")
        except Exception:
            t["status"] = "pending"
            changed = True
    return changed


def can_run(task: dict, all_tasks: list) -> bool:
    statuses = {t["id"]: t["status"] for t in all_tasks}
    for dep in task.get("depends_on", []):
        if statuses.get(dep) not in ("done", "failed"):
            return False
    return True


# ─── GATE: tsc --noEmit ───────────────────────────────────────────────────────
def typescript_gate() -> bool:
    """Roda rtk tsc --noEmit. Retorna True se sem erros."""
    try:
        r = subprocess.run(
            ["rtk", "tsc", "--noEmit"],
            capture_output=True, text=True,
            timeout=120, cwd=str(PROJECT_DIR),
        )
        if r.returncode == 0:
            log.info("  [gate] tsc --noEmit: OK")
            return True
        else:
            log.error(f"  [gate] tsc --noEmit: FALHOU\n{(r.stdout + r.stderr)[:600]}")
            return False
    except Exception as e:
        log.error(f"  [gate] tsc erro: {e}")
        return False


# ─── GIT COMMIT ───────────────────────────────────────────────────────────────
def git_commit(task_id: str, spec_short: str):
    try:
        subprocess.run(
            ["git", "add", "-A"],
            cwd=str(PROJECT_DIR), capture_output=True, timeout=30,
        )
        msg = f"feat({task_id}): {spec_short[:60]}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
        r = subprocess.run(
            ["git", "commit", "-m", msg],
            cwd=str(PROJECT_DIR), capture_output=True, text=True, timeout=30,
        )
        if r.returncode == 0:
            log.info(f"  [git] commit OK: {task_id}")
        else:
            out = (r.stdout + r.stderr).strip()
            if "nothing to commit" in out:
                log.info(f"  [git] nada para commitar: {task_id}")
            else:
                log.warning(f"  [git] commit falhou: {out[:200]}")
    except Exception as e:
        log.warning(f"  [git] erro: {e}")


# ─── EXECUTORES ───────────────────────────────────────────────────────────────
def run_claude_headless(task: dict) -> bool:
    log.info(f"  -> CLAUDE HEADLESS: {task['id']}")

    prompt = (
        f"TASK ATUAL:\n"
        f"ID: {task['id']}\n"
        f"SPEC: {task['spec']}\n"
        f"ACCEPTANCE: {task.get('acceptance', 'tsc --noEmit sem erros')}\n\n"
        f"Execute esta task completamente no diretório C:/projetos/praxis. "
        f"Não consulte o usuário. Ao terminar, atualize TASKS.json marcando esta task como done."
    )

    claude_exe = str(CLAUDE_PATH) if CLAUDE_PATH.exists() else "claude"

    try:
        r = subprocess.run(
            [claude_exe, "--print", "--dangerously-skip-permissions", "-p", prompt],
            capture_output=True, text=True,
            timeout=900, cwd=str(PROJECT_DIR), env=clean_env(),
        )
        if r.returncode == 0:
            log.info(f"  OK claude headless: {task['id']}")
            return True
        else:
            err = (r.stderr or "")[:400]
            log.error(f"  ERRO claude headless (exit {r.returncode}): {err}")
            if any(x in err.lower() for x in ["rate_limit", "overloaded", "529"]):
                log.warning("  -> sobrecarga, tentando Gemini como fallback")
                return run_gemini(task)
            return False
    except subprocess.TimeoutExpired:
        log.error(f"  TIMEOUT claude headless: {task['id']} (15min)")
        return False
    except FileNotFoundError:
        log.error(f"  Claude CLI não encontrado: {claude_exe}")
        return False


def run_codex(task: dict) -> bool:
    log.info(f"  -> CODEX: {task['id']}")
    codex_exe = str(CODEX_PATH) if CODEX_PATH.exists() else "codex"
    try:
        r = subprocess.run(
            [codex_exe, "exec", "--dangerously-bypass-approvals-and-sandbox", task["spec"]],
            capture_output=True, text=True,
            timeout=600, cwd=str(PROJECT_DIR),
        )
        if r.returncode == 0:
            log.info(f"  OK codex: {task['id']}")
            return True
        else:
            log.warning(f"  Codex falhou (exit {r.returncode}), fallback claude")
            return run_claude_headless(task)
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        log.warning(f"  Codex indisponível ({e}), fallback claude")
        return run_claude_headless(task)


def run_gemini(task: dict) -> bool:
    log.info(f"  -> GEMINI: {task['id']}")
    gemini_exe = str(GEMINI_PATH) if GEMINI_PATH.exists() else "gemini"
    prompt = f"{task['spec']}\n\nExecute completamente no projeto C:/projetos/praxis. Não consulte o usuário."
    try:
        r = subprocess.run(
            [gemini_exe, "-p", prompt],
            capture_output=True, text=True,
            timeout=600, cwd=str(PROJECT_DIR),
        )
        if r.returncode == 0:
            log.info(f"  OK gemini: {task['id']}")
            return True
        else:
            log.warning(f"  Gemini falhou, fallback claude")
            return run_claude_headless(task)
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        log.warning(f"  Gemini indisponível ({e}), fallback claude")
        return run_claude_headless(task)


def dispatch(task: dict) -> bool:
    agent = task.get("agent", "director").lower()
    if agent == "codex":
        return run_codex(task)
    elif agent == "gemini":
        return run_gemini(task)
    else:
        # director, cursor, antigravity, sonnet-direto, ui → todos viram claude headless
        return run_claude_headless(task)


# ─── LOOP PRINCIPAL ───────────────────────────────────────────────────────────
def main():
    log.info("=" * 60)
    log.info("PRAXIS DISPATCHER v5 — loop autônomo")
    log.info("=" * 60)

    if not TASKS_FILE.exists():
        log.error(f"TASKS.json não encontrado: {TASKS_FILE}")
        return

    # Testa Claude antes de começar
    log.info("Verificando Claude CLI...")
    claude_exe = str(CLAUDE_PATH) if CLAUDE_PATH.exists() else "claude"
    r = subprocess.run(
        [claude_exe, "--print", "--dangerously-skip-permissions", "-p", "responda: OK"],
        capture_output=True, text=True, timeout=30,
        cwd=str(PROJECT_DIR), env=clean_env(),
    )
    if r.returncode != 0:
        log.error(f"Claude CLI não autenticado: {(r.stderr or r.stdout)[:200]}")
        log.error("Execute 'claude login' e tente novamente.")
        return
    log.info(f"Claude CLI OK")

    # Testa RTK disponível
    try:
        subprocess.run(["rtk", "--version"], capture_output=True, timeout=10)
        log.info("RTK (token killer) disponível — economia ativada")
    except FileNotFoundError:
        log.warning("RTK não encontrado, comandos sem filtro de saída")

    idle_cycles = 0

    while True:
        try:
            tasks = load_tasks()
        except (json.JSONDecodeError, FileNotFoundError) as e:
            log.error(f"Erro lendo TASKS.json: {e}")
            time.sleep(CYCLE_SLEEP_SEC)
            continue

        if reset_stale_running(tasks):
            save_tasks(tasks)

        pending = [t for t in tasks if t["status"] == "pending"]

        if not pending:
            idle_cycles += 1
            if idle_cycles == 1:
                counts = {}
                for t in tasks:
                    counts[t["status"]] = counts.get(t["status"], 0) + 1
                log.info("STATUS: " + " | ".join(f"{k}:{v}" for k, v in sorted(counts.items())))
                log.info("Sem tasks pendentes. Aguardando TASKS.json ser atualizado pelo Director...")
            if idle_cycles >= IDLE_EXIT_CYCLES:
                log.info(f"Idle por {idle_cycles * CYCLE_SLEEP_SEC}s sem novas tasks. Encerrando.")
                break
            time.sleep(CYCLE_SLEEP_SEC)
            continue

        idle_cycles = 0

        executed = False
        for task in sorted(pending, key=lambda t: t.get("priority", 99)):
            if not can_run(task, tasks):
                log.info(f"  bloqueada por deps: {task['id']} -> {task.get('depends_on')}")
                continue

            # Marcar running
            task["status"] = "running"
            task["updated_at"] = datetime.now(timezone.utc).isoformat()
            save_tasks(tasks)

            log.info(f"\n{'─'*50}")
            log.info(f"EXECUTANDO: {task['id']} | agente: {task.get('agent', 'director')}")
            log.info(f"spec: {task['spec'][:120]}")

            ok = dispatch(task)

            # Gate TypeScript — só marca done se tsc passar
            if ok:
                ok = typescript_gate()
                if not ok:
                    log.error(f"  task {task['id']}: tsc falhou → marcando failed")

            task["status"] = "done" if ok else "failed"
            task["completed_at"] = datetime.now(timezone.utc).isoformat()
            task.pop("updated_at", None)
            save_tasks(tasks)

            log.info(f"RESULTADO: {task['id']} -> {'DONE ✓' if ok else 'FAILED ✗'}")

            if ok:
                git_commit(task["id"], task["spec"])

            executed = True
            time.sleep(2)  # pausa entre tasks

        if not executed:
            log.info("  Todas pendentes bloqueadas por deps. Aguardando...")
            time.sleep(15)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("\nDispatcher encerrado pelo usuário.")
