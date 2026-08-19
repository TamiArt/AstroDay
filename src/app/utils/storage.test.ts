import assert from 'node:assert/strict';
import { PROFILE_SCHEMA_VERSION, unwrapProfilePayload, wrapProfilePayload } from './profileMigrations';
import { importUserProfile, validateUserProfile } from './storage';

const legacyProfile = {
  name: 'Test',
  birthDate: '1990-01-01',
  birthTime: '12:00',
  birthPlace: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London',
};

const wrapped = wrapProfilePayload(legacyProfile);
assert.equal(wrapped.schemaVersion, PROFILE_SCHEMA_VERSION);
assert.deepEqual(unwrapProfilePayload(wrapped), legacyProfile);
assert.deepEqual(unwrapProfilePayload(legacyProfile), legacyProfile);
assert.ok(validateUserProfile(legacyProfile));
assert.ok(validateUserProfile(wrapped));
assert.equal(validateUserProfile({ ...legacyProfile, latitude: 100 }), null);
assert.equal(validateUserProfile({ ...legacyProfile, timezone: 'Not/A_Timezone' }), null);
assert.deepEqual(importUserProfile(JSON.stringify(wrapped)), validateUserProfile(legacyProfile));
assert.throws(
  () => unwrapProfilePayload({ schemaVersion: PROFILE_SCHEMA_VERSION + 1, profile: legacyProfile }),
  /более новой версией/,
);

console.log('storage migration tests passed');
