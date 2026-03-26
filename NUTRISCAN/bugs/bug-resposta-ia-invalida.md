---
tags: [bug, nutriscan, api, ia, validacao, zod]
data: 2026-03-17
status: resolvido
---

## Erro
Frontend crashava quando a IA retornava JSON malformado ou com campos faltando (ex: `calories` como string ao inves de number).

## Causa
Sem validacao da resposta da IA. O modelo pode retornar estruturas imprevisiveis dependendo do prompt e do provider.

## Solucao
Schema Zod para validar resposta da IA antes de enviar ao frontend:

```javascript
const ScanResponseSchema = z.object({
  food_name: z.string(),
  calories: z.number().int().positive(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  confidence: z.enum(["alta", "media", "baixa"]),
  benefits: z.array(z.string()),
  // ... mais campos
});
```

Se validacao falha → HTTP 502 com erro detalhado (nao expoe ao usuario).

**Arquivos afetados:** `api/scan.js`, `api/chat.js`

## Aprendizado
**Sempre validar output de IA** com schema rigoroso. LLMs sao imprevisiveis — tratar como input externo nao confiavel.

## Relacionados
- [[bug-api-provider-unico-falha]] — resiliencia
- [[bug-db-save-nao-fatal]] — outro ponto de falha tratado
- [[decisao-zod-validacao]]
- [[Coach Nutri]]
