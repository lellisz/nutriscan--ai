# Design System v2 — Praxis Nutri

## Fontes
- Headings (h1/h2/h3): Nunito (600/700/800)
- Body: DM Sans (400/500/600)
- Números: Space Grotesk (500/700) + classe .mono-num

## Paleta
| Variável | Hex | Uso |
|----------|-----|-----|
| --praxis-green | #1A7F56 | Primária, acentos |
| --praxis-green-light | #E8F5EC | Backgrounds suaves |
| --bg-warm | #FAF8F5 | Background geral |
| --macro-protein | #3B82F6 | Barras proteína |
| --macro-carb | #F59E0B | Barras carboidrato |
| --macro-fat | #8B5CF6 | Barras gordura |
| --attention-gentle | #E5A44D | Atenção (nunca erro) |

## Classes utilitárias
- .glass: backdrop-filter blur(12px) — header/nav
- .mono-num: tabular-nums — calorias/macros
- .skeleton: pulse loading
- .scan-btn-glow: pulse verde no FAB
- .history-scroll-container / .history-day-group: scroll-snap

## Animações (motion)
- Botões: whileTap scale 0.95, spring stiffness 400 damping 17
- Cards: stagger 0.06s, spring stiffness 300 damping 24
- Praxi: float y 0→-6→0, 3s loop
- Gotas: spring stiffness 500 damping 25
- Sempre: useReducedMotion() para acessibilidade

## Filosofia
- Nunca vermelho como fracasso → usar #E5A44D (âmbar gentil)
- Mobile-first: max-width 480px, 100dvh
- Inline styles primário (sem Tailwind, sem CSS modules)
