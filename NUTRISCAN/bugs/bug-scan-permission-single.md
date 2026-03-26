---
tags: [bug, nutriscan, api, scan, supabase]
data: 2026-03-21
status: resolvido
---

## Erro
Usuarios sem perfil (durante onboarding) recebiam erro 500 ao tentar escanear alimento.

## Causa
`checkScanPermission()` em `api/scan.js` usava `.single()` para buscar perfil. `.single()` lanca `PGRST116` quando nenhum registro existe.

## Solucao
Trocar `.single()` por `.maybeSingle()` — retorna `null` sem erro. Quando perfil e null, scan e permitido sem restricao de tier.

```javascript
// ANTES
const { data: profile } = await supabase.from("profiles")
  .select("*").eq("user_id", userId).single();

// DEPOIS
const { data: profile } = await supabase.from("profiles")
  .select("*").eq("user_id", userId).maybeSingle();
```

## Relacionados
- [[bug-maybe-single-query]] — mesmo padrao ja documentado
- [[bug-scan-free-tier]] — funcao que contem o bug
- [[Coach Nutri]]
