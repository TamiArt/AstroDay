import { clearForecastCache } from './indexedDB';
import { isValidCoordinates, isValidIanaTimezone } from './locationValidation';
import { unwrapProfilePayload, wrapProfilePayload } from './profileMigrations';
import { createEmptyVastuPropertyAssessment, type VastuPropertyAssessment } from './vastuPropertyAnalysis';

function legacyObfuscate(text: string, key: string): string {
  const utf8Bytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const encrypted = new Uint8Array(utf8Bytes.length);

  for (let index = 0; index < utf8Bytes.length; index++) {
    encrypted[index] = utf8Bytes[index] ^ keyBytes[index % keyBytes.length];
  }

  let binary = '';
  for (const byte of encrypted) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function legacyDeobfuscate(value: string, key: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);
  const decrypted = new Uint8Array(bytes.length);

  for (let index = 0; index < bytes.length; index++) {
    decrypted[index] = bytes[index] ^ keyBytes[index % keyBytes.length];
  }

  return new TextDecoder().decode(decrypted);
}

export interface UserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timeUncertainty?: number;
  timezoneAccuracy?: 'matched-region' | 'estimated-longitude' | 'manual';
  currentLocation?: {
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
    timezoneAccuracy?: 'matched-region' | 'estimated-longitude' | 'manual';
    lastUpdated: string;
  };
  relatives?: Relative[];
}

export interface Relative {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  livesNearby: boolean;
  includeInPredictions: boolean;
}

export interface DailyFeedback {
  date: string;
  mood: number;
  notes?: string;
}

export interface HomeCalibrationData {
  northOffset: number;
  calibratedAt: string;
  source: 'sun' | 'manual';
  warning?: string;
}

export interface HomeRoomRect {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baguaZone: string;
  vastuZone: string;
}

export type VastuMarkerType = 'entrance' | 'window' | 'obstruction' | 'water' | 'clutter' | 'kitchen' | 'bathroom' | 'workspace';

export interface VastuPlanMarker {
  id: string;
  type: VastuMarkerType;
  x: number;
  y: number;
  label: string;
}

export interface HomeFloorPlanData {
  imageDataUrl: string;
  rooms: HomeRoomRect[];
  northOffset: number;
  /** Clockwise bearing of geographic north from the image's top edge. */
  northBearingDegrees?: number;
  markers?: VastuPlanMarker[];
}

export interface HomeProgressItem {
  id: string;
  label: string;
  done: boolean;
}

export interface PartnerBirthProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface VastuChecklistItem {
  id: string;
  goal: 'abundance' | 'relationships' | 'wellbeing';
  label: string;
  done: boolean;
}

const STORAGE_KEY = 'vedic_astro_profile';
const FEEDBACK_KEY = 'vedic_astro_feedback';
const LEGACY_OBFUSCATION_KEY = 'jyotish-2026';
const HOME_CALIBRATION_KEY = 'astroday_home_calibration';
const HOME_FLOORPLAN_KEY = 'astroday_home_floorplan';
const HOME_PROGRESS_KEY = 'astroday_home_progress';
const HOME_VASTU_CHECKLIST_KEY = 'astroday_vastu_checklist';
const PARTNER_PROFILE_KEY = 'astroday_partner_profile';
const VASTU_PROPERTY_KEY = 'astroday_vastu_property_assessment';

export function saveUserProfile(profile: UserProfile): void {
  try {
    const payload = wrapProfilePayload(profile);
    localStorage.setItem(STORAGE_KEY, legacyObfuscate(JSON.stringify(payload), LEGACY_OBFUSCATION_KEY));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export function loadUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(legacyDeobfuscate(stored, LEGACY_OBFUSCATION_KEY));
    return validateUserProfile(unwrapProfilePayload(parsed));
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

export function saveDailyFeedback(feedback: DailyFeedback): void {
  try {
    const existing = loadAllFeedback();
    existing[feedback.date] = feedback;
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving feedback:', error);
  }
}

export function loadAllFeedback(): Record<string, DailyFeedback> {
  try {
    const data = localStorage.getItem(FEEDBACK_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading feedback:', error);
    return {};
  }
}

export function saveHomeCalibration(data: HomeCalibrationData): void {
  saveLegacyHomeValue(HOME_CALIBRATION_KEY, data);
}

export function loadHomeCalibration(): HomeCalibrationData | null {
  return loadLegacyHomeValue<HomeCalibrationData | null>(HOME_CALIBRATION_KEY, null);
}

export function saveHomeFloorPlan(data: HomeFloorPlanData): void {
  saveLegacyHomeValue(HOME_FLOORPLAN_KEY, data);
}

export function loadHomeFloorPlan(): HomeFloorPlanData | null {
  return loadLegacyHomeValue<HomeFloorPlanData | null>(HOME_FLOORPLAN_KEY, null);
}

export function saveHomeProgress(items: HomeProgressItem[]): void {
  saveLegacyHomeValue(HOME_PROGRESS_KEY, items);
}

export function loadHomeProgress(): HomeProgressItem[] {
  return loadLegacyHomeValue<HomeProgressItem[]>(HOME_PROGRESS_KEY, []);
}

export function saveVastuChecklist(items: VastuChecklistItem[]): void {
  saveLegacyHomeValue(HOME_VASTU_CHECKLIST_KEY, items);
}

export function loadVastuChecklist(): VastuChecklistItem[] {
  const stored = loadLegacyHomeValue<unknown>(HOME_VASTU_CHECKLIST_KEY, []);
  if (!Array.isArray(stored)) return [];

  return stored.filter((item): item is VastuChecklistItem => {
    if (typeof item !== 'object' || item === null) return false;
    const value = item as Record<string, unknown>;
    return typeof value.id === 'string'
      && typeof value.label === 'string'
      && typeof value.done === 'boolean'
      && (value.goal === 'abundance' || value.goal === 'relationships' || value.goal === 'wellbeing');
  });
}

function saveLegacyHomeValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, legacyObfuscate(JSON.stringify(value), LEGACY_OBFUSCATION_KEY));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

function loadLegacyHomeValue<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(legacyDeobfuscate(stored, LEGACY_OBFUSCATION_KEY)) as T;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return fallback;
  }
}

export function saveVastuPropertyAssessment(data: VastuPropertyAssessment): void {
  saveLegacyHomeValue(VASTU_PROPERTY_KEY, data);
}

export function loadVastuPropertyAssessment(): VastuPropertyAssessment {
  const stored = loadLegacyHomeValue<unknown>(VASTU_PROPERTY_KEY, null);
  if (!isRecord(stored) || stored.schemaVersion !== 1) return createEmptyVastuPropertyAssessment();
  const fallback = createEmptyVastuPropertyAssessment();
  const numeric = (key: keyof VastuPropertyAssessment, defaultValue: number) => {
    const value = stored[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : defaultValue;
  };
  const validDirections = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  const rooms = isRecord(stored.rooms) ? stored.rooms : {};
  const condition = isRecord(stored.condition) ? stored.condition : {};
  const roomValues = ['prayer', 'kitchen', 'master-bedroom', 'bedroom', 'guest-bedroom', 'living', 'dining', 'study', 'office', 'bathroom', 'toilet', 'stairs', 'storage', 'laundry', 'water', 'balcony', 'open', 'other'];
  const conditionValues = ['ok', 'attention', 'unknown'];
  return {
    ...fallback,
    propertyName: typeof stored.propertyName === 'string' ? stored.propertyName.slice(0, 120) : '',
    propertyType: ['apartment', 'house', 'land', 'office', 'retail', 'other'].includes(String(stored.propertyType)) ? stored.propertyType as VastuPropertyAssessment['propertyType'] : fallback.propertyType,
    facingDirection: validDirections.includes(String(stored.facingDirection)) ? stored.facingDirection as VastuPropertyAssessment['facingDirection'] : '',
    entranceWall: ['north', 'east', 'south', 'west'].includes(String(stored.entranceWall)) ? stored.entranceWall as VastuPropertyAssessment['entranceWall'] : '',
    entrancePosition: Math.min(100, numeric('entrancePosition', 50)),
    plotShape: ['square', 'rectangle', 'irregular', 'triangular', 'narrow', 'unknown'].includes(String(stored.plotShape)) ? stored.plotShape as VastuPropertyAssessment['plotShape'] : 'unknown',
    plotSlope: [...validDirections, 'flat', 'unknown'].includes(String(stored.plotSlope)) ? stored.plotSlope as VastuPropertyAssessment['plotSlope'] : 'unknown',
    roadSides: Array.isArray(stored.roadSides) ? stored.roadSides.filter((value): value is VastuPropertyAssessment['roadSides'][number] => validDirections.includes(String(value))) : [],
    waterSides: Array.isArray(stored.waterSides) ? stored.waterSides.filter((value): value is VastuPropertyAssessment['waterSides'][number] => validDirections.includes(String(value))) : [],
    rooms: Object.fromEntries(Object.entries(fallback.rooms).map(([sector, value]) => [sector, roomValues.includes(String(rooms[sector])) ? rooms[sector] : value])) as VastuPropertyAssessment['rooms'],
    condition: Object.fromEntries(Object.entries(fallback.condition).map(([id, value]) => [id, conditionValues.includes(String(condition[id])) ? condition[id] : value])) as VastuPropertyAssessment['condition'],
    currency: typeof stored.currency === 'string' && /^[A-Z]{3}$/.test(stored.currency) ? stored.currency : 'USD',
    purchasePrice: numeric('purchasePrice', 0),
    closingCosts: numeric('closingCosts', 0),
    renovationCost: numeric('renovationCost', 0),
    monthlyRent: numeric('monthlyRent', 0),
    vacancyRatePercent: Math.min(100, numeric('vacancyRatePercent', 5)),
    monthlyOperatingCosts: numeric('monthlyOperatingCosts', 0),
    annualPropertyTax: numeric('annualPropertyTax', 0),
    annualInsurance: numeric('annualInsurance', 0),
    annualCapitalReserve: numeric('annualCapitalReserve', 0),
    monthlyMortgagePayment: numeric('monthlyMortgagePayment', 0),
    notes: typeof stored.notes === 'string' ? stored.notes.slice(0, 4000) : '',
  };
}

export function deleteVastuPropertyAssessment(): void {
  localStorage.removeItem(VASTU_PROPERTY_KEY);
}

export function savePartnerProfile(profile: PartnerBirthProfile): void {
  saveLegacyHomeValue(PARTNER_PROFILE_KEY, profile);
}

export function loadPartnerProfile(): PartnerBirthProfile | null {
  const stored = loadLegacyHomeValue<unknown>(PARTNER_PROFILE_KEY, null);
  if (!isRecord(stored)) return null;
  const name = readString(stored, 'name');
  const birthDate = readString(stored, 'birthDate');
  const birthTime = readString(stored, 'birthTime');
  const birthPlace = readString(stored, 'birthPlace');
  const latitude = readNumber(stored, 'latitude');
  const longitude = readNumber(stored, 'longitude');
  const timezone = readString(stored, 'timezone');
  if (!name || !birthDate || !birthTime || !birthPlace || latitude === null || longitude === null || !timezone) return null;
  if (!isValidCoordinates(latitude, longitude) || !isValidIanaTimezone(timezone)) return null;
  return { name, birthDate, birthTime, birthPlace, latitude, longitude, timezone };
}

export function deletePartnerProfile(): void {
  localStorage.removeItem(PARTNER_PROFILE_KEY);
}

export function deleteHomeData(): void {
  localStorage.removeItem(HOME_CALIBRATION_KEY);
  localStorage.removeItem(HOME_FLOORPLAN_KEY);
  localStorage.removeItem(HOME_PROGRESS_KEY);
  localStorage.removeItem(HOME_VASTU_CHECKLIST_KEY);
  deleteVastuPropertyAssessment();
}

export async function deleteAllData(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
  deleteHomeData();
  deletePartnerProfile();

  try {
    await clearForecastCache();
  } catch (error) {
    console.error('Error clearing forecast cache:', error);
  }
}

export function exportData(): string {
  return JSON.stringify({
    profile: loadUserProfile(),
    feedback: loadAllFeedback(),
    homeCalibration: loadHomeCalibration(),
    homeFloorPlan: loadHomeFloorPlan(),
    homeProgress: loadHomeProgress(),
    vastuChecklist: loadVastuChecklist(),
    vastuPropertyAssessment: loadVastuPropertyAssessment(),
    partnerProfile: loadPartnerProfile(),
  }, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimezoneAccuracy(value: unknown): value is NonNullable<UserProfile['timezoneAccuracy']> {
  return value === 'matched-region' || value === 'estimated-longitude' || value === 'manual';
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeCurrentLocation(value: unknown): UserProfile['currentLocation'] | undefined {
  if (!isRecord(value)) return undefined;

  const place = readString(value, 'place');
  const latitude = readNumber(value, 'latitude');
  const longitude = readNumber(value, 'longitude');
  const timezone = readString(value, 'timezone');

  if (!place || latitude === null || longitude === null || !timezone) return undefined;
  if (!isValidCoordinates(latitude, longitude) || !isValidIanaTimezone(timezone)) return undefined;

  return {
    place,
    latitude,
    longitude,
    timezone,
    timezoneAccuracy: isTimezoneAccuracy(value.timezoneAccuracy) ? value.timezoneAccuracy : 'manual',
    lastUpdated: readString(value, 'lastUpdated') || new Date().toISOString(),
  };
}

function normalizeRelatives(value: unknown): Relative[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const relatives = value.map((item, index): Relative | null => {
    if (!isRecord(item)) return null;

    const name = readString(item, 'name');
    const relationship = readString(item, 'relationship');
    const birthDate = readString(item, 'birthDate');
    const birthTime = readString(item, 'birthTime');
    const birthPlace = readString(item, 'birthPlace');
    const latitude = readNumber(item, 'latitude');
    const longitude = readNumber(item, 'longitude');

    if (!name || !relationship || !birthDate || !birthTime || !birthPlace || latitude === null || longitude === null) {
      return null;
    }
    if (!isValidCoordinates(latitude, longitude)) return null;

    return {
      id: readString(item, 'id') || `relative-${index + 1}`,
      name,
      relationship,
      birthDate,
      birthTime,
      birthPlace,
      latitude,
      longitude,
      livesNearby: typeof item.livesNearby === 'boolean' ? item.livesNearby : false,
      includeInPredictions: typeof item.includeInPredictions === 'boolean' ? item.includeInPredictions : false,
    };
  }).filter((item): item is Relative => item !== null);

  return relatives.length > 0 ? relatives : undefined;
}

export function validateUserProfile(value: unknown): UserProfile | null {
  const source = unwrapProfilePayload(value);
  if (!isRecord(source)) return null;

  const name = readString(source, 'name');
  const birthDate = readString(source, 'birthDate');
  const birthTime = readString(source, 'birthTime');
  const birthPlace = readString(source, 'birthPlace');
  const latitude = readNumber(source, 'latitude');
  const longitude = readNumber(source, 'longitude');
  const timezone = readString(source, 'timezone');

  if (!name || !birthDate || !birthTime || !birthPlace || latitude === null || longitude === null || !timezone) {
    return null;
  }
  if (!isValidCoordinates(latitude, longitude) || !isValidIanaTimezone(timezone)) return null;

  const profile: UserProfile = {
    name,
    birthDate,
    birthTime,
    birthPlace,
    latitude,
    longitude,
    timezone,
    timezoneAccuracy: isTimezoneAccuracy(source.timezoneAccuracy) ? source.timezoneAccuracy : 'manual',
  };

  const timeUncertainty = readNumber(source, 'timeUncertainty');
  if (timeUncertainty !== null && timeUncertainty >= 0) profile.timeUncertainty = timeUncertainty;

  const currentLocation = normalizeCurrentLocation(source.currentLocation);
  if (currentLocation) profile.currentLocation = currentLocation;

  const relatives = normalizeRelatives(source.relatives);
  if (relatives) profile.relatives = relatives;

  return profile;
}

export function importUserProfile(json: string): UserProfile {
  const parsed: unknown = JSON.parse(json);
  const profile = validateUserProfile(parsed);

  if (!profile) {
    throw new Error('Файл не похож на профиль AstroDay или содержит некорректные координаты/timezone.');
  }

  return profile;
}
