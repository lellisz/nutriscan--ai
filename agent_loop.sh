#!/bin/bash
# agent_loop.sh — DEPRECATED
# Substituído por dispatcher.py v5
# Execute: python C:/projetos/praxis/dispatcher.py

echo "========================================"
echo "  agent_loop.sh está DEPRECATED"
echo "  Use: python dispatcher.py"
echo "========================================"
exit 0

# ─── CÓDIGO ORIGINAL ABAIXO (não executa) ────────────────────────────────────

TASKS="C:/projetos/praxis/TASKS.json"
PROMPT_FILE="C:/Users/felip/Documents/Obsidian/_AI_SYSTEM/Agentes/AGENT_PROMPT.md"
PROJECT="C:/projetos/praxis"
LOG="C:/projetos/praxis/agent_loop.log"

log() {
  echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"
}

count_pending() {
  python -c "
import json, sys
try:
    tasks = json.load(open('$TASKS', encoding='utf-8'))
    print(len([t for t in tasks if t['status'] == 'pending']))
except:
    print(0)
"
}

log "============================================"
log "AGENT LOOP PRAXIS v2 — INICIADO"
log "Claude para? Eu reinicio em 5s automaticamente."
log "============================================"

SESSION=0

while true; do
  SESSION=$((SESSION + 1))
  log "SESSÃO #$SESSION iniciando..."

  # Verifica tasks pendentes antes de abrir Claude
  PENDING=$(count_pending)

  if [ "$PENDING" = "0" ]; then
    log "✓ TODAS AS TASKS CONCLUÍDAS — loop encerrado."
    break
  fi

  log "$PENDING tasks pendentes. Abrindo Claude Code..."

  # Salva estado git antes de iniciar
  cd "$PROJECT" && git add -A && git stash 2>/dev/null

  # Abre Claude Code headless com contexto mínimo
  if [ -f "$PROMPT_FILE" ]; then
    claude --print --dangerously-skip-permissions \
           -p "$(cat "$PROMPT_FILE")" \
           >> "$LOG" 2>&1
  else
    claude --print --dangerously-skip-permissions \
           -p "Leia C:/projetos/praxis/TASKS.json e execute todas as tasks pending. Nao me consulte." \
           >> "$LOG" 2>&1
  fi

  EXIT_CODE=$?
  log "Sessão #$SESSION encerrada. Exit code: $EXIT_CODE"

  # Verifica se ainda tem tasks
  PENDING=$(count_pending)

  if [ "$PENDING" = "0" ]; then
    log "✓ TODAS AS TASKS CONCLUÍDAS — loop encerrado."
    break
  fi

  log "$PENDING tasks ainda pendentes. Reiniciando em 5s..."
  sleep 5
done

log "Agent loop finalizado."
