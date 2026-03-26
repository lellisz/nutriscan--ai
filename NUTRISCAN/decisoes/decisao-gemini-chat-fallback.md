---
tags: [decisao, praxis-nutri]
data: 2026-03-22
---

## Contexto
O Coach IA (chat) so tinha 3 providers: Groq, Anthropic e Ollama. Quando Groq e Anthropic falhavam (chaves invalidas, saldo zerado), o unico fallback era Ollama local. Em producao, sem Ollama, o chat ficava 100% indisponivel.

## Opcoes consideradas
1. **Adicionar Gemini ao chat** — mesmo padrao do scan.js, gratuito, rapido
   - Pro: tier gratuito generoso, ja testado no scan
   - Contra: mais um provider para manter
2. **Manter apenas 3 providers** — confiar que pelo menos um funciona
   - Pro: menos codigo
   - Contra: fragilidade comprovada (sessao de 2026-03-22 onde todos falharam)

## Decisao
Opcao 1: Adicionar Gemini ao chat com cascata Groq -> Anthropic -> Gemini -> Ollama.

Motivo: resiliencia. Ter 2 providers gratuitos (Groq + Gemini) garante que o chat funciona mesmo se um deles estiver fora. Anthropic e pago e Ollama e local — nenhum dos dois e confiavel em producao.

## Consequencias
- Cascata do chat agora e identica a do scan: 4 providers
- `GEMINI_API_KEY` e usada tanto pelo scan quanto pelo chat
- Modelo do chat: `gemini-2.5-flash-lite` (rapido, barato, suficiente para texto)
- Se Gemini mudar a API, ambos os endpoints precisam ser atualizados

## Links
- [[2026-03-22-coach-ia-evolution]]
- [[decisao-modelo-ia-fallback]]
