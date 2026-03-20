-- ==================== COACH IA CONVERSACIONAL ====================
-- Migration: Add chat functionality
-- Date: 2026-03-17
--
-- Run this migration in your Supabase SQL Editor to add the Coach IA feature

-- Chat conversations (sessoes de conversa com o Coach IA)
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text, -- Auto-generated or user-defined
  summary text, -- Brief summary of conversation
  message_count integer not null default 0,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id, updated_at desc);

-- Chat messages (mensagens individuais)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  -- AI metadata
  model text, -- e.g., "claude-opus-4-20250514"
  tokens_used integer, -- Total tokens for this message
  context_used jsonb default '{}'::jsonb, -- What user data was included (profile, goals, recent_scans)
  -- Attachments (for future: image analysis in chat)
  attachments jsonb default '[]'::jsonb,
  --
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_messages_conversation_id_idx
  on public.chat_messages (conversation_id, created_at asc);

create index if not exists chat_messages_user_id_idx
  on public.chat_messages (user_id, created_at desc);

-- RLS Policies for chat_conversations
alter table public.chat_conversations enable row level security;

drop policy if exists "chat_conversations_select_own" on public.chat_conversations;
drop policy if exists "chat_conversations_insert_own" on public.chat_conversations;
drop policy if exists "chat_conversations_update_own" on public.chat_conversations;
drop policy if exists "chat_conversations_delete_own" on public.chat_conversations;

create policy "chat_conversations_select_own"
  on public.chat_conversations for select using (auth.uid() = user_id);

create policy "chat_conversations_insert_own"
  on public.chat_conversations for insert with check (auth.uid() = user_id);

create policy "chat_conversations_update_own"
  on public.chat_conversations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_conversations_delete_own"
  on public.chat_conversations for delete using (auth.uid() = user_id);

-- RLS Policies for chat_messages
alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
drop policy if exists "chat_messages_delete_own" on public.chat_messages;

create policy "chat_messages_select_own"
  on public.chat_messages for select using (auth.uid() = user_id);

create policy "chat_messages_insert_own"
  on public.chat_messages for insert with check (auth.uid() = user_id);

create policy "chat_messages_delete_own"
  on public.chat_messages for delete using (auth.uid() = user_id);

-- Success message
do $$
begin
  raise notice 'Coach IA migration completed successfully!';
end $$;
