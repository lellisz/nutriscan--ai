-- Migration: adiciona coluna `role` na tabela profiles
-- Role 'dev' bypassa paywall e rate limiting no backend.
-- Só pode ser definido via service_role (backend/SQL Editor) — a RLS policy
-- de update foi atualizada para proteger este campo igual a is_premium.
--
-- Valores válidos: 'user' (padrão), 'dev', 'admin'

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'dev', 'admin'));

-- Atualiza a policy de update para também proteger o campo `role`.
-- O usuário não pode alterar is_premium, free_scans_limit nem role via cliente.
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    AND is_premium = (SELECT p.is_premium FROM public.profiles p WHERE p.user_id = auth.uid())
    AND free_scans_limit = (SELECT p.free_scans_limit FROM public.profiles p WHERE p.user_id = auth.uid())
    AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- Para ativar conta dev do CEO, rode no SQL Editor (substitua pelo UUID real):
-- UPDATE public.profiles SET role = 'dev' WHERE user_id = '<uuid-do-usuario>';
