import { describe, it, expect } from 'vitest';
import {
  computeAchievements,
  calculatePotentialReward,
  canPlaceBet,
  calculateWinRate,
} from '../utils/gameLogic';

// ============================================================
// computeAchievements
// ============================================================
describe('computeAchievements', () => {
  it('devuelve 7 logros siempre', () => {
    const achievements = computeAchievements(1000, 0, 0);
    expect(achievements).toHaveLength(7);
  });

  it('todos los logros bloqueados para usuario nuevo (0 predicciones, 1000 coins)', () => {
    const achievements = computeAchievements(1000, 0, 0);
    expect(achievements.every(a => !a.unlocked)).toBe(true);
  });

  it('"Primeros Pasos" se desbloquea con 1 predicción', () => {
    const achievements = computeAchievements(1000, 1, 0);
    const firstSteps = achievements.find(a => a.id === 'first_steps');
    expect(firstSteps?.unlocked).toBe(true);
  });

  it('"Iniciado" se desbloquea con exactamente 5 predicciones', () => {
    const achievements = computeAchievements(1000, 5, 0);
    const iniciado = achievements.find(a => a.id === 'predictor_5');
    expect(iniciado?.unlocked).toBe(true);
  });

  it('"Iniciado" NO se desbloquea con 4 predicciones', () => {
    const achievements = computeAchievements(1000, 4, 0);
    const iniciado = achievements.find(a => a.id === 'predictor_5');
    expect(iniciado?.unlocked).toBe(false);
  });

  it('"Predictor Activo" se desbloquea con 25+ predicciones', () => {
    const achievements = computeAchievements(1000, 25, 0);
    const activo = achievements.find(a => a.id === 'predictor_25');
    expect(activo?.unlocked).toBe(true);
  });

  it('"Acumulador" se desbloquea con 2000+ ArenaCoins', () => {
    const achievements = computeAchievements(2000, 0, 0);
    const acumulador = achievements.find(a => a.id === 'rich');
    expect(acumulador?.unlocked).toBe(true);
  });

  it('"Acumulador" NO se desbloquea con 1999 ArenaCoins', () => {
    const achievements = computeAchievements(1999, 0, 0);
    const acumulador = achievements.find(a => a.id === 'rich');
    expect(acumulador?.unlocked).toBe(false);
  });

  it('"La Ballena" se desbloquea con 10000+ ArenaCoins', () => {
    const achievements = computeAchievements(10000, 0, 0);
    const whale = achievements.find(a => a.id === 'whale');
    expect(whale?.unlocked).toBe(true);
  });

  it('"Ojo de Halcón" se desbloquea con 70%+ precisión y min 5 predicciones', () => {
    // 7 correctas de 10 = 70%
    const achievements = computeAchievements(1000, 10, 7);
    const sharp = achievements.find(a => a.id === 'sharp');
    expect(sharp?.unlocked).toBe(true);
  });

  it('"Ojo de Halcón" NO se desbloquea con 70% de precisión pero solo 4 predicciones', () => {
    // 4/4 = 100% pero menos de 5 predicciones
    const achievements = computeAchievements(1000, 4, 4);
    const sharp = achievements.find(a => a.id === 'sharp');
    expect(sharp?.unlocked).toBe(false);
  });

  it('"Leyenda de la Arena" requiere 100 predicciones con 80%+ precisión', () => {
    // 100 predicciones, 85 correctas = 85%
    const achievements = computeAchievements(1000, 100, 85);
    const legend = achievements.find(a => a.id === 'legend');
    expect(legend?.unlocked).toBe(true);
  });

  it('"Leyenda de la Arena" NO se desbloquea con 80% pero solo 99 predicciones', () => {
    const achievements = computeAchievements(1000, 99, 80);
    const legend = achievements.find(a => a.id === 'legend');
    expect(legend?.unlocked).toBe(false);
  });

  it('el progreso nunca supera 100', () => {
    const achievements = computeAchievements(999999, 9999, 9999);
    achievements.forEach(a => {
      expect(a.progress).toBeLessThanOrEqual(100);
    });
  });

  it('el progreso nunca es negativo', () => {
    const achievements = computeAchievements(0, 0, 0);
    achievements.forEach(a => {
      expect(a.progress).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================
// calculatePotentialReward
// ============================================================
describe('calculatePotentialReward', () => {
  it('calcula la ganancia correctamente con multiplicador 2x', () => {
    expect(calculatePotentialReward(100, 2)).toBe(200);
  });

  it('calcula la ganancia con multiplicador 1.5x', () => {
    expect(calculatePotentialReward(200, 1.5)).toBe(300);
  });

  it('devuelve entero (floor) para multiplicadores decimales', () => {
    expect(calculatePotentialReward(100, 1.33)).toBe(133);
  });

  it('apuesta de 0 da ganancia de 0', () => {
    expect(calculatePotentialReward(0, 2)).toBe(0);
  });

  it('multiplicador 1x devuelve la misma cantidad', () => {
    expect(calculatePotentialReward(500, 1)).toBe(500);
  });
});

// ============================================================
// canPlaceBet
// ============================================================
describe('canPlaceBet', () => {
  it('permite apostar si hay saldo suficiente', () => {
    expect(canPlaceBet(1000, 100)).toBe(true);
  });

  it('permite apostar el saldo exacto', () => {
    expect(canPlaceBet(500, 500)).toBe(true);
  });

  it('no permite apostar más del saldo disponible', () => {
    expect(canPlaceBet(100, 200)).toBe(false);
  });

  it('no permite apostar menos de 10 ArenaCoins', () => {
    expect(canPlaceBet(1000, 9)).toBe(false);
  });

  it('permite apostar exactamente 10 ArenaCoins', () => {
    expect(canPlaceBet(1000, 10)).toBe(true);
  });

  it('no permite apostar 0', () => {
    expect(canPlaceBet(1000, 0)).toBe(false);
  });

  it('no permite apostar con saldo 0', () => {
    expect(canPlaceBet(0, 10)).toBe(false);
  });
});

// ============================================================
// calculateWinRate
// ============================================================
describe('calculateWinRate', () => {
  it('devuelve 0 si no hay predicciones', () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it('calcula 50% correctamente', () => {
    expect(calculateWinRate(10, 5)).toBe(50);
  });

  it('calcula 100% correctamente', () => {
    expect(calculateWinRate(10, 10)).toBe(100);
  });

  it('redondea el win rate correctamente', () => {
    // 1/3 = 33.33... → 33%
    expect(calculateWinRate(3, 1)).toBe(33);
  });

  it('redondea 2/3 = 67%', () => {
    expect(calculateWinRate(3, 2)).toBe(67);
  });
});
