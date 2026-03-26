---
tags: [bug, nutriscan, api, premium, monetizacao]
data: 2026-03-17
status: resolvido
---

## Erro
Usuarios free podiam escanear sem limite. Sem enforcement do tier gratuito.

## Causa
Funcao `checkScanPermission()` nao existia. Nenhuma verificacao de `is_premium` ou `free_scans_used`.

## Solucao
Funcao `checkScanPermission()` no `api/scan.js` (linhas 426-457):
1. Busca `profiles.is_premium` e `profiles.free_scans_used` / `free_scans_limit`
2. Premium = sem limite
3. Free = compara `free_scans_used < free_scans_limit` (default: 2)
4. Retorna HTTP 402 Payment Required se excedeu

Apos scan bem-sucedido, incrementa `free_scans_used`.

**Arquivo afetado:** `api/scan.js`

## Relacionados
- [[bug-rate-limiting-spam]] — protecao por velocidade (complementar)
- [[decisao-modelo-freemium]]
- [[Coach Nutri]]
