import { create } from 'zustand';

export type DailyContext = 'normal' | 'stress' | 'travel' | 'celebrate' | 'hard' | 'restricao' | 'academia';
export type FastingProtocol = '12:12' | '16:8' | '18:6' | '24h';

interface DailyState {
  // ── Contexto do dia ───────────────────────────────────────────────────────
  context: DailyContext;
  setContext: (context: DailyContext) => void;

  // ── Jejum ────────────────────────────────────────────────────────────────
  /** ISO string do momento em que o jejum foi iniciado, ou null se inativo. */
  fastingStartTime: string | null;
  fastingProtocol: FastingProtocol;
  startFasting: (protocol: FastingProtocol, startTime: string) => void;
  stopFasting: () => void;
}

export const useDailyStore = create<DailyState>((set) => ({
  // Contexto do dia
  context: 'normal',
  setContext: (context) => set({ context }),

  // Jejum
  fastingStartTime: null,
  fastingProtocol: '16:8',
  startFasting: (protocol, startTime) =>
    set({ fastingProtocol: protocol, fastingStartTime: startTime }),
  stopFasting: () => set({ fastingStartTime: null }),
}));
