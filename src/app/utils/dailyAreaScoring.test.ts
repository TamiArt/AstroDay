import assert from 'node:assert/strict';
import { calculatePanchang } from './panchang';
import {
  calculateDailyAreaScore,
  getAspectWeight,
  getDashaPlanetInfluence,
  getPanchangInfluence,
  getTransitPlanetWeight,
} from './dailyAreaScoring';

assert.equal(getDashaPlanetInfluence('Jupiter').finances, 10);
assert.equal(getDashaPlanetInfluence('Venus').relationships, 10);
assert.equal(getDashaPlanetInfluence('Unknown').career, undefined);

assert.equal(getTransitPlanetWeight('Jupiter'), 10);
assert.equal(getTransitPlanetWeight('Saturn'), -5);
assert.equal(getTransitPlanetWeight('Unknown'), 0);

assert.equal(getAspectWeight('trine', 70), 8);
assert.equal(getAspectWeight('trine', 69), 0);
assert.equal(getAspectWeight('opposition', 90), -4);
assert.equal(getAspectWeight('unknown', 100), 0);

assert.equal(calculateDailyAreaScore({ panchangScore: 7 }), 70);
assert.equal(calculateDailyAreaScore({ dashaScore: 50, transitScore: 40, panchangScore: 10 }), 100);
assert.equal(calculateDailyAreaScore({ dashaScore: 0, transitScore: 0, panchangScore: 0 }), 0);

const panchang = calculatePanchang(new Date('2026-08-19T12:00:00.000Z'), { timezone: 'Europe/London' });
for (const areaId of ['career', 'relationships', 'health', 'finances', 'learning', 'creativity', 'spirituality', 'family'] as const) {
  const score = getPanchangInfluence(areaId, panchang);
  assert.ok(score >= 0 && score <= 10, `${areaId} Panchang score must stay in 0..10`);
}

console.log('dailyAreaScoring tests passed');
