---
tags: [estudo, frontend, javascript, praxis-nutri]
data: 2026-03-22
sessao: [[2026-03-22-coach-ia-evolution]]
---

# AbortController — Timeout de Requests em JavaScript

## O problema
`fetch()` nao tem timeout nativo. Se o servidor travar, o request fica pendurado para sempre. O usuario fica olhando o spinner infinitamente.

## A solucao: AbortController

```javascript
// Cria o controller
const controller = new AbortController();

// Define timeout de 30 segundos
const timeoutId = setTimeout(() => controller.abort(), 30000);

// Passa o signal para o fetch
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ message: "oi" }),
  signal: controller.signal, // <-- isso!
});

// Se chegou aqui, o request completou — cancela o timeout
clearTimeout(timeoutId);
```

## Como tratar o erro
Quando o AbortController aborta, o fetch lanca um `AbortError`:

```javascript
try {
  const response = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === "AbortError") {
    // Timeout! Mostrar mensagem amigavel
    alert("O servidor demorou para responder. Tente novamente.");
  } else if (err instanceof TypeError) {
    // Erro de rede (sem internet, DNS falhou, etc.)
    alert("Sem conexao com a internet.");
  } else {
    // Outro erro
    alert("Algo deu errado.");
  }
}
```

## Por que nao usar apenas setTimeout?
Um `setTimeout` com `reject` nao cancela o request HTTP real. O servidor continua processando. Com AbortController, o request e realmente cancelado — o browser fecha a conexao.

## Classificacao de erros no frontend

| Tipo | Deteccao | Mensagem para o usuario |
|------|----------|------------------------|
| Timeout | `err.name === "AbortError"` | "Demorou para responder" |
| Sem rede | `err instanceof TypeError` | "Sem conexao" |
| Rate limit | `err.message.includes("429")` | "Muitas requisicoes" |
| Outros | default | "Algo deu errado" |

## Regra: nunca mostre erros tecnicos
O usuario nao precisa saber que foi um "AbortError" ou "TypeError". Traduza para linguagem humana.

## Links
- [[2026-03-22-coach-ia-evolution]]
