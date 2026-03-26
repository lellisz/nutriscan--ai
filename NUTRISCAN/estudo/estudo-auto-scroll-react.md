---
tags: [estudo, frontend, react, ux, praxis-nutri]
data: 2026-03-22
sessao: [[2026-03-22-coach-ia-evolution]]
---

# Auto-Scroll Inteligente em React

## O problema
Em um chat, voce quer que novas mensagens aparecam na tela automaticamente (scroll para baixo). Mas se o usuario scrollou para cima para ler mensagens antigas, voce NAO pode puxar ele de volta — e irritante e interrompe a leitura.

## A solucao: detectar posicao do scroll

```jsx
const scrollContainerRef = useRef(null);
const isNearBottomRef = useRef(true); // useRef, nao useState!
const messagesEndRef = useRef(null);

// Detecta se o usuario esta perto do fim
function handleScroll() {
  const el = scrollContainerRef.current;
  if (!el) return;
  const { scrollHeight, scrollTop, clientHeight } = el;
  // 80px de tolerancia
  isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
}

// Scroll condicional
function scrollToBottom(force = false) {
  if (force || isNearBottomRef.current) {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
}
```

## Por que useRef e nao useState?
- `useState` causa re-render a cada scroll event (dezenas por segundo)
- `useRef` atualiza o valor sem re-render
- Scroll events sao de alta frequencia — performance importa

## Os 3 conceitos do scroll

### scrollHeight
Altura total do conteudo (incluindo parte invisivel). Se o chat tem 5000px de mensagens, scrollHeight = 5000.

### scrollTop
Quanto o usuario scrollou para baixo. Se esta no topo, scrollTop = 0.

### clientHeight
Altura visivel do container. O que cabe na tela.

### A formula
```
distanciaDoFim = scrollHeight - scrollTop - clientHeight
```
Se `distanciaDoFim < 80`, o usuario esta "perto do fim" e podemos fazer scroll automatico.

## Quando forcar scroll
Quando o PROPRIO usuario envia uma mensagem, force o scroll mesmo que ele esteja lendo historico:

```jsx
// Ao enviar mensagem
setMessages(prev => [...prev, novaMensagem]);
setTimeout(() => scrollToBottom(true), 50); // force = true
```

## Links
- [[2026-03-22-coach-ia-evolution]]
