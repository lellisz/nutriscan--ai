---
tags: [decisao, nutriscan, frontend, convencao]
data: 2026-03-13
---

## Contexto
Padrao de nomenclatura para arquivos React e organizacao de features.

## Decisao
- **Componentes React:** PascalCase (`AppShell.jsx`, `DashboardPage.jsx`)
- **Libs/utils:** camelCase (`db.js`, `supabase.js`)
- **CSS classes:** prefixo `ns-` + kebab-case (`ns-btn-primary`)
- **Features:** `src/features/{nome}/pages/` para pages, `hooks/`, `components/` para auxiliares
- **UI text:** sempre pt-BR
- **Pages:** lazy-loaded via `React.lazy()` em `router.jsx`

## Motivo
- PascalCase previne [[bug-case-sensitivity-app-jsx]] em deploys Linux
- Feature folders mantém modulos independentes
- Lazy loading melhora TTI (Time to Interactive)

## Quando revisar
- Se adotar Next.js (file-based routing muda convencoes)

## Referencias
- [[bug-case-sensitivity-app-jsx]]
- [[bug-capitalizacao-app-jsx]]
- [[Coach Nutri]]
