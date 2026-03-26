---
tags: [decisao, nutriscan, deploy, netlify]
data: 2026-03-13
---

## Contexto
Onde deployar o frontend? Opcoes: Vercel, Netlify, Cloudflare Pages, GitHub Pages.

## Decisao
**Netlify** para frontend (SPA) + **Vercel** para serverless functions.

### Config Netlify (`netlify.toml`)
```toml
[build]
command = "npm ci --legacy-peer-deps && npm run build"
publish = "dist"
ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."

[build.environment]
NODE_VERSION = "18"
NODE_ENV = "production"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

### Nota importante
O `dist/` folder e commitado no git (para deploy direto).

## Motivo
- Tier gratuito generoso
- Deploy automatico via git push
- Redirect SPA nativo
- Build skip inteligente via `ignore`

## Quando revisar
- Se precisar de edge functions (Cloudflare seria melhor)
- Se consolidar tudo no Vercel (frontend + API)

## Referencias
- [[bug-netlify-build-command]] — bugs de configuracao
- [[bug-npm-ci-compatibility]] — ajustes de CI
- [[bug-es-module-build]] — compatibilidade
- [[Coach Nutri]]
