---
tags: [bug, nutriscan, auth, resiliencia]
data: 2026-03-15
status: resolvido
---

## Erro
Se o carregamento do perfil falhava, o app inteiro ficava travado no loading.

## Causa
Erro no `getProfile()` propagava e bloqueava o `AuthContext` de completar o bootstrap.

## Solucao
Try-catch com warning (nao error) — app continua mesmo sem perfil:

```javascript
try {
  const data = await getProfile(userId);
  setProfile(data);
} catch (err) {
  logger.warn("Failed to load profile", { error: err.message });
  // App continua — perfil sera null
}
```

**Arquivo afetado:** `src/features/auth/context/AuthContext.jsx`

## Relacionados
- [[bug-token-expirado-401]]
- [[bug-auth-state-listener]]
- [[bug-db-save-nao-fatal]] — mesmo padrao de graceful degradation
- [[Coach Nutri]]
