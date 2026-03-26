---
tags: [bug, nutriscan, api, ia, resiliencia]
data: 2026-03-17
status: resolvido
---

## Erro
App retornava erro 500 quando o unico provider de IA (Anthropic) estava fora ou rate-limited. Usuario perdia a analise completamente.

## Causa
Dependencia de um unico provider de IA sem fallback. Qualquer instabilidade = app inutilizavel.

## Solucao
Implementar **fallback em cascata** com multiplos providers:

### scan.js
```
Groq → Anthropic → Gemini → Ollama (local)
```

### chat.js
```
Groq → Anthropic → Ollama
```

Cada provider tem `WithRetry()` com exponential backoff (3 tentativas, delay 2^n * 1000ms).

**Configuracao via env:**
```
AI_PROVIDER=groq_with_fallback  # tenta Groq, fallback pra Anthropic
```

**Arquivos afetados:** `api/scan.js`, `api/chat.js`

## Padrao de codigo
```javascript
try {
  response = await callGroqWithRetry(prompt, image);
  usedProvider = "groq";
} catch (groqError) {
  console.warn(`Groq failed: ${groqError.message}`);
  response = await callAnthropicWithRetry(prompt, image);
  usedProvider = "anthropic";
}
```

## Relacionados
- [[bug-rate-limiting-spam]] — protecao complementar
- [[bug-resposta-ia-invalida]] — validacao da resposta
- [[decisao-modelo-ia-fallback]]
- [[Coach Nutri]]
