// ============================================================
// Achievements Logic — pure functions (testable)
// ============================================================

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number; // 0-100
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Computes the list of achievements based on user stats.
 * Pure function — deterministic, no side effects.
 */
export function computeAchievements(
  coins: number,
  totalPredictions: number,
  correctPredictions: number
): Achievement[] {
  const winRate = totalPredictions > 0
    ? (correctPredictions / totalPredictions) * 100
    : 0;

  return [
    {
      id: 'first_steps',
      icon: '🎯',
      title: 'Primeros Pasos',
      description: 'Realiza tu primera predicción',
      unlocked: totalPredictions >= 1,
      progress: Math.min(100, totalPredictions * 100),
      rarity: 'common',
    },
    {
      id: 'predictor_5',
      icon: '🔮',
      title: 'Iniciado',
      description: 'Realiza 5 predicciones',
      unlocked: totalPredictions >= 5,
      progress: Math.min(100, (totalPredictions / 5) * 100),
      rarity: 'common',
    },
    {
      id: 'predictor_25',
      icon: '⚡',
      title: 'Predictor Activo',
      description: 'Realiza 25 predicciones',
      unlocked: totalPredictions >= 25,
      progress: Math.min(100, (totalPredictions / 25) * 100),
      rarity: 'rare',
    },
    {
      id: 'rich',
      icon: '💰',
      title: 'Acumulador',
      description: 'Acumula 2.000 ArenaCoins',
      unlocked: coins >= 2000,
      progress: Math.min(100, (coins / 2000) * 100),
      rarity: 'rare',
    },
    {
      id: 'whale',
      icon: '🐋',
      title: 'La Ballena',
      description: 'Acumula 10.000 ArenaCoins',
      unlocked: coins >= 10000,
      progress: Math.min(100, (coins / 10000) * 100),
      rarity: 'epic',
    },
    {
      id: 'sharp',
      icon: '🎯',
      title: 'Ojo de Halcón',
      description: 'Consigue un 70% de precisión (mín. 5 pred.)',
      unlocked: totalPredictions >= 5 && winRate >= 70,
      progress: totalPredictions >= 5
        ? Math.min(100, (winRate / 70) * 100)
        : (totalPredictions / 5) * 100,
      rarity: 'epic',
    },
    {
      id: 'legend',
      icon: '👑',
      title: 'Leyenda de la Arena',
      description: 'Realiza 100 predicciones con 80%+ precisión',
      unlocked: totalPredictions >= 100 && winRate >= 80,
      progress: Math.min(
        100,
        Math.min(totalPredictions / 100, winRate >= 80 ? 1 : winRate / 80) * 100
      ),
      rarity: 'legendary',
    },
  ];
}

/**
 * Calculates the potential reward given a bet amount and a multiplier.
 */
export function calculatePotentialReward(amountBet: number, multiplier: number): number {
  return Math.floor(amountBet * multiplier);
}

/**
 * Validates if a user has enough coins to place a bet.
 */
export function canPlaceBet(currentBalance: number, betAmount: number): boolean {
  return betAmount >= 10 && betAmount <= currentBalance;
}

/**
 * Calculates win rate percentage.
 */
export function calculateWinRate(total: number, correct: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
