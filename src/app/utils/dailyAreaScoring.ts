import type { PanchangData } from './panchang';

export const LIFE_AREA_IDS = [
  'career',
  'relationships',
  'health',
  'finances',
  'learning',
  'creativity',
  'spirituality',
  'family',
] as const;

export type LifeAreaId = (typeof LIFE_AREA_IDS)[number];

const DASHA_INFLUENCES: Record<string, Partial<Record<LifeAreaId, number>>> = {
  Sun: { career: 10, creativity: 8, health: 6, spirituality: 5 },
  Moon: { relationships: 10, family: 10, health: 6, spirituality: 5 },
  Mars: { health: 10, career: 8, spirituality: 3 },
  Mercury: { learning: 10, finances: 8, creativity: 6, career: 5 },
  Jupiter: { finances: 10, learning: 10, spirituality: 10, career: 6 },
  Venus: { relationships: 10, creativity: 10, family: 8, finances: 6 },
  Saturn: { career: 10, spirituality: 8, health: 5 },
  Rahu: { career: 8, finances: 6, learning: 5 },
  Ketu: { spirituality: 10, health: 5, learning: 3 },
};

const TRANSIT_PLANET_WEIGHTS: Record<string, number> = {
  Jupiter: 10,
  Venus: 8,
  Mercury: 6,
  Moon: 5,
  Sun: 4,
  Saturn: -5,
  Mars: 3,
};

const ASPECT_WEIGHTS: Record<string, number> = {
  trine: 8,
  sextile: 5,
  conjunction: 6,
  opposition: -4,
  square: -3,
};

export const FAVORABLE_NAKSHATRAS = new Set([
  'Rohini',
  'Uttara Phalguni',
  'Uttara Ashadha',
  'Uttara Bhadrapada',
  'Pushya',
  'Anuradha',
]);

export interface DailyAreaScoreParts {
  dashaScore?: number;
  transitScore?: number;
  panchangScore?: number;
}

export function getDashaPlanetInfluence(planet: string): Partial<Record<LifeAreaId, number>> {
  return DASHA_INFLUENCES[planet] ?? {};
}

export function getTransitPlanetWeight(planet: string): number {
  return TRANSIT_PLANET_WEIGHTS[planet] ?? 0;
}

export function getAspectWeight(type: string, strength: number): number {
  if (strength < 70) return 0;
  return ASPECT_WEIGHTS[type] ?? 0;
}

export function getPanchangInfluence(areaId: LifeAreaId, panchang: PanchangData): number {
  let influence = 0;
  const tithiIndex = panchang.tithi.index;

  if (tithiIndex === 0) {
    if (areaId === 'career' || areaId === 'learning') influence += 2;
    if (areaId === 'creativity') influence += 1;
  } else if (tithiIndex === 1) {
    if (areaId === 'finances') influence += 2;
    if (areaId === 'learning') influence += 1;
  } else if (tithiIndex === 2) {
    if (areaId === 'career') influence += 2;
    if (areaId === 'relationships' || areaId === 'health') influence += 1;
  } else if (tithiIndex === 4) {
    if (areaId === 'learning') influence += 3;
    if (areaId === 'creativity') influence += 2;
    if (areaId === 'career') influence += 1;
  } else if (tithiIndex === 6) {
    if (areaId === 'spirituality') influence += 3;
    if (areaId === 'health' || areaId === 'learning') influence += 1;
  } else if (tithiIndex === 8) {
    if (areaId === 'health') influence += 3;
    if (areaId === 'career') influence += 2;
    if (areaId === 'creativity') influence += 1;
  } else if (tithiIndex === 10 || tithiIndex === 25) {
    if (areaId === 'spirituality') influence += 4;
    if (areaId === 'health') influence += 2;
    if (areaId === 'learning') influence += 1;
  } else if (tithiIndex === 11) {
    if (areaId === 'health') influence += 3;
    if (areaId === 'family') influence += 2;
    if (areaId === 'relationships') influence += 1;
  } else if (tithiIndex === 14) {
    if (areaId === 'relationships' || areaId === 'spirituality' || areaId === 'family') influence += 2;
  } else if (tithiIndex === 29) {
    if (areaId === 'spirituality') influence += 3;
    if (areaId === 'health') influence += 1;
  }

  const vara = panchang.vara.planet;
  if (vara === 'Солнце') {
    if (areaId === 'career') influence += 2;
    if (areaId === 'creativity') influence += 1;
  } else if (vara === 'Луна') {
    if (areaId === 'relationships' || areaId === 'family') influence += 2;
    if (areaId === 'spirituality') influence += 1;
  } else if (vara === 'Марс') {
    if (areaId === 'health') influence += 2;
    if (areaId === 'career') influence += 1;
  } else if (vara === 'Меркурий') {
    if (areaId === 'learning') influence += 3;
    if (areaId === 'finances' || areaId === 'creativity') influence += 1;
  } else if (vara === 'Юпитер') {
    if (areaId === 'finances' || areaId === 'learning' || areaId === 'spirituality') influence += 2;
  } else if (vara === 'Венера') {
    if (areaId === 'relationships') influence += 3;
    if (areaId === 'creativity') influence += 2;
    if (areaId === 'family') influence += 1;
  } else if (vara === 'Сатурн') {
    if (areaId === 'career' || areaId === 'health' || areaId === 'spirituality') influence += 1;
  }

  const yoga = panchang.yoga.name;
  if (['Прити', 'Саубхагья', 'Шобхана', 'Шубха'].includes(yoga)) {
    influence += 1;
  } else if (['Аюшман', 'Сиддхи', 'Сиддха'].includes(yoga)) {
    if (areaId === 'health' || areaId === 'career') influence += 2;
  } else if (['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата'].includes(yoga)) {
    influence -= 2;
  }

  return Math.min(10, Math.max(0, influence));
}

export function calculateDailyAreaScore(parts: DailyAreaScoreParts): number {
  const dashaPoints = parts.dashaScore ?? 0;
  const transitPoints = parts.transitScore ?? 0;
  const panchangPoints = parts.panchangScore ?? 0;

  if (parts.transitScore === undefined && parts.dashaScore === undefined) {
    return Math.min(100, panchangPoints * 10);
  }

  return Math.max(0, Math.min(100, Math.round(dashaPoints + transitPoints + panchangPoints)));
}
