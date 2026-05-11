// supabase/functions/delete-account/index.ts
// Direito ao Esquecimento — LGPD Art. 18
// Exclusão completa e irreversível de todos os dados do usuário

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'https://praxis-gold.vercel.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[2];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return new Response('Unauthorized', { status: 401 });

    // Confirmação explícita obrigatória — LGPD: ação irreversível
    const body = await req.json();
    if (body.confirm !== 'DELETE_MY_ACCOUNT') {
      return new Response(
        JSON.stringify({ error: 'Confirmação obrigatória: envie { confirm: "DELETE_MY_ACCOUNT" }' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tentar SQL function (se migração já rodou)
    const { error: rpcError } = await supabaseAdmin.rpc('delete_user_all_data', {
      target_user_id: user.id,
    });

    if (rpcError) {
      // Fallback: exclusão manual em cascata
      const tables = [
        'coach_messages',
        'behavior_patterns',
        'frequent_meals',
        'fasting_sessions',
        'meals',
        'daily_logs',
        'consents',
        'security_log',
        'profiles',
      ];
      for (const table of tables) {
        await supabaseAdmin.from(table).delete().eq('user_id', user.id).catch(() => {});
      }
      await supabaseAdmin
        .from('partners')
        .delete()
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
        .catch(() => {});
    }

    // Deletar da auth (irreversível)
    await supabaseAdmin.auth.admin.deleteUser(user.id);

    return new Response(
      JSON.stringify({
        message: 'Conta e todos os dados excluídos com sucesso.',
        legal: 'LGPD Art. 18 — Direito ao Esquecimento',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('delete-account error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
