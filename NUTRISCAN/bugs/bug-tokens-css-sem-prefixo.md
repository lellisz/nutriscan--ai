---
tags: [bug, nutriscan, css, design-system]
data: 2026-03-21
status: resolvido
---

## Erro
CSS variables nao aplicavam valores corretos. Elementos ficavam sem border-radius ou com valores default do browser.

## Causa
Tokens CSS referenciados sem o prefixo `ns-`:
- `var(--radius-sm)` → deveria ser `var(--ns-radius-sm)`
- `var(--radius-full)` → deveria ser `var(--ns-radius-full)`
- `var(--radius-xs)` → deveria ser `var(--ns-radius-sm)`

## Solucao
Corrigidos em:
- `SubscriptionPage.jsx` — 3 ocorrencias
- `InsightsPage.jsx` — 1 ocorrencia

## Como detectar no futuro
Buscar por `var(--` seguido de algo sem `ns-`:
```bash
grep -rn "var(--" src/ | grep -v "var(--ns-"
```

## Relacionados
- [[decisao-css-design-system]] — convencao de prefixo ns-
- [[Coach Nutri]]
