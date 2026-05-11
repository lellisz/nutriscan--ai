// services/barcode.ts
// Lookup de alimentos via barcode — TACO local + Open Food Facts API
import TACO from '@/assets/taco-mini.json';

export interface FoodItem {
  id: string;
  name: string;
  per_100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sodio_mg?: number;
    calcio_mg?: number;
    ferro_mg?: number;
  };
  barcode?: string;
}

function mapOFFtoFoodItem(product: Record<string, unknown>): FoodItem {
  const n = (product.nutriments as Record<string, number>) ?? {};
  return {
    id: `off_${product.code}`,
    name: (product.product_name_pt as string) ?? (product.product_name as string) ?? 'Produto',
    per_100g: {
      calories:   n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0,
      protein_g:  n['proteins_100g']    ?? 0,
      carbs_g:    n['carbohydrates_100g'] ?? 0,
      fat_g:      n['fat_100g']         ?? 0,
      sodio_mg:   n['sodium_100g'] ? n['sodium_100g'] * 1000 : undefined,
    },
    barcode: product.code as string,
  };
}

export async function lookupBarcode(code: string): Promise<FoodItem | null> {
  // 1. Banco local TACO
  const local = (TACO as FoodItem[]).find(f => f.barcode === code);
  if (local) return local;

  // 2. Open Food Facts API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        return mapOFFtoFoodItem(data.product);
      }
    }
  } catch {
    // offline ou timeout — retorna null para fallback OCR
  }

  return null;
}

export function searchFoodsByName(query: string): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return (TACO as FoodItem[])
    .filter(f => f.name.toLowerCase().includes(q))
    .slice(0, 20);
}
