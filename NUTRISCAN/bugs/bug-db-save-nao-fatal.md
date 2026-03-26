---
tags: [bug, nutriscan, api, database, resiliencia]
data: 2026-03-17
status: resolvido
---

## Erro
Se o Supabase falhasse ao salvar o scan, o usuario perdia a analise inteira — mesmo que a IA tivesse respondido com sucesso.

## Causa
Erro no `saveScanToDatabase()` propagava e matava a response.

## Solucao
Tornar o save **nao-fatal**: logar erro mas retornar a analise ao usuario.

```javascript
try {
  savedScan = await saveScanToDatabase(userId, analysisResult);
} catch (databaseError) {
  console.error(`Database save error (non-fatal):`, databaseError.message);
  // Sentry captura, mas usuario recebe a analise normalmente
}
```

**Arquivo afetado:** `api/scan.js` (linhas 720-740)

## Trade-off
- **Pro:** Usuario sempre recebe a analise
- **Contra:** Scan pode nao ser persistido (nao aparece no historico)
- **Mitigacao:** Sentry alerta sobre falhas de save para investigar

## Relacionados
- [[bug-resposta-ia-invalida]] — outra camada de protecao
- [[bug-upsert-logs-duplicados]] — outro bug de DB
- [[Coach Nutri]]
