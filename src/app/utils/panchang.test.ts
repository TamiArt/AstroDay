import assert from 'node:assert/strict';
import { calculatePanchang, getImportantDates, KARANAS, TITHIS, YOGAS } from './panchang';

const date = new Date('2026-08-19T12:00:00.000Z');
const panchang = calculatePanchang(date, { timezone: 'Europe/London' });

assert.ok(panchang.tithi.index >= 0 && panchang.tithi.index < TITHIS.length);
assert.equal(panchang.tithi.name, TITHIS[panchang.tithi.index].name);
assert.ok(panchang.nakshatra.index >= 0 && panchang.nakshatra.index < 27);
assert.ok(panchang.yoga.index >= 0 && panchang.yoga.index < YOGAS.length);
assert.equal(panchang.yoga.name, YOGAS[panchang.yoga.index].name);
assert.ok(panchang.karana.index >= 0 && panchang.karana.index < KARANAS.length);
assert.equal(panchang.karana.name, KARANAS[panchang.karana.index].name);
assert.ok(panchang.vara.index >= 0 && panchang.vara.index <= 6);

const dates = getImportantDates(new Date('2026-08-01T12:00:00.000Z'), 40, { timezone: 'Europe/London' });
assert.ok(dates.length > 0, 'A 40-day interval should contain important lunar dates');
for (const importantDate of dates) {
  assert.ok(['Purnima', 'Amavasya', 'Ekadashi', 'Eclipse', 'Sankranti'].includes(importantDate.type));
  assert.ok(importantDate.date instanceof Date && Number.isFinite(importantDate.date.getTime()));
}

console.log('panchang tests passed');
