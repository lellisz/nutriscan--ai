---
tags: [bug, nutriscan, database, supabase, upsert]
data: 2026-03-15
status: resolvido
---

## Erro
Multiplos registros de peso/hidratacao para o mesmo dia. Dashboard mostrava dados duplicados.

## Causa
Usar `insert` ao inves de `upsert`. Cada submit criava nova row.

## Solucao
Usar `upsert` com constraint de unicidade composta:

```javascript
// weight_logs
.upsert(
  { user_id: userId, weight, logged_at: today },
  { onConflict: "user_id,logged_at" }
)

// hydration_logs
.upsert(
  { user_id: userId, amount_ml, logged_at: today },
  { onConflict: "user_id,logged_at" }
)
```

**Tabelas:** `weight_logs`, `hydration_logs` (indices unicos no schema)
**Arquivo afetado:** `src/lib/db.js`

## Regra
Para tabelas de tracking diario: **sempre upsert com `onConflict: "user_id,logged_at"`**

## Relacionados
- [[bug-profile-duplicado]] — mesmo padrao em profiles
- [[bug-maybe-single-query]] — pattern complementar
- [[decisao-supabase-schema]]
- [[Coach Nutri]]
