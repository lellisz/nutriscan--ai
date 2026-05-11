// services/consent.ts
// Gerenciamento de consentimentos LGPD
// Art. 7 e 11 — bases legais para tratamento de dados pessoais e sensíveis

import { supabase } from '@/services/supabase';

export const PRIVACY_POLICY_VERSION = 'v1.0';
const APP_VERSION = '3.0.0';

export type ConsentType =
  | 'health_data_processing'
  | 'ai_coach_processing'
  | 'partner_score_sharing'
  | 'wearable_integration'
  | 'marketing_communications'
  | 'analytics_anonymous';

/**
 * Registra consentimento ativo para o tipo informado.
 * LGPD Art. 7 — consentimento deve ser livre, informado e inequívoco.
 */
export async function grantConsent(type: ConsentType): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase.from('consents').upsert(
    {
      user_id:         user.id,
      consent_type:    type,
      granted:         true,
      granted_at:      new Date().toISOString(),
      revoked_at:      null,
      consent_version: PRIVACY_POLICY_VERSION,
      app_version:     APP_VERSION,
    },
    { onConflict: 'user_id,consent_type,consent_version' }
  );
  if (error) throw error;
}

/**
 * Revoga consentimento para o tipo informado.
 * LGPD Art. 8 §5 — revogação deve ser tão fácil quanto o consentimento.
 */
export async function revokeConsent(type: ConsentType): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('consents')
    .update({ revoked_at: new Date().toISOString(), granted: false })
    .eq('user_id', user.id)
    .eq('consent_type', type)
    .is('revoked_at', null);
  if (error) throw error;
}

/**
 * Verifica se o usuário tem consentimento ativo para o tipo informado.
 */
export async function hasConsent(type: ConsentType): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('consents')
    .select('id')
    .eq('user_id', user.id)
    .eq('consent_type', type)
    .eq('granted', true)
    .is('revoked_at', null)
    .single();

  return !!data;
}

/**
 * Executa fn() apenas se o consentimento estiver ativo.
 * Use para proteger qualquer operação que salva dados de saúde.
 */
export async function saveWithConsent<T>(
  type: ConsentType,
  fn: () => Promise<T>
): Promise<T> {
  const ok = await hasConsent(type);
  if (!ok) throw new Error(`Consentimento '${type}' necessário para esta operação`);
  return fn();
}

/**
 * Retorna todos os consentimentos ativos do usuário.
 */
export async function getAllConsents(): Promise<Record<string, boolean>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from('consents')
    .select('consent_type,granted')
    .eq('user_id', user.id)
    .is('revoked_at', null);

  const result: Record<string, boolean> = {};
  (data ?? []).forEach((row: { consent_type: string; granted: boolean }) => {
    result[row.consent_type] = row.granted;
  });
  return result;
}

/**
 * Solicita exportação dos dados via Edge Function.
 * LGPD Art. 18 — portabilidade.
 */
export async function requestDataExport(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const res = await supabase.functions.invoke('export-data', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (res.error) throw res.error;

  // Em mobile, o download é tratado pelo chamador (ex: Share API)
  return res.data;
}

/**
 * Solicita exclusão permanente da conta.
 * LGPD Art. 18 — direito ao esquecimento.
 * REQUER confirmação explícita do usuário antes de chamar.
 */
export async function requestAccountDeletion(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: 'DELETE_MY_ACCOUNT' },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
}
