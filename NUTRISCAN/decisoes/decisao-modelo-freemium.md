---
tags: [decisao, nutriscan, monetizacao, premium]
data: 2026-03-17
---

## Contexto
Como monetizar o app? Usuarios precisam experimentar antes de pagar.

## Decisao
**Modelo freemium:**
- Free: 2 scans por conta (`free_scans_limit = 2`)
- Premium: scans ilimitados (`is_premium = true`)
- Controle via `profiles.is_premium`, `profiles.free_scans_used`, `profiles.free_scans_limit`

## Motivo
- Baixa barreira de entrada: usuario testa antes
- Simples de implementar (flag booleana)
- Upgrade path claro

## Quando revisar
- Se conversao for baixa (aumentar free limit?)
- Se implementar planos (mensal/anual)
- Se adicionar features premium alem de scans

## Referencias
- [[bug-scan-free-tier]] — implementacao do enforcement
- [[Coach Nutri]]
