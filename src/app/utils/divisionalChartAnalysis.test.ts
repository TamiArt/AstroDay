import assert from 'node:assert/strict';
import type { NatalChart, PlanetPosition } from './astrology';
import { analyzeDivisionalCharts, VARGA_ANALYSIS_RULES } from './divisionalChartAnalysis';
import { DIVISIONAL_CHART_DEFINITIONS } from './divisionalCharts';

const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
function position(name: string, longitude: number): PlanetPosition {
  const normalized = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(normalized / 30);
  return {
    name,
    tropicalLon: normalized,
    siderealLon: normalized,
    sign,
    signName: ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][sign],
    degree: normalized % 30,
    nakshatra: Math.floor(normalized / (360 / 27)),
    nakshatraName: 'fixture',
    pada: Math.floor((normalized % (360 / 27)) / (360 / 108)) + 1,
    vargas: { D12: 1, D20: 1, D24: 1 },
  };
}
const planets = Object.fromEntries(planetNames.map((name, index) => [name, position(name, (index * 37 + 11) % 360)])) as NatalChart['planets'];
const chart = {
  date: new Date('1990-01-01T12:00:00Z'),
  latitude: 55.75,
  longitude: 37.61,
  ascendant: position('Ascendant', 123.456),
  planets,
} as NatalChart;

const report = analyzeDivisionalCharts(chart);
assert.equal(report.analyses.length, 11, 'all requested vargas except base D1 have a dedicated analysis');
assert.deepEqual(report.analyses.map((item) => item.division), [2,3,4,7,9,10,12,16,20,24,27]);
assert.equal(report.baseChart.ascendantSign, 'Leo');
assert.equal(report.baseChart.evidence.length, 4);
for (const item of report.analyses) {
  assert.ok(item.calculationRule.length > 20, `D${item.division} has an explicit rule`);
  assert.ok(item.d1Evidence.length > 0, `D${item.division} has D1 anchors`);
  assert.ok(item.vargaEvidence.length > 0, `D${item.division} has varga evidence`);
  assert.ok(item.comparisons.length > 0, `D${item.division} compares planets between D1 and varga`);
  assert.ok(item.limitations.length >= 2, `D${item.division} exposes limitations`);
  assert.ok(item.boundarySensitivity.segmentWidthDegrees > 0);
  assert.ok(item.boundarySensitivity.distanceToNearestAscendantBoundary >= 0);
  assert.ok(item.boundarySensitivity.distanceToNearestAscendantBoundary <= item.boundarySensitivity.segmentWidthDegrees / 2 + 1e-8);
}
assert.equal(VARGA_ANALYSIS_RULES.length, 12);
assert.ok(VARGA_ANALYSIS_RULES.every((rule) => DIVISIONAL_CHART_DEFINITIONS.some((definition) => definition.division === rule.division)));
assert.ok(VARGA_ANALYSIS_RULES.find((rule) => rule.division === 3)?.d1Houses.includes(3), 'D3 is explicitly tied to D1 third house');
assert.ok(VARGA_ANALYSIS_RULES.find((rule) => rule.division === 7)?.limitations.some((item) => item.includes('фертильность')), 'D7 must not make fertility claims');
assert.ok(VARGA_ANALYSIS_RULES.find((rule) => rule.division === 10)?.limitations.some((item) => item.includes('заработок')), 'D10 must not guarantee earnings');
assert.ok(report.warnings.some((item) => item.includes('ошибка времени рождения')));
console.log('Divisional chart evidence analysis tests passed.');
