import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { buildTransitTimeline } from './transitTimeline';

const natal = calculateNatalChart(new Date('1990-06-15T07:19:25.000Z'), 28.6139, 77.2090);
const start = new Date('2026-11-12T00:00:00.000Z');
const end = new Date('2026-11-20T00:00:00.000Z');
const report = buildTransitTimeline(natal, start, end, { stepHours: 12 });

assert.equal(report.startDate.toISOString(), start.toISOString());
assert.equal(report.endDate.toISOString(), end.toISOString());
assert.ok(report.events.every((event) => event.exactAt >= start && event.exactAt <= end));
assert.ok(report.events.every((event) => event.evidence.length > 0));
assert.ok(report.aspectWindows.every((window) => window.startsAt <= window.exactAt && window.exactAt <= window.endsAt));
assert.ok(report.dashaActivations.every((item) => item.startsAt < item.endsAt));
assert.ok(report.methodology.some((item) => item.includes('бисек')));
assert.ok(report.warnings.some((item) => item.includes('Раху')));

assert.throws(() => buildTransitTimeline(natal, end, start), /окончания/);
assert.throws(() => buildTransitTimeline(natal, new Date('1989-01-01T00:00:00.000Z'), end), /раньше даты рождения/);
assert.throws(() => buildTransitTimeline(natal, start, new Date(start.getTime() + 4 * 366 * 86400000)), /трёх лет/);
assert.throws(() => buildTransitTimeline(natal, start, end, { stepHours: 2 }), /от 6 до 72/);

console.log('transitTimeline: all tests passed');
