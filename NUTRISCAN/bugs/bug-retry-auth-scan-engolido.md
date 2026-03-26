---
tags: [bug, nutriscan, ia, scan]
data: 2026-03-22
status: resolvido
---

## Erro
Quando um provider de IA retorna 401/403 (chave invalida), o scan demora ~3 segundos extras antes de acionar o fallback.

## Causa
Em `api/scan.js`, os blocos `catch` de `callGroqWithRetry`, `callGeminiWithRetry` e `callAnthropicWithRetry` nao diferenciavam erros de autenticacao de erros transientes. Um 401 era capturado e retentado 3 vezes (com backoff de 1s + 2s) antes de propagar — desperdicando tempo com a mesma chave invalida.

Obs: o `chat.js` ja tinha esse fix implementado na sessao anterior (2026-03-22). O `scan.js` ficou para tras.

## Solucao
Adicionar guard no `catch` de cada funcao de retry que relanca imediatamente se a mensagem de erro contem '401', '403', 'invalida' ou 'unauthorized'.

## Aprendizado
Erros de autenticacao sao deterministicos — retentá-los so desperdia tempo e requests. Retry so faz sentido para erros transientes (timeout, 429, 500, rede).

## Referencias
- [[Coach Nutri]]
- [[bug-retry-desnecessario-401]]
