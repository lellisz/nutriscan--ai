---
tags: [bug, nutriscan, auth, supabase, token]
data: 2026-03-15
status: resolvido
---

## Erro
Apos algum tempo logado, requisicoes comecam a falhar com HTTP 401. Usuario precisa relogar manualmente.

## Causa
Token JWT do Supabase expira. Sem refresh automatico, todas as requests falham.

## Solucao
Interceptor no API client que detecta 401 e faz refresh transparente:

```javascript
if (response.status === 401) {
  const { data } = await supabase.auth.refreshSession();
  // Retry request original com novo token
  return this.fetch(endpoint, options);
}
```

**Arquivo afetado:** `src/lib/api/client.js`

## Relacionados
- [[bug-auth-state-listener]] — complemento para auth
- [[bug-profile-load-resiliente]] — graceful degradation
- [[Coach Nutri]]
