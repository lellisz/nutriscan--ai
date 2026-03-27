---
data: 2026-03-26
tipo: sessão
status: concluído
tags: [sprint, agentes, UI, templates, tendencias, nudges, wcag, ui-review]
---

# Sprint Premium pt4 — Concluído

## O que foi feito

### Grupo A (paralelo)
- **A1+A2** — Correções WCAG AA + Design Polish no DashboardPage e HistoryPage:
  - Streak dias inativos: cor `#6B7280` (passa 4.5:1 ✅)
  - Chrono pill null state: fundo `#FEF2F2`, texto `#991B1B`
  - Botão "Remover": `--ns-text-muted` (era disabled)
  - MacroCards: gap 12px, padding 16px
  - Empty state: CTA "ou registrar manualmente"
  - Banner scan: fundo verde suave `#F0FDF4` + copy contextual por hora do dia

- **A3** — Camada de dados `src/data/br-meal-templates.js`:
  - 25 pratos brasileiros com macros da TACO
  - Funções: `getTemplatesByCategory`, `getSuggestedTemplates`, `scaleMacros`

### Grupo B (paralelo, após A)
- **B1** — Coach Nudges Proativos:
  - `src/lib/coach/proactive-nudges.js`: 5 tipos de nudge com rate limit 3h
  - `src/features/coach/components/ProactiveNudgeBanner.jsx`: banner slide com PraxiAvatar
  - Integrado no DashboardPage (linha ~643)
  - Mensagens via Groq LLaMA 8B + fallback hardcoded

- **B2** — Tela de Tendências:
  - `src/features/trends/pages/TrendsPage.jsx`: LineChart Recharts, toggle 7d/30d, 4 cards
  - `src/lib/db.js`: `getDailyMacros()` + `getPeriodSummary()`
  - Rota `/trends` no AppRouter
  - Link "Ver tendências nutricionais" no InsightsPage

- **B3** — Templates UI:
  - `MealTemplateCard`, `MealTemplatesSelector`, `PortionAdjustModal` em scan/components
  - `TemplatesPage` em features/templates/pages
  - Botão "🍽️ Usar template rápido" no ScanPage
  - Rota `/templates` no AppRouter

### UI Review (pós-sprint)
Auditoria identificou 11 issues adicionais. Todos aplicados:

- **Subtítulo da home**: `--ns-text-muted` → `--ns-text-secondary` (3.8:1→6.5:1 ✅)
- **"de Xg" nos MacroCards**: `--ns-text-muted` → `--ns-text-secondary` (4.4:1→8:1 ✅)
- **Labels uppercase de seção**: `--ns-text-muted` → `--ns-text-secondary` onde sobre bg-primary
- **Pills "% consumido" e Chrono ativo**: texto de `--ns-accent` → `--ns-text-primary` (3:1→11:1 ✅)
- **Hierarquia hero card**: eyebrow uppercase 11px+600+secondary / referência 11px+400+muted
- **Copy contextual Praxi banner**: `getPraxiBannerLabel(state, hour)` — combina estado + horário

## Build
```
✓ built in 4.83s — zero erros
34 entries precached (2179.95 KiB)
```

## Pendente
- `git commit` + deploy Netlify
- QA manual no mobile (templates + tendências + nudges)
- Nudges proativos precisam de dados reais para disparar

## Prompt de continuidade
Sprint + UI review 100% concluídos. Próximo passo imediato: commit + deploy.
Sugestão próxima sessão: QA manual + polimento do PortionAdjustModal (animações de sucesso).
