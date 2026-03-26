---
data: 2026-03-26
tipo: sessao
tags: [mega-prompt, animacoes, design, pwa, voz, coach, retencao]
---

# Sessão 2026-03-26 — Mega-prompt 10 etapas completo

## O que foi feito

### Etapa 1 — Acentuação PT-BR (fix)
- Histórico, Manutenção, Hidratação, Proteína, Gênero, Nível, Sequência
- Labels ALL-CAPS → sentence case (STREAK, SCANS, MINHAS METAS)
- "IA Pronta" → "Praxi pronto"
- "Escanear alimento" → "Escanear refeição"
- Arquivos: DashboardPage, HistoryPage, OnboardingPage, ProfilePage, EditGoalsPage, EditProfilePage, ScanCorrectionModal, ScanPage, AppShell, schemas.js

### Etapa 2 — Framer Motion spring physics
- Pacote: motion (não framer-motion)
- PraxiAvatar: float animation (y: 0→-6→0, 3s loop)
- ScanPage, DashboardPage, CoachChatPage: whileTap scale 0.95 spring
- HistoryPage: stagger entrance (staggerChildren 0.06)
- DashboardPage: gotas hidratação com spring colorido
- useReducedMotion() em todos os componentes

### Etapa 3 — Design System v2
- Google Fonts: Nunito + DM Sans + Space Grotesk
- Background body: #FAF8F5 (warm off-white)
- Classe .glass: backdrop-filter blur(12px) na bottom nav
- Classe .mono-num: Space Grotesk, tabular nums em calorias/macros
- Classe .skeleton: animação pulse para loading states
- Classe .scan-btn-glow: pulse verde no botão scan
- Barras macros: 7px, azul/âmbar/roxo (#3B82F6/#F59E0B/#8B5CF6)

### Etapa 4 — Supabase Edge Function (chat IA)
- supabase/functions/chat/index.ts: TypeScript/Deno
- Intent detection: Groq LLaMA 8B → roteamento por tipo
- small_talk → LLaMA 8B; question/recipe → LLaMA 70B; emotional/food_log → Gemini Flash
- Fallback cruzado automático
- Session memory: extração de insights a cada 5 mensagens
- Sistema anti-culpa no system prompt ("dia generoso", nunca "excedeu")
- NÃO DEPLOYADA ainda — requer: supabase functions deploy chat

### Etapa 5 — PWA offline-first
- vite-plugin-pwa configurado (Praxis Nutri, theme #1A7F56)
- Workbox: NetworkFirst Supabase (5min), CacheFirst fontes (1 ano)
- IndexedDB queue: queueAction(), syncPendingActions()
- OfflineIndicator: barra âmbar offline, verde ao sincronizar

### Etapa 6 — Registro por voz
- api/voice.js: endpoint Vercel parseia texto com Groq LLaMA 70B
  Conhecimento BR: PF, coxinha, açaí, tapioca, pão de queijo
- useVoiceInput.js: Web Speech API, lang pt-BR, estados idle→listening→processing→result
- VoicePreviewModal: confirmação com lista de alimentos + totais
- ScanPage: botão mic integrado, registra no Supabase ao confirmar

### Etapa 7 — Hook Model + Crononutrição
- Praxi Reacts: mascote muda estado por contexto (waving/proud/worried/celebrating/sleeping)
- Quick actions dinâmicas: sem log / hora noturna / meta quase atingida / normal
- Refeições frequentes: top 5 últimos 30 dias como chips de registro rápido
- Chrono Score: badge ⏰ 0-100, alinhamento circadiano

### Etapa 8 — Retenção
- Modo Respira: detecta palavras de ansiedade alimentar, exibe card acolhedor + CVV 188
- useTrack: analytics fire-and-forget (app_opened, quick_register)
- analytics_events: tabela Supabase com RLS

### Etapa 9 — Polish + haptics
- haptics.js: light/medium/success via navigator.vibrate
- Água +1 → haptic light; meta água → haptic success
- Scan resultado → haptic medium
- AppShell: glow pulse no botão scan
- scroll-snap no histórico

### Etapa 10 — Mascote Praxi
- PraxiAvatar já tinha 8 estados SVG completos
- DashboardPage: Praxi reativo integrado (substituiu ícone estático)
- HistoryPage: Praxi waving no empty state

## Commits desta sessão
- fix: acentuação PT-BR e labels sentence case
- feat: Framer Motion spring physics em toda UI
- feat: design system v2 — fontes, cores, glass, skeleton, mono-num
- feat: Supabase Edge Function para chat IA com intent routing
- feat: PWA offline-first com sync automático
- feat: registro por voz Web Speech API + Groq
- feat: Hook Model, crononutrição, Praxi reacts e atalhos
- feat: onboarding, Modo Respira, analytics próprio
- feat: haptics e CSS premium
- feat: mascote Praxi em toda UI com 8 estados SVG

## Pendências / próxima sessão
1. Deploy da Edge Function: `supabase functions deploy chat`
2. Rodar migrations: analytics_events + conversation_insights
3. Adicionar ícones PWA reais (pwa-192x192.png, pwa-512x512.png)
4. Testar voz em dispositivo real (Web Speech API não funciona em todos navegadores)
5. Integrar gateway de pagamento (RevenueCat ou Stripe)
6. Rate limiter Redis/Upstash para produção

## Branch
copilot/vscode-mmtbhneq-3qff
