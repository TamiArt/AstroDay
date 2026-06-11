// [УТИЛИТА] Работа с планетами - централизованное место для иконок, названий и цветов

export const PLANET_DATA = {
  Sun: { icon: '☀️', name: 'Солнце', color: '#f59e0b' },
  Moon: { icon: '🌙', name: 'Луна', color: '#cbd5e1' },
  Mars: { icon: '🔴', name: 'Марс', color: '#ef4444' },
  Mercury: { icon: '☿️', name: 'Меркурий', color: '#06b6d4' },
  Jupiter: { icon: '♃', name: 'Юпитер', color: '#eab308' },
  Venus: { icon: '♀️', name: 'Венера', color: '#ec4899' },
  Saturn: { icon: '♄', name: 'Сатурн', color: '#6366f1' }
} as const;

export type PlanetName = keyof typeof PLANET_DATA;

/**
 * Получить иконку планеты
 */
export function getPlanetIcon(planet: string): string {
  return PLANET_DATA[planet as PlanetName]?.icon || '⭐';
}

/**
 * Получить русское название планеты
 */
export function getPlanetName(planet: string): string {
  return PLANET_DATA[planet as PlanetName]?.name || planet;
}

/**
 * Получить цвет планеты
 */
export function getPlanetColor(planet: string): string {
  return PLANET_DATA[planet as PlanetName]?.color || '#a78bfa';
}

/**
 * Получить полную информацию о планете
 */
export function getPlanetInfo(planet: string) {
  return PLANET_DATA[planet as PlanetName] || {
    icon: '⭐',
    name: planet,
    color: '#a78bfa'
  };
}
