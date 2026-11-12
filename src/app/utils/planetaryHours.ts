import * as Astronomy from 'astronomy-engine';
import { formatDateKey, formatTime, getWeekdayIndex } from './dateUtils';
import { isValidCoordinates, isValidIanaTimezone } from './locationValidation';
import { createDateInTimezone } from './timezones';

const AstronomyApi = (Reflect.get(Astronomy, 'default') as typeof Astronomy | undefined) ?? Astronomy;
const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const;
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

export interface PlanetaryHourInfo {
  planet: string;
  start: Date;
  end: Date;
  isDaytime: boolean;
  hourNumber: number;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  isFallback?: boolean;
}

export interface FavorableTimeWindow {
  label: string;
  planet: string;
  quality: 'Традиционный ориентир' | 'Дополнительный ориентир' | 'Мягкий ориентир';
  description: string;
  start: Date;
  end: Date;
}

function validatePlanetaryHourInput(latitude: number, longitude: number, timezone: string): void {
  if (!isValidCoordinates(latitude, longitude)) {
    throw new Error('Для расчёта планетарного часа нужны корректные координаты');
  }
  if (!isValidIanaTimezone(timezone)) {
    throw new Error('Для расчёта планетарного часа нужна корректная IANA timezone');
  }
}

function searchSunEvent(
  direction: 1 | -1,
  observer: Astronomy.Observer,
  from: Date,
  limitDays: number
): Date | null {
  const event = AstronomyApi.SearchRiseSet(AstronomyApi.Body.Sun, observer, direction, from, limitDays);
  return event?.date ?? null;
}

function getLocalDayBounds(date: Date, latitude: number, longitude: number, timezone: string) {
  const observer = new AstronomyApi.Observer(latitude, longitude, 0);
  const dateKey = formatDateKey(date, timezone);
  const dayStart = createDateInTimezone(dateKey, '00:00', timezone);

  const sunrise = searchSunEvent(1, observer, dayStart, 2);
  const sunset = searchSunEvent(-1, observer, dayStart, 2);
  const nextSunrise = sunset
    ? searchSunEvent(1, observer, new Date(sunset.getTime() + 60_000), 2)
    : null;

  const previousSearchStart = new Date(dayStart.getTime() - 36 * 60 * 60 * 1000);
  const previousSunrise = searchSunEvent(1, observer, previousSearchStart, 2);
  const previousSunset = previousSunrise
    ? searchSunEvent(-1, observer, new Date(previousSunrise.getTime() + 60_000), 2)
    : null;

  if (sunrise && sunset && nextSunrise && previousSunrise && previousSunset) {
    return { sunrise, sunset, nextSunrise, previousSunrise, previousSunset, isFallback: false };
  }

  const fallbackSunrise = createDateInTimezone(dateKey, '06:00', timezone);
  const fallbackSunset = createDateInTimezone(dateKey, '18:00', timezone);
  const nextDate = new Date(fallbackSunrise);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const previousDate = new Date(fallbackSunrise);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);

  return {
    sunrise: fallbackSunrise,
    sunset: fallbackSunset,
    nextSunrise: nextDate,
    previousSunrise: previousDate,
    previousSunset: new Date(fallbackSunset.getTime() - 24 * 60 * 60 * 1000),
    isFallback: true
  };
}

export function calculatePlanetaryHour(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): PlanetaryHourInfo {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new Error('Для расчёта планетарного часа нужна корректная дата');
  }
  validatePlanetaryHourInput(latitude, longitude, timezone);

  const { sunrise, sunset, nextSunrise, previousSunrise, previousSunset, isFallback } = getLocalDayBounds(
    date,
    latitude,
    longitude,
    timezone
  );

  let periodStart: Date;
  let periodEnd: Date;
  let dayRuler: string;
  let offsetBase: number;
  let isDaytime: boolean;
  let currentSunrise = sunrise;
  let currentSunset = sunset;
  let currentNextSunrise = nextSunrise;

  if (date >= sunrise && date < sunset) {
    periodStart = sunrise;
    periodEnd = sunset;
    dayRuler = DAY_RULERS[getWeekdayIndex(sunrise, timezone)];
    offsetBase = 0;
    isDaytime = true;
  } else if (date >= sunset) {
    periodStart = sunset;
    periodEnd = nextSunrise;
    dayRuler = DAY_RULERS[getWeekdayIndex(sunrise, timezone)];
    offsetBase = 12;
    isDaytime = false;
  } else {
    periodStart = previousSunset;
    periodEnd = sunrise;
    dayRuler = DAY_RULERS[getWeekdayIndex(previousSunrise, timezone)];
    offsetBase = 12;
    isDaytime = false;
    currentSunrise = previousSunrise;
    currentSunset = previousSunset;
    currentNextSunrise = sunrise;
  }

  const hourLength = (periodEnd.getTime() - periodStart.getTime()) / 12;
  const hourInPeriod = Math.max(
    0,
    Math.min(11, Math.floor((date.getTime() - periodStart.getTime()) / hourLength))
  );
  const hourNumber = offsetBase + hourInPeriod + 1;
  const start = new Date(periodStart.getTime() + hourInPeriod * hourLength);
  const end = new Date(periodStart.getTime() + (hourInPeriod + 1) * hourLength);
  const rulerIndex = CHALDEAN_ORDER.indexOf(dayRuler as typeof CHALDEAN_ORDER[number]);
  const planet = CHALDEAN_ORDER[(rulerIndex + offsetBase + hourInPeriod) % CHALDEAN_ORDER.length];

  return {
    planet,
    start,
    end,
    isDaytime,
    hourNumber,
    sunrise: currentSunrise,
    sunset: currentSunset,
    nextSunrise: currentNextSunrise,
    isFallback
  };
}

export function calculatePlanetaryHoursForDay(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): PlanetaryHourInfo[] {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new Error('Для расчёта планетарных часов нужна корректная дата');
  }
  validatePlanetaryHourInput(latitude, longitude, timezone);

  const { sunrise, sunset, nextSunrise, isFallback } = getLocalDayBounds(date, latitude, longitude, timezone);
  const dayRuler = DAY_RULERS[getWeekdayIndex(sunrise, timezone)];
  const rulerIndex = CHALDEAN_ORDER.indexOf(dayRuler as typeof CHALDEAN_ORDER[number]);
  const dayLength = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightLength = (nextSunrise.getTime() - sunset.getTime()) / 12;
  const hours: PlanetaryHourInfo[] = [];

  for (let i = 0; i < 24; i++) {
    const isDaytime = i < 12;
    const hourInPeriod = isDaytime ? i : i - 12;
    const periodStart = isDaytime ? sunrise : sunset;
    const hourLength = isDaytime ? dayLength : nightLength;
    const start = new Date(periodStart.getTime() + hourInPeriod * hourLength);
    const end = new Date(periodStart.getTime() + (hourInPeriod + 1) * hourLength);
    const planet = CHALDEAN_ORDER[(rulerIndex + i) % CHALDEAN_ORDER.length];

    hours.push({
      planet,
      start,
      end,
      isDaytime,
      hourNumber: i + 1,
      sunrise,
      sunset,
      nextSunrise,
      isFallback
    });
  }

  return hours;
}

export function calculateFavorableTimeWindows(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): FavorableTimeWindow[] {
  const hours = calculatePlanetaryHoursForDay(date, latitude, longitude, timezone);
  const favorablePlanets: Record<string, { quality: FavorableTimeWindow['quality']; description: string }> = {
    Jupiter: { quality: 'Традиционный ориентир', description: 'В традиции планетарных часов Юпитер символически связывают с обучением, наставничеством и расширением кругозора.' },
    Venus: { quality: 'Традиционный ориентир', description: 'В традиции планетарных часов Венеру символически связывают с отношениями, красотой и согласованием интересов.' },
    Mercury: { quality: 'Дополнительный ориентир', description: 'В традиции планетарных часов Меркурий символически связывают с общением, документами, планированием и обучением.' },
    Moon: { quality: 'Мягкий ориентир', description: 'В традиции планетарных часов Луну символически связывают с заботой, отдыхом, семейными делами и эмоциональным контактом.' }
  };

  return hours
    .filter(hour => favorablePlanets[hour.planet])
    .filter(hour => hour.end > date || formatDateKey(hour.start, timezone) === formatDateKey(date, timezone))
    .slice(0, 4)
    .map(hour => {
      const info = favorablePlanets[hour.planet];
      return {
        label: `${formatTime(hour.start, timezone)} - ${formatTime(hour.end, timezone)}`,
        planet: hour.planet,
        quality: info.quality,
        description: info.description,
        start: hour.start,
        end: hour.end
      };
    });
}
