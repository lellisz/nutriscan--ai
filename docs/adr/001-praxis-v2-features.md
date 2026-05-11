# ADR-001: PRAXIS v2 Feature Architecture

**Status:** Accepted  
**Date:** 2026-05-10  
**Authors:** Architect Agent  

---

## Overview

This ADR documents architectural decisions for PRAXIS v2 major features: monetization (RevenueCat), barcode scanning, offline mode, health platform integration, and micronutrient tracking.

---

## ADR-001.1: RevenueCat Monetization

### Context

PRAXIS needs a sustainable revenue model. The app currently has no monetization. We need to implement a freemium model with premium subscriptions while maintaining a great free tier experience.

### Decision

Use `react-native-purchases` (RevenueCat SDK) for subscription management.

**Products:**
| Product ID | Price | Billing |
|------------|-------|---------|
| `praxis_premium_monthly` | R$ 19,90 | Monthly |
| `praxis_premium_annual` | R$ 149,90 | Annual (~R$ 12,49/mo) |

**Trial:** 7-day free trial on both plans.

**Feature Matrix:**
| Feature | Free | Premium |
|---------|------|---------|
| Manual food logging | Yes | Yes |
| Basic macros (P/C/F) | Yes | Yes |
| PRAXIS Score | Yes | Yes |
| Hydration tracking | Yes | Yes |
| Coach Praxi (3 msgs/day) | Yes | Unlimited |
| Barcode scanner | 5 scans/day | Unlimited |
| OCR label scanning | No | Yes |
| Micronutrient tracking | No | Yes |
| HealthKit/Health Connect sync | No | Yes |
| Meal photo analysis | No | Yes |
| Export data (CSV/PDF) | No | Yes |
| Ad-free experience | No | Yes |
| Priority support | No | Yes |

### Alternatives Considered

1. **Stripe direct** - More complex mobile implementation, no receipt validation
2. **In-app purchases direct** - Separate implementations for iOS/Android, no unified analytics
3. **One-time purchase** - Lower LTV, no recurring revenue

### Consequences

- Dependency on RevenueCat infrastructure (99.9% uptime SLA)
- Need to handle offline entitlement caching
- Must implement restore purchases flow
- Apple/Google take 15-30% commission

### Interface Contract

```typescript
// services/revenue.ts
export interface SubscriptionState {
  isPremium: boolean;
  plan: 'free' | 'monthly' | 'annual';
  expiresAt: Date | null;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
}

export interface RevenueService {
  initialize(): Promise<void>;
  getSubscriptionState(): Promise<SubscriptionState>;
  purchasePackage(packageId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<SubscriptionState>;
  getOfferings(): Promise<Offering[]>;
}

// hooks/useSubscription.ts
export function useSubscription(): {
  state: SubscriptionState;
  isLoading: boolean;
  isPremium: boolean;
  canUseFeature(feature: PremiumFeature): boolean;
  purchase(plan: 'monthly' | 'annual'): Promise<void>;
  restore(): Promise<void>;
};

type PremiumFeature = 
  | 'unlimited_coach'
  | 'unlimited_barcode'
  | 'ocr_scanning'
  | 'micronutrients'
  | 'health_sync'
  | 'photo_analysis'
  | 'export_data';
```

---

## ADR-001.2: Barcode Scanner

### Context

Users need a fast way to log packaged foods. Barcode scanning is the most requested feature. We need high accuracy with fallbacks for Brazilian products not in global databases.

### Decision

Implement a three-tier lookup strategy:

1. **Local TACO database** (bundled) - ~2,000 Brazilian foods, instant lookup
2. **Open Food Facts API** - 3M+ products, network required
3. **OCR fallback** (Premium) - Gemini Vision for nutrition label extraction

**Scanner:** `expo-barcode-scanner` (uses device camera, good RN 0.81 compatibility)

**Lookup Flow:**
```
[Scan] → [Local TACO] → found? → [Return]
                      → not found → [Open Food Facts API]
                                  → found? → [Return]
                                  → not found → [OCR Prompt (Premium)]
                                              → [Manual Entry (Free)]
```

### Alternatives Considered

1. **expo-camera + vision-camera** - More complex setup, overkill for barcodes
2. **Nutritionix API** - Paid, limited Brazilian coverage
3. **USDA API only** - Poor coverage for Brazilian products

### Consequences

- Need to bundle TACO database (~500KB gzipped)
- Open Food Facts has variable data quality
- OCR requires Gemini API calls (cost per use)
- Need offline queue for scans when no network

### Interface Contract

```typescript
// services/barcode.ts
export interface FoodData {
  barcode: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: 'g' | 'ml';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  // Micronutrients (Premium)
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  source: 'taco' | 'openfoodfacts' | 'ocr' | 'manual';
}

export interface BarcodeService {
  lookupBarcode(barcode: string): Promise<FoodData | null>;
  searchTACO(query: string): Promise<FoodData[]>;
  extractFromImage(imageUri: string): Promise<FoodData | null>; // Premium
}

// Local TACO schema (SQLite)
interface TACOEntry {
  id: number;
  code: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  // ... micronutrients
}
```

---

## ADR-001.3: Offline Mode

### Context

Users log meals throughout the day, often without reliable network (subway, rural areas, airplane mode). The app must work offline with eventual sync.

### Decision

Use `expo-sqlite` for local queue storage combined with TanStack Query's persistence layer.

**Strategy:**
- All mutations go to local SQLite first (optimistic)
- Background sync when network available
- Conflict resolution: last-write-wins with timestamps
- Sync indicator in UI when pending changes exist

**Queue Schema:**
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL,
  synced_at INTEGER,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

### Alternatives Considered

1. **WatermelonDB** - Heavier, more complex, overkill for our needs
2. **AsyncStorage only** - No query capabilities, poor for structured data
3. **PouchDB/CouchDB** - Complex setup, Supabase is already our backend

### Consequences

- Need to handle sync conflicts gracefully
- Must show sync status to users
- Increased app size (~200KB for SQLite)
- Need background task for sync (expo-background-fetch)

### Interface Contract

```typescript
// services/offline.ts
export interface SyncQueueItem {
  id: string;
  tableName: 'food_logs' | 'daily_logs' | 'meals' | 'weight_logs';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: number;
  syncedAt: number | null;
  retryCount: number;
}

export interface OfflineService {
  initialize(): Promise<void>;
  queueMutation(item: Omit<SyncQueueItem, 'id' | 'createdAt'>): Promise<string>;
  getPendingCount(): Promise<number>;
  syncAll(): Promise<SyncResult>;
  clearSynced(): Promise<void>;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// TanStack Query persistence config
export const queryClientPersister = createSyncStoragePersister({
  storage: AsyncStorage,
  key: 'PRAXIS_QUERY_CACHE',
});
```

---

## ADR-001.4: HealthKit / Health Connect Integration

### Context

Users want automatic activity data (steps, calories burned) to adjust their TDEE dynamically. iOS uses HealthKit, Android uses Health Connect (Google's new unified API).

### Decision

Use `react-native-health-connect` which provides a unified API for both platforms.

**Data Points to Sync:**
| Metric | Permission | Update Frequency |
|--------|------------|------------------|
| Steps | Read | Every 15 min |
| Active calories | Read | Every 15 min |
| Weight | Read/Write | On change |
| Sleep | Read | Daily |
| Heart rate (avg) | Read | Daily |

**TDEE Adjustment:**
```
Adaptive TDEE = BMR * Activity Multiplier * Weekly Adjustment Factor
Weekly Adjustment Factor = Actual Expenditure / Estimated Expenditure (7-day avg)
```

### Alternatives Considered

1. **react-native-health** - iOS only, no Android support
2. **Google Fit API direct** - Deprecated in favor of Health Connect
3. **Manual entry only** - Poor UX, low engagement

### Consequences

- Premium-only feature (health data is sensitive)
- Need clear permission explanations (GDPR/LGPD)
- Must handle permission denials gracefully
- Background sync requires careful battery management

### Interface Contract

```typescript
// services/health.ts
export interface HealthData {
  steps: number;
  activeCalories: number;
  weight: number | null;
  sleepHours: number | null;
  heartRateAvg: number | null;
  lastSyncAt: Date;
}

export interface HealthService {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<PermissionStatus>;
  getPermissionStatus(): Promise<PermissionStatus>;
  getTodayData(): Promise<HealthData>;
  getWeekData(): Promise<HealthData[]>;
  writeWeight(kg: number, date: Date): Promise<void>;
  startBackgroundSync(): Promise<void>;
  stopBackgroundSync(): Promise<void>;
}

export type PermissionStatus = 'granted' | 'denied' | 'not_determined';

// hooks/useDynamicTDEE.ts
export function useDynamicTDEE(): {
  baseTDEE: number;
  adjustedTDEE: number;
  weeklyFactor: number;
  isHealthConnected: boolean;
  lastSyncAt: Date | null;
};
```

---

## ADR-001.5: Micronutrient Tracking

### Context

Power users want vitamin and mineral tracking beyond basic macros. This differentiates PRAXIS from basic calorie counters.

### Decision

Expand `food_logs` schema with micronutrient columns. Premium-only feature.

**Micronutrients to Track:**
- Fiber (g)
- Sodium (mg)
- Sugar (g)
- Vitamin A (mcg RAE)
- Vitamin C (mg)
- Vitamin D (mcg)
- Calcium (mg)
- Iron (mg)
- Potassium (mg)
- Magnesium (mg)

### Migration

```sql
-- Migration: 011_micronutrients.sql
ALTER TABLE food_logs
  ADD COLUMN fiber FLOAT,
  ADD COLUMN sodium FLOAT,
  ADD COLUMN sugar FLOAT,
  ADD COLUMN vitamin_a FLOAT,
  ADD COLUMN vitamin_c FLOAT,
  ADD COLUMN vitamin_d FLOAT,
  ADD COLUMN calcium FLOAT,
  ADD COLUMN iron FLOAT,
  ADD COLUMN potassium FLOAT,
  ADD COLUMN magnesium FLOAT,
  ADD COLUMN barcode TEXT,
  ADD COLUMN source TEXT CHECK (source IN ('manual', 'taco', 'openfoodfacts', 'ocr'));

-- Also add to meals table
ALTER TABLE meals
  ADD COLUMN fiber NUMERIC(6,1),
  ADD COLUMN sodium NUMERIC(8,1),
  ADD COLUMN sugar NUMERIC(6,1);

-- Daily targets in profiles
ALTER TABLE profiles
  ADD COLUMN fiber_target INT DEFAULT 25,
  ADD COLUMN sodium_target INT DEFAULT 2300;
```

### Alternatives Considered

1. **Separate micronutrients table** - More normalized but slower queries
2. **JSONB column** - Flexible but harder to query/aggregate
3. **Track all USDA nutrients** - Too complex, diminishing returns

### Consequences

- Larger food_logs rows (~10 additional columns)
- Need UI for micronutrient goals
- Data quality varies by source
- Premium paywall for detailed nutrition

### Interface Contract

```typescript
// types/nutrition.ts
export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MicroNutrients {
  fiber?: number;
  sodium?: number;
  sugar?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  magnesium?: number;
}

export interface FoodLogEntry extends MacroNutrients, MicroNutrients {
  id: string;
  userId: string;
  foodName: string;
  loggedAt: Date;
  barcode?: string;
  source: 'manual' | 'taco' | 'openfoodfacts' | 'ocr';
}

export interface DailyMicroTargets {
  fiber: number;      // g
  sodium: number;     // mg
  vitaminA: number;   // mcg RAE
  vitaminC: number;   // mg
  vitaminD: number;   // mcg
  calcium: number;    // mg
  iron: number;       // mg
}
```

---

## Summary

| Feature | Package/Tech | Premium? | Migration |
|---------|--------------|----------|-----------|
| RevenueCat | react-native-purchases | N/A | None |
| Barcode | expo-barcode-scanner + OFF API | Partial | None |
| Offline | expo-sqlite + TanStack persist | No | sync_queue table |
| Health | react-native-health-connect | Yes | None |
| Micronutrients | Schema expansion | Yes | 011_micronutrients.sql |
