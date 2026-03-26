# NutriScan - Central de Comando

> Vault Obsidian como segundo cerebro do projeto NutriScan.
> Aqui mora tudo que a IA esquece entre sessoes: bugs resolvidos, decisoes, roadmap e sessoes.

---

## Navegacao Rapida

| Area | Link | Descricao |
|------|------|-----------|
| Roadmap | [[Roadmap-Master]] | Fases, status e proximos passos |
| Ultima Sessao | [[01-Sessoes/]] | Log de todas as sessoes com Claude |
| Bugs Resolvidos | [[02-Bugs/]] | Base de conhecimento de bugs |
| Contexto IA | [[CLAUDE-md-espelho]] | Fonte de verdade para iniciar sessoes |
| Decisoes | [[05-Decisoes/]] | Decisoes tecnicas e o porque |

---

## Status Atual do Projeto

**Fase atual:** Fase 2 - Reliability & Observability
**Branch:** `main`
**Deploy:** Netlify

### Fase 1 - COMPLETA
- [x] Estrutura profissional, auth, onboarding
- [x] Scan IA, dashboard, history
- [x] Router, AppShell, design system

### Fase 2 - EM ANDAMENTO
- [x] Coach IA conversacional
- [x] Sentry frontend
- [x] Rate limiting + Zod validation
- [x] Dev server local
- [ ] Migration Coach IA no Supabase (CRITICO)
- [ ] InsightsPage - graficos Recharts
- [ ] ProfilePage - edicao de perfil
- [ ] ScanCorrectionModal
- [ ] Integration tests
- [ ] GitHub Actions CI/CD

### Fase 3 - FUTURA
- [ ] Weekly/monthly insights
- [ ] Recommendation engine
- [ ] Premium features

---

## Inicio Rapido - Nova Sessao Claude

Cole isso no inicio de cada sessao:

```
Continuando o projeto NutriScan.
Ultima sessao: [data] - fizemos [X] e ficou pendente [Y].
Ver CLAUDE.md para contexto completo do projeto.
```

---

*Atualizado em: 2026-03-21*
