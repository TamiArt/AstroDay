import assert from 'node:assert/strict';
import { PROFILE_SCHEMA_VERSION, unwrapProfilePayload, wrapProfilePayload } from './profileMigrations';
import {
  deleteHomeData,
  deletePartnerProfile,
  importUserProfile,
  loadVastuChecklist,
  loadPartnerProfile,
  saveVastuChecklist,
  savePartnerProfile,
  validateUserProfile,
  type VastuChecklistItem,
} from './storage';

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

const storageValues = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storageValues.get(key) ?? null,
    setItem: (key: string, value: string) => storageValues.set(key, value),
    removeItem: (key: string) => storageValues.delete(key),
  },
});

const checklist: VastuChecklistItem[] = [
  { id: 'abundance-north', goal: 'abundance', label: 'Освободить север', done: true },
  { id: 'relationships-southwest', goal: 'relationships', label: 'Организовать спальню', done: false },
];
saveVastuChecklist(checklist);
assert.deepEqual(loadVastuChecklist(), checklist, 'Vastu checklist must persist locally');
const partner = {
  name: 'Partner',
  birthDate: '1988-05-12',
  birthTime: '08:30',
  birthPlace: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London',
};
savePartnerProfile(partner);
assert.deepEqual(loadPartnerProfile(), partner, 'Partner profile must persist locally');
deleteHomeData();
assert.deepEqual(loadVastuChecklist(), [], 'Deleting home data must also delete the Vastu checklist');
assert.deepEqual(loadPartnerProfile(), partner, 'Deleting home data must preserve the separate partner chart');
deletePartnerProfile();
assert.equal(loadPartnerProfile(), null, 'Partner profile can be deleted separately');

console.log('storage migration tests passed');
