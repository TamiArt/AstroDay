import { clearForecastCache } from './indexedDB';
import { isValidCoordinates, isValidIanaTimezone } from './locationValidation';
import { unwrapProfilePayload, wrapProfilePayload } from './profileMigrations';

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

export interface HomeFloorPlanData {
  imageDataUrl: string;
  rooms: HomeRoomRect[];
  northOffset: number;
}

export interface HomeProgressItem {
  id: string;
  label: string;
  done: boolean;
}

const STORAGE_KEY = 'vedic_astro_profile';
const FEEDBACK_KEY = 'vedic_astro_feedback';
const LEGACY_OBFUSCATION_KEY = 'jyotish-2026';
const HOME_CALIBRATION_KEY = 'astroday_home_calibration';
const HOME_FLOORPLAN_KEY = 'astroday_home_floorplan';
const HOME_PROGRESS_KEY = 'astroday_home_progress';

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
  return loadLegacyHomeValue<HomeCalibrationData>(HOME_CALIBRATION_KEY, null);
}

export function saveHomeFloorPlan(data: HomeFloorPlanData): void {
  saveLegacyHomeValue(HOME_FLOORPLAN_KEY, data);
}

export function loadHomeFloorPlan(): HomeFloorPlanData | null {
  return loadLegacyHomeValue<HomeFloorPlanData>(HOME_FLOORPLAN_KEY, null);
}

export function saveHomeProgress(items: HomeProgressItem[]): void {
  saveLegacyHomeValue(HOME_PROGRESS_KEY, items);
}

export function loadHomeProgress(): HomeProgressItem[] {
  return loadLegacyHomeValue<HomeProgressItem[]>(HOME_PROGRESS_KEY, []);
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

export function deleteHomeData(): void {
  localStorage.removeItem(HOME_CALIBRATION_KEY);
  localStorage.removeItem(HOME_FLOORPLAN_KEY);
  localStorage.removeItem(HOME_PROGRESS_KEY);
}

export async function deleteAllData(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
  deleteHomeData();

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
