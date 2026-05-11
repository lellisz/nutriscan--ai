---
description: Salva ou carrega o estado completo da sessão PRAXIS — substitui context-load, lê TASKS.json, git, dispatcher e gera briefing compacto ou atualiza HANDOFF.md
allowed-tools: Read, Bash, Glob, Grep, Write
---

# PRAXIS Handoff

## Modo
$ARGUMENTS
(padrão: `load` | opções: `load`, `save`)

## Modo LOAD — Iniciar Sessão

### 1. Estado do git
```
Branch atual: !`git branch --show-current`
Últimos commits: !`rtk git log --oneline -5`
Status: !`rtk git status`
```

### 2. Estado das Tasks
Ler `C:/projetos/praxis/TASKS.json` e resumir por status:
- **done**: quantas e quais foram as últimas 3
- **running**: quais estão em execução (há quanto tempo?)
- **pending**: quantas e quais são as prioritárias
- **failed**: quais falharam e por quê (se disponível no log)

### 3. Estado do Dispatcher
Verificar `C:/projetos/praxis/dispatch.log`:
- Última linha e timestamp
- Se último log > 30min: dispatcher provavelmente parado
- Se última linha é erro: reportar erro específico

### 4. Gate TypeScript
Checar último resultado de tsc no log ou rodar rápido:
```bash
rtk tsc --noEmit 2>&1 | tail -5
```

### 5. HANDOFF.md
Ler `C:/projetos/praxis/HANDOFF.md` — seção "Prompt de continuidade" se existir.

### 6. Output do Briefing

```
## Briefing PRAXIS — [data]

Branch: [branch]
Tasks: [N done] | [N running] | [N pending] | [N failed]
Último commit: [hash] — [mensagem]
Dispatcher: [rodando/parado — último log há Xmin]
TypeScript: [X erros / limpo]

Pendências prioritárias:
1. [task ID] ([agente]) — [spec curta] [bloqueio se houver]
2. ...

Sugestão: [próxima ação concreta]
```

---

## Modo SAVE — Encerrar Sessão

### 1. Coletar estado atual
- Tasks por status (TASKS.json)
- Últimos 5 commits (`rtk git log --oneline -5`)
- Erros TypeScript se houver
- Últimas 30 linhas do dispatch.log

### 2. Escrever HANDOFF.md

Criar/atualizar `C:/projetos/praxis/HANDOFF.md` com:

```markdown
# HANDOFF PRAXIS — [data e hora]

## Estado das Tasks
[tabela: ID | agente | status | spec curta]

## Branch Atual
[branch] — [último commit]

## Dispatcher
[status + última atividade]

## TypeScript
[limpo / N erros com lista]

## Pendências Críticas
[lista de bloqueios e próximos passos]

## Prompt de Continuidade
> Retomando PRAXIS. Branch: [X]. Tasks pendentes: [Y]. 
> Próximo passo: [ação específica].
```

### 3. Confirmar gravação
Reportar: "HANDOFF.md atualizado em [timestamp]"

---

## Regras
- Nunca iniciar trabalho sem ter rodado o modo LOAD primeiro
- Sempre salvar com SAVE antes de encerrar sessão longa
- Se HANDOFF.md tiver mais de 24h, alertar que pode estar desatualizado
