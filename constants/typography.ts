import { fonts } from './design';
import { Colors } from './Colors';

// ─── TYPOGRAPHY — PRAXIS Spec v2.0 ───────────────────────────────────────────
// Hierarquia estrita — não misturar famílias entre categorias
export const Typography = {
  // Cormorant Garamond — display, logo, títulos grandes
  display: { fontFamily: fonts.serifLight,       letterSpacing: 8, textTransform: 'uppercase' as const },
  heading: { fontFamily: fonts.serifRegular,      letterSpacing: 4 },

  // Jost — UI, labels, botões, navegação
  label:   { fontFamily: fonts.sansRegular,  letterSpacing: 2, textTransform: 'uppercase' as const, fontSize: 11 },
  button:  { fontFamily: fonts.sansMedium,   letterSpacing: 3, textTransform: 'uppercase' as const, fontSize: 12 },
  body:    { fontFamily: fonts.sansLight,    fontSize: 14, lineHeight: 22 },

  // DM Sans — dados numéricos, métricas, scores
  number:  { fontFamily: fonts.monoRegular,  fontSize: 42, letterSpacing: -1 },
  metric:  { fontFamily: fonts.monoLight,    fontSize: 28 },
  small:   { fontFamily: fonts.monoRegular,  fontSize: 13 },
} as const;

export const TYPE_SCALE = {
  // Display — Cormorant Garamond Light (serif premium)
  d1: { fontFamily: fonts.serifLight,        fontSize: 52, letterSpacing: 2.0,  lineHeight: 56 },
  d2: { fontFamily: fonts.serifLight,        fontSize: 36, letterSpacing: 1.5,  lineHeight: 40 },
  d3: { fontFamily: fonts.serifLight,        fontSize: 26, letterSpacing: 5.0,  lineHeight: 32 },
  d4: { fontFamily: fonts.serifLight,        fontSize: 22, letterSpacing: 3.0,  lineHeight: 28 },
  d5: { fontFamily: fonts.serifLight,        fontSize: 17, letterSpacing: 2.5,  lineHeight: 22 },

  // Display Italic — Cormorant Garamond Italic
  di1: { fontFamily: fonts.serifLightItalic, fontSize: 20, letterSpacing: 0.3,  lineHeight: 28 },
  di2: { fontFamily: fonts.serifLightItalic, fontSize: 16, letterSpacing: 0.2,  lineHeight: 22 },
  di3: { fontFamily: fonts.serifLightItalic, fontSize: 13, letterSpacing: 0.1,  lineHeight: 20 },

  // Mono — DM Sans (dados numéricos)
  m1: { fontFamily: fonts.monoLight,         fontSize: 48, letterSpacing: -2,   lineHeight: 52 },
  m2: { fontFamily: fonts.monoLight,         fontSize: 32, letterSpacing: -1,   lineHeight: 36 },
  m3: { fontFamily: fonts.monoLight,         fontSize: 24, letterSpacing: -0.5, lineHeight: 28 },
  m4: { fontFamily: fonts.monoLight,         fontSize: 18, letterSpacing: 0,    lineHeight: 22 },
  m5: { fontFamily: fonts.monoRegular,       fontSize: 13, letterSpacing: 0.5,  lineHeight: 18 },
  m6: { fontFamily: fonts.monoRegular,       fontSize: 11, letterSpacing: 1.0,  lineHeight: 16 },

  // UI — Jost (interface, labels, botões)
  u1: { fontFamily: fonts.sansMedium,        fontSize: 13, letterSpacing: 3.5,  lineHeight: 18 },
  u2: { fontFamily: fonts.sansLight,         fontSize: 13, letterSpacing: 2.0,  lineHeight: 18 },
  u3: { fontFamily: fonts.sansLight,         fontSize: 11, letterSpacing: 2.5,  lineHeight: 16 },
  u4: { fontFamily: fonts.sansExtraLight,    fontSize: 11, letterSpacing: 3.5,  lineHeight: 16 },
} as const;

export type TypeScaleKey = keyof typeof TYPE_SCALE;
