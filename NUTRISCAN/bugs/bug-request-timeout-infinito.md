---
tags: [bug, nutriscan, api, timeout, ux]
data: 2026-03-15
status: resolvido
---

## Erro
Requests lentos ficavam "pendentes" infinitamente. UI congelada sem feedback.

## Causa
Sem timeout no fetch. Se o servidor nao respondesse, a Promise nunca resolvia.

## Solucao
AbortController com timeout de 30 segundos:

```javascript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === "AbortError") {
    throw new Error("Requisicao demorou demais. Tente novamente.");
  }
}
```

**Arquivo afetado:** `src/lib/api/client.js`

## Relacionados
- [[bug-token-expirado-401]] — outra protecao no client
- [[Coach Nutri]]
