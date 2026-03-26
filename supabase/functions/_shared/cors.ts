/**
 * CORS headers compartilhados entre todas as Edge Functions do Praxis Nutri.
 *
 * ALLOWED_ORIGIN deve ser configurado via `supabase secrets set ALLOWED_ORIGIN=https://seudominio.com`.
 * Em desenvolvimento local (supabase start), a variavel pode nao estar definida —
 * nesse caso o fallback '*' e aceitavel. Em producao, SEMPRE defina ALLOWED_ORIGIN.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
