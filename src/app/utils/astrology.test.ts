import assert from 'node:assert/strict';
import {
  calculateDasha,
  calculateNatalChart,
  getCurrentAntardasha,
  getNakshatra,
  getSign,
} from './astrology';

const birthMoment = new Date('1990-06-15T08:30:00.000Z');
const chart = calculateNatalChart(birthMoment, 51.5074, -0.1278);

assert.equal(chart.houses?.length, 12, 'Whole Sign chart must contain 12 houses');
assert.equal(new Set(chart.houses?.map((house) => house.house)).size, 12, 'House numbers must be unique');
assert.ok(chart.ascendant.sign >= 0 && chart.ascendant.sign < 12, 'Ascendant sign must be valid');

const rahu = chart.planets.Rahu.siderealLon;
const ketu = chart.planets.Ketu.siderealLon;
const nodeSeparation = ((ketu - rahu) % 360 + 360) % 360;
assert.ok(Math.abs(nodeSeparation - 180) < 1e-9, 'Rahu and Ketu must remain exactly opposite');

for (const planet of Object.values(chart.planets)) {
  assert.ok(planet.siderealLon >= 0 && planet.siderealLon < 360, `${planet.name} sidereal longitude must be normalized`);
  assert.ok(planet.sign >= 0 && planet.sign < 12, `${planet.name} sign must be valid`);
  assert.ok(planet.nakshatra >= 0 && planet.nakshatra < 27, `${planet.name} nakshatra must be valid`);
  assert.ok(planet.pada >= 1 && planet.pada <= 4, `${planet.name} pada must be valid`);
}

assert.equal(getSign(0), 0);
assert.equal(getSign(359.999), 11);
assert.equal(getNakshatra(0), 0);
assert.equal(getNakshatra(359.9), 26);

const moonNakshatra = chart.planets.Moon.nakshatra;
const currentDate = new Date('2026-08-19T12:00:00.000Z');
const dasha = calculateDasha(birthMoment, moonNakshatra, currentDate, chart.planets.Moon.siderealLon);
assert.ok(dasha.startDate <= currentDate && currentDate < dasha.endDate, 'Current Mahadasha must contain requested date');
const antardasha = getCurrentAntardasha(dasha, currentDate);
assert.ok(antardasha, 'Active Mahadasha must expose an active Antardasha');
assert.ok(antardasha!.startDate <= currentDate && currentDate < antardasha!.endDate);

console.log('astrology tests passed');
