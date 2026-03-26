---
tags: [bug, nutriscan, build, netlify, deploy]
data: 2026-03-13
status: resolvido
commit: ceeaa86
---

## Erro
Deploy no Netlify falha com build script customizado (`node build.js`). Script de 20 linhas era fragil e dificil de debugar.

## Causa
Script `build.js` customizado adicionava complexidade desnecessaria. Wrappava `npm install && npm run build` com logging extra mas introduzia pontos de falha.

## Solucao
Simplificar `netlify.toml` para usar comandos diretos:

```toml
[build]
command = "npm install && npm run build"
publish = "dist"
```

**Arquivos afetados:** `netlify.toml`, `build.js`
**Commit:** `ceeaa86`

## Aprendizado
Build scripts customizados em CI/CD devem ser evitados quando os comandos padrao (`npm ci`, `npm run build`) sao suficientes. Menos codigo = menos bugs.

## Relacionados
- [[bug-es-module-build]] — bug anterior na cadeia
- [[bug-npm-ci-compatibility]] — proximo refinamento
- [[Coach Nutri]]
