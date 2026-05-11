// services/offline.ts
// Offline queue usando expo-sqlite — stub até instalação
// TODO: ativar após: npx expo install expo-sqlite @react-native-community/netinfo

export interface QueuedMeal {
  id: string;
  data: string; // JSON serializado
  created_at: string;
  synced: boolean;
}

let isInitialized = false;

export async function initOfflineDB(): Promise<void> {
  if (isInitialized) return;
  // TODO: const db = SQLite.openDatabase('praxis_offline.db');
  // db.transaction(tx => tx.executeSql(CREATE_TABLES_SQL));
  isInitialized = true;
}

export async function saveMealOffline(meal: Record<string, unknown>): Promise<void> {
  // TODO: inserir em meals_queue via SQLite
  console.log('[Offline] stub — meal queued:', meal);
}

export async function getUnsyncedMeals(): Promise<QueuedMeal[]> {
  // TODO: SELECT * FROM meals_queue WHERE synced = 0
  return [];
}

export async function syncQueue(userId: string): Promise<number> {
  const pending = await getUnsyncedMeals();
  if (pending.length === 0) return 0;
  // TODO: iterar e inserir via supabase, marcar synced = 1
  console.log(`[Offline] stub — would sync ${pending.length} meals for user ${userId}`);
  return 0;
}
