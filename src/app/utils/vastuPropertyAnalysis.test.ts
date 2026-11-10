import assert from 'node:assert/strict';
import {
  analyzeVastuProperty,
  calculateEntrancePada,
  calculatePropertyInvestment,
  createEmptyVastuPropertyAssessment,
  PROPERTY_CONDITION_ITEMS,
} from './vastuPropertyAnalysis';

assert.equal(calculateEntrancePada(0), 1);
assert.equal(calculateEntrancePada(12.49), 1);
assert.equal(calculateEntrancePada(12.5), 2);
assert.equal(calculateEntrancePada(99.99), 8);
assert.equal(calculateEntrancePada(100), 8);
assert.equal(calculateEntrancePada(-1), null);
assert.equal(calculateEntrancePada(Number.NaN), null);

const empty = createEmptyVastuPropertyAssessment();
const emptyAnalysis = analyzeVastuProperty(empty);
assert.equal(emptyAnalysis.assessedSectors, 0);
assert.equal(emptyAnalysis.traditionalAlignmentScore, null);
assert.equal(emptyAnalysis.highPriorityCount, 0);
assert.equal(emptyAnalysis.conditionFindings.length, PROPERTY_CONDITION_ITEMS.length);
assert.ok(emptyAnalysis.siteFindings.some((item) => item.id === 'facing-missing'));
assert.ok(emptyAnalysis.siteFindings.some((item) => item.id === 'slope-missing'));
assert.ok(emptyAnalysis.conditionFindings.every((item) => item.status === 'unknown'));

const property = createEmptyVastuPropertyAssessment();
property.facingDirection = 'east';
property.plotShape = 'irregular';
property.plotSlope = 'southwest';
property.roadSides = ['north', 'east'];
property.waterSides = ['west'];
property.entranceWall = 'north';
property.entrancePosition = 50;
property.rooms.northeast = 'prayer';
property.rooms.southeast = 'kitchen';
property.rooms.center = 'toilet';
property.condition.structure = 'attention';
property.condition.legal = 'attention';
property.condition.moisture = 'ok';
const analysis = analyzeVastuProperty(property);
assert.equal(analysis.entrancePada, 5);
assert.ok(analysis.siteFindings.some((item) => item.id === 'shape' && item.level === 'review'));
assert.ok(analysis.siteFindings.some((item) => item.id === 'slope' && item.level === 'review'));
assert.ok(analysis.siteFindings.some((item) => item.id === 'roads'));
assert.ok(analysis.siteFindings.some((item) => item.id === 'water'));
assert.equal(analysis.assessedSectors, 3);
assert.equal(analysis.traditionalAlignmentScore, 67);
assert.equal(analysis.highPriorityCount, 2);
assert.equal(analysis.findings.find((item) => item.sector === 'northeast')?.level, 'note');
assert.equal(analysis.findings.find((item) => item.sector === 'southeast')?.level, 'note');
assert.equal(analysis.findings.find((item) => item.sector === 'center')?.level, 'review');

const investment = calculatePropertyInvestment({
  purchasePrice: 200000,
  closingCosts: 10000,
  renovationCost: 10000,
  monthlyRent: 2000,
  vacancyRatePercent: 5,
  monthlyOperatingCosts: 300,
  annualPropertyTax: 1200,
  annualInsurance: 1200,
  annualCapitalReserve: 1000,
  monthlyMortgagePayment: 1000,
});
assert.equal(investment.totalAcquisitionCost, 220000);
assert.equal(investment.effectiveAnnualRent, 22800);
assert.equal(investment.annualOperatingCosts, 7000);
assert.equal(investment.annualNetOperatingIncome, 15800);
assert.equal(investment.grossYieldPercent, 24000 / 220000 * 100);
assert.equal(investment.netYieldPercent, 15800 / 220000 * 100);
assert.equal(investment.monthlyCashFlowBeforeFinancing, 15800 / 12);
assert.equal(investment.monthlyCashFlowAfterFinancing, 15800 / 12 - 1000);
assert.equal(investment.breakEvenOccupancyPercent, 7000 / 24000 * 100);
assert.equal(investment.isComplete, true);

const noRent = calculatePropertyInvestment({
  purchasePrice: 0, closingCosts: 0, renovationCost: 0, monthlyRent: 0,
  vacancyRatePercent: 150, monthlyOperatingCosts: 0, annualPropertyTax: 0, annualInsurance: 0, annualCapitalReserve: 0, monthlyMortgagePayment: 0,
});
assert.equal(noRent.grossYieldPercent, null);
assert.equal(noRent.netYieldPercent, null);
assert.equal(noRent.breakEvenOccupancyPercent, null);
assert.equal(noRent.effectiveAnnualRent, 0);
assert.equal(noRent.isComplete, false);

console.log('Vastu property analysis tests passed');

const impossibleBreakEven = calculatePropertyInvestment({
  purchasePrice: 100000, closingCosts: 0, renovationCost: 0, monthlyRent: 100,
  vacancyRatePercent: 0, monthlyOperatingCosts: 200, annualPropertyTax: 0,
  annualInsurance: 0, annualCapitalReserve: 0, monthlyMortgagePayment: 0,
});
assert.equal(impossibleBreakEven.breakEvenOccupancyPercent, 200);
