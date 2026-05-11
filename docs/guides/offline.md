# Offline Mode Guide

## Overview

PRAXIS is designed to work seamlessly without network connectivity. Users can log meals, track water, and view their nutrition data while offline. All changes are queued locally and synced to Supabase when network is restored.

## Architecture

```
┌─────────────────────┐
│   User Action       │
│  (Log Food, etc)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Local SQLite Queue │
│  (expo-sqlite)      │
│  ✅ Optimistic      │
└──────────┬──────────┘
           │
           ├─ Network Available?
           │
      ┌────┴────┐
      │ Yes     │ No
      ▼         ▼
   Sync to   Queue
   Supabase  Pending
      │        │
      ▼        ▼
   ✅ Done   Show Badge
            (user knows)
```

## How It Works

### 1. Offline Write (Immediate)

When a user logs food or tracks hydration while offline:

1. Action goes to local SQLite queue first
2. Optimistic UI update (immediate feedback)
3. User sees the entry in their daily log instantly
4. Data is persisted to device storage

```typescript
// Example: User logs food while offline
const logFood = async (foodData: FoodLogEntry) => {
  // Step 1: Queue locally
  await offlineService.queueMutation({
    tableName: 'food_logs',
    operation: 'INSERT',
    payload: foodData,
  });

  // Step 2: Update UI immediately
  queryClient.setQueryData(['nutrition', 'daily'], (old) => ({
    ...old,
    foodLogs: [...old.foodLogs, foodData],
  }));

  // Step 3: Show success
  Alert.alert('✓ Saved locally', 'Will sync when online');
};
```

### 2. Background Sync

When network is restored:

1. App detects connection via `NetInfo`
2. Triggers `syncQueue()` automatically
3. Processes items FIFO (first-in, first-out)
4. Retries failed items up to 3 times
5. Shows sync status in UI

```typescript
// Automatic trigger on network recovery
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(({ isConnected }) => {
    if (isConnected && hasPendingSync) {
      syncQueue(); // Automatic background sync
    }
  });
  return () => unsubscribe();
}, []);
```

### 3. Conflict Resolution

If the same record was modified both offline and online:

- **Last-write-wins strategy** — Timestamps determine precedence
- User sees a toast: `"Synced. Note: your changes may have been merged with updates from another device."`
- Conflict info logged for debugging

### Queue Schema

```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload TEXT NOT NULL,    -- JSON
  created_at INTEGER NOT NULL,
  synced_at INTEGER,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

## When It Activates

Offline mode activates automatically when:

- ❌ Network connection is lost (Wifi, cellular)
- ✈️  Airplane mode is enabled
- 🏢 User enters area with no signal

Users don't need to do anything—the app detects and handles it automatically.

## UI Indicators

### Sync Status Badge

Located in the header:

| State | Icon | Meaning |
|-------|------|---------|
| 🌐 Connected | Green dot | All synced, online |
| 🔄 Syncing | Spinner | Data being sent |
| ⚠️ Pending | Orange dot | Offline with queued changes |
| ❌ Error | Red dot | Sync failed, will retry |

Click the badge to manually retry sync.

### Notifications

```typescript
// User receives toasts for:
- "Saving offline..." (during offline write)
- "✓ Synced to cloud" (successful sync)
- "⚠️ Retry sync?" (failed, user can tap)
```

## Data Included in Sync Queue

The following tables support offline queuing:

| Table | Support | Priority |
|-------|---------|----------|
| `food_logs` | ✅ | High |
| `hydration_logs` | ✅ | High |
| `weight_logs` | ✅ | Medium |
| `meals` | ✅ | Medium |
| Profiles | ⚠️ | Low (stub) |

## Current Limitations

**Offline mode is currently a stub.** Full implementation pending:

- [ ] `expo-sqlite` — Local queue database
- [ ] `expo-background-fetch` — Background sync trigger
- [ ] NetInfo integration — Network state detection

### What Works Today

- ✅ Manual food logging (with network)
- ✅ View cached nutrition data
- ✅ Hydration quick-add (cached)
- ✅ Browse past meals

### What's Stubbed

- ❌ Offline food entry (no queue)
- ❌ Background sync (no expo-sqlite)
- ❌ Network state detection (no NetInfo)
- ❌ Sync status badge
- ❌ Conflict resolution

## Testing Without Native Setup

### Simulating Offline

1. Open **Settings** → **Developer Settings** (if available)
2. Enable "Disable network" or use DevTools
3. Try logging food → Should fail gracefully

### When Fully Implemented

1. Enable Airplane Mode
2. Log food
3. See "Offline" badge
4. Disable Airplane Mode
5. Watch auto-sync happen

## File Reference

- **Service Logic:** `services/offline.ts`
- **Sync Hook:** `hooks/useSyncQueue.ts`
- **Network Detection:** `hooks/useNetworkStatus.ts`
- **UI Component:** `components/SyncStatusBadge.tsx`

## Manual Sync

Users can manually trigger sync:

```typescript
// In any screen
import { useSyncQueue } from '@/hooks/useSyncQueue';

function MyScreen() {
  const { syncAll, isPending } = useSyncQueue();

  return (
    <Button
      title={isPending ? 'Syncing...' : 'Sync Now'}
      onPress={syncAll}
      disabled={isPending}
    />
  );
}
```

## Pending Items View

Users can see what's waiting to sync:

```typescript
function PendingSyncScreen() {
  const { items, count } = useSyncQueue();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Text>{item.tableName} — {item.operation}</Text>
      )}
      ListHeaderComponent={() => <Text>{count} items pending</Text>}
    />
  );
}
```

## Error Handling

If sync fails:

1. **Automatic Retry** — Triggered at 1min, 5min, 15min intervals
2. **User Notification** — Red badge appears in header
3. **Manual Override** — User can tap badge to retry immediately
4. **Data Safety** — Queue persists; no data is lost

## Storage Limits

- **Queue Size Limit:** 50MB max (typical user has <1MB)
- **Item Count:** Up to 10,000 pending mutations
- **Cleanup:** Synced items removed after 7 days retention

## Privacy & Security

- Queue stored locally on device (not cloud-backed)
- Sensitive fields (password, tokens) never queued
- Only nutritional and health data in queue
- Encryption via device storage security

## Roadmap

- [ ] Selective sync (user chooses what to upload)
- [ ] Sync scheduling (sync at specific times)
- [ ] Delta sync (send only changed fields)
- [ ] P2P sync (backup to another device)
- [ ] Conflict visualization (show merged changes)
