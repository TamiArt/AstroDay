import assert from 'node:assert/strict';
import { calculateTransitAspects } from './aspectCalculations';
import { calculateNatalChart } from './astrology';
import { buildAstroInfluenceFacts } from './astroInfluenceEngine';
import { calculatePanchang } from './panchang';
import { calculatePlanetaryHour } from './planetaryHours';
import { generatePersonalRecommendations } from './personalRecommendations';
import type { UserProfile } from './storage';

const profile: UserProfile = {
  name: 'Integration',
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

const context = { date, natalChart, currentChart, aspects, panchang, planetaryHour };
const facts = buildAstroInfluenceFacts(context);
const recommendation = generatePersonalRecommendations({ profile, ...context });

assert.equal(recommendation.dashaPlanet, facts.dasha.planet);
assert.equal(recommendation.antardashaPlanet, facts.antardasha?.planet);
assert.equal(facts.planetaryHourPlanet, planetaryHour.planet);
assert.equal(facts.currentMoonSign, currentChart.planets.Moon.signName);
assert.equal(facts.strongestAspect, aspects[0] ?? null);
assert.ok(recommendation.mainRecommendation.length > 0);
assert.ok(recommendation.reasoning.length > 0);

console.log('personalRecommendations integration tests passed');
