import assert from 'node:assert/strict';
import type { NatalChart, PlanetPosition } from './astrology';
import { addIntegratedFactor, buildIntegratedNatalAnalysis, type IntegratedEvidence } from './integratedNatalAnalysis';

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

const invalidDate = new Date(Number.NaN);
assert.throws(() => buildIntegratedNatalAnalysis(chart, invalidDate), /Некорректная дата/);
assert.throws(() => buildIntegratedNatalAnalysis(chart, new Date('1989-01-01T00:00:00Z')), /раньше даты рождения/);

console.log('integratedNatalAnalysis: all checks passed');
