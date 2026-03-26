# CLAUDE.md - Espelho

> Copia do CLAUDE.md do projeto. Usar como referencia rapida e para colar no inicio de sessoes com IAs.
> **Fonte de verdade:** `C:\projetos\nutriscan\CLAUDE.md`
> **Ultima sync:** 2026-03-21

---

## Tech Stack
- **Frontend**: React 18.3 + Vite 5.3 + React Router 7 (SPA)
- **Backend**: Vercel serverless functions (`api/`)
- **Database**: Supabase (PostgreSQL com RLS)
- **AI**: Anthropic Claude (cloud) + Ollama/llava (local fallback)
- **Validation**: Zod
- **Charts**: Recharts
- **Monitoring**: Sentry
- **Styling**: Custom CSS design system (sem Tailwind)

## Estrutura Principal
```
api/              → Serverless functions
src/features/     → Modulos por feature (auth, dashboard, scan, history, insights, coach, profile)
src/lib/db.js     → Todas as operacoes DB (nunca chamar Supabase direto)
src/styles/       → Design system com CSS variables
supabase/         → Schema SQL + migrations
```

## Convencoes Criticas
- UI em **portugues (pt-BR)** sempre
- CSS vars: `--ns-accent`, `--ns-bg-card`, `--ns-text-primary`, etc.
- Classes: prefixo `ns-` (`ns-card`, `ns-btn`, `ns-input`)
- DB via `src/lib/db.js` - nunca Supabase direto em componentes
- Pages lazy-loaded via `React.lazy()` em `router.jsx`
- Rotas protegidas com `<ProtectedRoute>`

## Comandos
```bash
npm run dev      # Dev server
npm run build    # Build producao
npm run preview  # Preview local
```

## Env Vars
Ver `.env.example` - nunca commitar `.env`
