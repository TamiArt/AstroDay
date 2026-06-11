/**
 * Browser-compatible timezone detection
 * Maps coordinates to IANA timezone identifiers
 *
 * This keeps the app dependency-light. The returned IANA zone is then used
 * with Intl, which applies historical DST rules when the zone is correct.
 * The lookup also reports whether the zone came from a known region or from
 * longitude estimation so UI can communicate confidence.
 */

interface TimezoneRegion {
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface TimezoneLookup {
  timezone: string;
  accuracy: 'matched-region' | 'estimated-longitude';
}

/**
 * Major timezone regions with approximate boundaries
 * Organized by timezone for quick lookup
 */
const TIMEZONE_REGIONS: TimezoneRegion[] = [
  // Russia
  { name: 'Europe/Kaliningrad', bounds: { minLat: 54, maxLat: 55.5, minLon: 19, maxLon: 23 } },
  { name: 'Europe/Moscow', bounds: { minLat: 51, maxLat: 61, minLon: 27, maxLon: 48 } },
  { name: 'Europe/Samara', bounds: { minLat: 51, maxLat: 56, minLon: 48, maxLon: 54 } },
  { name: 'Asia/Yekaterinburg', bounds: { minLat: 54, maxLat: 62, minLon: 54, maxLon: 65 } },
  { name: 'Asia/Omsk', bounds: { minLat: 52, maxLat: 58, minLon: 65, maxLon: 77 } },
  { name: 'Asia/Krasnoyarsk', bounds: { minLat: 51, maxLat: 62, minLon: 77, maxLon: 95 } },
  { name: 'Asia/Irkutsk', bounds: { minLat: 50, maxLat: 60, minLon: 95, maxLon: 115 } },
  { name: 'Asia/Yakutsk', bounds: { minLat: 56, maxLat: 71, minLon: 115, maxLon: 135 } },
  { name: 'Asia/Vladivostok', bounds: { minLat: 42, maxLat: 51, minLon: 130, maxLon: 143 } },
  { name: 'Asia/Magadan', bounds: { minLat: 55, maxLat: 65, minLon: 143, maxLon: 165 } },
  { name: 'Asia/Kamchatka', bounds: { minLat: 50, maxLat: 62, minLon: 155, maxLon: 180 } },

  // Europe
  { name: 'Europe/London', bounds: { minLat: 49.5, maxLat: 61, minLon: -8, maxLon: 2 } },
  { name: 'Europe/Paris', bounds: { minLat: 42, maxLat: 51.5, minLon: -5, maxLon: 10 } },
  { name: 'Europe/Berlin', bounds: { minLat: 47, maxLat: 55, minLon: 5, maxLon: 15 } },
  { name: 'Europe/Rome', bounds: { minLat: 36, maxLat: 47, minLon: 6, maxLon: 19 } },
  { name: 'Europe/Athens', bounds: { minLat: 34, maxLat: 42, minLon: 19, maxLon: 30 } },
  { name: 'Europe/Istanbul', bounds: { minLat: 36, maxLat: 42, minLon: 26, maxLon: 45 } },
  { name: 'Europe/Kiev', bounds: { minLat: 44, maxLat: 52, minLon: 22, maxLon: 40 } },

  // Asia
  { name: 'Asia/Dubai', bounds: { minLat: 22, maxLat: 26, minLon: 51, maxLon: 57 } },
  { name: 'Asia/Karachi', bounds: { minLat: 23, maxLat: 37, minLon: 60, maxLon: 78 } },
  { name: 'Asia/Kolkata', bounds: { minLat: 6, maxLat: 36, minLon: 68, maxLon: 98 } },
  { name: 'Asia/Dhaka', bounds: { minLat: 20, maxLat: 27, minLon: 88, maxLon: 93 } },
  { name: 'Asia/Bangkok', bounds: { minLat: 5, maxLat: 21, minLon: 97, maxLon: 106 } },
  { name: 'Asia/Ho_Chi_Minh', bounds: { minLat: 8, maxLat: 24, minLon: 102, maxLon: 110 } },
  { name: 'Asia/Shanghai', bounds: { minLat: 18, maxLat: 54, minLon: 73, maxLon: 135 } },
  { name: 'Asia/Tokyo', bounds: { minLat: 24, maxLat: 46, minLon: 122, maxLon: 154 } },
  { name: 'Asia/Seoul', bounds: { minLat: 33, maxLat: 39, minLon: 124, maxLon: 132 } },

  // Americas
  { name: 'America/New_York', bounds: { minLat: 24, maxLat: 48, minLon: -85, maxLon: -66 } },
  { name: 'America/Chicago', bounds: { minLat: 25, maxLat: 50, minLon: -105, maxLon: -85 } },
  { name: 'America/Denver', bounds: { minLat: 31, maxLat: 49, minLon: -115, maxLon: -102 } },
  { name: 'America/Los_Angeles', bounds: { minLat: 32, maxLat: 49, minLon: -125, maxLon: -114 } },
  { name: 'America/Mexico_City', bounds: { minLat: 14, maxLat: 33, minLon: -118, maxLon: -86 } },
  { name: 'America/Sao_Paulo', bounds: { minLat: -34, maxLat: 5, minLon: -74, maxLon: -34 } },
  { name: 'America/Buenos_Aires', bounds: { minLat: -55, maxLat: -21, minLon: -74, maxLon: -53 } },

  // Australia & Oceania
  { name: 'Australia/Perth', bounds: { minLat: -35, maxLat: -15, minLon: 112, maxLon: 130 } },
  { name: 'Australia/Adelaide', bounds: { minLat: -39, maxLat: -26, minLon: 129, maxLon: 141 } },
  { name: 'Australia/Sydney', bounds: { minLat: -44, maxLat: -28, minLon: 141, maxLon: 154 } },
  { name: 'Pacific/Auckland', bounds: { minLat: -48, maxLat: -34, minLon: 166, maxLon: 179 } },

  // Africa
  { name: 'Africa/Cairo', bounds: { minLat: 22, maxLat: 32, minLon: 24, maxLon: 37 } },
  { name: 'Africa/Johannesburg', bounds: { minLat: -35, maxLat: -22, minLon: 16, maxLon: 33 } },
  { name: 'Africa/Nairobi', bounds: { minLat: -5, maxLat: 5, minLon: 33, maxLon: 42 } },
  { name: 'Africa/Lagos', bounds: { minLat: 4, maxLat: 14, minLon: 2, maxLon: 15 } },
];

/**
 * Find timezone by coordinates
 * @param latitude - WGS84 latitude (-90 to 90)
 * @param longitude - WGS84 longitude (-180 to 180)
 * @returns IANA timezone identifier
 */
export function findTimezoneByCoordinates(latitude: number, longitude: number): string {
  return findTimezoneInfoByCoordinates(latitude, longitude).timezone;
}

export function findTimezoneInfoByCoordinates(latitude: number, longitude: number): TimezoneLookup {
  // Normalize longitude to -180 to 180
  let lon = longitude;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  // Find matching region
  for (const region of TIMEZONE_REGIONS) {
    const { minLat, maxLat, minLon, maxLon } = region.bounds;

    if (latitude >= minLat && latitude <= maxLat &&
        lon >= minLon && lon <= maxLon) {
      return {
        timezone: region.name,
        accuracy: 'matched-region'
      };
    }
  }

  return {
    timezone: getTimezoneFromLongitude(lon),
    accuracy: 'estimated-longitude'
  };
}

/**
 * Fallback: estimate timezone from longitude
 * Not accurate for all locations, but provides reasonable default
 */
function getTimezoneFromLongitude(longitude: number): string {
  const offset = Math.round(longitude / 15);

  // Map common offsets to timezones
  const offsetMap: Record<string, string> = {
    '-12': 'Pacific/Fiji',
    '-11': 'Pacific/Midway',
    '-10': 'Pacific/Honolulu',
    '-9': 'America/Anchorage',
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver',
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '-4': 'America/Halifax',
    '-3': 'America/Sao_Paulo',
    '-2': 'Atlantic/South_Georgia',
    '-1': 'Atlantic/Azores',
    '0': 'Europe/London',
    '1': 'Europe/Paris',
    '2': 'Europe/Athens',
    '3': 'Europe/Moscow',
    '4': 'Asia/Dubai',
    '5': 'Asia/Karachi',
    '6': 'Asia/Dhaka',
    '7': 'Asia/Bangkok',
    '8': 'Asia/Shanghai',
    '9': 'Asia/Tokyo',
    '10': 'Australia/Sydney',
    '11': 'Pacific/Noumea',
    '12': 'Pacific/Fiji',
  };

  return offsetMap[String(offset)] || 'UTC';
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplayName(timezone: string, date?: Date): string {
  try {
    const targetDate = date || new Date();
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      timeZone: timezone,
      timeZoneName: 'long'
    });

    const parts = formatter.formatToParts(targetDate);
    const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || timezone;

    return timeZoneName;
  } catch (error) {
    return timezone;
  }
}

/**
 * Get timezone offset for a specific date
 * This automatically handles historical changes via Intl API
 */
export function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    };

    const toUtcMillis = (formatter: Intl.DateTimeFormat, sourceDate: Date) => {
      const parts = formatter.formatToParts(sourceDate);
      const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value);

      return Date.UTC(
        value('year'),
        value('month') - 1,
        value('day'),
        value('hour'),
        value('minute'),
        value('second')
      );
    };

    const tzFormatter = new Intl.DateTimeFormat('en-US', options);
    const utcFormatter = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' });
    const tzTime = toUtcMillis(tzFormatter, date);
    const utcTime = toUtcMillis(utcFormatter, date);

    // Calculate offset in minutes
    const offsetMs = tzTime - utcTime;
    return offsetMs / (1000 * 60); // Convert to minutes
  } catch (error) {
    return 0;
  }
}

/**
 * Create an absolute Date from local date/time in a named IANA timezone.
 * HTML inputs provide civil local time, but astrology calculations need the
 * corresponding instant, independent of the browser's current timezone.
 */
export function createDateInTimezone(dateString: string, timeString: string, timezone: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return new Date(`${dateString}T${timeString}`);
  }

  const assumedUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = getTimezoneOffset(timezone, assumedUtc);
  return new Date(assumedUtc.getTime() - offsetMinutes * 60 * 1000);
}
