import assert from 'node:assert/strict';
import type { NatalChart, PlanetPosition } from './astrology';
import { buildNatalChartFacts } from './natalChartFacts';
import { analyzeNatalYogas } from './natalYogaAnalysis';
import { buildConclusionUnifiedAdvice } from './unifiedNatalAdvice';
import { synthesizeNatalChart } from './natalChartSynthesis';

const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const signLords = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

function position(name: string, sign: number): PlanetPosition {
  const longitude = sign * 30 + 10;
  return {
    name, tropicalLon: longitude, siderealLon: longitude, sign, signName: signNames[sign],
    degree: 10, nakshatra: Math.floor(longitude / (360 / 27)),
    nakshatraName: 'Test nakshatra', pada: 2, vargas: {},
  } as PlanetPosition;
}

function chartWith(planets: Record<string, number>): NatalChart {
  return {
    date: new Date('1990-01-01T12:00:00Z'),
    latitude: 55.75,
    longitude: 37.62,
    ascendant: position('Ascendant', 0),
    houses: Array.from({ length: 12 }, (_, index) => ({
      house: index + 1, cusp: index * 30, sign: index,
      signName: signNames[index], lord: signLords[index],
    })),
    planets: Object.fromEntries(Object.entries(planets).map(([name, sign]) => [name, position(name, sign)])),
  } as unknown as NatalChart;
}

const exchangeChart = chartWith({
  Sun: 8, Moon: 8, Mars: 0, Mercury: 7, Jupiter: 3,
  Venus: 8, Saturn: 10, Rahu: 2, Ketu: 8,
});
const exchangeFacts = buildNatalChartFacts(exchangeChart);
const exchangeAnalysis = analyzeNatalYogas(exchangeFacts);

assert.ok(exchangeAnalysis.findings.some((item) => item.id.startsWith('raja-4-5-')));
assert.ok((exchangeAnalysis.checks.find((item) => item.id === 'raja-yoga')?.findingIds.length ?? 0) >= 2, 'All distinct Raja yoga links must be returned');
assert.ok(exchangeAnalysis.findings.some((item) => item.category === 'wealth'));
assert.ok(exchangeAnalysis.findings.some((item) => item.id === 'parivartana-moon-jupiter'));
assert.ok(exchangeAnalysis.findings.some((item) => item.id === 'vipareeta-6-lord'));
assert.ok(exchangeAnalysis.findings.some((item) => item.id === 'mahapurusha-mars'));
assert.ok(exchangeAnalysis.findings.every((item) => item.formalRule.length > 0 && item.evidence.length > 0));
assert.ok(exchangeAnalysis.findings.every((item) => item.assessment && Array.isArray(item.assessment.supportingFactors) && Array.isArray(item.assessment.weakeningFactors) && item.assessment.unassessedFactors.length > 0));
assert.equal(new Set(exchangeAnalysis.findings.map((item) => item.id)).size, exchangeAnalysis.findings.length);
assert.ok(exchangeAnalysis.checks.every((item) => Array.isArray(item.findingIds)));

const lunarChart = chartWith({
  Sun: 4, Moon: 0, Mars: 6, Mercury: 4, Jupiter: 3,
  Venus: 1, Saturn: 10, Rahu: 3, Ketu: 9,
});
const lunarAnalysis = analyzeNatalYogas(buildNatalChartFacts(lunarChart));
assert.ok(lunarAnalysis.findings.some((item) => item.id === 'gaja-kesari'));
assert.ok(lunarAnalysis.findings.some((item) => item.id === 'chandra-mangala'));
assert.ok(lunarAnalysis.findings.some((item) => item.id === 'budha-aditya'));
assert.ok(lunarAnalysis.findings.some((item) => item.id === 'mahapurusha-jupiter'));

const signOnlyLunarFacts = buildNatalChartFacts({ ...lunarChart, houses: [] } as unknown as NatalChart);
const signOnlyLunarAnalysis = analyzeNatalYogas(signOnlyLunarFacts);
assert.equal(signOnlyLunarAnalysis.checks.find((item) => item.id === 'gaja-kesari')?.status, 'detected', 'Gaja-Kesari is determined by sign distance from the Moon');
assert.equal(signOnlyLunarAnalysis.checks.find((item) => item.id === 'chandra-mangala')?.status, 'incomplete', 'Without same-sign conjunction, missing houses prevent aspect verification');

const missingJupiterChart = {
  ...lunarChart,
  planets: { ...lunarChart.planets, Jupiter: undefined },
} as unknown as NatalChart;
const incomplete = analyzeNatalYogas(buildNatalChartFacts(missingJupiterChart));
assert.equal(incomplete.checks.find((item) => item.id === 'gaja-kesari')?.status, 'incomplete');
assert.equal(incomplete.checks.find((item) => item.id === 'mahapurusha-jupiter')?.status, 'incomplete');
assert.ok(incomplete.dataQuality.missingPlanets.includes('Jupiter'));
assert.ok(incomplete.checks.find((item) => item.id === 'raja-yoga')?.missingFacts.some((item) => item.includes('Юпитер')), 'Missing house-lord placement must not be silently treated as a negative result');
assert.ok(incomplete.checks.find((item) => item.id === 'dhana-yoga')?.missingFacts.some((item) => item.includes('Юпитер')));

const cancerAscendantChart = chartWith({
  Sun: 4, Moon: 3, Mars: 0, Mercury: 2, Jupiter: 8,
  Venus: 1, Saturn: 9, Rahu: 10, Ketu: 4,
});
cancerAscendantChart.ascendant = position('Ascendant', 3);
cancerAscendantChart.houses = (cancerAscendantChart.houses ?? []).map((house, index) => {
  const sign = (3 + index) % 12;
  return { ...house, sign, signName: signNames[sign], lord: signLords[sign] };
});
const yogaKaraka = analyzeNatalYogas(buildNatalChartFacts(cancerAscendantChart));
assert.ok(yogaKaraka.findings.some((item) => item.id === 'raja-karaka-10-5-mars'), 'A planet ruling a kendra and trikona must be identified as a yoga-karaka');

const piscesAscendantChart = chartWith({
  Sun: 4, Moon: 3, Mars: 0, Mercury: 2, Jupiter: 8,
  Venus: 1, Saturn: 9, Rahu: 10, Ketu: 4,
});
piscesAscendantChart.ascendant = position('Ascendant', 11);
piscesAscendantChart.houses = (piscesAscendantChart.houses ?? []).map((house, index) => {
  const sign = (11 + index) % 12;
  return { ...house, sign, signName: signNames[sign], lord: signLords[sign] };
});
const sharedDhanaLord = analyzeNatalYogas(buildNatalChartFacts(piscesAscendantChart));
assert.ok(sharedDhanaLord.findings.some((item) => item.id === 'dhana-karaka-2-9-mars'), 'A single planet ruling a wealth house and a trikona must be recognized as a Dhana yoga link');

const noYogaChart = chartWith({
  Sun: 0, Moon: 2, Mars: 4, Mercury: 6, Jupiter: 8,
  Venus: 10, Saturn: 1, Rahu: 3, Ketu: 9,
});
const noYoga = analyzeNatalYogas(buildNatalChartFacts(noYogaChart));
assert.ok(noYoga.checks.some((item) => item.status === 'not-detected'));

const synthesis = synthesizeNatalChart(exchangeFacts);
const unlinked = buildConclusionUnifiedAdvice(
  { ...synthesis.conclusions[0], relatedHouses: [] },
  synthesis.tensions,
);
assert.ok(unlinked.practicalStep.includes('проверяемый результат'));

console.log('natal yoga analysis tests passed');
