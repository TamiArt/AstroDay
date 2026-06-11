/**
 * Local Storage Management with Encryption
 * All data is stored locally in browser, never sent to server
 */

// Simple XOR encryption for sensitive data (UTF-8 compatible)
function simpleEncrypt(text: string, key: string): string {
  // First encode UTF-8 to bytes
  const utf8Bytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);

  // XOR encryption
  const encrypted = new Uint8Array(utf8Bytes.length);
  for (let i = 0; i < utf8Bytes.length; i++) {
    encrypted[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Convert to base64
  let binary = '';
  for (let i = 0; i < encrypted.length; i++) {
    binary += String.fromCharCode(encrypted[i]);
  }
  return btoa(binary);
}

function simpleDecrypt(encrypted: string, key: string): string {
  // Decode from base64
  const binary = atob(encrypted);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // XOR decryption
  const keyBytes = new TextEncoder().encode(key);
  const decrypted = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    decrypted[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Decode UTF-8
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
  mood: number; // 1-5
  notes?: string;
}

const STORAGE_KEY = 'vedic_astro_profile';
const FEEDBACK_KEY = 'vedic_astro_feedback';
const ENCRYPTION_KEY = 'jyotish-2026';

export function saveUserProfile(profile: UserProfile): void {
  try {
    const json = JSON.stringify(profile);
    const encrypted = simpleEncrypt(json, ENCRYPTION_KEY);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export function loadUserProfile(): UserProfile | null {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;

    const decrypted = simpleDecrypt(encrypted, ENCRYPTION_KEY);
    return JSON.parse(decrypted);
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

export function deleteAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
}

export function exportData(): string {
  const profile = loadUserProfile();
  const feedback = loadAllFeedback();
  return JSON.stringify({ profile, feedback }, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
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

  if (!place || latitude === null || longitude === null || !timezone || !isValidCoordinate(latitude, longitude)) {
    return undefined;
  }

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

  const relatives = value
    .map((item, index): Relative | null => {
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

      if (!isValidCoordinate(latitude, longitude)) return null;

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
    })
    .filter((item): item is Relative => item !== null);

  return relatives.length > 0 ? relatives : undefined;
}

export function validateUserProfile(value: unknown): UserProfile | null {
  const source = isRecord(value) && isRecord(value.profile) ? value.profile : value;
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

  if (!isValidCoordinate(latitude, longitude)) return null;

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
  if (timeUncertainty !== null && timeUncertainty >= 0) {
    profile.timeUncertainty = timeUncertainty;
  }

  const currentLocation = normalizeCurrentLocation(source.currentLocation);
  if (currentLocation) profile.currentLocation = currentLocation;

  const relatives = normalizeRelatives(source.relatives);
  if (relatives) profile.relatives = relatives;

  return profile;
}

export function importUserProfile(json: string): UserProfile {
  const parsed = JSON.parse(json);
  const profile = validateUserProfile(parsed);

  if (!profile) {
    throw new Error('Файл не похож на профиль AstroDay или содержит некорректные координаты.');
  }

  return profile;
}
