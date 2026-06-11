import { Aspect, NatalChart } from './astrology';

const ASPECT_DEFINITIONS: Array<{ angle: number; orb: number; type: Aspect['type']; label: string }> = [
  { angle: 0, orb: 10, type: 'conjunction', label: 'соединён с' },
  { angle: 60, orb: 6, type: 'sextile', label: 'в секстиле к' },
  { angle: 90, orb: 8, type: 'square', label: 'в квадрате к' },
  { angle: 120, orb: 8, type: 'trine', label: 'в трине к' },
  { angle: 180, orb: 10, type: 'opposition', label: 'в оппозиции к' },
];

function getAngularDistance(longitudeA: number, longitudeB: number): number {
  const diff = Math.abs(longitudeA - longitudeB);
  return diff > 180 ? 360 - diff : diff;
}

function findAspectsBetween(
  planet1: string,
  longitude1: number,
  planet2: string,
  longitude2: number,
  isTransit: boolean
): Aspect[] {
  const angle = getAngularDistance(longitude1, longitude2);
  const aspects: Aspect[] = [];

  for (const definition of ASPECT_DEFINITIONS) {
    const orb = Math.abs(angle - definition.angle);
    if (orb <= definition.orb) {
      const subject1 = isTransit ? `транзитный ${planet1}` : planet1;
      const subject2 = isTransit ? `натальный ${planet2}` : planet2;

      aspects.push({
        planet1,
        planet2,
        type: definition.type,
        angle: definition.angle,
        orb,
        strength: Math.round(((definition.orb - orb) / definition.orb) * 100),
        description: `${subject1} ${definition.label} ${subject2}`,
        isTransit,
        context: isTransit ? 'transit' : 'natal',
        isApplying: longitude1 < longitude2,
      });
    }
  }

  return aspects;
}

export function calculateNatalAspects(chart: NatalChart): Aspect[] {
  const planets = Object.entries(chart.planets);
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length - 1; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const [planet1, position1] = planets[i];
      const [planet2, position2] = planets[j];
      aspects.push(...findAspectsBetween(planet1, position1.siderealLon, planet2, position2.siderealLon, false));
    }
  }

  return aspects.sort((a, b) => b.strength - a.strength || a.orb - b.orb);
}

export function calculateTransitAspects(natalChart: NatalChart, transitChart: NatalChart): Aspect[] {
  const aspects: Aspect[] = [];

  Object.entries(transitChart.planets).forEach(([transitName, transitPlanet]) => {
    Object.entries(natalChart.planets).forEach(([natalName, natalPlanet]) => {
      aspects.push(...findAspectsBetween(
        transitName,
        transitPlanet.siderealLon,
        natalName,
        natalPlanet.siderealLon,
        true
      ));
    });
  });

  return aspects.sort((a, b) => b.strength - a.strength || a.orb - b.orb);
}
