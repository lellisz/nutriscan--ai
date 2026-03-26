---
tags: [bug, nutriscan, api, seguranca, rate-limit]
data: 2026-03-17
status: resolvido
---

## Erro
Usuarios podiam enviar scans ilimitados, esgotando cota da API de IA rapidamente.

## Causa
Sem rate limiting no endpoint `api/scan.js`. Qualquer usuario autenticado podia fazer requests infinitos.

## Solucao
Classe `RateLimiter` in-memory no `api/scan.js`:
- **5 scans por 60 segundos** por usuario (sliding window)
- Cleanup automatico a cada 5 minutos (evita memory leak)
- Retorna HTTP 429 com header `Retry-After`

```javascript
class RateLimiter {
  constructor(maxRequests = 5, windowSeconds = 60) { ... }
  check(userId) { return { allowed, retryAfter }; }
  cleanup() { /* remove entradas expiradas */ }
}
```

**Arquivo afetado:** `api/scan.js` (linhas 9-73)

## Limitacao
Rate limiter e **in-memory** — reseta quando a serverless function faz cold start. Para protecao mais robusta, usar Redis ou Supabase.

## Relacionados
- [[bug-api-provider-unico-falha]] — resiliencia complementar
- [[bug-scan-free-tier]] — controle de cota do tier free
- [[Coach Nutri]]
