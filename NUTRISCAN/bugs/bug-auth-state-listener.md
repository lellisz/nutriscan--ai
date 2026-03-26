---
tags: [bug, nutriscan, auth, supabase, state]
data: 2026-03-15
status: resolvido
---

## Erro
Estado de autenticacao nao atualizava na UI apos logout em outra aba ou token refresh. Usuario via interface de logado mas requests falhavam.

## Causa
Sem listener para mudancas de estado de auth. Componente so lia o estado no mount.

## Solucao
Subscriber no `AuthContext.jsx` para todos os eventos de auth:

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case "SIGNED_IN": setUser(session.user); break;
    case "SIGNED_OUT": setUser(null); break;
    case "TOKEN_REFRESHED": setUser(session.user); break;
  }
});
```

**Arquivo afetado:** `src/features/auth/context/AuthContext.jsx`

## Relacionados
- [[bug-token-expirado-401]] — complemento
- [[bug-profile-load-resiliente]]
- [[Coach Nutri]]
