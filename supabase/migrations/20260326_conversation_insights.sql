-- ============================================================
--  Migration: conversation_insights
--  Date: 2026-03-26
--
--  Tabela para armazenar insights extraidos automaticamente
--  das conversas do usuario com o Coach Praxi.
--
--  Extraidos a cada 5 mensagens via Gemini Flash Lite (fire-and-forget).
--  Injetados de volta no system prompt para personalizacao progressiva.
--
--  Como aplicar:
--    1. Supabase Dashboard → SQL Editor → colar e executar
--    2. Ou via CLI: supabase db push
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversation_insights (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight    text        NOT NULL,
  -- Categorias definidas:
  --   preference  = preferencias alimentares (ex: nao gosta de broccolis)
  --   difficulty  = dificuldades relatadas (ex: dificuldade em comer proteina no cafe)
  --   progress    = progressos registrados (ex: perdeu 2kg no ultimo mes)
  --   restriction = restricoes dieteticas (ex: intolerante a lactose)
  --   context     = contexto de vida (ex: treina de manha, trabalha em turno noturno)
  category   text        NOT NULL CHECK (category IN ('preference', 'difficulty', 'progress', 'restriction', 'context')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: cada usuario so ve e grava os proprios insights
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_insights" ON public.conversation_insights;
CREATE POLICY "users_own_insights" ON public.conversation_insights
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index para busca rapida dos insights mais recentes por usuario
-- (padrao de acesso: ORDER BY created_at DESC LIMIT 5)
CREATE INDEX IF NOT EXISTS idx_insights_user_created
  ON public.conversation_insights(user_id, created_at DESC);
