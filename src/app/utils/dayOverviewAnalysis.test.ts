import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { analyzeTransits } from './transitAnalysis';
import { buildDayLifeAreaAnalyses, DAY_LIFE_AREAS } from './dayOverviewAnalysis';

const natalChart = calculateNatalChart(new Date('1990-06-15T07:19:25.000Z'), 28.6139, 77.2090);
const report = analyzeTransits(natalChart, new Date('2026-11-20T12:00:00.000Z'));
const areas = buildDayLifeAreaAnalyses(natalChart, report);

assert.equal(areas.length, 8, 'daily overview includes the eight requested life directions');
assert.deepEqual(
  areas.map((area) => area.definition.id),
  ['finances', 'career', 'creativity', 'relationships', 'family', 'children', 'health', 'communication'],
);
assert.deepEqual(
  DAY_LIFE_AREAS.find((area) => area.id === 'finances')?.houses,
  [1, 2, 10, 11],
);
assert.deepEqual(
  DAY_LIFE_AREAS.find((area) => area.id === 'children')?.houses,
  [5, 9, 2, 7],
);
assert.ok(areas.every((area) => area.natalBasis.every((item) =>
  item.house >= 1 && item.house <= 12 && item.lord.length > 0 && Number.isFinite(item.lordDegree),
)));
assert.ok(areas.every((area) => area.transitPositions.every((item) =>
  area.definition.houses.includes(item.natalHouse),
)));
assert.ok(areas.every((area) => area.evidenceCount ===
  area.transitPositions.length + area.aspects.length + area.lordHits.length));
assert.ok(areas.every((area) => area.narrative.length > 0));
assert.ok(areas.find((area) => area.definition.id === 'children')?.definition.limitation?.includes('зачатия'));
assert.ok(areas.find((area) => area.definition.id === 'health')?.definition.limitation?.includes('диагностирует'));

console.log('dayOverviewAnalysis: all tests passed');
