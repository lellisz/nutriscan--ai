---
description: Painel de controle do dispatcher PRAXIS — status das tasks, saúde do processo, tasks travadas, reset de falhas e instruções para iniciar/parar
allowed-tools: Read, Bash, Glob, Grep
---

# PRAXIS Dispatch Monitor

## Comando
$ARGUMENTS
(padrão: `status` | opções: `status`, `start`, `reset-failed`, `stop`)

---

## Modo STATUS (padrão)

### 1. Ler TASKS.json
Agrupar tasks por status e exibir:
- **done**: contagem total
- **running**: listar com tempo estimado de execução (se timestamp disponível)
- **pending**: listar em ordem de prioridade
- **failed**: listar com razão da falha (última linha de erro no dispatch.log)

### 2. Verificar saúde do dispatcher
```bash
# Últimas 20 linhas do log
tail -20 C:/projetos/praxis/dispatch.log

# Timestamp da última linha
```
- Se último log < 5min: **RODANDO**
- Se último log 5-30min: **POSSIVELMENTE PARADO**
- Se último log > 30min: **PARADO**

### 3. Detectar tasks travadas
Task com status `running` + último log > 20min = travada. Reportar.

### 4. Output do Painel

```
## PRAXIS Dispatcher — [timestamp]

Estado: [RODANDO 🟢 / POSSIVELMENTE PARADO 🟡 / PARADO 🔴]
(último log há Xmin)

Tasks: [N done] | [N running] | [N pending] | [N failed]

Pendentes prontas:
  [ID] ([agente]) — [spec curta]
  ...

Falhadas:
  [ID] — [razão]
  ...

[Sugestão de próximo passo]
```

---

## Modo START

Verificar pré-condições antes de sugerir iniciar:
1. Claude CLI disponível? `claude --version`
2. RTK disponível? `rtk --version 2>/dev/null || echo "não encontrado"`
3. Há tasks `running` travadas? (avisar antes de iniciar)
4. TASKS.json tem tasks `pending`? Se não, não há o que executar.

Se tudo OK:
```
Pré-condições: OK
Comando para iniciar:
  python C:/projetos/praxis/dispatcher.py

Recomendação: rodar em terminal separado para monitorar output.
```

---

## Modo RESET-FAILED

1. Listar todas as tasks com status `failed` e suas razões
2. Para cada uma, diagnosticar se é:
   - Erro de TypeScript → corrigir antes de resetar
   - Dep não instalada → `pnpm install` primeiro
   - Timeout → resetar direto
   - Erro de agente → resetar direto
3. Perguntar: "Resetar todas as failed para pending? (s/n)"
4. Se confirmado, atualizar TASKS.json

---

## Modo STOP

```
Para encerrar o dispatcher:
1. Pressione Ctrl+C no terminal onde está rodando
2. Ou identifique o PID: Get-Process python | Where-Object {$_.CommandLine -match 'dispatcher'}
3. Depois: Stop-Process -Id [PID]

Aviso: tasks com status 'running' não serão marcadas como failed automaticamente.
Após parar, rode /praxis-dispatch-monitor reset-failed se necessário.
```
