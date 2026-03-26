---
tags: [bug, nutriscan, build, imports, critico]
data: 2026-03-13
status: resolvido
commit: f2fc40f
---

## Erro
Build falha com erro de sintaxe nos imports do `src/App.jsx`. JavaScript nao consegue parsear o arquivo.

## Causa
Os imports continham **aspas curvas** (smart quotes `\u201C \u201D`) ao inves de aspas retas (`" "`). Provavelmente o codigo foi colado de um documento formatado (Word, Notion, etc.) que converteu as aspas automaticamente.

```jsx
// ERRADO - aspas curvas (invisivel a olho nu)
import { useState } from \u201Creact\u201D;

// CORRETO - aspas retas
import { useState } from "react";
```

## Solucao
Substituir todas as aspas curvas por aspas retas no arquivo `src/App.jsx`.

**Arquivo afetado:** `src/App.jsx`
**Commit:** `f2fc40f`

## Como detectar no futuro
- Se o build falha com `SyntaxError: Unexpected token` nos imports
- Copiar a linha do import e colar num editor hex - aspas curvas tem codigo Unicode diferente
- Usar `grep -P '[\x{201C}\x{201D}]'` para encontrar aspas curvas

## Prevencao
- Nunca copiar codigo de documentos formatados (Word, Google Docs, Notion)
- Se precisar copiar, colar primeiro num editor de texto puro
- Configurar linter (ESLint) para pegar esse tipo de erro

## Relacionados
- [[bug-case-sensitivity-app-jsx]] — outro bug no mesmo arquivo, mesma sessao
- [[bug-es-module-build]] — cadeia de bugs de build do dia 13/03
- [[Coach Nutri]]
