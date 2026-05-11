/**
 * Decides whether the Compassion Mode should be activated for the current user.
 *
 * Activates when ALL of the following are true:
 *   - The feature is enabled in user settings
 *   - The user has not logged an entry for >= 3 days  OR  has had >= 3 consecutive low-score days (score < 50)
 */
export function shouldActivateCompassion(
  daysSinceLastEntry: number,
  consecutiveLowScores: number,
  enabled: boolean,
): boolean {
  if (!enabled) return false;
  return daysSinceLastEntry >= 3 || consecutiveLowScores >= 3;
}

/**
 * Returns a compassionate re-engagement message personalised to the user.
 *
 * @param name       - The user's first name.
 * @param daysMissed - Number of days without a nutrition entry.
 */
export function getCompassionMessage(name: string, daysMissed: number): string {
  if (daysMissed >= 7) {
    return (
      `${name}, faz um tempo que você não aparece — e está tudo bem. ` +
      `Vamos recomeçar com uma coisa só hoje: registre um alimento. Só isso.`
    );
  }

  if (daysMissed >= 3) {
    return (
      `${name}, percebi que você sumiu por alguns dias — e está tudo bem. ` +
      `Uma coisa só: beba um copo d'água agora e registre um alimento.`
    );
  }

  return (
    `${name}, ontem foi pesado. Hoje é um novo dia — vamos devagar. ` +
    `Uma refeição leve para começar.`
  );
}
