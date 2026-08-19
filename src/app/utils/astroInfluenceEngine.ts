import { type Aspect, calculateDasha, getCurrentAntardasha, getPlanetHouse, type NatalChart } from './astrology';
import type { PanchangData } from './panchang';
import type { PlanetaryHourInfo } from './planetaryHours';

export type PanchangSignal = 'purnima' | 'amavasya' | 'ekadashi' | 'supportive-yoga' | 'difficult-yoga' | 'neutral';

const SUPPORTIVE_YOGAS = new Set(['Прити', 'Саубхагья', 'Шобхана', 'Сиддхи', 'Сиддха', 'Шубха']);
const DIFFICULT_YOGAS = new Set(['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата', 'Вайдхрити']);

export interface AstroInfluenceFacts {
  dasha: ReturnType<typeof calculateDasha>;
  antardasha: ReturnType<typeof getCurrentAntardasha>;
  strongestAspect: Aspect | null;
  currentMoonSign: string;
  currentMoonHouse: number | null;
  planetaryHourPlanet: string;
  panchangSignal: PanchangSignal;
  isDifficultYoga: boolean;
  isSupportiveYoga: boolean;
}

export interface AstroInfluenceContext {
  date: Date;
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
  planetaryHour: PlanetaryHourInfo;
}

export function getPanchangSignal(panchang: PanchangData): PanchangSignal {
  if (panchang.tithi.index === 14) return 'purnima';
  if (panchang.tithi.index === 29) return 'amavasya';
  if (panchang.tithi.index === 10 || panchang.tithi.index === 25) return 'ekadashi';
  if (SUPPORTIVE_YOGAS.has(panchang.yoga.name)) return 'supportive-yoga';
  if (DIFFICULT_YOGAS.has(panchang.yoga.name)) return 'difficult-yoga';
  return 'neutral';
}

export function buildAstroInfluenceFacts(context: AstroInfluenceContext): AstroInfluenceFacts {
  const { date, natalChart, currentChart, aspects, panchang, planetaryHour } = context;
  const moonNakshatra = Math.floor(natalChart.planets.Moon.siderealLon / (360 / 27));
  const dasha = calculateDasha(natalChart.date, moonNakshatra, date, natalChart.planets.Moon.siderealLon);
  const antardasha = getCurrentAntardasha(dasha, date);
  const currentMoon = currentChart.planets.Moon;
  const currentMoonHouse = natalChart.houses?.length === 12
    ? getPlanetHouse(currentMoon.sign, natalChart.houses)
    : null;

  return {
    dasha,
    antardasha,
    strongestAspect: aspects[0] ?? null,
    currentMoonSign: currentMoon.signName,
    currentMoonHouse,
    planetaryHourPlanet: planetaryHour.planet,
    panchangSignal: getPanchangSignal(panchang),
    isDifficultYoga: DIFFICULT_YOGAS.has(panchang.yoga.name),
    isSupportiveYoga: SUPPORTIVE_YOGAS.has(panchang.yoga.name),
  };
}
