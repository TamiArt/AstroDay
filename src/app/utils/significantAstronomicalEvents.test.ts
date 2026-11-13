import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { getPersonalizedAstronomicalEvent, SIGNIFICANT_ASTRONOMICAL_EVENTS } from './significantAstronomicalEvents';

const event = SIGNIFICANT_ASTRONOMICAL_EVENTS.find((item) => item.id === 'four-planet-alignment-2026-11');
assert.ok(event, 'November 2026 four-planet alignment is included in the calendar');
assert.equal(event.date, '2026-11-14');
assert.equal(event.referenceTime, '05:25 МСК');
assert.match(event.referenceTimeNote, /не точный момент выравнивания/);
assert.deepEqual(event.planets, ['Меркурий', 'Венера', 'Марс', 'Юпитер']);
assert.match(event.visibilityWindow, /13–22 ноября/);
assert.match(event.description, /видимое с Земли/);

const natalChart = calculateNatalChart(new Date('1990-06-15T07:19:25.000Z'), 28.6139, 77.2090);
const personalized = getPersonalizedAstronomicalEvent(event, natalChart);
assert.equal(personalized.transitMoment.toISOString(), '2026-11-14T02:25:00.000Z');
assert.equal(personalized.planetaryPositions.length, 2);
assert.ok(personalized.planetaryPositions.every((position) => ['Марс', 'Юпитер'].includes(position.name)));
assert.ok(personalized.planetaryPositions.every((position) => position.natalHouse >= 1 && position.natalHouse <= 12));
assert.ok(personalized.personalSummary.length > 20);
assert.ok(personalized.personalMeaning.length > 20);
assert.match(personalized.caveat, /не предсказывает/);

console.log('significantAstronomicalEvents: all tests passed');
