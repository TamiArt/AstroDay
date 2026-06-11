// [УТИЛИТА] Расчёт астрологических прогнозов для календаря
import { calculateNatalChart } from './astrology';
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

/**
 * Выбрать наиболее релевантную область для отображения в календаре
 */
function selectBestAreaForCalendar(
  bestAreas: string[],
  energyLevel: number,
  tithi: string
): string {
  if (!bestAreas || bestAreas.length === 0) {
    return 'Наблюдение';
  }

  // Приоритеты для разных типов дней
  if (energyLevel >= 75) {
    // Для высокоэнергичных дней показываем действие/активность
    if (bestAreas.includes('Активные действия')) return 'Активные действия';
    if (bestAreas.includes('Карьера')) return 'Карьера';
    if (bestAreas.includes('Рост')) return 'Рост';
  }

  if (energyLevel <= 40) {
    // Для низкоэнергичных дней показываем восстановление
    if (bestAreas.includes('Восстановление')) return 'Восстановление';
    if (bestAreas.includes('Дом')) return 'Дом';
    if (bestAreas.includes('Духовность')) return 'Духовность';
  }

  // Для Полнолуния - завершение
  if (tithi.includes('Полнолуние') || tithi.includes('14')) {
    if (bestAreas.includes('Завершение')) return 'Завершение';
    if (bestAreas.includes('Личные темы карты')) return 'Личные темы карты';
  }

  // Для Новолуния - новые начинания
  if (tithi.includes('Новолуние') || tithi.includes('29')) {
    if (bestAreas.includes('Рост')) return 'Рост';
    if (bestAreas.includes('Новые возможности')) return 'Новые возможности';
  }

  // Приоритеты по умолчанию (предпочитаем более специфичные области)
  const priorityOrder = [
    'Личные темы карты',
    'Карьера',
    'Отношения',
    'Творчество',
    'Практики и обучение',
    'Дисциплина',
    'Финансы',
    'Рост',
    'Дом',
    'Семья',
    'Активные действия',
    'Восстановление',
    'Общение',
    'Обучение'
  ];

  for (const priority of priorityOrder) {
    if (bestAreas.includes(priority)) {
      return priority;
    }
  }

  // Если ничего не подходит, берем первую доступную
  return bestAreas[0] || 'Наблюдение';
}

function stableHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
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
    currentLocation: profile.currentLocation
      ? {
          latitude: Number(profile.currentLocation.latitude.toFixed(4)),
          longitude: Number(profile.currentLocation.longitude.toFixed(4)),
          timezone: profile.currentLocation.timezone,
          timezoneAccuracy: profile.currentLocation.timezoneAccuracy ?? 'manual'
        }
      : null,
    calcVersion: FORECAST_CALC_VERSION
  }));
}

/**
 * Рассчитать прогноз для конкретного дня
 */
export async function calculateDayForecast(
  date: Date,
  profile: UserProfile
): Promise<DayForecast> {
  // Используем текущее местоположение для транзитов (или место рождения как фолбэк)
  const currentLat = profile.currentLocation?.latitude ?? profile.latitude;
  const currentLon = profile.currentLocation?.longitude ?? profile.longitude;
  const currentTimezone = profile.currentLocation?.timezone ?? profile.timezone;
  const dateKey = formatDateKey(date);
  const forecastMoment = createDateInTimezone(dateKey, '12:00', currentTimezone);
  const birthMoment = createDateInTimezone(profile.birthDate, profile.birthTime, profile.timezone);

  const natalChart = calculateNatalChart(birthMoment, profile.latitude, profile.longitude);
  // Транзиты для выбранного дня считаем на локальный полдень,
  // чтобы карточка дня не зависела от часового пояса браузера.
  const transitChart = calculateNatalChart(forecastMoment, currentLat, currentLon);
  const aspects = calculateTransitAspects(natalChart, transitChart);

  // Панчанг для выбранной даты
  const panchang = calculatePanchang(forecastMoment, { timezone: currentTimezone });
  const planetaryHour = calculatePlanetaryHour(forecastMoment, currentLat, currentLon, currentTimezone);

  const personalRecommendation = generatePersonalRecommendations({
    profile,
    date: forecastMoment,
    natalChart,
    currentChart: transitChart,
    aspects,
    panchang,
    planetaryHour,
  });
  const energyLevel = personalRecommendation.energyLevel;
  const color = getEnergyColor(energyLevel);
  const label = getEnergyLabel(energyLevel);

  // Иконка в зависимости от уровня энергии и титхи
  let icon = '✨';
  if (panchang.tithi.index === 14) icon = '🌕'; // Полнолуние
  else if (panchang.tithi.index === 29) icon = '🌑'; // Новолуние
  else if (panchang.tithi.index === 10 || panchang.tithi.index === 25) icon = '🙏'; // Экадаши
  else if (energyLevel >= 70) icon = '🔥';
  else if (energyLevel < 40) icon = '🌙';

  // Предупреждение (если есть сложные йоги)
  let warning: string | undefined;
  const difficultYogas = ['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата', 'Вайдхрити'];
  if (difficultYogas.includes(panchang.yoga.name)) {
    warning = `${panchang.yoga.name} — будьте осторожны`;
  }

  const favorableHours = calculateFavorableTimeWindows(
    forecastMoment,
    currentLat,
    currentLon,
    currentTimezone
  ).map(window => `${window.label} — ${window.planet}`);

  const forecast: DayForecast = {
    date: dateKey,
    profileKey: getForecastProfileKey(profile),
    calcVersion: FORECAST_CALC_VERSION,
    energyLevel,
    moonSign: transitChart.planets.Moon.signName,
    tithi: panchang.tithi.name,
    yoga: panchang.yoga.name,
    planetaryHour: `${planetaryHour.planet}: ${planetaryHour.isDaytime ? 'дневной' : 'ночной'} час`,
    topRecommendation: personalRecommendation.mainRecommendation,
    avoidRecommendation: personalRecommendation.avoidRecommendation,
    reasoning: personalRecommendation.reasoning,
    bestAreas: personalRecommendation.bestAreas,
    microUpaya: personalRecommendation.microUpaya.title,
    precisionNotes: personalRecommendation.precision.notes,
    warning,
    favorableHours,
    color,
    icon,
    label,
    timestamp: Date.now()
  };

  return forecast;
}

/**
 * Предвычислить прогнозы для диапазона дат и сохранить в IndexedDB
 */
export async function precalculateForecasts(
  profile: UserProfile,
  daysBack: number = 30,
  daysForward: number = 30,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const today = new Date();
  const total = daysBack + daysForward + 1;

  for (let i = -daysBack; i <= daysForward; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Проверяем, есть ли уже прогноз в кэше
    const dateStr = formatDateKey(date);
    const cached = await getForecast(dateStr);
    const profileKey = getForecastProfileKey(profile);

    if (!cached || cached.profileKey !== profileKey || cached.calcVersion !== FORECAST_CALC_VERSION) {
      // Рассчитываем новый прогноз
      try {
        const forecast = await calculateDayForecast(date, profile);
        await saveForecast(forecast);
      } catch (error) {
        console.error(`Ошибка расчёта прогноза для ${dateStr}:`, error);
      }
    }

    // Обновляем прогресс
    if (onProgress) {
      onProgress(i + daysBack + 1, total);
    }
  }

}

/**
 * Получить или рассчитать прогноз для даты
 */
export async function getOrCalculateForecast(
  date: Date,
  profile: UserProfile
): Promise<DayForecast> {
  const dateStr = formatDateKey(date);

  // Проверяем кэш
  const cached = await getForecast(dateStr);
  const profileKey = getForecastProfileKey(profile);
  if (cached && cached.profileKey === profileKey && cached.calcVersion === FORECAST_CALC_VERSION) {
    return cached;
  }

  // Рассчитываем новый
  const forecast = await calculateDayForecast(date, profile);
  await saveForecast(forecast);
  return forecast;
}
