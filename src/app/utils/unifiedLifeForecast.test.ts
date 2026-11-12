import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { buildUnifiedLifeForecast } from './unifiedLifeForecast';

const natal = calculateNatalChart(new Date('1990-06-15T07:19:25.000Z'), 28.6139, 77.2090);
const start = new Date('2026-11-12T00:00:00.000Z');
const end = new Date('2026-11-15T00:00:00.000Z');
const report = buildUnifiedLifeForecast(natal, start, end, { stepHours: 24 });

assert.equal(report.areas.length, 8);
assert.deepEqual(report.areas.map((item) => item.id), [
  'career', 'finances', 'relationships', 'children', 'learning', 'creativity', 'home', 'personal-growth',
]);
assert.ok(report.areas.every((area) => area.evidence.every((item) => ['house', 'planet', 'yoga', 'varga', 'dasha', 'transit'].includes(item.source))));
assert.ok(report.areas.every((area) => area.synthesis.length > 0));
assert.ok(report.areas.find((area) => area.id === 'children')?.limitations.some((item) => item.includes('фертильности')));
assert.ok(report.methodology.some((item) => item.includes('D1')));
assert.ok(report.warnings.some((item) => item.includes('медицинские')));
assert.equal(report.startDate.toISOString(), start.toISOString());

assert.throws(() => buildUnifiedLifeForecast(natal, end, start), /корректный период/);
assert.throws(() => buildUnifiedLifeForecast(natal, new Date('1989-01-01T00:00:00.000Z'), end), /раньше даты рождения/);

console.log('unifiedLifeForecast: all tests passed');
