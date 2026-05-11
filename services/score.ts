interface ScoreInput {
  calories:       { consumed: number; target: number };
  protein:        { consumed: number; target: number };
  hydration:      { consumed: number; target: number };
  consistency:    number; // 0-1
  micronutrients: number; // 0-1
  context: 'normal' | 'stress' | 'travel' | 'celebrate' | 'hard' | 'restricao' | 'academia';
}

interface ScoreResult {
  total: number; // NUNCA abaixo de 12 (Modo Compaixão)
  label: 'excelente' | 'bom' | 'em progresso' | 'recomeçando' | 'atenção';
  components: {
    nutrition:      number;
    protein:        number;
    hydration:      number;
    consistency:    number;
    micronutrients: number;
  };
  contextMultiplier: number;
}

const WEIGHTS = {
  nutrition:      35,
  protein:        25,
  hydration:      20,
  consistency:    10,
  micronutrients: 10,
} as const;

const CONTEXT_MULTIPLIERS: Record<ScoreInput['context'], number> = {
  normal:    1.0,
  stress:    0.85,
  travel:    0.80,
  celebrate: 0.70,
  hard:      0.65,
  restricao: 0.90,
  academia:  1.05,
};

const SCORE_MINIMUM = 12;

/** Clamps a ratio to [0, 1] so over-achievement doesn't exceed 100% on a component. */
function clamp(value: number, min = 0, max = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates the PRAXIS Score for a given day.
 *
 * Weights (sum = 100):
 *   nutrition=35, protein=25, hydration=20, consistency=10, micronutrients=10
 *
 * Context multipliers are applied to the weighted sum before rounding.
 * The final score is always >= 12 (Compassion Floor).
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const { calories, protein, hydration, consistency, micronutrients, context } = input;

  // Ratio for each component, clamped to [0, 1]
  const nutritionRatio      = clamp(calories.target > 0 ? calories.consumed / calories.target : 0);
  const proteinRatio        = clamp(protein.target  > 0 ? protein.consumed  / protein.target  : 0);
  const hydrationRatio      = clamp(hydration.target > 0 ? hydration.consumed / hydration.target : 0);
  const consistencyRatio    = clamp(consistency);
  const micronutrientsRatio = clamp(micronutrients);

  // Weighted component scores (each in its own weight range)
  const components = {
    nutrition:      nutritionRatio      * WEIGHTS.nutrition,
    protein:        proteinRatio        * WEIGHTS.protein,
    hydration:      hydrationRatio      * WEIGHTS.hydration,
    consistency:    consistencyRatio    * WEIGHTS.consistency,
    micronutrients: micronutrientsRatio * WEIGHTS.micronutrients,
  };

  const rawSum =
    components.nutrition +
    components.protein +
    components.hydration +
    components.consistency +
    components.micronutrients;

  const contextMultiplier = CONTEXT_MULTIPLIERS[context];
  const rawScore = rawSum * contextMultiplier;
  const total = Math.max(Math.round(rawScore), SCORE_MINIMUM);

  // Determine label
  let label: ScoreResult['label'];
  if (total >= 85) {
    label = 'excelente';
  } else if (total >= 70) {
    label = 'bom';
  } else if (total >= 50) {
    label = 'em progresso';
  } else if (context === 'hard') {
    label = 'recomeçando';
  } else {
    label = 'atenção';
  }

  return {
    total,
    label,
    components,
    contextMultiplier,
  };
}
