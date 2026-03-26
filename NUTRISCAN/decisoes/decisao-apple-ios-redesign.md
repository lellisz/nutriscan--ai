---
tags: [decisao, nutriscan, design, apple-ios]
data: 2026-03-21
---

## Contexto
Usuario relatou que "a vista esta cansando". Interface usava preto puro (#000), branco puro (#FFF), fontWeight 800 em tudo, cores saturadas e falta de whitespace.

## Decisao
Adotar paleta **Apple iOS Health/Fitness** como referencia de design:

| Token | Antes | Depois |
|-------|-------|--------|
| --ns-bg-primary | #FFFFFF | #F2F2F7 |
| --ns-text-primary | #000000 | #1C1C1E |
| --ns-text-muted | vários | #8E8E93 |
| --ns-accent | #16A34A | #30B050 |
| --ns-danger | #DC2626 | #FF3B30 |
| --ns-warning | - | #FF9500 |
| font-weight max | 800 | 700 |
| Macro protein | preto | #007AFF (azul) |
| Macro carbs | cinza | #FF9500 (laranja) |
| Macro fat | cinza | #AF52DE (roxo) |

## Motivo
- Apple iOS e o padrao de referencia para apps mobile de saude
- Cores menos agressivas reduzem cansaco visual
- Font weight mais leve melhora legibilidade em textos longos
- Fundo cinza claro (#F2F2F7) cria profundidade sem contraste excessivo

## Quando revisar
- Se adicionar tema escuro (iOS Premium dark mode)
- Se feedback de usuarios indicar que ficou "apagado" demais

## Referencias
- [[decisao-css-design-system]] — decisao original do design system
- [[Coach Nutri]]
