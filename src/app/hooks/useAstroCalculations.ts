// [ХУК] Централизованные астрологические расчёты с обработкой ошибок
import { useState, useEffect } from 'react';
import {
  calculateNatalChart,
  NatalChart,
  Aspect
} from '../utils/astrology';
import { calculateTransitAspects } from '../utils/aspectCalculations';
import { calculateFavorableTimeWindows, calculatePlanetaryHour, PlanetaryHourInfo } from '../utils/planetaryHours';
import { calculatePanchang, PanchangData } from '../utils/panchang';
import { UserProfile } from '../utils/storage';
import { createDateInTimezone } from '../utils/timezones';

interface UseAstroCalculationsResult {
  natalChart: NatalChart | null;
  currentChart: NatalChart | null;
  aspects: Aspect[];
  panchang: PanchangData | null;
  planetaryHour: string;
  planetaryHourInfo: PlanetaryHourInfo | null;
  favorableWindows: string[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useAstroCalculations(profile: UserProfile): UseAstroCalculationsResult {
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [currentChart, setCurrentChart] = useState<NatalChart | null>(null);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [panchang, setPanchang] = useState<PanchangData | null>(null);
  const [planetaryHour, setPlanetaryHour] = useState<string>('Sun');
  const [planetaryHourInfo, setPlanetaryHourInfo] = useState<PlanetaryHourInfo | null>(null);
  const [favorableWindows, setFavorableWindows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculate = (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Валидация профиля
      if (!profile.birthDate || !profile.birthTime) {
        throw new Error('Не указаны дата или время рождения');
      }

      if (!Number.isFinite(profile.latitude) || !Number.isFinite(profile.longitude)) {
        throw new Error('Не указаны координаты места рождения');
      }

      const currentDate = new Date();
      const birthDate = createDateInTimezone(profile.birthDate, profile.birthTime, profile.timezone);

      // Проверка валидности даты
      if (isNaN(birthDate.getTime())) {
        throw new Error('Неверный формат даты или времени рождения');
      }

      // Проверка валидности координат
      if (
        profile.latitude < -90 ||
        profile.latitude > 90 ||
        profile.longitude < -180 ||
        profile.longitude > 180
      ) {
        throw new Error('Неверные координаты (широта: -90..90, долгота: -180..180)');
      }

      // [ВАЖНО] Используем текущее местоположение для дневных расчётов
      // Если не установлено - фолбэк на место рождения
      const currentLat = profile.currentLocation?.latitude ?? profile.latitude;
      const currentLon = profile.currentLocation?.longitude ?? profile.longitude;
      const currentTimezone = profile.currentLocation?.timezone ?? profile.timezone;

      // Проверка валидности координат текущего местоположения
      if (
        currentLat < -90 ||
        currentLat > 90 ||
        currentLon < -180 ||
        currentLon > 180
      ) {
        throw new Error('Неверные координаты текущего местоположения');
      }

      // [ВАЖНО] Натальная карта ВСЕГДА рассчитывается по месту рождения (не меняется при смене города)
      let natal: NatalChart;
      try {
        natal = calculateNatalChart(birthDate, profile.latitude, profile.longitude);
      } catch (err) {
        throw new Error(`Ошибка расчёта натальной карты: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
      }

      // [ВАЖНО] Транзиты рассчитываются для ТЕКУЩЕГО местоположения (меняются при смене города)
      let current: NatalChart;
      try {
        current = calculateNatalChart(currentDate, currentLat, currentLon);
      } catch (err) {
        throw new Error(`Ошибка расчёта текущего положения планет: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
      }

      let asp: Aspect[] = [];
      try {
        asp = calculateTransitAspects(natal, current);
      } catch (err) {
        console.warn('Ошибка расчёта аспектов:', err);
        asp = []; // Аспекты опциональны, продолжаем без них
      }

      let panch: PanchangData;
      try {
        panch = calculatePanchang(currentDate, { timezone: currentTimezone });
      } catch (err) {
        throw new Error(`Ошибка расчёта панчанга: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
      }

      let hour = 'Sun';
      let hourInfo: PlanetaryHourInfo | null = null;
      try {
        hourInfo = calculatePlanetaryHour(currentDate, currentLat, currentLon, currentTimezone);
        hour = hourInfo.planet;
      } catch (err) {
        console.warn('Ошибка определения планетарного часа:', err);
        hour = 'Sun'; // Дефолтное значение
      }

      let windows: string[] = [];
      try {
        windows = calculateFavorableTimeWindows(currentDate, currentLat, currentLon, currentTimezone)
          .slice(0, 3)
          .map(window => `${window.label} — ${window.planet}`);
      } catch (err) {
        console.warn('Ошибка расчёта благоприятных окон:', err);
        windows = [];
      }

      setNatalChart(natal);
      setCurrentChart(current);
      setAspects(asp);
      setPanchang(panch);
      setPlanetaryHour(hour);
      setPlanetaryHourInfo(hourInfo);
      setFavorableWindows(windows);
      setError(null);
    } catch (err) {
      console.error('Ошибка астрологических расчётов:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка при расчёте данных');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    calculate(true);
    const interval = window.setInterval(() => calculate(false), 60_000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return {
    natalChart,
    currentChart,
    aspects,
    panchang,
    planetaryHour,
    planetaryHourInfo,
    favorableWindows,
    isLoading,
    error,
    retry: () => calculate(true)
  };
}
