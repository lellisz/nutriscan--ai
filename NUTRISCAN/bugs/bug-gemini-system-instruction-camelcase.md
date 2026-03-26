---
tags: [bug, nutriscan, ia, scan]
data: 2026-03-22
status: resolvido
---

## Erro
Scan retorna 502 "Formato de resposta invalido da IA" quando Gemini e acionado como fallback. O modelo responde sem seguir o schema JSON esperado.

## Causa
Em `api/scan.js` linha 367, o payload enviado para a Gemini API usava `systemInstruction` (camelCase), mas a API REST v1beta aceita apenas `system_instruction` (snake_case). O campo era silenciosamente ignorado — o modelo respondia sem o system prompt, gerando texto livre em vez de JSON estruturado.

## Solucao
Trocar `systemInstruction` por `system_instruction` no body do fetch para Gemini em `api/scan.js`.

## Aprendizado
A Gemini REST API nao retorna erro quando recebe campos desconhecidos — simplesmente ignora. Isso torna bugs de naming dificeis de detectar. Sempre verificar a documentacao oficial para nomes de campos exatos.

## Referencias
- [[Coach Nutri]]
- [[decisao-gemini-chat-fallback]]
