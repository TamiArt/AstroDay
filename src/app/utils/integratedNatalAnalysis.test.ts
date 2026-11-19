import assert from 'node:assert/strict';
import type { NatalChart, PlanetPosition } from './astrology';
import { addIntegratedFactor, buildIntegratedNatalAnalysis, type IntegratedEvidence } from './integratedNatalAnalysis';
import { buildNatalChartFacts } from './natalChartFacts';
import { analyzeDivisionalCharts } from './divisionalChartAnalysis';
import { analyzeAllNatalHouses } from './natalHousePersonalizedAnalysis';
import { analyzeAllNatalPlanets } from './natalPlanetPersonalizedAnalysis';

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const lords = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
function position(name: string, sign: number): PlanetPosition {
  const longitude = sign * 30 + 10;
  return {
    name, tropicalLon: longitude, siderealLon: longitude, sign, signName: signs[sign],
    degree: 10, nakshatra: Math.floor(longitude / (360 / 27)),
    nakshatraName: 'Test nakshatra', pada: 2, vargas: {},
  } as PlanetPosition;
}
function chartWith(planets: Record<string, number>): NatalChart {
  return {
    date: new Date('1990-01-01T12:00:00Z'), latitude: 55.75, longitude: 37.62,
    ascendant: position('Ascendant', 0),
    houses: Array.from({ length: 12 }, (_, index) => ({
      house: index + 1, cusp: index * 30, sign: index, signName: signs[index], lord: lords[index],
    })),
    planets: Object.fromEntries(Object.entries(planets).map(([name, sign]) => [name, position(name, sign)])),
  } as unknown as NatalChart;
}

const deduplicated: IntegratedEvidence[] = [];
const repeatedFactor = {
  factorId: 'natal:planet:Venus:placement', source: 'planet' as const,
  sourceFamily: 'natal-structure' as const, area: 'relationships' as const,
  title: 'Венера: положение', statement: 'Положение Венеры в D1.',
  polarity: 'neutral' as const, references: ['D1 position'],
};
addIntegratedFactor(deduplicated, repeatedFactor);
addIntegratedFactor(deduplicated, { ...repeatedFactor, references: ['same fact in planet analysis'] });
assert.equal(deduplicated.length, 1, 'the same underlying factor must be represented once');
assert.equal(deduplicated[0].duplicateMentions, 2, 'duplicate mentions are tracked without increasing factor count');
assert.equal(deduplicated[0].references.length, 2, 'source references are preserved after deduplication');

const chart = chartWith({
  Sun: 8, Moon: 8, Mars: 0, Mercury: 7, Jupiter: 3,
  Venus: 8, Saturn: 10, Rahu: 2, Ketu: 8,
});
const asOf = new Date('2026-11-12T12:00:00Z');
const report = buildIntegratedNatalAnalysis(chart, asOf);

assert.equal(report.generatedAt.toISOString(), asOf.toISOString());
assert.equal(report.areas.length, 12, 'all twelve thematic areas must be represented');

const expectedAreas = [
  'identity', 'resources', 'skills', 'home', 'creativity', 'work',
  'relationships', 'transformation', 'wisdom', 'career', 'gains', 'retreat',
];
assert.deepEqual(report.areas.map((area) => area.id), expectedAreas, 'all twelve life areas must appear in stable roadmap order');
for (const area of report.areas) {
  assert.ok(area.houses.length > 0, `${area.id} must be linked to at least one natal house`);
  assert.ok(area.evidence.some((item) => item.source === 'house'), `${area.id} must use its natal-house calculation`);
  assert.ok(area.evidence.every((item) => item.area === area.id), `${area.id} must not contain evidence assigned to another area`);
}

const chartFacts = buildNatalChartFacts(chart);
const houseAnalyses = analyzeAllNatalHouses(chartFacts);
const planetAnalyses = analyzeAllNatalPlanets(chartFacts);
assert.equal(houseAnalyses.length, 12, 'the detailed analysis must cover all twelve houses');
assert.deepEqual(houseAnalyses.map((item) => item.house), Array.from({ length: 12 }, (_, index) => index + 1));
assert.ok(houseAnalyses.every((item) => item.available && item.theme.length > 0 && item.evidence.length > 0));
assert.ok(houseAnalyses.every((item) => item.interpretation.length > 0 && item.limitations.length > 0));
assert.equal(planetAnalyses.length, 9, 'the detailed analysis must cover all nine grahas');
assert.ok(planetAnalyses.every((item) => item.available && item.function.length > 0 && item.interpretation.length > 0));
assert.ok(planetAnalyses.every((item) => item.evidence.some((fact) => fact.includes('находится в знаке'))));

assert.ok(report.evidence.some((item) => item.source === 'house'), 'house analysis must be included');
assert.ok(report.evidence.some((item) => item.source === 'planet'), 'nine-planet analysis must be included');
assert.ok(report.evidence.some((item) => item.source === 'yoga'), 'yoga findings must be included');
assert.ok(report.evidence.some((item) => item.source === 'varga'), 'topic-specific vargas must be included');
assert.ok(report.evidence.some((item) => item.source === 'dasha'), 'current Vimshottari layers must be included');
assert.ok(report.evidence.some((item) => item.source === 'transit'), 'exact transit aspects must be included');
for (const area of report.areas) {
  const ids = area.evidence.map((item) => item.factorId);
  assert.equal(new Set(ids).size, ids.length, `duplicate factor IDs must be merged in ${area.id}`);
  assert.equal(area.uniqueFactorCount, ids.length);
  if (area.repeatedTheme) {
    assert.ok(area.sourceFamilies.length >= 2, 'a repeated theme requires multiple source families');
  }
}
assert.ok(report.methodology.some((item) => item.includes('не суммируются')));
assert.ok(report.methodology.some((item) => item.includes('Йоги')));
assert.ok(report.overview.includes('диспозиторы'));

const missingJupiterChart = {
  ...chart,
  planets: { ...chart.planets, Jupiter: undefined },
} as unknown as NatalChart;
const partialVargas = analyzeDivisionalCharts(missingJupiterChart);
assert.ok(partialVargas.warnings.some((warning) => warning.includes('Юпитер') && warning.includes('исключена')));
assert.ok(partialVargas.baseChart.evidence.every((item) => !item.occupants.includes('Юпитер')));
assert.ok(partialVargas.analyses.every((item) =>
  item.vargaEvidence.every((house) => !house.occupants.includes('Юпитер'))
  && item.comparisons.every((comparison) => comparison.planet !== 'Юпитер'),
), 'missing planets must not be fabricated in varga evidence or comparisons');

const nullJupiterChart = {
  ...chart,
  planets: { ...chart.planets, Jupiter: null },
} as unknown as NatalChart;
assert.doesNotThrow(() => analyzeDivisionalCharts(nullJupiterChart), 'null planet positions must be skipped');

const invalidLongitudeChart = {
  ...chart,
  planets: { ...chart.planets, Jupiter: { ...chart.planets.Jupiter, siderealLon: Number.NaN } },
} as unknown as NatalChart;
assert.doesNotThrow(() => analyzeDivisionalCharts(invalidLongitudeChart), 'non-finite planet longitudes must be skipped');

const partialReport = buildIntegratedNatalAnalysis(missingJupiterChart, asOf);
assert.equal(partialReport.areas.find((area) => area.id === 'identity')?.dataStatus, 'complete', 'unrelated missing planets must not downgrade every area');
assert.equal(partialReport.areas.find((area) => area.id === 'wisdom')?.dataStatus, 'partial', 'an area must be marked partial when its house lord is missing');
assert.equal(partialReport.areas.find((area) => area.id === 'retreat')?.dataStatus, 'partial', 'all areas ruled by the missing planet must be marked partial');

const invalidDate = new Date(Number.NaN);
assert.throws(() => buildIntegratedNatalAnalysis(chart, invalidDate), /Некорректная дата/);
assert.throws(() => buildIntegratedNatalAnalysis(chart, new Date('1989-01-01T00:00:00Z')), /раньше даты рождения/);

console.log('integratedNatalAnalysis: all checks passed');
