import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { angularSeparation, buildNatalPrecisionReport, calculateAngularAspects, calculatePlanetMotion, classifyCombustion } from './astrologyPrecision';
import type { PlanetPosition } from './astrology';

assert.equal(angularSeparation(359, 1), 2);
assert.equal(angularSeparation(10, 190), 180);
assert.throws(() => angularSeparation(Number.NaN, 1), /конечными числами/);
assert.equal(classifyCombustion('Mercury', 13, false).threshold, 14);
assert.equal(classifyCombustion('Mercury', 13, false).status, 'combust');
assert.equal(classifyCombustion('Mercury', 13, true).threshold, 12);
assert.equal(classifyCombustion('Mercury', 13, true).status, 'not-combust');
assert.equal(classifyCombustion('Venus', 8, true).status, 'combust');
assert.equal(classifyCombustion('Saturn', 15.01, false).status, 'not-combust');
assert.equal(classifyCombustion('Rahu', 1, true).status, 'not-assessed');

function point(name: string, longitude: number): PlanetPosition {
  const sign = Math.floor(longitude / 30);
  return { name, tropicalLon: longitude, siderealLon: longitude, sign, signName: String(sign), degree: longitude % 30,
    nakshatra: 0, nakshatraName: 'Ashwini', pada: 1, vargas: {} as PlanetPosition['vargas'] };
}
const positions = { A: point('A', 0), B: point('B', 89.5), C: point('C', 180) };
const motions = {
  A: { planet: 'A', dailyMotion: 1, state: 'direct' as const, sampleWindowHours: 12 },
  B: { planet: 'B', dailyMotion: 0, state: 'stationary' as const, sampleWindowHours: 12 },
  C: { planet: 'C', dailyMotion: -1, state: 'retrograde' as const, sampleWindowHours: 12 },
};
const aspects = calculateAngularAspects(positions, motions);
const square = aspects.find((a) => a.planet1 === 'A' && a.planet2 === 'B' && a.aspect === 'square');
assert.ok(square); assert.equal(square.orb, 0.5); assert.equal(square.phase, 'applying');
const opposition = aspects.find((a) => a.planet1 === 'A' && a.planet2 === 'C' && a.aspect === 'opposition');
assert.ok(opposition); assert.equal(opposition.orb, 0); assert.equal(opposition.phase, 'unknown');

assert.equal(calculatePlanetMotion('Mercury', new Date('2024-04-10T12:00:00.000Z')).state, 'retrograde');
assert.equal(calculatePlanetMotion('Mars', new Date('2024-04-10T12:00:00.000Z')).state, 'direct');

const chart = calculateNatalChart(new Date('1990-06-15T07:19:25.000Z'), 28.6139, 77.2090);
const report = buildNatalPrecisionReport(chart);
assert.equal(report.planets.length, 9);
assert.equal(report.conjunctions.length, 36);
assert.equal(report.ascendant.status, 'calculated-model');
assert.equal(report.quality.find((x) => x.topic === 'Накшатры и пады')?.status, 'exact-mathematics');
assert.equal(report.quality.find((x) => x.topic === 'Сожжение')?.status, 'school-dependent');
assert.ok(report.planets.every((p) => p.siderealLongitude >= 0 && p.siderealLongitude < 360));
assert.ok(report.planets.every((p) => p.pada >= 1 && p.pada <= 4));
assert.ok(report.aspects.every((a) => a.orb <= a.maxOrb));
console.log('astrology precision tests passed');
