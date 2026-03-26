---
tags: [bug, praxis-nutri]
status: resolvido
data: 2026-03-22
---

## Sintoma
Ao rodar `npm run dev`, o dev-server detectava "Porta 3002 ja em uso" e saia silenciosamente (exit code 0). O servidor antigo continuava rodando com chaves de API velhas/invalidas. Todas as chamadas ao Coach IA falhavam com 401.

## Causa raiz
O processo `node api/dev-server.js` (PID 24268) nao foi encerrado quando o usuario atualizou as chaves no .env. O dev-server carrega as env vars na inicializacao e nunca as recarrega. O novo processo detectava a porta ocupada e saia, deixando o antigo (com chaves invalidas) servindo requests.

## Fix
1. Identificar PID via `netstat -ano | grep :3002`
2. Confirmar processo via `wmic process where ProcessId=24268`
3. Encerrar: `taskkill //PID 24268 //F`
4. Reiniciar: `node api/dev-server.js`

## Como prevenir
- O dev-server ja tem logica de detecao de porta ocupada, mas a mensagem "ja em uso -- OK!" e enganosa
- Considerar: matar processo existente automaticamente, ou mostrar aviso mais claro
- Em dev, sempre reiniciar o servidor apos alterar .env

## Links
- [[2026-03-22-coach-ia-evolution]]
