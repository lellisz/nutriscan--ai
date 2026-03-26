---
tags: [decisao, praxis-nutri, seguranca, supabase]
data: 2026-03-22
---

## Contexto
O campo `is_premium` na tabela `profiles` podia ser alterado diretamente pelo cliente via Supabase SDK, pois a policy de UPDATE so verificava `auth.uid() = user_id`. Qualquer usuario podia se tornar premium sem pagar.

## Opcoes consideradas
1. **Remover is_premium da policy de UPDATE** — impedir qualquer update no profile
   - Pro: Seguro
   - Contra: Quebra atualizacao de nome, peso, metas, etc.
2. **Coluna computada ou tabela separada** — mover is_premium para tabela gerenciada pelo backend
   - Pro: Separacao clara de responsabilidades
   - Contra: Requer migracao, joins extras, mudanca em queries
3. **RLS WITH CHECK subquery** — permitir update no profile mas comparar is_premium e free_scans_limit contra o valor atual no banco
   - Pro: Zero migracao, protecao forte, transparente
   - Contra: Subquery tem custo (minimo em profiles com PK lookup)

## Decisao
Opcao 3 — RLS WITH CHECK com subquery.

```sql
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    AND is_premium = (SELECT p.is_premium FROM public.profiles p WHERE p.user_id = auth.uid())
    AND free_scans_limit = (SELECT p.free_scans_limit FROM public.profiles p WHERE p.user_id = auth.uid())
  );
```

Complementado com:
- Frontend `SubscriptionPage` bloqueado (mostra "Pagamento ainda nao integrado")
- `updatePremiumStatus()` marcada como `@deprecated` no `db.js`
- Ativacao premium so via backend com `service_role` (webhook de pagamento)

## Consequencias
- Impossivel escalar privilegio via cliente (token anonimo)
- Profile update continua funcionando normalmente para campos permitidos
- Quando gateway de pagamento for integrado, backend usa service_role para bypassar RLS
- Custo de performance da subquery e negligivel (PK index lookup)

## Links
- [[2026-03-22-security-hardening]]
- [[decisao-security-hardening]]
