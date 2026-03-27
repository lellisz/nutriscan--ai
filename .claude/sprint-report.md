# Sprint Report — Praxis Nutri
**Data:** 2026-03-26
**Branch:** copilot/vscode-mmtbhneq-3qff
**Build:** ✅ Sucesso (zero erros, zero warnings críticos)

---

## Grupo A — Concluído ✅

### A1+A2 — Contraste WCAG + Design Polish
**Status:** ✅ Concluído (agente foreground)
**Arquivos modificados:**
- `src/features/dashboard/pages/DashboardPage.jsx`
- `src/features/history/pages/HistoryPage.jsx`

**Mudanças:**
- Streak dias inativos: `--ns-text-disabled` → `#6B7280` (WCAG AA ✅)
- Chrono pill null: `background: #FEF2F2`, `color: #991B1B` (semântico ✅)
- Botão "Remover": `--ns-text-disabled` → `--ns-text-muted` (WCAG AA ✅)
- MacroCards: `gap: 8` → `gap: 12`, `padding: '14px 12px'` → `'16px'`
- Empty state: CTA "ou registrar manualmente" adicionado → `/scan`
- Banner Scan CTA: `background: #F0FDF4` + `getCoachBannerCopy(hour)` contextual

### A3 — BR Meal Templates Data Layer
**Status:** ✅ Concluído
**Arquivo criado:**
- `src/data/br-meal-templates.js`

**Conteúdo:**
- 25 pratos brasileiros com macros TACO
- `getTemplatesByCategory(category)`
- `getSuggestedTemplates(hour)`
- Categorias: café-da-manhã, almoço, jantar, lanche, pós-treino, típicos

---

## Grupo B — Concluído ✅

### B1 — Coach Nudges Proativos
**Status:** ✅ Concluído
**Arquivos criados/modificados:**
- `src/lib/coach/proactive-nudges.js` (NOVO)
- `src/features/coach/components/ProactiveNudgeBanner.jsx` (NOVO)
- `src/features/dashboard/pages/DashboardPage.jsx` (import + integração)

**Funcionalidades:**
- 5 tipos de nudge: calorie, protein, hydration, streak, readd
- Rate limit: 3h via localStorage (`praxis_last_nudge`)
- Mensagens personalizadas via Groq LLaMA 8B (com fallback hardcoded)
- Banner slide-down com PraxiAvatar (estado "thinking"), botão dismiss
- Integrado no DashboardPage: `<ProactiveNudgeBanner streakDays={streakCount} />`

### B2 — Tela de Tendências Recharts
**Status:** ✅ Concluído
**Arquivos criados/modificados:**
- `src/lib/db.js` (+ `getDailyMacros`, `getPeriodSummary`)
- `src/features/trends/pages/TrendsPage.jsx` (NOVO)
- `src/app/AppRouter.jsx` (+ rota `/trends`)
- `src/features/insights/pages/InsightsPage.jsx` (+ botão "Ver tendências")

**Funcionalidades:**
- LineChart (Recharts) com calorias diárias vs meta (ReferenceLine)
- Toggle 7d / 30d
- 4 summary cards: média diária, melhor dia, dias na meta, kcal total
- Acessado via InsightsPage → "Ver tendências nutricionais"

### B3 — Templates UI
**Status:** ✅ Concluído
**Arquivos criados/modificados:**
- `src/features/scan/components/MealTemplateCard.jsx` (NOVO)
- `src/features/scan/components/MealTemplatesSelector.jsx` (NOVO)
- `src/features/scan/components/PortionAdjustModal.jsx` (NOVO)
- `src/features/templates/pages/TemplatesPage.jsx` (NOVO)
- `src/features/scan/pages/ScanPage.jsx` (+ "Usar template rápido")
- `src/app/AppRouter.jsx` (+ rota `/templates`)

**Funcionalidades:**
- MealTemplateCard: card compacto com macros, tags (🇧🇷 típico, 💪 proteico)
- MealTemplatesSelector: bottom sheet com busca, filtro por categoria, "Sugerido agora"
- PortionAdjustModal: ajuste de porção com macros em tempo real via scaleMacros()
- TemplatesPage: página completa `/templates`
- ScanPage: botão "🍽️ Usar template rápido" com separador visual

---

## Build
```
✓ built in 4.98s
34 entries precached (2179.71 KiB)
Novos chunks: TrendsPage, TemplatesPage, PortionAdjustModal
Zero erros de compilação
```

## Issues conhecidos
- Nenhum erro de build
- `--ns-text-disabled` (#B8C2BC) ainda usado em alguns lugares do CSS global — melhoria incremental futura
- CoachChatPage (134KB gzip 41KB) pode se beneficiar de lazy loading mais granular no futuro

## Próximos passos sugeridos
1. `npm run build && git commit` (dist atualizado)
2. Deploy Netlify
3. QA manual: testar fluxo completo de templates no mobile
4. Verificar nudges proativos em produção (requer dados reais de hidratação/streak)
