---
tags: [decisao, praxis-nutri, design, mascote, praxi]
data: 2026-03-25
---

## Contexto
O mega-prompt definiu que o Praxi precisa de uma identidade visual propria como mascote.
Precisavamos de algo que representasse o "nutricionista IA" de forma acolhedora.

## Opcoes Consideradas
1. **Icone generico** — rapido mas sem personalidade
2. **Foto/ilustracao de pessoa** — complicada para SVG, sem adaptabilidade emocional
3. **Abacate nutricionista SVG** — icone reconhecivel de saude/nutricao + dinamismo emocional via estados

## Decisao
Abacate nutricionista com jaleco e oculos, implementado como SVG com 8 estados emocionais.

**Implementacao** (`src/components/praxi/PraxiAvatar.jsx`):
- Estados: happy, thinking, celebrating, cooking, sleeping, waving, worried, proud
- Tamanhos: sm (32px), md (48px), lg (80px)
- SVG inline — sem dependencia de imagem externa, funciona offline
- Cada estado muda expressao facial e postura do corpo

**Uso atual:**
- Chat header: state="happy"
- Typing indicator: state="thinking"
- Empty state: state="waving"
- Modo Respira: state="worried"
- Onboarding tela 2: state="celebrating"

## Consequencias
- Identidade visual unica e reconhecivel
- Feedback emocional contextual (usuario ve o Praxi reagindo)
- Filosofia anti-culpa reforçada visualmente (worried nao e punitivo, e empatico)
- Facil de adicionar novos estados no futuro

## Links
- [[2026-03-25-mega-prompt-completo]]
