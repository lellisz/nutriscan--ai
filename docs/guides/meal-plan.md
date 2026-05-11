# Meal Planning Guide

## Overview

Meal Planning in PRAXIS allows users to generate AI-powered nutrition meal plans based on their goals, dietary restrictions, and Brazilian food preferences. Plans are generated via Groq AI and displayed as a horizontal scrollable 7-day calendar with quick meal registration.

## How It Works

### 1. Generate a Meal Plan

```
[Select Preferences] → [Groq AI Generation] → [7-Day Calendar] → [Register Meals]
```

#### User Input

Before generation, users provide:

```typescript
interface MealPlanRequest {
  tdee: number;              // Daily calorie target
  dietaryGoals: {
    protein: number;          // grams/day
    carbs: number;            // grams/day
    fat: number;              // grams/day
  };
  restrictions: string[];     // e.g., ['vegetarian', 'nut-free']
  daysToGenerate: number;     // Usually 7
  mealCount: number;          // Meals per day (usually 4)
  cuisinePreference: 'brazilian' | 'international' | 'mixed';
}
```

#### Groq AI Response

Groq generates a JSON response with daily meal suggestions:

```json
{
  "success": true,
  "mealPlan": [
    {
      "day": 1,
      "date": "2026-05-10",
      "meals": [
        {
          "mealType": "breakfast",
          "name": "Pão com Queijo e Café",
          "description": "2 fatias de pão integral, 50g de queijo meia cura, 1 xícara de café com leite",
          "estimatedCalories": 350,
          "macros": {
            "protein": 12,
            "carbs": 45,
            "fat": 14
          },
          "ingredients": ["Pão integral", "Queijo meia cura", "Café", "Leite"]
        },
        {
          "mealType": "lunch",
          "name": "Arroz, Feijão e Frango Grelhado",
          "description": "1 xícara de arroz cozido, 1 concha de feijão, 150g frango grelhado, alface com tomate",
          "estimatedCalories": 650,
          "macros": {
            "protein": 45,
            "carbs": 65,
            "fat": 18
          },
          "ingredients": ["Arroz branco", "Feijão carioca", "Frango peito", "Alface", "Tomate"]
        }
      ]
    },
    // ... more days
  ]
}
```

### 2. Display on Calendar

The generated plan is displayed as:

```
┌─────────────────────────────────────┐
│ Meal Plan — May 2026                │
├─────────────────────────────────────┤
│ ← [Day 1] [Day 2] [Day 3] →         │
│    May 10   May 11  May 12          │
├─────────────────────────────────────┤
│                                     │
│ Café da Manhã (350 cal)             │
│ Pão com Queijo e Café               │
│ P: 12g | C: 45g | F: 14g            │
│ [+ Add to Today]                    │
│                                     │
│ Almoço (650 cal)                    │
│ Arroz, Feijão e Frango              │
│ P: 45g | C: 65g | F: 18g            │
│ [+ Add to Today]                    │
│                                     │
│ (2 more meals for this day...)      │
│                                     │
└─────────────────────────────────────┘
```

**Navigation:**
- Horizontal scroll or swipe to browse days
- Tap day number to jump
- Today highlighted in blue
- Future days dimmed

### 3. Register Meals in Batch

Users can:

#### Option A: Add Single Meal
```
Tap [+ Add to Today] → Logs to food_logs for today → Counts toward TDEE
```

#### Option B: Register Whole Day
```
Tap [Register Full Day] → All 4 meals logged → Daily nutrition updated
```

#### Option C: Add to Shopping List
```
Tap [📋 Add to List] → Ingredients extracted → Generates shopping list view
```

## Data Structure

### Meal Plan Storage

```typescript
interface MealPlan {
  id: string;
  userId: string;
  generatedAt: Date;
  expiresAt: Date;         // 30-day validity
  days: DayPlan[];
  totalDays: number;
  request: MealPlanRequest;
}

interface DayPlan {
  day: number;             // 1-7
  date: Date;              // YYYY-MM-DD
  meals: PlannedMeal[];
  totalCalories: number;
  totalMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface PlannedMeal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  estimatedCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: string[];
  source: 'groq';
  registered: boolean;    // Has user logged this meal?
  registeredLogIds?: string[]; // Linked food_log IDs
}
```

### Database Tables

**meals table** (new in Migration 011):

```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id),
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories NUMERIC(7,1),
  protein NUMERIC(6,1),
  carbs NUMERIC(6,1),
  fat NUMERIC(6,1),
  fiber NUMERIC(6,1),
  sodium NUMERIC(8,1),
  sugar NUMERIC(6,1),
  ingredients TEXT[],
  source TEXT DEFAULT 'groq',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  request_params JSONB,
  total_days INTEGER,
  created_at TIMESTAMP DEFAULT now()
);
```

## Usage from the App

### Navigation

1. Open **PRAXIS**
2. Go to **Nutrition** tab
3. Tap **Meal Plans** card
4. Current valid plan loads (or "No plan" message)

### Generate New Plan

```typescript
import { useMealPlans } from '@/hooks/useMealPlans';

function MealPlanScreen() {
  const { generatePlan, currentPlan, isLoading } = useMealPlans();

  const handleGenerate = async () => {
    await generatePlan({
      tdee: 2200,
      dietaryGoals: { protein: 140, carbs: 220, fat: 65 },
      restrictions: ['vegetarian'],
      daysToGenerate: 7,
      mealCount: 4,
      cuisinePreference: 'brazilian',
    });
  };

  return (
    <>
      {!currentPlan && <Button title="Generate Plan" onPress={handleGenerate} />}
      {currentPlan && <MealCalendar plan={currentPlan} />}
    </>
  );
}
```

### Register Meal

```typescript
const handleAddMeal = async (plannedMeal: PlannedMeal) => {
  // Convert to food_log entry
  const foodLog = {
    userId: user.id,
    foodName: plannedMeal.name,
    calories: plannedMeal.estimatedCalories,
    protein: plannedMeal.macros.protein,
    carbs: plannedMeal.macros.carbs,
    fat: plannedMeal.macros.fat,
    description: plannedMeal.description,
    source: 'meal_plan',
  };

  await logFood(foodLog);
  
  // Mark as registered
  await markMealRegistered(plannedMeal.id);
};
```

## Shopping List Generation

When users add meals to a shopping list:

```typescript
interface ShoppingList {
  generatedAt: Date;
  items: ShoppingItem[];
  categorized: {
    [category: string]: ShoppingItem[];
  };
}

interface ShoppingItem {
  ingredient: string;
  frequency: number;   // How many meals include this
  category: string;    // 'Proteína', 'Grãos', 'Vegetais', etc.
}
```

**Example Output:**

```
COMPRAS — Semana 10 Maio

🥚 Proteína
  [ ] Frango peito (3x)
  [ ] Ovos (2x)
  [ ] Iogurte grego (4x)

🌾 Grãos & Pão
  [ ] Arroz integral (2x)
  [ ] Pão integral (5x)
  [ ] Aveia (3x)

🥬 Vegetais & Frutas
  [ ] Brócolis (2x)
  [ ] Banana (4x)
  [ ] Tomate (5x)
  [ ] Alface (3x)
```

Users can:
- Export as text/PDF
- Share with family
- Check off items while shopping

## Current Limitations

**Meal planning is currently a stub.** Full implementation pending:

- [ ] Groq AI integration — API calls to generate plans
- [ ] Meal plan persistence — Storage in `meal_plans` table
- [ ] UI calendar component — Horizontal day scroll
- [ ] Shopping list export — PDF/text generation

### What Works Today

- ✅ Manual meal logging
- ✅ View daily nutrition summary
- ✅ Browse past meals

### What's Stubbed

- ❌ Meal plan generation
- ❌ 7-day calendar view
- ❌ Batch meal registration
- ❌ Shopping list generation
- ❌ Plan persistence

## Testing

### Sample Request

```typescript
const testRequest = {
  tdee: 2000,
  dietaryGoals: {
    protein: 150,
    carbs: 200,
    fat: 60,
  },
  restrictions: [],
  daysToGenerate: 7,
  mealCount: 4,
  cuisinePreference: 'brazilian' as const,
};

// When implemented: generatePlan(testRequest)
```

### Expected Response Format

```typescript
// Groq should return this JSON structure
interface MealPlanResponse {
  success: boolean;
  mealPlan: Array<{
    day: number;
    date: string;
    meals: Array<{
      mealType: string;
      name: string;
      description: string;
      estimatedCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      };
      ingredients: string[];
    }>;
  }>;
}
```

## Files Reference

- **Screen:** `app/meal-plan.tsx`
- **Hook:** `hooks/useMealPlans.ts`
- **Service:** `services/mealPlan.ts`
- **Components:** `components/MealCalendar.tsx`, `components/ShoppingList.tsx`
- **Database:** Migrations 011 (`meals`, `meal_plans` tables)

## Roadmap

- [ ] AI-powered macro customization (adjust plan per user feedback)
- [ ] Meal swapping (replace suggested meal with alternative)
- [ ] Recipe links (open full recipe in external app)
- [ ] Weekly nutrition summary (PDF export)
- [ ] Integration with local grocery store databases (price estimation)
- [ ] Social sharing (share plan with friends)
