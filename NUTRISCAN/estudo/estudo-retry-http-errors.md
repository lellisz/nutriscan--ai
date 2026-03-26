---
tags: [estudo, backend, http, praxis-nutri]
data: 2026-03-22
sessao: [[2026-03-22-coach-ia-evolution]]
---

# Retry em Erros HTTP — Quando Sim, Quando Nao

## A regra de ouro
**Retry apenas erros temporarios. Nunca retry erros permanentes.**

## Tabela de decisao

| Status | Tipo | Retry? | Motivo |
|--------|------|--------|--------|
| 400 | Bad Request | NAO | Seu request esta errado. Reenviar o mesmo request vai dar o mesmo erro |
| 401 | Unauthorized | NAO | Chave invalida. Nao vai magicamente funcionar na proxima tentativa |
| 403 | Forbidden | NAO | Sem permissao. Problema de configuracao, nao de timing |
| 404 | Not Found | NAO | Recurso nao existe |
| 429 | Too Many Requests | SIM | Rate limit temporario. Espere e tente de novo |
| 500 | Internal Server Error | SIM | Erro do servidor, pode ser transitorio |
| 502 | Bad Gateway | SIM | Proxy/load balancer com problema momentaneo |
| 503 | Service Unavailable | SIM | Servidor sobrecarregado, tente depois |
| 504 | Gateway Timeout | SIM | Timeout, pode funcionar na proxima |

## Resumo: so retry em 429 e 5xx

```javascript
function shouldRetry(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}
```

## Exponential Backoff
Quando faz retry, nao faca imediatamente. Espere cada vez mais:

```javascript
// Tentativa 1: espera 1s
// Tentativa 2: espera 2s
// Tentativa 3: espera 4s
const waitTime = Math.pow(2, attempt) * 1000;
await new Promise(resolve => setTimeout(resolve, waitTime));
```

## O bug que aprendemos
No Praxis Nutri, o `callAnthropicWithRetry` fazia retry em 401. Resultado: 3 requests identicos falhando com "Invalid API Key", perdendo ~7 segundos. O fix foi adicionar um guard:

```javascript
if (response.status === 401 || response.status === 403) {
  throw new Error(`Auth error ${response.status}`); // Nao retry
}
```

## Links
- [[estudo-cascata-fallback]]
- [[bug-retry-desnecessario-401]]
