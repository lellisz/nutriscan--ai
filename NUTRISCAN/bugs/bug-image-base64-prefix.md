---
tags: [bug, nutriscan, api, imagem, base64]
data: 2026-03-17
status: resolvido
---

## Erro
API de IA rejeitava imagens quando vinham com prefixo data URL (`data:image/jpeg;base64,...`).

## Causa
Frontend envia imagem como data URL completo. APIs de IA esperam base64 puro sem prefixo.

## Solucao
Strip do prefixo antes de enviar pra IA:

```javascript
const imageBase64 = validatedRequest.imageBase64.includes(",")
  ? validatedRequest.imageBase64.split(",")[1]
  : validatedRequest.imageBase64;
```

**Arquivo afetado:** `api/scan.js` (linhas 572-575)

## Aprendizado
Sempre normalizar input de imagem. Browsers geram data URLs com prefixo, APIs esperam base64 puro.

## Relacionados
- [[bug-resposta-ia-invalida]] — outra normalizacao de dados
- [[Coach Nutri]]
