// supabase/functions/export-data/index.ts
// Portabilidade de dados — LGPD Art. 18
// Retorna todos os dados do usuário em JSON para download

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return new Response('Unauthorized', { status: 401 });

    // Buscar todos os dados do usuário em paralelo
    const [profile, logs, meals, fasting, coach, consents, frequentMeals] =
      await Promise.allSettled([
        supabase
          .from('profiles')
          .select('name,goal,calories_target,protein_target,hydration_target,created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('daily_logs')
          .select('date,context,score,calories_consumed,protein_consumed,hydration_ml,sleep_hours,created_at')
          .eq('user_id', user.id),
        supabase
          .from('meals')
          .select('date,meal_type,name,calories,protein,carbs,fat,logged_at')
          .eq('user_id', user.id),
        supabase
          .from('fasting_sessions')
          .select('protocol,started_at,ended_at,completed')
          .eq('user_id', user.id),
        supabase
          .from('coach_messages')
          .select('role,content,created_at')
          .eq('user_id', user.id),
        supabase
          .from('consents')
          .select('consent_type,granted,granted_at,revoked_at,consent_version')
          .eq('user_id', user.id),
        supabase
          .from('frequent_meals')
          .select('name,calories,protein,carbs,fat,count,last_used')
          .eq('user_id', user.id),
      ]);

    const extract = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' ? r.value.data : null;

    const exportData = {
      export_date:    new Date().toISOString(),
      legal_basis:    'LGPD Art. 18 — Portabilidade de Dados Pessoais',
      data_controller:'PRAXIS NUTRITION',
      user_email:     user.email,
      data: {
        profile:           extract(profile),
        nutrition_logs:    extract(logs),
        meals:             extract(meals),
        fasting_history:   extract(fasting),
        coach_history:     extract(coach),
        consents_history:  extract(consents),
        frequent_meals:    extract(frequentMeals),
      },
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="meus-dados-praxis.json"',
      },
    });

  } catch (err) {
    console.error('export-data error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
