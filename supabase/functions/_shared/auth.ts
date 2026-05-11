// supabase/functions/_shared/auth.ts
// Helper compartilhado para autenticação JWT via Supabase

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js';

export interface AuthResult {
  user_id: string;
  email: string | null;
  supabase: SupabaseClient;
}

/**
 * Extrai e valida o JWT do header Authorization.
 * Retorna { user_id, email, supabase } ou lança Response 401.
 *
 * Uso:
 *   try {
 *     const { user_id, supabase } = await getUserFromAuthHeader(req);
 *   } catch (resp) {
 *     return resp; // Response 401 já formatada
 *   }
 */
export async function getUserFromAuthHeader(
  req: Request,
  corsHeaders: Record<string, string> = {}
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Response(JSON.stringify({ error: 'Unauthorized: missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    throw new Response(JSON.stringify({ error: 'Unauthorized: empty token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    // Tenta logar tentativa de auth inválida (não-bloqueante)
    try {
      await supabase.from('security_log').insert({
        user_id: null,
        event: 'auth_failure',
        details: { reason: error?.message ?? 'no_user', token_prefix: token.slice(0, 8) },
      });
    } catch {
      /* swallow */
    }
    throw new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return { user_id: user.id, email: user.email ?? null, supabase };
}

/**
 * Detecta se o token é o service_role (admin) ao invés de user JWT.
 * Útil para endpoints que aceitam tanto user quanto cron/admin.
 */
export function isServiceRoleToken(req: Request): boolean {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  return token.length > 0 && token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Cria um client com service_role (admin), para operações cron / sistema.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}
