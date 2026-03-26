---
tags: [bug, nutriscan, build, react, imports]
data: 2026-03-13
status: resolvido
commit: 60f0120
---

## Erro
```
ReferenceError: React is not defined
```
ou JSX nao renderiza corretamente.

## Causa
A partir do React 17+, o JSX transform automatico (`react/jsx-runtime`) nao exige `import React`. Porem, em algumas configuracoes do Vite/Babel, o import ainda e necessario.

## Solucao
Adicionar `import React from "react"` no `App.jsx` ou garantir que `vite.config.js` tenha:
```javascript
plugins: [react()] // plugin @vitejs/plugin-react ativa o jsx transform
```

**Commit:** `60f0120`

## Quando acontece
- Vite sem `@vitejs/plugin-react` configurado
- Arquivo `.jsx` sem import do React + transform nao ativo
- Build de producao pode falhar mesmo que dev funcione

## Relacionados
- [[bug-aspas-curvas-imports]] — outro bug de imports
- [[bug-es-module-build]] — cadeia de setup
- [[Coach Nutri]]
