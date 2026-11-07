import assert from 'node:assert/strict';
import { angularDistance, analyzeLifeAreas, getSynastryAspects } from './lifePathAnalysis';
import type { NatalChart, PlanetPosition } from './astrology';

const position = (siderealLon: number) => ({ siderealLon, signName: 'Овен', name: 'Test', tropicalLon: siderealLon, sign: 1, degree: siderealLon, nakshatra: 1, nakshatraName: 'Ашвини', pada: 1, vargas: {} } as unknown as PlanetPosition);
const chart = {
  date: new Date('1990-01-01T12:00:00Z'),
  latitude: 55,
  longitude: 37,
  ascendant: position(0),
  houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, signName: 'Овен', lord: 'Mars' })),
  planets: {
    Sun: position(10), Moon: position(65), Mars: position(95), Mercury: position(125),
    Jupiter: position(185), Venus: position(245), Saturn: position(305),
    Rahu: position(155), Ketu: position(335),
  },
} as unknown as NatalChart;

assert.equal(angularDistance(350, 10), 20);
assert.equal(angularDistance(20, 200), 180);
const areas = analyzeLifeAreas(chart);
assert.deepEqual(areas.map((area) => area.id), ['money', 'career', 'development', 'wellbeing', 'relationships']);
assert.ok(areas.every((area) => area.houseNotes.length === area.houses.length));
assert.ok(areas.find((area) => area.id === 'money')?.planetNotes.length);

const firstSynastryChart = { ...chart, planets: { Moon: position(65) } } as unknown as NatalChart;
const secondSynastryChart = { ...chart, planets: { Sun: position(65) } } as unknown as NatalChart;
const synastry = getSynastryAspects(firstSynastryChart, secondSynastryChart);
assert.ok(synastry.some((aspect) => aspect.firstPlanet === 'Moon' && aspect.secondPlanet === 'Sun'));
assert.ok(synastry.every((aspect) => aspect.orb >= 0));
console.log('life path analysis tests passed');
