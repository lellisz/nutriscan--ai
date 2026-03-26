---
tags: [bug, praxis-nutri]
status: resolvido
data: 2026-03-22
---

## Sintoma
Quando a chave Anthropic era invalida, o log mostrava 3 tentativas consecutivas com erro 401 antes de desistir. Desperdicio de tempo (~7 segundos) e requests.

## Causa raiz
A funcao `callAnthropicWithRetry()` em `api/chat.js` fazia retry em qualquer erro HTTP, incluindo 401 (autenticacao invalida). Retry so faz sentido em 429 (rate limit) e 5xx (erro do servidor).

## Fix
Adicionado guard antes do bloco de retry em `callAnthropicWithRetry`:

```javascript
if (response.status === 401 || response.status === 403) {
  console.error(`[ANTHROPIC] Auth error ${response.status} -- skipping retries`);
  throw new Error(`AI provider error (status ${response.status})`);
}
```

Arquivo: `api/chat.js`, dentro da funcao `callAnthropicWithRetry`

## Como prevenir
- Sempre classificar erros HTTP antes de retry: 4xx client errors nao devem ser retentados (exceto 429)
- Pattern: retry apenas em 429, 500, 502, 503, 504

## Links
- [[2026-03-22-coach-ia-evolution]]
