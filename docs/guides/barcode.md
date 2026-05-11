# Barcode Scanner Guide

## Overview

The barcode scanner in PRAXIS allows users to quickly log packaged foods by scanning their barcode. The feature uses a three-tier lookup strategy to maximize accuracy, with fallbacks for Brazilian products not in global databases.

## How It Works

### Lookup Chain

```
[Scan] → [Local TACO] → found? → [Return]
                      → not found → [Open Food Facts API]
                                  → found? → [Return]
                                  → not found → [OCR Prompt (Premium)]
                                              → [Manual Entry (Free)]
```

1. **Local TACO Database** (instant, offline-capable)
   - 56+ Brazilian foods with complete macro and micronutrient data
   - Bundled in `assets/taco-mini.json`
   - No network required
   - Covers common staples (arroz, feijão, pão, ovos, frutas, etc.)

2. **Open Food Facts API** (3M+ global products)
   - Falls back when barcode not in TACO
   - Requires network connection
   - Variable data quality depending on product popularity
   - Good coverage for international brands

3. **OCR Label Extraction** (premium feature)
   - Uses Gemini Vision for nutrition label analysis
   - Falls back when barcode not found in OFF
   - Extracts macros from product packaging
   - Premium-only feature (prevents abuse)

4. **Manual Entry** (free, last resort)
   - User manually inputs food name and gram amount
   - Required when all automated lookups fail

## Data Structure

Each food item returned by the barcode scanner includes:

```typescript
interface FoodData {
  barcode: string;                    // EAN/UPC barcode
  name: string;                       // Product name
  brand?: string;                     // Brand (optional)
  servingSize: number;                // Per-serving amount
  servingUnit: 'g' | 'ml';            // Grams or milliliters
  calories: number;                   // Per serving
  protein: number;                    // In grams
  carbs: number;                      // In grams
  fat: number;                        // In grams
  fiber?: number;                     // Optional, in grams
  sodium?: number;                    // Optional, in mg
  source: 'taco' | 'openfoodfacts' | 'ocr' | 'manual';
}
```

### Micronutrients (Premium)

Premium users receive additional micronutrient data when available:

```typescript
// Extended for premium users:
vitaminA?: number;        // mcg RAE
vitaminC?: number;        // mg
vitaminD?: number;        // mcg
calcium?: number;         // mg
iron?: number;            // mg
```

## Usage

### From the App

1. Navigate to **Log** → **+ Add Food**
2. Tap **Barcode** icon (bottom toolbar)
3. Point device camera at barcode
4. Wait for automatic detection (3-5 seconds)
5. Confirm food name and serving size
6. Select quantity (grams)
7. Tap **Save** to log the meal

### From Code

```typescript
import { useBarcode } from '@/hooks/useBarcode';

function BarcodeScreen() {
  const { scan, lookupBarcode } = useBarcode();
  
  const handleScan = async (barcode: string) => {
    const foodData = await lookupBarcode(barcode);
    if (foodData) {
      // Log the food
      await logFood({
        name: foodData.name,
        calories: foodData.calories,
        // ... other fields
      });
    }
  };

  return <BarcodeScannerUI onScan={handleScan} />;
}
```

## Current Limitations

**Important:** Barcode scanner features are currently stubs. Full implementation pending setup:

- [ ] `expo-barcode-scanner` — Requires EAS Build native configuration
- [ ] Background sync for offline scans — Pending expo-sqlite installation
- [ ] OCR label extraction — Requires Gemini API key setup

### What Works Today

- ✅ Manual food entry (no barcode needed)
- ✅ Food search from local TACO database
- ✅ Browse frequent meals
- ✅ Log with custom gram amounts

### What's Stubbed

- ❌ Camera barcode detection (returns null)
- ❌ Open Food Facts lookup (network call stubbed)
- ❌ OCR label reading (Gemini integration pending)
- ❌ Offline queue persistence (expo-sqlite pending)

## Testing the Feature

### Without Native Setup

```typescript
// Test with manual barcode entry
const testBarcode = '7891910200081'; // Real Brazilian product
const result = await lookupBarcode(testBarcode);
console.log(result); // Will be null until native module installed
```

### Expected Flow (When Fully Implemented)

1. User taps camera → Scanner opens
2. User points at EAN barcode on product
3. Camera detects → `expo-barcode-scanner` returns barcode string
4. `lookupBarcode()` called → TACO lookup → OFF API → OCR if needed
5. Food data returned → Quantity input → Log to `food_logs`

## Premium vs Free

| Feature | Free | Premium |
|---------|------|---------|
| Manual food entry | ✅ | ✅ |
| TACO database lookup | ✅ | ✅ |
| Scans per day | 5 | Unlimited |
| Open Food Facts | ✅ | ✅ |
| OCR label reading | ❌ | ✅ |
| Micronutrient detail | ❌ | ✅ |

## Files Reference

- **Scanner Screen:** `app/log/barcode.tsx`
- **Service Logic:** `services/barcode.ts`
- **TACO Database:** `assets/taco-mini.json`
- **Hook:** `hooks/useBarcode.ts`
- **Subscription Gate:** `hooks/useSubscription.ts`

## Troubleshooting

**Q: Barcode not found in TACO or Open Food Facts**

A: This is expected for smaller Brazilian brands or new products. Users can:
- Manually enter the food name and amount
- Use OCR label reading (premium feature)
- Upload product data to Open Food Facts community database

**Q: Why does barcode lookup fail?**

A: Possible reasons:
1. Network unavailable (OFF API requires connection)
2. Barcode not yet registered in databases
3. Barcode is invalid/malformed
4. OCR feature not enabled (premium only)

**Q: Is barcode data stored?**

A: Yes. Scanned items are logged to `food_logs` with `source: 'taco'` or `'openfoodfacts'`. The original barcode is stored in the `barcode` column for future reference.

## Roadmap

- [ ] Local TACO database caching (offline-first)
- [ ] Barcode history (recently scanned)
- [ ] Custom barcode library (save user's favorites)
- [ ] Crowdsourced nutrition corrections
- [ ] Batch barcode import (multiple items at once)
