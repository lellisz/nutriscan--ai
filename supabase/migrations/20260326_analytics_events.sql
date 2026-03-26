-- Migration: analytics_events
-- Tabela de eventos de analytics proprio (fire-and-forget do frontend)
-- Apenas service role pode ler (para analytics agregado no backend/dashboard)

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text        NOT NULL,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Usuarios so podem inserir seus proprios eventos
DROP POLICY IF EXISTS "users_insert_own_events" ON public.analytics_events;
CREATE POLICY "users_insert_own_events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Leitura restrita ao service role (sem policy de SELECT para anon/authenticated)
-- Isso garante que usuarios nao consigam ler eventos de outros usuarios

-- Indice para queries por tipo de evento e data (relatorios de funil)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
  ON public.analytics_events(event_type, created_at DESC);

-- Indice para queries por usuario e data (historico individual)
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
  ON public.analytics_events(user_id, created_at DESC);
