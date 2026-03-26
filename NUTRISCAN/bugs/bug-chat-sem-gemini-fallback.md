---
tags: [bug, praxis-nutri]
status: resolvido
data: 2026-03-22
---

## Sintoma
Quando Groq e Anthropic falhavam, o chat ia direto para Ollama (que requer servidor local). Se Ollama nao estivesse rodando, todas as respostas falhavam. No scan, Gemini funcionava como fallback gratuito, mas no chat nao.

## Causa raiz
`api/scan.js` tinha 4 providers na cascata (Groq -> Anthropic -> Gemini -> Ollama), mas `api/chat.js` so tinha 3 (Groq -> Anthropic -> Ollama). Gemini nunca foi adicionado ao chat quando o scan foi atualizado.

## Fix
1. Adicionado `GEMINI` ao objeto `AI_PROVIDERS` e `GEMINI_FAST` ao `MODELS`
2. Criada funcao `callGemini()` usando a API `generativelanguage.googleapis.com/v1beta`
3. Encaixado na cascata entre Anthropic e Ollama

Arquivo: `api/chat.js`

## Como prevenir
- Quando adicionar um provider novo no scan, verificar se o chat tambem precisa
- Manter paridade de providers entre scan.js e chat.js

## Links
- [[2026-03-22-coach-ia-evolution]]
- [[decisao-gemini-chat-fallback]]
