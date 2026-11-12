import assert from 'node:assert/strict';
import { PROFILE_SCHEMA_VERSION, unwrapProfilePayload, wrapProfilePayload } from './profileMigrations';
import {
  deleteHomeData,
  deletePartnerProfile,
  exportData,
  importUserProfile,
  restoreUserArchive,
  loadAllFeedback,
  loadHomeCalibration,
  loadUserProfile,
  saveDailyFeedback,
  saveUserProfile,
  saveHomeCalibration,
  saveHomeProgress,
  loadHomeProgress,
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
let writesBeforeFailure: number | null = null;
let failureName = 'QuotaExceededError';
let failReads = false;
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => {
      if (failReads) throw new DOMException('Storage access blocked', 'SecurityError');
      return storageValues.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (writesBeforeFailure !== null) {
        if (writesBeforeFailure === 0) {
          writesBeforeFailure = null;
          throw new DOMException('Storage write blocked', failureName);
        }
        writesBeforeFailure -= 1;
      }
      storageValues.set(key, value);
    },
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
  annualInsurance: 900,
  annualCapitalReserve: 1500,
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

saveUserProfile(legacyProfile);
saveDailyFeedback({ date: '2026-11-11', mood: 4, notes: 'Архивная заметка' });
saveHomeCalibration({ northOffset: 12.5, calibratedAt: '2026-11-11T10:00:00.000Z', source: 'manual' });
saveHomeProgress([{ id: 'task-1', label: 'Проверить план', done: true }]);
saveVastuChecklist(checklist);
saveHomeFloorPlan(floorPlan);
saveVastuPropertyAssessment(propertyAssessment);
savePartnerProfile(partner);
const exportedArchive = exportData();
const exported = JSON.parse(exportedArchive) as { format: string; schemaVersion: number; data: Record<string, unknown> };
assert.equal(exported.format, 'astroday-user-archive');
assert.equal(exported.schemaVersion, 1);
assert.ok(exported.data.profile);
assert.deepEqual(exported.data.feedback, { '2026-11-11': { date: '2026-11-11', mood: 4, notes: 'Архивная заметка' } });

deleteHomeData();
deletePartnerProfile();
saveDailyFeedback({ date: '2026-11-10', mood: 1 });
const restored = restoreUserArchive(exportedArchive);
assert.equal(restored.legacyProfileOnly, false);
assert.equal(restored.restoredSections.length, 8);
assert.equal(loadUserProfile()?.name, legacyProfile.name, 'Archive restore must restore the main profile');
assert.deepEqual(loadAllFeedback(), { '2026-11-11': { date: '2026-11-11', mood: 4, notes: 'Архивная заметка' } });
assert.deepEqual(loadHomeProgress(), [{ id: 'task-1', label: 'Проверить план', done: true }]);
assert.equal(loadHomeCalibration()?.northOffset, 12.5);
assert.deepEqual(loadHomeFloorPlan(), floorPlan, 'Archive restore must restore floor plan and markers');
assert.deepEqual(loadVastuChecklist(), checklist, 'Archive restore must restore the Vastu checklist');
assert.equal(loadVastuPropertyAssessment().propertyName, propertyAssessment.propertyName);
assert.deepEqual(loadPartnerProfile(), partner, 'Archive restore must restore partner profile');

const legacyFullArchive = restoreUserArchive(JSON.stringify(exported.data));
assert.equal(legacyFullArchive.legacyProfileOnly, false, 'Previous unversioned full JSON exports must remain restorable');
assert.deepEqual(loadPartnerProfile(), partner);

const stateBeforeFailedRestore = JSON.parse(exportData()).data;
writesBeforeFailure = 2;
assert.throws(() => restoreUserArchive(exportedArchive), /Предыдущие данные восстановлены/);
assert.deepEqual(JSON.parse(exportData()).data, stateBeforeFailedRestore, 'A failed restore must roll back all previous storage values');

const legacyProfileJson = JSON.stringify({ ...legacyProfile, name: 'Legacy profile' });
const legacyRestore = restoreUserArchive(legacyProfileJson);
assert.equal(legacyRestore.legacyProfileOnly, true);
assert.equal(loadUserProfile()?.name, 'Legacy profile');
assert.equal(loadHomeCalibration()?.northOffset, 12.5, 'Legacy profile import must not erase unrelated data');

const stateBeforeInvalidImport = JSON.parse(exportData()).data;
assert.throws(() => restoreUserArchive(JSON.stringify({
  format: 'astroday-user-archive',
  schemaVersion: 1,
  exportedAt: '2026-11-11T00:00:00.000Z',
  data: { profile: legacyProfile, feedback: 'broken' },
})), /Текущие данные не изменены/);
assert.deepEqual(JSON.parse(exportData()).data, stateBeforeInvalidImport, 'Invalid archive validation must happen before writes');
assert.throws(() => restoreUserArchive(JSON.stringify({
  format: 'astroday-user-archive',
  schemaVersion: 1,
  exportedAt: '2026-11-11T00:00:00.000Z',
  data: { ...exported.data, homeFloorPlan: { ...floorPlan, imageDataUrl: 'https://example.com/remote-image.png' } },
})), /Текущие данные не изменены/, 'Archive restore must not accept remote floor-plan image URLs');
assert.throws(() => restoreUserArchive(JSON.stringify({
  format: 'astroday-user-archive',
  schemaVersion: 1,
  exportedAt: '2026-11-11T00:00:00.000Z',
  data: { ...exported.data, vastuPropertyAssessment: { ...propertyAssessment, purchasePrice: -1 } },
})), /Текущие данные не изменены/, 'Archive restore must reject invalid property assessment values');

writesBeforeFailure = 0;
failureName = 'QuotaExceededError';
assert.throws(() => saveUserProfile(legacyProfile), /Не удалось сохранить профиль/);
writesBeforeFailure = 0;
failureName = 'SecurityError';
assert.throws(() => saveUserProfile(legacyProfile), /настройки приватности браузера/);
failReads = true;
assert.throws(() => loadUserProfile(), /Не удалось прочитать сохранённый профиль/);
failReads = false;

console.log('storage and archive tests passed');
