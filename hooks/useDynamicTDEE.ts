import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { initHealthConnect, getCaloriesBurned } from '@/services/health';

export function useDynamicTDEE() {
  const { profile } = useAuthStore();
  const baseTDEE = profile?.calories_target ?? 2000;
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  const fetchBurned = useCallback(async () => {
    try {
      const initialized = await initHealthConnect();
      if (!initialized) {
        setCaloriesBurned(0);
        return;
      }
      const burned = await getCaloriesBurned();
      setCaloriesBurned(burned);
    } catch {
      setCaloriesBurned(0);
    }
  }, []);

  useEffect(() => {
    fetchBurned();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        fetchBurned();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchBurned]);

  return {
    dynamicTDEE: baseTDEE + caloriesBurned,
    baseTDEE,
    caloriesBurned,
  };
}
