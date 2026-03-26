---
tags: [decisao, nutriscan, validacao, api, seguranca]
data: 2026-03-17
---

## Contexto
Endpoints da API recebem dados do frontend E da IA. Ambos podem ser invalidos.

## Decisao
**Zod** para validacao em todas as fronteiras:
1. **Request validation** — validar input do usuario (body, headers)
2. **Response validation** — validar output da IA antes de enviar ao frontend

## Motivo
- Type-safe em runtime (complementa TypeScript)
- Mensagens de erro claras e detalhadas
- Funciona em serverless sem dependencias pesadas
- Mesmo lib no frontend e backend

## Quando revisar
- Se migrar para TypeScript completo com tRPC (validacao integrada)

## Referencias
- [[bug-resposta-ia-invalida]] — bug que motivou validacao de response
- [[decisao-modelo-ia-fallback]] — resposta varia por provider, validacao essencial
- [[Coach Nutri]]
