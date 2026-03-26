---
tags: [bug, nutriscan, build, filesystem, critico]
data: 2026-03-13
status: resolvido
commit: 4389e11
---

## Erro
App funciona no Windows (dev) mas falha no deploy (Linux). Import de `App.jsx` nao encontra o arquivo porque o nome real era `app.jsx` (minusculo).

```
Module not found: Can't resolve './App.jsx'
```

## Causa
**Case sensitivity do filesystem.** Windows trata `app.jsx` e `App.jsx` como o mesmo arquivo. Linux (servidor de deploy) diferencia maiusculas/minusculas. O arquivo foi criado como `app.jsx` mas importado como `App.jsx`.

## Solucao
Renomear o arquivo para `App.jsx` (com A maiusculo) para corresponder ao import.

```bash
git mv src/app.jsx src/App.jsx
```

**Arquivo afetado:** `src/App.jsx`
**Commit:** `4389e11`

## Como detectar no futuro
- Se funciona local (Windows) mas falha no deploy (Linux/Netlify/Vercel)
- Erro `Module not found` que nao faz sentido localmente
- Verificar case exato: `ls -la src/` e comparar com os imports

## Prevencao
- Sempre usar PascalCase para componentes React: `App.jsx`, `DashboardPage.jsx`
- Configurar ESLint com `import/no-unresolved` para pegar erros de import
- Testar build localmente antes de deploy: `npm run build`

## Relacionados
- [[bug-aspas-curvas-imports]] — outro bug no mesmo arquivo, mesma sessao
- [[bug-capitalizacao-app-jsx]] — variacao do mesmo problema
- [[bug-es-module-build]] — cadeia de bugs de build
- [[decisao-convencao-nomenclatura]]
- [[Coach Nutri]]
