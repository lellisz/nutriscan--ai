---
tags: [decisao, praxis-nutri, ia, groq, gemini]
data: 2026-03-25
---

## Contexto
O mega-prompt definiu restricao explicita: NUNCA usar Anthropic/Claude no chat.
Precisavamos de um motor de IA para o Coach com qualidade, velocidade e custo controlados.

## Opcoes Consideradas
1. **So Groq** — rapido, barato, mas sem fallback se o servico cair
2. **So Gemini** — multimodal nativo, mas API menos estavel para chat
3. **Intent router + dual-provider** — LLaMA 8B classifica intent (~10ms), roteia para modelo certo; fallback automatico entre Groq e Gemini

## Decisao
Opcao 3: Intent Router com LLaMA 8B + fallback Groq/Gemini.

**Arquitetura:**
- `detectIntent()`: chama llama-3.1-8b-instant com max 50 tokens para classificar em 7 intents
- `getRouteByIntent()`: mapeia intent para {provider, model, maxTokens}
  - small_talk: Groq 8B (50 tokens, ultra-rapido)
  - question/recipe: Groq 70B (600 tokens)
  - emotional: Gemini Flash (800 tokens, mais empatico)
  - progress_report: Gemini Flash (1000 tokens)
- `callWithFallback()`: Groq falha → Gemini; Gemini falha → Groq; ambos falham → mensagem amigavel
- Session memory com Gemini Flash Lite (modelo mais barato): extrai insights a cada 5 mensagens

## Consequencias
- Chat responsivo (~300ms para small_talk, ~1s para questoes nutricionais)
- Sem lock-in em um so provider
- Custo controlado: mensagens simples usam modelo de 8B (10x mais barato que 70B)
- Session memory personaliza Praxi entre sessoes sem custo de contexto longo

## Links
- [[2026-03-25-mega-prompt-completo]]
