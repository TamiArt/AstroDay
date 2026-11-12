import assert from 'node:assert/strict';
import type { NatalChart, PlanetPosition } from './astrology';
import { analyzeVimshottariDasha } from './vimshottariDashaAnalysis';

const names = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
const signNames = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function position(name: string, longitude: number): PlanetPosition {
  const normalized = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(normalized / 30);
  return {
    name, tropicalLon: normalized, siderealLon: normalized, sign, signName: signNames[sign],
    degree: normalized % 30, nakshatra: Math.floor(normalized / (360 / 27)),
    nakshatraName: 'fixture', pada: 1, vargas: { D12: 1, D20: 1, D24: 1 },
  };
}
const planets = Object.fromEntries(names.map((name, index) => [name, position(name, (index * 37 + 11) % 360)])) as NatalChart['planets'];
const ascendant = position('Ascendant', 123.456);
const houses = Array.from({ length: 12 }, (_, index) => {
  const sign = (ascendant.sign + index) % 12;
  return { house: index + 1, cusp: sign * 30, sign, signName: signNames[sign], lord: ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'][sign] };
});
const chart: NatalChart = {
  date: new Date('1990-01-01T12:00:00Z'), latitude: 55.75, longitude: 37.61,
  ascendant, houses, planets,
};
const now = new Date('2026-11-12T12:00:00Z');
const report = analyzeVimshottariDasha(chart, now);
assert.ok(report.current.mahadasha.startDate <= now && now < report.current.mahadasha.endDate);
assert.ok(report.current.antardasha, 'current antardasha must be available');
assert.ok(report.current.pratyantardasha, 'current pratyantardasha must be available');
assert.equal(report.mahadashaAntardashas.length, 9);
assert.equal(report.antardashaPratyantardashas.length, 9);
for (const layer of [report.current.mahadasha, report.current.antardasha!, report.current.pratyantardasha!]) {
  assert.ok(layer.profile.planetName.length > 0);
  assert.ok(layer.profile.evidence.length >= 4);
  assert.ok(layer.whyHighlighted.length >= 2);
  assert.ok(layer.profile.limitations.length >= 3);
}
assert.ok(report.current.mahadasha.profile.dignity, 'classical planet dignity should be evaluated');
assert.ok(report.current.mahadasha.profile.dispositor, 'dispositor should be traced');
assert.ok(report.current.mahadasha.profile.lifeAreaLinks.every((area) => area.reasons.length > 0));
assert.ok(report.current.mahadasha.profile.vargas.length > 0, 'relevant varga evidence should be included');
assert.ok(report.warnings.some((warning) => warning.includes('не научно')));
assert.ok(report.methodology.some((line) => line.includes('120 лет')));
assert.throws(() => analyzeVimshottariDasha(chart, new Date('1989-12-31T00:00:00Z')), /раньше даты рождения/);
console.log('Vimshottari dasha analysis tests passed.');
