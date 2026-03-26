---
tags: [bug, nutriscan, build, filesystem]
data: 2026-03-13
status: resolvido
commit: 7fd9ee3
---

## Erro
Mesmo apos renomear, git nao detectou a mudanca de case no `App.jsx` no Windows.

## Causa
Git no Windows por padrao ignora mudancas de capitalizacao (`core.ignorecase=true`). O `git mv` e necessario para forcar o rename.

## Solucao
Usar `git mv` explicitamente ou renomear em dois passos:
```bash
git mv src/app.jsx src/temp.jsx
git mv src/temp.jsx src/App.jsx
```

**Commits:** `7fd9ee3`, `42d76ca`

## Como detectar no futuro
- `git status` nao mostra mudanca apos renomear arquivo mudando apenas case
- Deploy continua falhando mesmo apos "correcao" local

## Relacionados
- [[bug-case-sensitivity-app-jsx]] — bug original
- [[Coach Nutri]]
