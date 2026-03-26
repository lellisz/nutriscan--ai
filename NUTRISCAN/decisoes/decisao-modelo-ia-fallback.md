---
tags: [decisao, nutriscan, ia, arquitetura]
data: 2026-03-17
---

## Contexto
Precisamos de IA para analise nutricional (visao) e coaching (texto). Qual modelo usar? Dependencia de um unico provider e arriscado.

## Decisao
**Cadeia de fallback com multiplos providers:**

### Scan (visao - api/scan.js)
| Prioridade | Provider | Modelo | Uso |
|---|---|---|---|
| 1 | Groq | llama-3.2-90b-vision-preview | Rapido e barato |
| 2 | Anthropic | claude-sonnet-4-6 | Mais preciso |
| 3 | Gemini | gemini-2.0-flash | Alternativa Google |
| 4 | Ollama | llava (local) | Fallback offline |

### Coach (texto - api/chat.js)
| Prioridade | Provider | Modelo | Uso |
|---|---|---|---|
| 1 | Groq | llama-3.1-8b-instant | Ultra rapido |
| 2 | Groq | llama-3.3-70b-versatile | Mais inteligente |
| 3 | Anthropic | claude-sonnet-4-6 | Premium |
| 4 | Ollama | local | Fallback |

Controlado por env var `AI_PROVIDER` com valores como `groq_with_fallback`.

## Motivo
- Groq primeiro: mais rapido e mais barato (tokens gratuitos)
- Anthropic como fallback premium: mais preciso porem caro
- Ollama local: funciona sem internet (dev + fallback extremo)
- Nenhum vendor lock-in

## Quando revisar
- Se Groq mudar pricing ou deprecar modelos
- Se novo provider surgir com melhor custo-beneficio
- Se qualidade do Groq para visao nao for suficiente

## Referencias
- [[bug-api-provider-unico-falha]] — bug que motivou essa decisao
- [[decisao-zod-validacao]] — validacao complementar
- [[Coach Nutri]]
