import assert from 'node:assert/strict';
import { getForecastProfileKey } from './forecastCalculations';
import { formatDateKey } from './dateUtils';
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

const residenceTimezone = getForecastProfileKey({
  ...baseProfile,
  currentLocation: {
    place: 'London',
    latitude: baseProfile.latitude,
    longitude: baseProfile.longitude,
    timezone: 'America/Los_Angeles',
    timezoneAccuracy: 'manual',
    lastUpdated: '2026-08-19T00:00:00.000Z',
  },
});
const otherResidenceTimezone = getForecastProfileKey({
  ...baseProfile,
  currentLocation: {
    place: 'London',
    latitude: baseProfile.latitude,
    longitude: baseProfile.longitude,
    timezone: 'Europe/London',
    timezoneAccuracy: 'manual',
    lastUpdated: '2026-08-19T00:00:00.000Z',
  },
});
assert.notEqual(residenceTimezone, otherResidenceTimezone, 'Residence timezone changes must invalidate forecast cache');

const sameInstant = new Date('2026-11-22T01:00:00.000Z');
assert.equal(formatDateKey(sameInstant, 'America/Los_Angeles'), '2026-11-21', 'Calendar date must follow residence timezone');
assert.equal(formatDateKey(sameInstant, 'Europe/Moscow'), '2026-11-22', 'Different residence timezones may have different local dates');

const uncertain = getForecastProfileKey({ ...baseProfile, timeUncertainty: 15 });
assert.notEqual(first, uncertain, 'Birth-time uncertainty changes must invalidate forecast cache');

console.log('forecastCalculations tests passed');
