// [УТИЛИТА] Расчёт астрологических прогнозов для календаря
import { calculateNatalChart, NatalChart } from './astrology';
import { calculateTransitAspects } from './aspectCalculations';
import { calculateFavorableTimeWindows, calculatePlanetaryHour } from './planetaryHours';
import { calculatePanchang } from './panchang';
import { getEnergyColor, getEnergyLabel } from './energyUtils';
import { generatePersonalRecommendations } from './personalRecommendations';
import { UserProfile } from './storage';
import { DayForecast, saveForecast, getForecast } from './indexedDB';
import { formatDateKey } from './dateUtils';
import { createDateInTimezone } from './timezones';

export const FORECAST_CALC_VERSION = 'personalized-v4';

interface ForecastCalculationContext {
  natalChart: NatalChart;
  currentLat: number;
  currentLon: number;
  currentTimezone: string;
}

function stableHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36);
}

export function getForecastProfileKey(profile: UserProfile): string {
  return stableHash(JSON.stringify({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthPlace: profile.birthPlace,
    latitude: Number(profile.latitude.toFixed(4)),
    longitude: Number(profile.longitude.toFixed(4)),
    timezone: profile.timezone,
    timeUncertainty: profile.timeUncertainty ?? 0,
    timezoneAccuracy: profile.timezoneAccuracy ?? 'manual',
    currentLocation: profile.currentLocation ? {
      latitude: Number(profile.currentLocation.latitude.toFixed(4)),
      longitude: Number(profile.currentLocation.longitude.toFixed(4)),
      timezone: profile.currentLocation.timezone,
      timezoneAccuracy: profile.currentLocation.timezoneAccuracy ?? 'manual'
    } : null,
    calcVersion: FORECAST_CALC_VERSION
  }));
}

function prepareForecastContext(profile: UserProfile): ForecastCalculationContext {
  const currentLat = profile.currentLocation?.latitude ?? profile.latitude;
  const currentLon = profile.currentLocation?.longitude ?? profile.longitude;
  const currentTimezone = profile.currentLocation?.timezone ?? profile.timezone;
  const birthMoment = createDateInTimezone(profile.birthDate, profile.birthTime, profile.timezone);
  return { natalChart: calculateNatalChart(birthMoment, profile.latitude, profile.longitude), currentLat, currentLon, currentTimezone };
}

export async function calculateDayForecast(date: Date, profile: UserProfile, preparedContext?: ForecastCalculationContext): Promise<DayForecast> {
  const context = preparedContext ?? prepareForecastContext(profile);
  const { natalChart, currentLat, currentLon, currentTimezone } = context;
  const dateKey = formatDateKey(date);
  const forecastMoment = createDateInTimezone(dateKey, '12:00', currentTimezone);
  const transitChart = calculateNatalChart(forecastMoment, currentLat, currentLon);
  const aspects = calculateTransitAspects(natalChart, transitChart);
  const panchang = calculatePanchang(forecastMoment, { timezone: currentTimezone });
  const planetaryHour = calculatePlanetaryHour(forecastMoment, currentLat, currentLon, currentTimezone);
  const personalRecommendation = generatePersonalRecommendations({ profile, date: forecastMoment, natalChart, currentChart: transitChart, aspects, panchang, planetaryHour });
  const energyLevel = personalRecommendation.energyLevel;
  const color = getEnergyColor(energyLevel);
  const label = getEnergyLabel(energyLevel);
  let icon = '✨';
  if (panchang.tithi.index === 14) icon = '🌕';
  else if (panchang.tithi.index === 29) icon = '🌑';
  else if (panchang.tithi.index === 10 || panchang.tithi.index === 25) icon = '🙏';
  else if (energyLevel >= 70) icon = '🔥';
  else if (energyLevel < 40) icon = '🌙';
  let warning: string | undefined;
  if (['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата', 'Вайдхрити'].includes(panchang.yoga.name)) warning = `${panchang.yoga.name} — будьте осторожны`;
  const favorableHours = calculateFavorableTimeWindows(forecastMoment, currentLat, currentLon, currentTimezone).map(window => `${window.label} — ${window.planet}`);
  return { date: dateKey, profileKey: getForecastProfileKey(profile), calcVersion: FORECAST_CALC_VERSION, energyLevel, moonSign: transitChart.planets.Moon.signName, tithi: panchang.tithi.name, yoga: panchang.yoga.name, planetaryHour: `${planetaryHour.planet}: ${planetaryHour.isDaytime ? 'дневной' : 'ночной'} час`, topRecommendation: personalRecommendation.mainRecommendation, avoidRecommendation: personalRecommendation.avoidRecommendation, reasoning: personalRecommendation.reasoning, bestAreas: personalRecommendation.bestAreas, microUpaya: personalRecommendation.microUpaya.title, precisionNotes: personalRecommendation.precision.notes, warning, favorableHours, color, icon, label, timestamp: Date.now() };
}

export async function precalculateForecasts(
  profile: UserProfile,
  daysBack = 30,
  daysForward = 30,
  onProgress?: (current: number, total: number) => void,
  shouldCancel?: () => boolean,
): Promise<void> {
  const today = new Date();
  const total = daysBack + daysForward + 1;
  const profileKey = getForecastProfileKey(profile);
  const context = prepareForecastContext(profile);
  for (let i = -daysBack; i <= daysForward; i++) {
    if (shouldCancel?.()) return;
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = formatDateKey(date);
    const cached = await getForecast(dateStr, profileKey, FORECAST_CALC_VERSION);
    if (shouldCancel?.()) return;
    if (!cached) {
      try {
        const forecast = await calculateDayForecast(date, profile, context);
        if (shouldCancel?.()) return;
        await saveForecast(forecast);
      } catch (error) {
        console.error(`Ошибка расчёта прогноза для ${dateStr}:`, error);
      }
    }
    onProgress?.(i + daysBack + 1, total);
  }
}

export async function getOrCalculateForecast(date: Date, profile: UserProfile): Promise<DayForecast> {
  const dateStr = formatDateKey(date);
  const profileKey = getForecastProfileKey(profile);
  const cached = await getForecast(dateStr, profileKey, FORECAST_CALC_VERSION);
  if (cached) return cached;
  const forecast = await calculateDayForecast(date, profile);
  await saveForecast(forecast);
  return forecast;
}
