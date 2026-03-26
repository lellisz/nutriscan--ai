import { openDB } from 'idb';

const DB_NAME = 'praxis-offline';
const STORE_NAME = 'pending-actions';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('type', 'type');
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

export async function queueAction(type, payload) {
  const db = await getDB();
  await db.add(STORE_NAME, {
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
}

export async function getPendingActions() {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'createdAt');
}

export async function removeAction(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function syncPendingActions(syncFn) {
  const pending = await getPendingActions();
  if (pending.length === 0) return;

  const results = [];
  for (const action of pending) {
    try {
      await syncFn(action);
      await removeAction(action.id);
      results.push({ id: action.id, success: true });
    } catch (err) {
      results.push({ id: action.id, success: false, error: err.message });
    }
  }
  return results;
}
