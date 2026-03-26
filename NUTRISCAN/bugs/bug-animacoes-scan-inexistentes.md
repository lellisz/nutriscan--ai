---
tags: [bug, praxis-nutri, css, frontend]
status: resolvido
data: 2026-03-21
resolvido_em: 2026-03-21
---

## Sintoma
ScanPage usava classes CSS de animacao que nao existiam no design system: `ns-fade-up`, `ns-scan-line`, `ns-rotate`. Elementos ficavam estaticos sem feedback visual.

## Causa raiz
Classes foram escritas no JSX sem antes serem definidas em `src/styles/index.css`. Nao havia erro no console (CSS ignora classes nao encontradas), entao o bug passava despercebido.

## Fix
Classes de animacao adicionadas ao `index.css`:
- `ns-fade-up` — transicao de opacidade + translateY para entrada de elementos
- `ns-scan-line` — animacao de linha de scan sobre a imagem do alimento
- `ns-rotate` — rotacao continua para icones de loading

## Como prevenir
Ao criar classes CSS custom no JSX, sempre verificar se existem no `index.css` antes de commitar. Preferir classes ja existentes no design system (`animate-fade-up`, `ns-spinner`).

## Links
- [[2026-03-21-agentes]]
- [[decisao-css-design-system]]
- [[Coach Nutri]]
