---
tags: [bug, nutriscan, database, supabase, coach, critico]
data: 2026-03-21
status: resolvido
resolvido_em: 2026-03-21
---

## Erro
Coach IA retorna erro ao tentar usar: tabelas `chat_conversations` e `chat_messages` nao existem no Supabase.

## Causa
Migration `supabase/migrations/20260317_coach_ia.sql` foi criada mas **nunca executada** no Supabase console.

## Passo a passo para resolver

### Opcao A — SQL Editor no Dashboard (recomendado)

1. Acesse https://supabase.com/dashboard e abra seu projeto
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New query**
4. Abra o arquivo `supabase/migrations/20260317_coach_ia.sql` no editor de codigo
5. Copie todo o conteudo do arquivo (Ctrl+A, Ctrl+C)
6. Cole no SQL Editor do Supabase
7. Clique em **Run** (ou F5)
8. Verifique que a mensagem de saida inclui: `NOTICE: Coach IA migration completed successfully!`
9. Confirme que as tabelas foram criadas: no menu lateral, clique em **Table Editor** e verifique que `chat_conversations` e `chat_messages` aparecem na lista

### Opcao B — Supabase CLI (se tiver a CLI instalada e configurada)

```bash
supabase db push
```

### Verificacao pos-execucao

No SQL Editor, rode:
```sql
select count(*) from public.chat_conversations;
select count(*) from public.chat_messages;
```
Ambas devem retornar `0` sem erro.

## O que a migration cria

- Tabela `chat_conversations` (sessoes de conversa com o Coach IA)
- Tabela `chat_messages` (mensagens individuais de cada conversa)
- Indices para performance (`user_id`, `conversation_id`, timestamps)
- Politicas RLS: usuarios so acessam suas proprias conversas/mensagens

## Workaround atual
`api/chat.js` tem `ensureChatTablesExist()` que detecta tabelas faltantes pelo codigo de erro PostgreSQL `42P01` e retorna mensagem de erro clara ao inves de travar.

## Status
**RESOLVIDO** — migration executada em 2026-03-21 via Supabase SQL Editor.

## Relacionados
- [[decisao-modelo-ia-fallback]] — Coach usa mesma cadeia de fallback
- [[Coach Nutri]]
