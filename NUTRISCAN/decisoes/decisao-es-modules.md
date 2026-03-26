---
tags: [decisao, nutriscan, node, javascript]
data: 2026-03-13
---

## Contexto
CommonJS (`require`) ou ES Modules (`import`)? Projeto usa Vite que e ESM-first.

## Decisao
**ES Modules** em todo o projeto. `package.json` tem `"type": "module"`.

## Motivo
- Vite exige ESM
- Padrao moderno do JavaScript
- Tree-shaking funciona melhor com ESM
- Consistencia entre frontend e scripts

## Quando revisar
- Nunca (ESM e o futuro do JS)

## Referencias
- [[bug-es-module-build]] — bug de migracao que validou a decisao
- [[Coach Nutri]]
