# HANDOFF PRAXIS — 2026-05-10 (Sessão 5)

## Estado Geral

- Stack: React Native 0.81.5, Expo ~54, Expo Router ~6, TypeScript strict, Supabase, TanStack Query v5, Zustand v5, NativeWind v4, Reanimated v4
- Filosofia: anti-shame. O app nunca pune pausas, falhas ou recomeços.
- PRAXIS Score: nunca zero — `Math.max(12, score)`. Modo Compaixão congela score por 3 dias.
- Fonte de verdade de design: `PRAXIS_SPEC.md` na raiz (criado nesta sessão).

---

## Tasks

| ID | Agente | Status | Spec |
|----|--------|--------|------|
| T001–T014 | director/cursor/codex | done | Ver TASKS.json para detalhes |

Não há tasks running, pending ou failed.

---

## Fase de Implementação Atual

### FASE 1 — Fundação (iniciada nesta sessão)

| Tarefa | Arquivo | Status |
|--------|---------|--------|
| Tokens de cor | `constants/Colors.ts` | ✅ feito — não commitado |
| Tipografia | `constants/typography.ts` | ✅ feito — não commitado |
| MetallicButton | `components/ui/MetallicButton.tsx` | ✅ feito — não commitado |
| PraxisRing | `components/ui/PraxisRing.tsx` | ⏳ pendente |
| NavBar | `app/(tabs)/_layout.tsx` (tab bar) | ⏳ pendente |

### FASE 2 — Telas de entrada (pendente)

| Tela | Arquivo | Status |
|------|---------|--------|
| Splash | `app/(auth)/index.tsx` | ⏳ pendente (redesign per spec) |
| Login | `app/(auth)/login.tsx` | ⏳ pendente (redesign per spec) |

### FASE 3 — Core (pendente)

| Tela | Arquivo | Status |
|------|---------|--------|
| Home Dashboard | `app/(tabs)/index.tsx` | ⏳ pendente (redesign per spec) |
| Coach | `app/(tabs)/coach.tsx` | ⏳ pendente (redesign per spec) |
| Macros/Food | `app/(tabs)/food.tsx` | ⏳ pendente |
| Score | `app/score.tsx` | ⏳ pendente |

### Telas implementadas (sessões anteriores)

| Tela | Arquivo | Nota |
|------|---------|------|
| Consent | `app/(onboarding)/consent.tsx` | LGPD compliant |
| Goal/Personal/Results | `app/(onboarding)/` | Onboarding completo |
| Login/Register | `app/(auth)/` | Supabase Auth |
| Fasting | `app/(tabs)/fasting.tsx` | Timer + protocolos |
| Scan Hub | `app/(tabs)/scan.tsx` | Câmera/Voz/Restaurante |
| Insights | `app/(tabs)/insights.tsx` | Gráficos + peso |
| Profile | `app/(tabs)/profile.tsx` | Toggles → Supabase |
| Coach | `app/(tabs)/coach.tsx` | Groq IA com contexto |
| Settings | `app/settings.tsx` | Notificações + LGPD |
| Log flow | `app/log/` | Camera, voice, add, result |
| Score | `app/score.tsx` | Ring + breakdown |
| Privacy Policy | `app/(modals)/privacy-policy.tsx` | LGPD Art. 18 |

---

## Branch e Git

```
Branch: master
Último commit: f359ddb — fix: touch targets < 44px em 7 botões (WCAG 2.5.5)
Arquivos modificados não commitados:
  ~ components/ui/MetallicButton.tsx
  ~ constants/typography.ts
  + constants/Colors.ts  (untracked)
  + PRAXIS_SPEC.md       (untracked)
```

**Próximo commit sugerido:**
```bash
rtk git add constants/Colors.ts constants/typography.ts components/ui/MetallicButton.tsx PRAXIS_SPEC.md
rtk git commit -m "feat: FASE 1 fundação — Colors.ts, Typography, MetallicButton primary/secondary"
```

---

## TypeScript

Limpo — `tsc --noEmit` zero erros (verificado nesta sessão).

---

## Pendências Externas (bloqueios fora do código)

| Item | Responsável | Status |
|------|-------------|--------|
| RevenueCat Dashboard — criar produtos + chaves | Felipe | pendente |
| `.env` — `EXPO_PUBLIC_REVENUECAT_IOS_KEY` + `ANDROID_KEY` | Felipe | pendente |
| Apple Developer Portal — habilitar HealthKit para `com.praxis.nutrition` | Felipe | pendente |
| `eas.json` — preencher `ascAppId` + `appleTeamId` | Felipe | pendente |
| `eas build --profile development` | Felipe (após credenciais) | pendente |

---

## Regras Arquiteturais

### Director-Only files
Nunca editar exceto Director:
- `app/_layout.tsx`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json`

### Design System
- **Fonte de verdade:** `PRAXIS_SPEC.md` — ler antes de qualquer tela
- **Colors:** importar de `constants/Colors.ts` (novo, uppercase: BG, WH, AC...)
- **Typography:** importar de `constants/typography.ts` (export `Typography` adicionado)
- **Legado:** `constants/design.ts` ainda funciona (57 arquivos dependem dele) — não remover

### NativeWind v4
- Usar `className` prop. NUNCA `styled()`.

### Reanimated v4
- API v3: `useSharedValue`, `withTiming`, `withRepeat`, `useAnimatedStyle`

### TanStack Query v5
- Sintaxe de objeto: `useQuery({ queryKey, queryFn, staleTime })`
- Invalidações: `queryClient.invalidateQueries({ queryKey: [...] })`

### Regras do Spec (PRAXIS_SPEC.md seção 8)
- NUNCA fundo branco puro (#FFFFFF)
- NUNCA vermelho punitivo brilhante
- NUNCA ALL-CAPS sem letterSpacing >= 2
- NUNCA boxShadow CSS — usar elevation + shadowColor RN
- NUNCA linear-gradient CSS — usar `<LinearGradient>` expo
- NUNCA botão < 44×44px sem hitSlop
- SEMPRE SafeAreaView em todas as telas
- SEMPRE KeyboardAvoidingView em telas com input

---

## Prompt de Continuidade

> Retomando PRAXIS. Branch: master. FASE 1 fundação completa mas não commitada (Colors.ts, Typography, MetallicButton). Próximo passo: (1) commitar FASE 1, (2) implementar PraxisRing.tsx e NavBar per PRAXIS_SPEC.md seção 4, (3) FASE 2: redesign Splash (auth)/index.tsx e Login (auth)/login.tsx per spec seções TELA 01 e TELA 02. Ler PRAXIS_SPEC.md antes de qualquer tela.
