/**
 * Geocoding utilities using free Nominatim API (OpenStreetMap)
 * Converts place names to coordinates
 *
 * All coordinates are in WGS84 datum (standard GPS coordinate system)
 */

import { findTimezoneByCoordinates, findTimezoneInfoByCoordinates, getTimezoneDisplayName } from './timezones';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  timezone: string;
  timezoneAccuracy: 'matched-region' | 'estimated-longitude';
}

interface NominatimSearchItem {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Search for a place and get its coordinates
 * Uses Nominatim API (free, no API key required)
 * Returns coordinates in WGS84 datum (standard GPS)
 */
export async function geocodePlace(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) {
    throw new Error('Введите название места');
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=5` +
      `&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'VedicAstrologyApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Не удалось найти место');
    }

    const data = (await response.json()) as NominatimSearchItem[];

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Место не найдено. Попробуйте другое название');
    }

    return data.map((item) => {
      const latitude = parseFloat(item.lat);
      const longitude = parseFloat(item.lon);

      const timezoneInfo = findTimezoneInfoByCoordinates(latitude, longitude);

      return {
        latitude,
        longitude,
        displayName: item.display_name,
        timezone: timezoneInfo.timezone,
        timezoneAccuracy: timezoneInfo.accuracy
      };
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Get timezone from coordinates
 * Supports historical timezones for any date via Intl API
 * @param latitude - WGS84 latitude
 * @param longitude - WGS84 longitude
 * @returns IANA timezone identifier (e.g., "Europe/Moscow")
 */
export function getTimezoneFromCoordinates(latitude: number, longitude: number): string {
  return findTimezoneByCoordinates(latitude, longitude);
}

export function getTimezoneInfoFromCoordinates(latitude: number, longitude: number) {
  return findTimezoneInfoByCoordinates(latitude, longitude);
}

/**
 * Get historical timezone offset for a specific date and location
 * This is important for birth charts as timezone rules change over time
 * @param latitude - WGS84 latitude
 * @param longitude - WGS84 longitude
 * @param date - The date for which to get the timezone
 * @returns Timezone identifier with historical context
 */
export function getHistoricalTimezone(latitude: number, longitude: number, _date?: Date): string {
  // Returns IANA timezone identifier which automatically handles
  // historical timezone changes when used with Intl.DateTimeFormat
  return findTimezoneByCoordinates(latitude, longitude);
}

/**
 * Reverse geocode: get place name from coordinates
 * @param latitude - WGS84 latitude
 * @param longitude - WGS84 longitude
 * @returns Human-readable place name
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${latitude}` +
      `&lon=${longitude}` +
      `&format=json`,
      {
        headers: {
          'User-Agent': 'VedicAstrologyApp/1.0'
        }
      }
    );

    if (!response.ok) {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    const data = await response.json();
    return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

/**
 * Get timezone information for display
 * @param timezone - IANA timezone identifier
 * @param date - Optional date for historical offset
 * @returns Human-readable timezone info
 */
export function getTimezoneInfo(timezone: string, date?: Date): string {
  return getTimezoneDisplayName(timezone, date);
}
