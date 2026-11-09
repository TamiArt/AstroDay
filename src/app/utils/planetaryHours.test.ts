import assert from 'node:assert/strict';
import {
  calculatePlanetaryHour,
  calculatePlanetaryHoursForDay,
  calculateFavorableTimeWindows,
} from './planetaryHours';

const latitude = 51.5074;
const longitude = -0.1278;
const timezone = 'Europe/London';
const date = new Date('2026-08-19T12:00:00.000Z');

const hours = calculatePlanetaryHoursForDay(date, latitude, longitude, timezone);
assert.equal(hours.length, 24, 'Planetary day must contain 24 planetary hours');

for (let index = 0; index < hours.length; index++) {
  const hour = hours[index];
  assert.equal(hour.hourNumber, index + 1);
  assert.ok(hour.start < hour.end, 'Each planetary hour must have positive duration');
  if (index > 0) {
    assert.equal(hours[index - 1].end.getTime(), hour.start.getTime(), 'Planetary hours must be contiguous');
  }
}

assert.equal(hours.filter((hour) => hour.isDaytime).length, 12);
assert.equal(hours.filter((hour) => !hour.isDaytime).length, 12);
assert.deepEqual(
  hours.slice(0, 4).map((hour) => hour.planet),
  ['Mercury', 'Moon', 'Saturn', 'Jupiter'],
  'Wednesday planetary hours must follow the Chaldean sequence',
);
assert.equal(hours[12].planet, 'Sun', 'The 13th hour continues the Chaldean sequence into the night');
assert.ok(hours.every((hour) => hour.isFallback === false), 'London summer solstice test date must use astronomical sunrise/sunset');

const polarNightHours = calculatePlanetaryHoursForDay(
  new Date('2026-12-21T12:00:00.000Z'),
  89.9,
  0,
  'UTC',
);
assert.equal(polarNightHours.length, 24);
assert.ok(polarNightHours.every((hour) => hour.isFallback === true), 'Polar fallback must be explicitly marked');
assert.equal(polarNightHours[0].start.toISOString(), '2026-12-21T06:00:00.000Z');
assert.equal(polarNightHours[12].start.toISOString(), '2026-12-21T18:00:00.000Z');

const current = calculatePlanetaryHour(date, latitude, longitude, timezone);
assert.ok(current.start <= date && date < current.end, 'Current planetary hour must contain requested instant');
assert.ok(current.hourNumber >= 1 && current.hourNumber <= 24);

const windows = calculateFavorableTimeWindows(date, latitude, longitude, timezone);
assert.ok(windows.length <= 4);
for (const window of windows) {
  assert.ok(window.start < window.end);
  assert.ok(['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(window.planet));
}

assert.throws(
  () => calculatePlanetaryHour(new Date(Number.NaN), latitude, longitude, timezone),
  /корректная дата/,
  'Invalid dates must be rejected before sunrise calculations',
);
assert.throws(
  () => calculatePlanetaryHour(date, 91, longitude, timezone),
  /координаты/,
  'Out-of-range coordinates must be rejected before astronomy calculations',
);
assert.throws(
  () => calculatePlanetaryHoursForDay(date, latitude, longitude, 'Invalid/Timezone'),
  /IANA timezone/,
  'Invalid IANA timezone must be rejected explicitly',
);

console.log('planetaryHours tests passed');
