---
tags: [bug, nutriscan, validacao, chat]
data: 2026-03-22
status: resolvido
---

## Erro
Respostas 400 do chat (`api/chat.js`) chegavam ao cliente sem detalhes de validacao — o array `details` sempre vazio.

## Causa
Em `api/chat.js` linha 722, o codigo usava `err.errors?.map(e => e.message)`. No Zod v4 (usado no projeto, v4.3.6), a propriedade correta e `.issues`, nao `.errors`. Como `err.errors` era `undefined`, o optional chaining retornava `undefined` e o fallback `|| []` produzia array vazio.

## Solucao
Trocar para `(err.issues || err.errors || []).map(e => e.message)` — mesmo padrao ja usado em `api/scan.js`. Compativel com Zod v3 e v4.

## Aprendizado
Zod v4 renomeou `.errors` para `.issues` no ZodError. Ao migrar versoes de libs, verificar breaking changes em propriedades de objetos de erro.

## Referencias
- [[Coach Nutri]]
- [[decisao-zod-validacao]]
