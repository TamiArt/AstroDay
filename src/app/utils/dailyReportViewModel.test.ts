import assert from 'node:assert/strict';
import { calculateTransitAspects } from './aspectCalculations';
import { calculateNatalChart } from './astrology';
import { buildDailyReportViewModel } from './dailyReportViewModel';
import { calculatePanchang } from './panchang';

const birthDate = new Date('1990-06-15T08:30:00.000Z');
const reportDate = new Date('2026-08-19T12:00:00.000Z');
const natalChart = calculateNatalChart(birthDate, 51.5074, -0.1278);
const currentChart = calculateNatalChart(reportDate, 51.5074, -0.1278);
const aspects = calculateTransitAspects(natalChart, currentChart);
const panchang = calculatePanchang(reportDate, { timezone: 'Europe/London' });

const report = buildDailyReportViewModel(
  'Regression',
  reportDate,
  natalChart,
  currentChart,
  aspects,
  panchang,
);

assert.equal(report.userName, 'Regression');
assert.equal(report.natal.ascendant, natalChart.ascendant.signName);
assert.equal(report.natal.moonSign, natalChart.planets.Moon.signName);
assert.equal(report.natal.moonNakshatra, natalChart.planets.Moon.nakshatraName);
assert.equal(report.transits.length, Object.keys(currentChart.planets).length);
assert.ok(report.keyAspects.length <= 5);
assert.equal(report.panchang.tithi, panchang.tithi.name);
assert.ok(report.dateLabel.length > 0);

console.log('dailyReportViewModel tests passed');
