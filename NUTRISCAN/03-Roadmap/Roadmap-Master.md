# Roadmap Master - NutriScan

> Plano de 60 dias dividido em 3 fases. Fonte de verdade para priorizacao.

---

## Fase 1 - Foundation (COMPLETA)

**Objetivo:** App funcional com scan IA, auth e navegacao.

| Item | Status | Commit/Data |
|------|--------|-------------|
| Estrutura React + Vite + Router | Done | Fase 1 |
| Auth (Supabase) + Onboarding | Done | Fase 1 |
| ScanPage (camera/upload + IA) | Done | Fase 1 |
| DashboardPage (progresso diario) | Done | Fase 1 |
| HistoryPage (historico scans) | Done | Fase 1 |
| AppShell + BottomNav | Done | Fase 1 |
| Design System CSS | Done | Fase 1 |

---

## Fase 2 - Reliability & Features (EM ANDAMENTO)

**Objetivo:** App confiavel com coach IA, insights e monitoring.

| Item | Status | Notas |
|------|--------|-------|
| Coach IA conversacional | Done | `api/chat.js` + `CoachChatPage` - migration pendente! |
| Sentry frontend | Done | |
| Rate limiting (api/scan.js) | Done | |
| Zod validation backend | Done | |
| Dev server local | Done | `api/dev-server.js` + concurrently |
| **Migration Coach no Supabase** | **BLOQUEADO** | Rodar `20260317_coach_ia.sql` no console |
| InsightsPage | Pendente | Weight tracking, workout logs, graficos Recharts |
| ProfilePage | Pendente | Edicao de perfil completa |
| ScanCorrectionModal | Pendente | Corrigir scans imprecisos |
| Integration tests | Pendente | |
| GitHub Actions CI/CD | Pendente | |

---

## Fase 3 - Intelligence (FUTURA)

**Objetivo:** App inteligente com recomendacoes e premium.

| Item | Status | Notas |
|------|--------|-------|
| Weekly/monthly insights | Futuro | Agregacoes temporais |
| Recommendation engine | Futuro | Sugestoes baseadas em historico |
| Premium/subscription | Futuro | Paywall + features exclusivas |
| Notificacoes push | Futuro | |
| Export de dados | Futuro | PDF/CSV |

---

## Backlog Tecnico

- [ ] Testes E2E (Playwright?)
- [ ] PWA manifest + service worker
- [ ] Otimizacao bundle (code splitting)
- [ ] Cache de scans offline
- [ ] Tema escuro/claro toggle

---

*Atualizado em: 2026-03-21*
