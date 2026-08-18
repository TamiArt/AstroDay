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

interface CivilDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

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
  { name: 'Europe/Kyiv', bounds: { minLat: 44, maxLat: 52, minLon: 22, maxLon: 40 } },

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
  { name: 'America/Argentina/Buenos_Aires', bounds: { minLat: -55, maxLat: -21, minLon: -74, maxLon: -53 } },

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

export function findTimezoneByCoordinates(latitude: number, longitude: number): string {
  return findTimezoneInfoByCoordinates(latitude, longitude).timezone;
}

export function findTimezoneInfoByCoordinates(latitude: number, longitude: number): TimezoneLookup {
  let lon = longitude;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  for (const region of TIMEZONE_REGIONS) {
    const { minLat, maxLat, minLon, maxLon } = region.bounds;
    if (latitude >= minLat && latitude <= maxLat && lon >= minLon && lon <= maxLon) {
      return { timezone: region.name, accuracy: 'matched-region' };
    }
  }

  return {
    timezone: getTimezoneFromLongitude(lon),
    accuracy: 'estimated-longitude'
  };
}

/** Longitude-only fallback is intentionally approximate. */
function getTimezoneFromLongitude(longitude: number): string {
  const offset = Math.max(-12, Math.min(14, Math.round(longitude / 15)));
  if (offset === 0) return 'UTC';

  // Etc/GMT signs are intentionally inverted by the IANA convention.
  const ianaSign = offset > 0 ? '-' : '+';
  return `Etc/GMT${ianaSign}${Math.abs(offset)}`;
}

export function getTimezoneDisplayName(timezone: string, date?: Date): string {
  try {
    const targetDate = date || new Date();
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      timeZone: timezone,
      timeZoneName: 'long'
    });

    const parts = formatter.formatToParts(targetDate);
    return parts.find(p => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

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
    return (tzTime - utcTime) / (1000 * 60);
  } catch {
    return 0;
  }
}

function parseCivilDateTime(dateString: string, timeString: string): CivilDateTimeParts | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  const timeMatch = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(timeString);
  if (!dateMatch || !timeMatch) return null;

  const parts: CivilDateTimeParts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2])
  };

  if (
    parts.month < 1 || parts.month > 12 ||
    parts.day < 1 || parts.day > 31 ||
    parts.hour < 0 || parts.hour > 23 ||
    parts.minute < 0 || parts.minute > 59
  ) {
    return null;
  }

  const calendarCheck = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    calendarCheck.getUTCFullYear() !== parts.year ||
    calendarCheck.getUTCMonth() !== parts.month - 1 ||
    calendarCheck.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return parts;
}

function getCivilPartsAtInstant(date: Date, timezone: string): CivilDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const formatted = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(formatted.find(part => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute')
  };
}

function sameCivilTime(left: CivilDateTimeParts, right: CivilDateTimeParts): boolean {
  return left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute;
}

/**
 * Convert civil local date/time into an absolute instant in an IANA timezone.
 *
 * We evaluate the offsets around the requested civil time instead of applying
 * one offset sampled at an assumed UTC instant. This handles normal DST days
 * correctly and detects nonexistent spring-forward wall times. Ambiguous
 * fall-back wall times resolve deterministically to the earlier occurrence.
 */
export function createDateInTimezone(dateString: string, timeString: string, timezone: string): Date {
  const civil = parseCivilDateTime(dateString, timeString);
  if (!civil) return new Date(Number.NaN);

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
  } catch {
    return new Date(Number.NaN);
  }

  const civilAsUtcMs = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute, 0);
  const sampleInstants = [
    civilAsUtcMs - 36 * 60 * 60 * 1000,
    civilAsUtcMs - 12 * 60 * 60 * 1000,
    civilAsUtcMs,
    civilAsUtcMs + 12 * 60 * 60 * 1000,
    civilAsUtcMs + 36 * 60 * 60 * 1000
  ];
  const offsets = Array.from(new Set(sampleInstants.map(ms => getTimezoneOffset(timezone, new Date(ms)))));

  const candidates = offsets
    .map(offset => new Date(civilAsUtcMs - offset * 60 * 1000))
    .filter(candidate => sameCivilTime(getCivilPartsAtInstant(candidate, timezone), civil))
    .sort((a, b) => a.getTime() - b.getTime());

  return candidates[0] ?? new Date(Number.NaN);
}
