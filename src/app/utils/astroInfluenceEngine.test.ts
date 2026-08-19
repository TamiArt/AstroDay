import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { calculateTransitAspects } from './aspectCalculations';
import { buildAstroInfluenceFacts, getPanchangSignal } from './astroInfluenceEngine';
import { calculatePanchang } from './panchang';
import { calculatePlanetaryHour } from './planetaryHours';

const birthMoment = new Date('1990-06-15T08:30:00.000Z');
const date = new Date('2026-08-19T12:00:00.000Z');
const latitude = 51.5074;
const longitude = -0.1278;
const timezone = 'Europe/London';

const natalChart = calculateNatalChart(birthMoment, latitude, longitude);
const currentChart = calculateNatalChart(date, latitude, longitude);
const aspects = calculateTransitAspects(natalChart, currentChart);
const panchang = calculatePanchang(date, { timezone });
const planetaryHour = calculatePlanetaryHour(date, latitude, longitude, timezone);

const facts = buildAstroInfluenceFacts({
  date,
  natalChart,
  currentChart,
  aspects,
  panchang,
  planetaryHour,
});

assert.ok(facts.dasha.startDate <= date && date < facts.dasha.endDate);
assert.ok(facts.antardasha);
assert.equal(facts.currentMoonSign, currentChart.planets.Moon.signName);
assert.ok(facts.currentMoonHouse === null || (facts.currentMoonHouse >= 1 && facts.currentMoonHouse <= 12));
assert.equal(facts.planetaryHourPlanet, planetaryHour.planet);
assert.equal(facts.strongestAspect, aspects[0] ?? null);
assert.equal(facts.panchangSignal, getPanchangSignal(panchang));
assert.equal(facts.isDifficultYoga, facts.panchangSignal === 'difficult-yoga');

const purnimaLike = {
  ...panchang,
  tithi: { ...panchang.tithi, index: 14 },
};
const amavasyaLike = {
  ...panchang,
  tithi: { ...panchang.tithi, index: 29 },
};
const ekadashiLike = {
  ...panchang,
  tithi: { ...panchang.tithi, index: 10 },
};

assert.equal(getPanchangSignal(purnimaLike), 'purnima');
assert.equal(getPanchangSignal(amavasyaLike), 'amavasya');
assert.equal(getPanchangSignal(ekadashiLike), 'ekadashi');

console.log('astroInfluenceEngine tests passed');
