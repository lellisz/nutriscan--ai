/**
 * haptic(type) — Feedback tátil via navigator.vibrate
 * Graceful degradation: sem-op se não suportado.
 *
 * light   → toque sutil (ações secundárias, chips)
 * medium  → toque médio (registro de refeição, confirmações)
 * success → padrão de sucesso (meta atingida, salvamento)
 */

const PATTERNS = {
  light:   [10],
  medium:  [25],
  success: [10, 50, 10, 50, 30],
};

export function haptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(PATTERNS[type] ?? PATTERNS.light);
}
