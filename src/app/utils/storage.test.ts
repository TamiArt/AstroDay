import assert from 'node:assert/strict';
import { PROFILE_SCHEMA_VERSION, unwrapProfilePayload, wrapProfilePayload } from './profileMigrations';
import {
  deleteHomeData,
  deletePartnerProfile,
  importUserProfile,
  loadVastuChecklist,
  loadHomeFloorPlan,
  saveHomeFloorPlan,
  loadVastuPropertyAssessment,
  saveVastuPropertyAssessment,
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
const floorPlan = {
  imageDataUrl: '',
  rooms: [],
  northOffset: 0,
  northBearingDegrees: 90,
  markers: [{ id: 'entry-1', type: 'entrance' as const, x: 0.2, y: 0.4, label: 'Вход' }],
};
saveHomeFloorPlan(floorPlan);
assert.deepEqual(loadHomeFloorPlan(), floorPlan, 'Vastu compass alignment and plan markers must persist locally');
const propertyAssessment = {
  schemaVersion: 1 as const,
  propertyName: 'Test property',
  propertyType: 'apartment' as const,
  facingDirection: 'east' as const,
  entranceWall: 'east' as const,
  entrancePosition: 37.5,
  plotShape: 'rectangle' as const,
  plotSlope: 'flat' as const,
  roadSides: ['east'] as Array<'east'>,
  waterSides: [],
  rooms: { northwest: '', north: 'office', northeast: 'prayer', west: '', center: 'open', east: '', southwest: 'master-bedroom', south: '', southeast: 'kitchen' } as const,
  condition: { structure: 'ok', moisture: 'unknown', electrical: 'attention', fire: 'unknown', plumbing: 'unknown', ventilation: 'unknown', daylight: 'unknown', noise: 'unknown', accessibility: 'unknown', legal: 'unknown', permits: 'unknown', insurance: 'unknown' } as const,
  currency: 'CAD',
  purchasePrice: 500000,
  closingCosts: 12000,
  renovationCost: 8000,
  monthlyRent: 2800,
  vacancyRatePercent: 4,
  monthlyOperatingCosts: 450,
  annualPropertyTax: 3200,
  monthlyMortgagePayment: 1800,
  notes: 'Check electrical panel',
};
saveVastuPropertyAssessment(propertyAssessment);
assert.deepEqual(loadVastuPropertyAssessment(), propertyAssessment, 'Property assessment must persist locally with room, condition and finance data');
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
assert.equal(loadVastuPropertyAssessment().propertyName, '', 'Deleting home data must also delete property assessment');
assert.deepEqual(loadPartnerProfile(), partner, 'Deleting home data must preserve the separate partner chart');
deletePartnerProfile();
assert.equal(loadPartnerProfile(), null, 'Partner profile can be deleted separately');

console.log('storage migration tests passed');
