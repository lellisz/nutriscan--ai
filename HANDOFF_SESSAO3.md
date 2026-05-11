# HANDOFF — PRAXIS Nutrition — Sessão 3 → Agentes
> Gerado pelo Director (Claude Code Sonnet) em 2026-04-27
> Para: Cursor IDE, Codex CLI, Antigravity

---

## Estado do Projeto

Stack: React Native 0.81.5 / Expo Router 6 / NativeWind v4 / Supabase / TanStack Query v5 / Reanimated v4
Design: bg #09080C | surface #100F15 | ivory #EBE4D2 | gold #C9A96E
Fonts: Cormorant Garamond (serifLight) | Jost (sansLight/sansMedium) | DM Sans (monoLight)
Grid: 8px | Font mínima: 11px | Números: fontVariant tabular-nums

## O que foi feito nesta sessão

- ✅ AnimatedBar substitui PraxisRing (3 barras animadas com Reanimated v4)
- ✅ AiLearning card "Praxi notou" com seed determinístico
- ✅ useStreak hook com loop guard, timezone SP, anti-shame (preserva streak sem log hoje)
- ✅ MealTimeline + Insights vitaminas: empty states anti-shame
- ✅ Coach Edge Function: Haiku → Groq llama-3.3-70b
- ✅ result.tsx: agora lida com param `prefilled` (voice + restaurante)
- ✅ QA Opus realizado (issues_2026-04-27.md)

## Tasks Pendentes — TASKS.json

| ID | Agente | Descrição |
|----|--------|-----------|
| T007 | **Cursor** | WeightTab — botão "Registrar medição" com insert em weight_logs |
| T008 | **Codex** | api/voice.js — verificar/completar transcrição Whisper + estimativa Groq |
| T009 | **Cursor** | Onboarding — verificar fluxo completo, corrigir crashes |
| T010 | **Cursor** | Score screen — verificar ScoreRing + card explicativo anti-shame |

## Regras inegociáveis para os agentes

1. NÃO alterar arquivos Director-Only: `app/_layout.tsx`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json`
2. NÃO usar `expo-*` ou `react-native` em `api/`
3. NÃO usar `styled()` — sempre `className` com NativeWind v4
4. Reanimated v4: usar `useSharedValue`, `withTiming`, `cancelAnimation` — não API v2 legada
5. TanStack Query v5: `useQuery({ queryKey, queryFn, enabled, staleTime })`
6. PRAXIS Score mínimo 12 — nunca zero
7. Linguagem anti-shame: sem "déficit", "falhou", "perdeu" — sempre encorajador
8. TypeScript strict: sem `any`, sem `@ts-ignore`

## Arquivos de referência importantes

- `constants/design.ts` — tokens de cor e tipografia (Obsidian Warm v3)
- `services/supabase.ts` — cliente Supabase
- `stores/authStore.ts` — user + profile
- `hooks/useTodayData.ts` — daily_logs + meals do dia
- `components/ui/Card.tsx` — Card base do design system
- `components/ui/AnimatedBar.tsx` — bar animada (referência de padrão)

## Para Codex CLI — T008

```
[TASK FOR CODEX] ID: T008
Projeto: PRAXIS Nutrition — Node 20 / Vercel Serverless
Arquivo: api/voice.js
Ler arquivo atual. Completar endpoint para:
- Receber POST { audioBase64: string, mimeType: string }
- Auth: Bearer token Supabase (mesmo padrão de api/restaurant.js)
- Transcrever com Groq Whisper (model: whisper-large-v3, endpoint: /openai/v1/audio/transcriptions)
- Estimar macros do texto com Groq llama-3.3-70b (mesmo prompt de api/restaurant.js, adaptado)
- Retornar { food_name, calories, protein, carbs, fat, confidence, ai_tip, verdict }
- Rate limit: 5 req/min por userId
Proibido: expo-*, react-native, qualquer dependência nova
TypeScript strict sem any
```

## Para Cursor — T007

```
[TASK FOR CURSOR] ID: T007
Arquivo: app/(tabs)/insights.tsx (EXISTENTE)
Stack: RN 0.81.5 / NativeWind v4 / TanStack Query v5 / Reanimated v4
Modificar APENAS função WeightTab (linha ~561).
Adicionar:
1. Estado local: const [showInput, setShowInput] = useState(false)
2. Estado local: const [weightVal, setWeightVal] = useState('')
3. const qc = useQueryClient() — adicionar ao topo do componente
4. Botão discreto abaixo do Card PESO ATUAL: Text '+ REGISTRAR MEDIÇÃO'
   Style: sansLight 10px Colors.t3 letterSpacing 2, paddingVertical 12
5. Quando showInput: exibir View inline com:
   - TextInput keyboardType='decimal-pad' placeholder='75.5' style monospace
   - Pressable 'SALVAR' borderColor Colors.gold
6. Ao salvar: supabase.from('weight_logs').insert({
     user_id: userId, weight_kg: parseFloat(weightVal),
     logged_at: new Date().toISOString()
   }).then(() => { qc.invalidateQueries({ queryKey: ['weight-logs'] }); setShowInput(false); setWeightVal('') })
NÃO alterar nenhuma outra parte do arquivo.
```
