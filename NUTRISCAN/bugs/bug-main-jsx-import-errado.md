---
tags: [bug, nutriscan, build, imports]
data: 2026-03-21
status: resolvido
---

## Erro
App nao carregava CSS. Console mostrava 404 para arquivo de estilo.

## Causa
`src/main.jsx` importava `apex-neutral.css` que nao existe. O arquivo correto e `index.css`.

## Solucao
Trocar import para `./styles/index.css`.

## Relacionados
- [[bug-aspas-curvas-imports]] — outro bug de import
- [[Coach Nutri]]
