// PRAXIS Nutrition — Design System v4.0 "Black Metallic"
// Migrado de Obsidian Warm → Black Metallic (obsidian roxo + branco metálico)

// ─── CORES ───────────────────────────────────────────────────────────────────
export const Colors = {
  // Backgrounds — obsidian profundo com toque violáceo
  bg:  '#07070D',                      // deep obsidian — background principal
  bg2: '#09090F',                      // obsidian levemente aquecido
  c1:  '#0D0C1A',                      // surface 1 — cards primários
  c2:  '#121128',                      // surface 2 — estados ativos / inputs
  c3:  '#181636',                      // surface 3 — hover / selecionado
  c4:  '#221F30',                      // separador sutil
  c5:  '#2A2740',                      // hover state
  overlay: 'rgba(7,7,13,0.85)',        // modal overlay

  // Borders (rgba) — deslocadas para cool/violáceo
  b1:  'rgba(240,238,255,0.07)',        // border padrão (sutil)
  b2:  'rgba(240,238,255,0.14)',        // border destacado
  b3:  'rgba(240,238,255,0.28)',        // border forte

  // Texto — escala Metallic White (w1-w5 são aliases)
  t1:  '#F5F2FF',                      // primário — branco metálico puro
  t2:  '#D8D4EC',                      // secundário — branco metálico médio
  t3:  '#A8A4BC',                      // muted — branco metálico suave
  t4:  '#706C84',                      // disabled — cinza lilás
  t5:  '#4A4660',                      // ghost — muito sutil (decoração apenas)

  // Aliases semânticos (novos nomes para código novo)
  get w1() { return this.t1; },
  get w2() { return this.t2; },
  get w3() { return this.t3; },
  get w4() { return this.t4; },
  get w5() { return this.t5; },
  get s1() { return this.c1; },
  get s2() { return this.c2; },
  get s3() { return this.c3; },
  get bd()  { return this.b1; },
  get bdm() { return this.b2; },
  get bdl() { return this.b3; },

  // Semânticos
  success:  '#6B9E8C',
  successL: '#8BBCAA',
  danger:   '#C47E6E',
  dangerL:  '#D4967A',
  warn:     '#C4944A',
  info:     '#7A8EC4',

  // Metallic accent (substitui gold na nova paleta)
  gold: '#B8B4CC',

  // Gradient stops
  metalStart: '#D0CCEC',
  metalMid:   '#F5F2FF',
  metalEnd:   '#B8B4CC',
  shimStart:  'rgba(155,127,232,0.0)',
  shimMid:    'rgba(155,127,232,0.08)',
  shimEnd:    'rgba(155,127,232,0.0)',
} as const;

// Gradientes como arrays para expo-linear-gradient
export const GRADIENTS = {
  metalWhite:  [Colors.metalStart, Colors.metalMid, Colors.metalEnd] as const,
  metalButton: [Colors.metalStart, Colors.metalMid, Colors.metalEnd] as const,
  shimmer:     [Colors.shimStart,  Colors.shimMid,  Colors.shimEnd]  as const,
  surface:     [Colors.c1, Colors.c2]                                as const,
  success:     ['#4A7A6A', '#6B9E8C']                                as const,
} as const;

export const GRADIENT_ANGLES = {
  metalWhite: 135,
  shimmer:    90,
  surface:    180,
} as const;

// Manter compatibilidade com código legado
export const colors = {
  bg:         Colors.bg,
  bg2:        Colors.c1,
  surface:    Colors.c1,
  surfaceAlt: Colors.c2,
  border:     Colors.b1,
  borderMid:  Colors.b2,
  borderLt:   Colors.b3,
  fg:         Colors.t1,
  fg2:        Colors.t2,
  fg3:        Colors.t3,
  fg4:        Colors.t4,
  success:    Colors.success,
  danger:     Colors.danger,
  gold:       Colors.gold,
} as const;

// ─── TIPOGRAFIA ───────────────────────────────────────────────────────────────
export const Typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.8, color: Colors.t1 },
  title:   { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4, color: Colors.t1 },
  heading: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: Colors.t1 },
  body:    { fontSize: 13, fontWeight: '400' as const, lineHeight: 20,      color: Colors.t1 },
  label:   { fontSize: 11, fontWeight: '400' as const, letterSpacing: 1.1,  color: Colors.t4 },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.t3 },
  micro:   { fontSize: 10, fontWeight: '400' as const, letterSpacing: 0.8,  color: Colors.t4 },
} as const;

// ─── ESPAÇAMENTO — Grid de 8px ────────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  px:  22,
} as const;

// ─── COMPATIBILIDADE LEGADO ───────────────────────────────────────────────────
export const spacing = {
  xs:    Spacing.xs,
  sm:    Spacing.sm,
  md:    Spacing.lg,
  lg:    Spacing.xxl,
  xl:    32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   18,
  full: 9999,
} as const;

export const fontSizes = {
  xs:    11,
  sm:    13,
  md:    15,
  lg:    18,
  xl:    22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

export const fonts = {
  serifLight:         'CormorantGaramond_300Light',
  serifLightItalic:   'CormorantGaramond_300Light_Italic',
  serifRegular:       'CormorantGaramond_400Regular',
  serifRegularItalic: 'CormorantGaramond_400Regular_Italic',
  monoLight:          'DMSans_300Light',
  monoRegular:        'DMSans_400Regular',
  sansExtraLight:     'Jost_200ExtraLight',
  sansLight:          'Jost_300Light',
  sansRegular:        'Jost_400Regular',
  sansMedium:         'Jost_500Medium',
} as const;
