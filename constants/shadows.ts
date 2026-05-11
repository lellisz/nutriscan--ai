export const SHADOWS = {
  none: {},

  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },

  // Glow lilás/branco — shadowColor customizado só funciona em iOS
  glow: {
    shadowColor: 'rgba(240,238,255,0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 0,
  },

  phone: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.9,
    shadowRadius: 60,
    elevation: 24,
  },
} as const;
