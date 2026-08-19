import assert from 'node:assert/strict';
import { calculateTransitAspects } from './aspectCalculations';
import { calculateNatalChart } from './astrology';
import { calculateDailyAreas } from './dailyAreasAnalysis';
import { calculatePanchang } from './panchang';
import { getCurrentDashaForChart } from './personalRecommendations';

const birthMoment = new Date('1990-06-15T08:30:00.000Z');
const date = new Date('2026-08-19T12:00:00.000Z');
const latitude = 51.5074;
const longitude = -0.1278;

const natalChart = calculateNatalChart(birthMoment, latitude, longitude);
const currentChart = calculateNatalChart(date, latitude, longitude);
const aspects = calculateTransitAspects(natalChart, currentChart);
const panchang = calculatePanchang(date, { timezone: 'Europe/London' });
const { dasha } = getCurrentDashaForChart(natalChart, date);
const areas = calculateDailyAreas(panchang, natalChart, currentChart, aspects, dasha);

assert.equal(areas.length, 8, 'Daily area analysis must return all 8 life areas');
assert.equal(new Set(areas.map((area) => area.id)).size, 8, 'Life area ids must remain unique');

for (const area of areas) {
  assert.ok(area.score >= 0 && area.score <= 100, `${area.id} score must be normalized`);
  assert.ok(area.name.trim().length > 0);
  assert.ok(area.description.trim().length > 0);
  assert.ok(Array.isArray(area.recommendations));
}

const sortedScores = [...areas].sort((a, b) => b.score - a.score).map((area) => area.score);
for (let index = 1; index < sortedScores.length; index++) {
  assert.ok(sortedScores[index - 1] >= sortedScores[index]);
}

console.log('dailyAreasAnalysis tests passed');
