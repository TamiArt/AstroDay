import assert from 'node:assert/strict';
import { calculateTransitAspects } from './aspectCalculations';
import { calculateNatalChart } from './astrology';
import { calculatePanchang } from './panchang';
import { calculatePlanetaryHour } from './planetaryHours';
import { generatePersonalRecommendations } from './personalRecommendations';
import type { UserProfile } from './storage';

const profile: UserProfile = {
  name: 'Regression',
  birthDate: '1990-06-15',
  birthTime: '09:30',
  birthPlace: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London',
  timezoneAccuracy: 'manual',
  timeUncertainty: 0,
};

const birthMoment = new Date('1990-06-15T08:30:00.000Z');
const date = new Date('2026-08-19T12:00:00.000Z');
const natalChart = calculateNatalChart(birthMoment, profile.latitude, profile.longitude);
const currentChart = calculateNatalChart(date, profile.latitude, profile.longitude);
const aspects = calculateTransitAspects(natalChart, currentChart);
const panchang = calculatePanchang(date, { timezone: profile.timezone });
const planetaryHour = calculatePlanetaryHour(date, profile.latitude, profile.longitude, profile.timezone);

const result = generatePersonalRecommendations({
  profile,
  date,
  natalChart,
  currentChart,
  aspects,
  panchang,
  planetaryHour,
});

assert.ok(result.mainRecommendation.trim().length > 0);
assert.ok(result.avoidRecommendation.trim().length > 0);
assert.ok(result.bestAreas.length > 0);
assert.ok(result.reasoning.length > 0);
assert.ok(result.energyLevel >= 0 && result.energyLevel <= 100);
assert.ok(result.dashaPlanet.length > 0);
assert.equal(result.precision.level, 'high');
assert.ok(result.microUpaya.title.trim().length > 0);

const uncertainProfile: UserProfile = {
  ...profile,
  timeUncertainty: 15,
  timezoneAccuracy: 'estimated-longitude',
};
const uncertain = generatePersonalRecommendations({
  profile: uncertainProfile,
  date,
  natalChart,
  currentChart,
  aspects,
  panchang,
  planetaryHour,
});
assert.equal(uncertain.precision.level, 'low');
assert.ok(uncertain.precision.notes.length >= 2);

console.log('personalRecommendations tests passed');
