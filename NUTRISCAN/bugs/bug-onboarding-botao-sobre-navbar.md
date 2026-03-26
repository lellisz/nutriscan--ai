---
tags: [bug, nutriscan, frontend, onboarding]
data: 2026-03-22
status: resolvido
---

## Erro
O botao CTA verde na tela de onboarding ficava sobreposto a bottom nav bar, tornando os icones (Inicio, Historico, Coach, Perfil) inacessiveis.

## Causa
Em `src/features/onboarding/pages/OnboardingPage.jsx` linha 426, o container dos botoes tinha `paddingBottom: 20px`, menor que a altura da bottom nav bar (72px definida por `--ns-nav-height`). O conteudo ficava atras da navbar fixa.

## Solucao
Trocar `paddingBottom: 20` por `paddingBottom: "calc(var(--ns-nav-height) + 20px)"` (~92px total). Usa a variavel CSS do design system em vez de valor hardcoded.

Outras telas (Dashboard, History, Profile, Scan) ja tinham `paddingBottom: 90-100px` e nao tinham o problema.

## Aprendizado
Telas com bottom nav fixa precisam de paddingBottom >= altura da nav. Usar a variavel CSS `--ns-nav-height` garante consistencia se a altura mudar no futuro.

## Referencias
- [[Coach Nutri]]
