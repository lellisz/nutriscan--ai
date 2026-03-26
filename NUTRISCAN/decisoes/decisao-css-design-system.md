---
tags: [decisao, nutriscan, frontend, css, design]
data: 2026-03-13
---

## Contexto
Como estilizar o app? Opcoes: Tailwind, CSS Modules, styled-components, CSS puro com variables.

## Decisao
**CSS custom design system** com variables e classes com prefixo `ns-`.

### Tokens (variaveis CSS)
```css
--ns-accent, --ns-bg-card, --ns-text-primary, --ns-text-muted,
--ns-border-subtle, --ns-radius, --ns-shadow
```

### Classes utilitarias
```
ns-card, ns-btn, ns-btn-primary, ns-input, ns-badge,
ns-spinner, ns-page, ns-label, ns-empty
```

### Animacoes
```
animate-fade-up, stagger-1 ... stagger-5
```

### Temas implementados
- **Polar** — branco editorial, tipografia bold (commit `fa87958`)
- **iOS Premium** — true black + Apple color system (commit `afdc15d`)

## Motivo
- Zero dependencias (no Tailwind, no CSS-in-JS)
- Mobile-first (max-width: 480px)
- Temas via troca de CSS variables
- Performance: sem runtime CSS

## Quando revisar
- Se equipe crescer e precisar de design system mais rigoroso
- Se performance de CSS for problema (muito improvavel)

## Referencias
- [[Coach Nutri]]
