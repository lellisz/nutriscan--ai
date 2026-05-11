# PRAXIS v2.0 — Plano de Implementação
> Gerado em 2026-05-10 | Director: Claude Code Sonnet 4.6
> Fontes: PRAXIS_FailurePlan_CorrectionPlan.md + PRAXIS_v2_Black_Metallic_HD.pdf

---

## Status Geral

| Onda | Status | Agentes |
|------|--------|---------|
| Onda 1 | ✅ CONCLUÍDA | Architect, CSS Specialist, Senior Backend, Security |
| Onda 2 | ✅ CONCLUÍDA | Senior Frontend, Senior Backend (EFs), QA Engineer |
| Onda 3 | ✅ CONCLUÍDA | Code Reviewer, Docs Writer, DevOps |
| Gate Final | ✅ PASS 11/11 | QA Engineer (tsc + expo-doctor) |

---

## ⚠️ BLOCKER CRÍTICO — Resolver antes do deploy

**Security Auditor encontrou secrets expostos no .env:**
- `GROQ_API_KEY` — revogar em console.groq.com
- Token Claude — revogar em claude.ai/settings
- Adicionar `.env` ao `.gitignore`
- Limpar histórico Git: `git filter-repo --path .env --invert-paths`

---

## ONDA 1 — CONCLUÍDA ✅

### Architect
- `docs/adr/001-praxis-v2-features.md` — ADRs: RevenueCat, Barcode, Offline, HealthKit, Micronutrientes
- `docs/adr/002-praxis-v2-audit-fixes.md` — ADRs: WCAG, LinearGradient, Touch Targets

### CSS Specialist
- `constants/design.ts` — t4: #706C84 → #8C8AA0 | t5: #4A4660 → #6A687A (WCAG AA ✅)
- `app/log/result.tsx` — hitSlop botões −/+
- `app/log/add.tsx`, `index.tsx`, `restaurant.tsx`, `voice.tsx` — hitSlop botão ✕
- `components/ui/Toggle.tsx` — hitSlop toggle
- `components/ui/WaterTracker.tsx` — hitSlop copos

### Senior Backend
- `supabase/migrations/011_v2_features.sql` — tabelas: hydration_logs, meal_plans, subscriptions + RLS
- `supabase/migrations/012_micronutrients.sql` — colunas: sodio_mg, calcio_mg, ferro_mg, vitc_mg, vita_mcg

### Security Auditor (findings)
- CRITICAL: .env com secrets expostos (Felipe vai resolver)
- HIGH-01: Tela de Política de Privacidade não implementada em app/settings.tsx
- HIGH-02: export-data não exporta tabelas das migrations 006-010
- HIGH-03: delete-account não garante deleção de auth.users
- HIGH-04: consentimento não salva IP hash/device_id
- MEDIUM-01: security_log sem RLS policies
- MEDIUM-02: settings.tsx sem botões de exportar dados / revogar consentimento

---

## ONDA 2 — PENDENTE 🔴

### Senior Frontend (a executar)
Tarefas:
1. **Rules of Hooks** — extrair componente de `app/(onboarding)/goal.tsx` (useState em objeto literal)
2. **setTimeout cleanup** — `app/(tabs)/coach.tsx` — adicionar return cleanup
3. **SafeAreaView** — `app/log/result.tsx`, `app/log/camera.tsx`, `app/log/add.tsx`, `app/settings.tsx`, `app/score.tsx`, `app/consult.tsx`
4. **Memoização** — `components/ui/WeightLineChart.tsx` → useMemo([data])
5. **stores/hydrationStore.ts** — criar com goal_ml, consumed_ml, addWater, reset
6. **components/ui/HydrationWidget.tsx** — card com anel + botões [+150, +250, +350, +500ml]
7. **hooks/useSubscription.ts** — isPremium via RevenueCat
8. **components/Paywall.tsx** — modal Black Metallic com planos
9. **app/log/barcode.tsx** — tela scanner com BarCodeScanner
10. **app/meal-plan.tsx** — tela com scroll horizontal por dia
11. **hooks/useDynamicTDEE.ts** — baseTDEE + burned_today
12. **app/(tabs)/index.tsx** — integrar HydrationWidget e TDEE dinâmico

### Senior Backend (a executar)
Tarefas:
1. **services/revenue.ts** — initRevenueCat, checkPremium, purchaseMonthly/Annual
2. **services/barcode.ts** — lookup: local → Open Food Facts → null
3. **services/offline.ts** — expo-sqlite queue + syncQueue + NetInfo
4. **services/health.ts** — react-native-health-connect, getCaloriesBurned
5. **assets/taco-mini.json** — 50 alimentos TACO com macros + micronutrientes
6. **supabase/functions/coach/index.ts** — adicionar request_type: 'meal_plan' + compassion_mode
7. **supabase/functions/export-data/index.ts** — adicionar tabelas 006-010
8. **supabase/functions/delete-account/index.ts** — garantir auth.users deletado

### QA Engineer (após Senior Frontend + Backend)
- Testes para: score.ts, compassion.ts, barcode.ts, offline.ts, hydrationStore.ts
- Cobertura mínima: 80% branch coverage em lógica de negócio

---

## ONDA 3 — PENDENTE 🔴

### Code Reviewer
- Revisar todos os arquivos da Onda 2 antes de marcar done
- Output: APPROVED ou CHANGES REQUESTED por arquivo

### DevOps
- Instalar dependências novas: `npx expo install react-native-purchases expo-barcode-scanner expo-sqlite @react-native-community/netinfo react-native-health-connect`
- Configurar EAS Build para react-native-purchases (native module)
- Verificar app.json para permissões de câmera (BarCodeScanner) e HealthKit

### Docs Writer
- CHANGELOG.md com todas as features v2.0
- docs/guides/barcode.md, offline.md, meal-plan.md
- Atualizar README.md com novas features

---

## Gate Final — PENDENTE 🔴
```bash
rtk tsc --noEmit        # zero erros
npx expo-doctor         # zero warnings críticos
/praxis-qa full         # gate completo
```

---

## Distribuição completa por agente (referência)

### 10 Agentes Claude Code (`~/.claude/agents/`)
| Agente | Modelo | Tasks PRAXIS v2 |
|--------|--------|-----------------|
| Orchestrator | Opus | Coordena todo o plano (Director) |
| Architect | Opus | ✅ ADRs features + audit fixes |
| Senior Backend | Opus | Migrations ✅ + services + Edge Functions |
| CSS Specialist | Sonnet | ✅ WCAG, touch targets, design tokens |
| Senior Frontend | Opus | Rules of Hooks, SafeAreaView, stores, telas, hooks |
| QA Engineer | Sonnet | Testes pós-implementação |
| DevOps | Sonnet | Deps nativas, EAS Build, permissões |
| Security Auditor | Sonnet | ✅ Auditoria LGPD + RLS |
| Docs Writer | Haiku | CHANGELOG + docs features |
| Code Reviewer | Sonnet | Revisão pré-merge |

---

## Constraints obrigatórias (nunca esquecer)
- NativeWind v4: `className` prop, NUNCA `styled()`
- Reanimated v4: `useSharedValue`, `withTiming` (API v3)
- expo-* PROIBIDO em `api/`; Node puro PROIBIDO em `app/`
- Director-Only (não tocar): `app/_layout.tsx`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json`
- Gate: `tsc --noEmit` + `expo-doctor` zero erros antes de marcar DONE
- Score PRAXIS: mínimo 12, nunca zero
- Anti-shame: sem linguagem punitiva em nenhum componente

---

## Fontes originais do plano
- `C:\Users\felip\OneDrive\PRAXIS_FailurePlan_CorrectionPlan.md`
- `C:\Users\felip\Downloads\PRAXIS_v2_Black_Metallic_HD.pdf`
- `C:\Users\felip\OneDrive\agentes_claude_code.pdf`
