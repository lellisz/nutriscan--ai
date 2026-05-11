// constants/Colors.ts — PRAXIS Design Spec v2.0 "Black Metallic"
// Source of truth: PRAXIS_SPEC.md seção 1
// NÃO misturar com constants/design.ts (legado)

export const Colors = {
  // Backgrounds
  BG:  '#07070D',   // fundo principal — NUNCA branco puro
  C1:  '#0D0D17',   // cards primários
  C2:  '#12121F',   // cards secundários
  C3:  '#1A1A2E',   // cards terciários / hover

  // Brancos metálicos (hierarquia de texto)
  WH:  '#EBE4D2',   // títulos principais, logo
  W2:  '#C8BFA8',   // subtítulos
  W3:  '#8A8070',   // labels, textos muted
  W4:  '#4A4860',   // textos muito suaves (MÍNIMO — não usar mais escuro)

  // Accent
  AC:  '#6B5FE4',   // roxo accent (streak, badges premium)
  ACL: '#8B7FF4',   // roxo claro (hover, glow)

  // Bordas
  B1:  '#2A2840',   // borda padrão
  B2:  '#1E1C30',   // borda sutil

  // Status
  OK:  '#2D7A4F',   // verde sucesso
  ERR: '#7A2D2D',   // vermelho erro (NUNCA vermelho punitivo brilhante)
  WRN: '#7A5C2D',   // laranja warning

  // Coral (macros, gráficos)
  CO:  '#E8593C',   // coral quente
  COL: '#F07A5A',   // coral claro

  // Gradientes — usar com expo-linear-gradient (não CSS)
  GP: ['#1A1830', '#07070D'] as const,   // fundo gradiente padrão
  GH: ['#6B5FE4', '#4A3FA8'] as const,   // gradiente header
} as const;
