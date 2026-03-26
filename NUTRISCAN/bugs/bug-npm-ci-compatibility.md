---
tags: [bug, nutriscan, build, npm, cicd]
data: 2026-03-13
status: resolvido
commit: ccfffc2
---

## Erro
Builds no Netlify inconsistentes e lentos. Dependencias resolvidas diferente entre local e CI.

## Causa
`npm install` em CI pode gerar resultados diferentes do lockfile local. Peer dependencies causavam warnings e falhas intermitentes.

## Solucao
1. Trocar `npm install` por `npm ci --legacy-peer-deps` (instala exatamente do lockfile)
2. Criar `.npmrc` com configuracoes de compatibilidade:
```ini
auto-install-peers=true
legacy-peer-deps=true
fetch-timeout=60000
audit=false
fund=false
```
3. Adicionar `NODE_ENV=production` e build skip via git diff:
```toml
[build]
command = "npm ci --legacy-peer-deps && npm run build"
ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."
```

**Arquivos afetados:** `netlify.toml`, `.npmrc`
**Commit:** `ccfffc2`

## Regra
- **Sempre usar `npm ci` em CI/CD**, nunca `npm install`
- `npm ci` e mais rapido, deterministico e falha se lockfile estiver desatualizado

## Relacionados
- [[bug-netlify-build-command]] — bug anterior na cadeia
- [[decisao-netlify-deploy]]
- [[Coach Nutri]]
