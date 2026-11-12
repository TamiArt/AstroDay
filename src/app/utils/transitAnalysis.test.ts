import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { analyzeTransits } from './transitAnalysis';

const birth = new Date('1990-06-15T07:19:25.000Z');
const chart = calculateNatalChart(birth, 28.6139, 77.2090);
const moment = new Date('2026-11-12T12:00:00.000Z');
const report = analyzeTransits(chart, moment);

assert.equal(report.positions.length, 9, 'all seven classical planets and both nodes are listed');
assert.ok(report.positions.every((item) => item.natalHouse >= 1 && item.natalHouse <= 12));
assert.ok(report.positions.every((item) => Number.isFinite(item.longitude) && Number.isFinite(item.degree)));
assert.equal(report.dasha.mahadasha.length > 0, true);
assert.ok(report.aspects.every((item) => item.orb >= 0 && item.strength >= 0 && item.strength <= 100));
assert.ok(report.aspects.every((item) => item.transitHouse >= 1 && item.transitHouse <= 12));
assert.ok(report.houseLordHits.every((item) => item.house >= 1 && item.house <= 12));
assert.ok(report.lifeAreas.every((area) => area.repeated === (area.transitEvidence.length > 0 && area.dashaEvidence.length > 0)));
assert.deepEqual(report.repeatedThemes, report.lifeAreas.filter((area) => area.repeated).map((area) => area.label));
assert.ok(report.methodology.length >= 6);
assert.ok(report.warnings.some((warning) => warning.includes('Раху')));

assert.throws(() => analyzeTransits(chart, new Date('1989-01-01T00:00:00.000Z')), /раньше даты рождения/);
assert.throws(() => analyzeTransits(chart, new Date(Number.NaN)), /Некорректная дата/);
assert.throws(() => analyzeTransits({ ...chart, houses: [] }, moment), /12 натальных домов/);

console.log('transitAnalysis: all tests passed');
