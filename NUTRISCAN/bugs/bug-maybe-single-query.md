---
tags: [bug, nutriscan, database, supabase, query]
data: 2026-03-15
status: resolvido
---

## Erro
```
PGRST116: JSON object requested, multiple (or no) rows returned
```
Ao buscar perfil ou goals de usuario novo (sem registro).

## Causa
Usar `.single()` que **exige** exatamente 1 row. Se nao existe registro, lanca erro.

## Solucao
Usar `.maybeSingle()` — retorna `null` se nao encontrar, sem erro.

```javascript
// ERRADO
const { data } = await supabase.from("profiles").select("*").eq("user_id", id).single();

// CORRETO
const { data } = await supabase.from("profiles").select("*").eq("user_id", id).maybeSingle();
```

**Arquivo afetado:** `src/lib/db.js`

## Regra
- `.single()` → quando DEVE existir (erro se nao existir)
- `.maybeSingle()` → quando PODE nao existir (retorna null)

## Relacionados
- [[bug-upsert-logs-duplicados]] — pattern complementar
- [[bug-profile-duplicado]] — pattern complementar
- [[Coach Nutri]]
