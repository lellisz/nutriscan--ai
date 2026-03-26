---
tags: [bug, nutriscan, router, imports, performance]
data: 2026-03-21
status: resolvido
---

## Erro
AppRouter importava pages diretamente (sem lazy loading) e referenciava componentes/rotas inexistentes (`ProgressPage`, rota `/progress`).

## Causa
Arquivo ficou desatualizado conforme features foram renomeadas/adicionadas.

## Solucao
Reescrito com:
- Todas as pages com `React.lazy()` + `<Suspense>` com spinner `ns-spinner-lg`
- Rota `/progress` corrigida para `/insights` (InsightsPage)
- Adicionadas rotas faltantes: `/onboarding`, `/subscription`, `/paywall-welcome`
- Removido import de `ProgressPage`

## Relacionados
- [[decisao-convencao-nomenclatura]] — pages lazy-loaded por convencao
- [[Coach Nutri]]
