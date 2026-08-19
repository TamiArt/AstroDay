import assert from 'node:assert/strict';
import { getForecastProfileKey } from './forecastCalculations';
import type { UserProfile } from './storage';

const baseProfile: UserProfile = {
  name: 'Test',
  birthDate: '1990-01-01',
  birthTime: '12:00',
  birthPlace: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London',
  timezoneAccuracy: 'manual',
};

const first = getForecastProfileKey(baseProfile);
const second = getForecastProfileKey({ ...baseProfile });
assert.equal(first, second, 'Equivalent profiles must produce the same cache key');

const moved = getForecastProfileKey({
  ...baseProfile,
  currentLocation: {
    place: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
    timezoneAccuracy: 'manual',
    lastUpdated: '2026-08-19T00:00:00.000Z',
  },
});
assert.notEqual(first, moved, 'Current location changes must invalidate forecast cache');

const uncertain = getForecastProfileKey({ ...baseProfile, timeUncertainty: 15 });
assert.notEqual(first, uncertain, 'Birth-time uncertainty changes must invalidate forecast cache');

console.log('forecastCalculations tests passed');
