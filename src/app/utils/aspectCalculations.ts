import type { Aspect, NatalChart } from './astrology';
import {
  calculateAngularAspects,
  calculatePlanetMotion,
  type PlanetMotion,
} from './astrologyPrecision';
import type { PlanetPosition } from './astrology';

const LABELS: Record<Aspect['type'], string> = {
  conjunction: 'соединён с',
  sextile: 'в секстиле к',
  square: 'в квадрате к',
  trine: 'в трине к',
  opposition: 'в оппозиции к',
  special: 'имеет специальную связь с',
};
const MOTION_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function getMotions(chart: NatalChart, prefix = ''): Record<string, PlanetMotion | null> {
  const result: Record<string, PlanetMotion | null> = {};
  for (const planet of MOTION_PLANETS) {
    result[prefix + planet] = calculatePlanetMotion(planet, chart.date);
  }
  for (const planet of ['Rahu', 'Ketu']) result[prefix + planet] = null;
  return result;
}

function toAspect(
  item: ReturnType<typeof calculateAngularAspects>[number],
  isTransit: boolean,
): Aspect {
  return {
    planet1: item.planet1.replace(/^(Transit|Natal) /, ''),
    planet2: item.planet2.replace(/^(Transit|Natal) /, ''),
    type: item.aspect,
    angle: item.exactAngle,
    orb: item.orb,
    strength: item.maxOrb === 0 ? 0 : Math.round(((item.maxOrb - item.orb) / item.maxOrb) * 100),
    description: (isTransit ? 'Транзитный ' : '') + item.planet1.replace(/^(Transit|Natal) /, '') +
      ' ' + LABELS[item.aspect] + ' ' + (isTransit ? 'натальный ' : '') + item.planet2.replace(/^(Transit|Natal) /, ''),
    isTransit,
    context: isTransit ? 'transit' : 'natal',
    isApplying: item.isApplying ?? undefined,
  };
}

export function calculateNatalAspects(chart: NatalChart): Aspect[] {
  const motions = getMotions(chart);
  const aspects = calculateAngularAspects(chart.planets as Record<string, PlanetPosition>, motions);
  return aspects.map((item) => toAspect(item, false))
    .sort((a, b) => b.strength - a.strength || a.orb - b.orb);
}

export function calculateTransitAspects(natalChart: NatalChart, transitChart: NatalChart): Aspect[] {
  const positions: Record<string, PlanetPosition> = {};
  for (const [name, position] of Object.entries(transitChart.planets)) positions['Transit ' + name] = position;
  for (const [name, position] of Object.entries(natalChart.planets)) positions['Natal ' + name] = position;
  const motions = { ...getMotions(transitChart, 'Transit '), ...getMotions(natalChart, 'Natal ') };
  const aspects = calculateAngularAspects(positions, motions)
    .filter((item) => item.planet1.startsWith('Transit ') && item.planet2.startsWith('Natal '));
  return aspects.map((item) => toAspect(item, true))
    .sort((a, b) => b.strength - a.strength || a.orb - b.orb);
}
