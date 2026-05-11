import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { upsertDailyLog } from '@/services/daily';

interface HydrationLog {
  ml: number;
  time: string;
}

interface HydrationState {
  goal_ml: number;
  consumed_ml: number;
  logs: HydrationLog[];
  isLoading: boolean;
  setGoal: (ml: number) => void;
  addWater: (ml: number, userId?: string) => Promise<void>;
  reset: () => void;
  loadToday: (userId: string) => Promise<void>;
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  goal_ml: 2500,
  consumed_ml: 0,
  logs: [],
  isLoading: false,
  setGoal: (ml) => set({ goal_ml: ml }),
  addWater: async (ml, userId) => {
    const newTotal = get().consumed_ml + ml;
    set(s => ({
      consumed_ml: newTotal,
      logs: [...s.logs, { ml, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }],
    }));
    // Persist to daily_logs.hydration_ml
    if (userId) {
      await upsertDailyLog(userId, { hydration_ml: newTotal });
    }
  },
  reset: () => set({ consumed_ml: 0, logs: [] }),
  loadToday: async (userId) => {
    set({ isLoading: true });
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_logs')
      .select('hydration_ml')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    if (data?.hydration_ml) {
      set({ consumed_ml: data.hydration_ml });
    }
    set({ isLoading: false });
  },
}));
