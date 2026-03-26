---
tags: [estudo, backend, resiliencia, praxis-nutri]
data: 2026-03-22
sessao: [[2026-03-22-coach-ia-evolution]]
---

# Padrao Cascata com Fallback

## O que e
Quando voce depende de um servico externo (API de IA, banco de dados, etc.), um unico ponto de falha pode derrubar tudo. O padrao cascata tenta multiplos providers em sequencia ate um funcionar.

## Como funciona no Praxis Nutri

```
Groq (gratuito, rapido)
  |-- falhou? -->
Anthropic (pago, confiavel)
  |-- falhou? -->
Gemini (gratuito, bom)
  |-- falhou? -->
Ollama (local, sem custo)
  |-- falhou? -->
Erro para o usuario
```

## Codigo simplificado

```javascript
let response;
const errors = [];

// Tenta cada provider em ordem
for (const provider of [callGroq, callAnthropic, callGemini, callOllama]) {
  try {
    response = await provider(prompt, messages);
    break; // Funcionou! Sai do loop
  } catch (err) {
    errors.push(err.message);
    // Continua para o proximo
  }
}

if (!response) {
  throw new Error(`Todos falharam: ${errors.join(' | ')}`);
}
```

## Conceitos importantes

### 1. Ordem importa
Coloque o provider mais rapido/barato primeiro. O mais caro/lento deve ser fallback, nao primario.

### 2. Fail fast
Se o erro e de autenticacao (401), nao adianta retry — pule direto para o proximo. Retry so em erros temporarios (429 rate limit, 5xx server error).

### 3. Log de cada falha
Guarde o erro de cada provider. Se todos falharem, o log mostra exatamente o que deu errado em cada um.

### 4. Nao exponha erros internos
O usuario ve "Algo deu errado. Tente novamente." O log do servidor ve "Groq: 401 | Anthropic: 401 | Gemini: 429 | Ollama: connection refused".

## Quando usar
- Qualquer integracao com API externa
- Servicos de pagamento (Stripe -> fallback manual)
- CDNs e servicos de imagem
- Qualquer coisa que pode ficar indisponivel

## Links
- [[estudo-retry-http-errors]]
- [[decisao-gemini-chat-fallback]]
