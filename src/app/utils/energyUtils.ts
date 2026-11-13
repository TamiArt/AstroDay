// [УТИЛИТА] Условный индекс астрологической модели дня

export interface EnergyInfo {
  level: number; // 0-100
  category: 'low' | 'medium' | 'high';
  color: string;
  label: string;
  icon: string;
}

export interface PersonalEnergyFactors {
  ascendantSign?: string;
  natalMoonSign?: string;
  currentMoonSign?: string;
  dashaPlanet?: string;
  strongestAspectStrength?: number;
  timeUncertainty?: number;
}

/**
 * Расчёт условного индекса по выбранным астрологическим правилам; он не измеряет физическую или эмоциональную энергию человека
 * @param date - Дата для расчёта
 * @param moonLon - Долгота Луны (опционально, для более точного расчёта)
 * @param tithiIndex - Индекс титхи (опционально)
 * @returns Условный индекс модели от 0 до 100
 */
export function calculateEnergyLevel(
  date: Date,
  moonLon?: number,
  tithiIndex?: number
): number {
  // Базовая энергия от дня недели
  const dayOfWeek = date.getDay();
  const dayEnergy = [65, 50, 75, 80, 85, 60, 45][dayOfWeek]; // Вс-Сб

  // Модификация от титхи (если доступен)
  let tithiModifier = 0;
  if (tithiIndex !== undefined) {
    // Новолуние (29) и полнолуние (14) - пиковые моменты
    if (tithiIndex === 29 || tithiIndex === 14) {
      tithiModifier = 15;
    } else if (tithiIndex === 10 || tithiIndex === 25) { // Экадаши - духовная энергия
      tithiModifier = 10;
    } else if (tithiIndex < 14) { // Растущая луна
      tithiModifier = 5;
    } else { // Убывающая луна
      tithiModifier = -5;
    }
  }

  // Модификация от положения Луны (если доступно)
  let moonModifier = 0;
  if (moonLon !== undefined) {
    // Луна в определённых накшатрах даёт больше энергии
    const nakshatraIndex = Math.floor(moonLon / 13.333333) % 27;
    // Ашвини (0), Рохини (3), Уттара Пхалгуни (11), Свати (14) - энергетические накшатры
    if ([0, 3, 11, 14].includes(nakshatraIndex)) {
      moonModifier = 10;
    }
  }

  // Циклическая компонента (день месяца)
  const dayOfMonth = date.getDate();
  const cycleModifier = Math.sin((dayOfMonth / 30) * Math.PI * 2) * 5;

  // Итоговый расчёт
  const totalEnergy = dayEnergy + tithiModifier + moonModifier + cycleModifier;

  // Ограничение диапазона
  return Math.max(0, Math.min(100, Math.round(totalEnergy)));
}

export function calculatePersonalEnergyLevel(
  date: Date,
  moonLon?: number,
  tithiIndex?: number,
  factors: PersonalEnergyFactors = {}
): number {
  let energy = calculateEnergyLevel(date, moonLon, tithiIndex);

  if (factors.dashaPlanet) {
    const dashaModifiers: Record<string, number> = {
      Sun: 6,
      Moon: 2,
      Mars: 8,
      Mercury: 5,
      Jupiter: 7,
      Venus: 4,
      Saturn: -4,
      Rahu: 3,
      Ketu: -2,
    };
    energy += dashaModifiers[factors.dashaPlanet] ?? 0;
  }

  if (factors.natalMoonSign && factors.currentMoonSign) {
    energy += factors.natalMoonSign === factors.currentMoonSign ? 5 : 0;
  }

  if (typeof factors.strongestAspectStrength === 'number') {
    energy += factors.strongestAspectStrength >= 75 ? 4 : 0;
  }

  if ((factors.timeUncertainty ?? 0) > 10) {
    energy -= 3;
  }

  return Math.max(0, Math.min(100, Math.round(energy)));
}

/**
 * Получить информацию об энергии
 */
export function getEnergyInfo(level: number): EnergyInfo {
  let category: 'low' | 'medium' | 'high';
  let color: string;
  let label: string;
  let icon: string;

  if (level >= 70) {
    category = 'high';
    color = '#10b981'; // var(--neon-green)
    label = 'Выше среднего по модели';
    icon = '🔥';
  } else if (level >= 40) {
    category = 'medium';
    color = '#fbbf24'; // var(--neon-yellow)
    label = 'Средний индекс модели';
    icon = '✨';
  } else {
    category = 'low';
    color = '#ef4444'; // red/pink
    label = 'Ниже среднего по модели';
    icon = '🌙';
  }

  return { level, category, color, label, icon };
}

/**
 * Получить цвет по уровню энергии
 */
export function getEnergyColor(level: number): string {
  if (level >= 70) return '#10b981';
  if (level >= 40) return '#fbbf24';
  return '#ef4444';
}

/**
 * Получить лейбл по уровню энергии
 */
export function getEnergyLabel(level: number): string {
  if (level >= 70) return 'Выше среднего по модели';
  if (level >= 40) return 'Средний индекс модели';
  return 'Ниже среднего по модели';
}
