/**
 * Vedic Astrology Calculations Module
 * Free and open-source implementation using astronomy-engine
 */

import * as Astronomy from 'astronomy-engine';
import { calculateAdditionalVargas, type AdditionalVargas } from './divisionalCharts';

// Ayanamsha Lahiri constant for sidereal zodiac (2000.0 epoch)
const AYANAMSHA_LAHIRI_2000 = 23.85;
const AYANAMSHA_RATE = 0.0135; // degrees per year
const DEG_TO_RAD = Math.PI / 180;
const FULL_CIRCLE = 360;

// Calculate current ayanamsha
export function getAyanamsha(date: Date): number {
  const year = date.getFullYear() + (date.getMonth() / 12);
  const yearsSince2000 = year - 2000;
  return AYANAMSHA_LAHIRI_2000 + (AYANAMSHA_RATE * yearsSince2000);
}

// Convert tropical longitude to sidereal
export function tropicalToSidereal(tropicalLon: number, date: Date): number {
  const ayanamsha = getAyanamsha(date);
  return normalizeDegrees(tropicalLon - ayanamsha);
}

function normalizeDegrees(value: number): number {
  return ((value % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
}

function getMeanObliquity(date: Date): number {
  const astroTime = Astronomy.MakeTime(date);
  const t = (astroTime.ut - 2451545.0) / 36525.0;
  const seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813));
  return 23 + (26 / 60) + (seconds / 3600);
}

function getEclipticEquatorial(longitude: number, obliquity: number) {
  const lon = longitude * DEG_TO_RAD;
  const eps = obliquity * DEG_TO_RAD;
  const x = Math.cos(lon);
  const y = Math.sin(lon) * Math.cos(eps);
  const z = Math.sin(lon) * Math.sin(eps);

  return {
    rightAscension: Math.atan2(y, x),
    declination: Math.asin(z)
  };
}

function getAltitudeForEclipticLongitude(
  longitude: number,
  localSiderealDegrees: number,
  latitude: number,
  obliquity: number
): number {
  const { rightAscension, declination } = getEclipticEquatorial(longitude, obliquity);
  const lat = latitude * DEG_TO_RAD;
  const hourAngle = localSiderealDegrees * DEG_TO_RAD - rightAscension;
  return (
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
  );
}

function refineHorizonRoot(
  startLongitude: number,
  endLongitude: number,
  localSiderealDegrees: number,
  latitude: number,
  obliquity: number
): number {
  let start = startLongitude;
  let end = endLongitude;
  let startAltitude = getAltitudeForEclipticLongitude(start, localSiderealDegrees, latitude, obliquity);

  for (let i = 0; i < 40; i++) {
    const mid = (start + end) / 2;
    const midAltitude = getAltitudeForEclipticLongitude(mid, localSiderealDegrees, latitude, obliquity);

    if (Math.sign(startAltitude) === Math.sign(midAltitude)) {
      start = mid;
      startAltitude = midAltitude;
    } else {
      end = mid;
    }
  }

  return normalizeDegrees((start + end) / 2);
}

function calculateTropicalAscendant(date: Date, latitude: number, longitude: number): number {
  const siderealTimeHours = Astronomy.SiderealTime(date);
  const localSiderealDegrees = normalizeDegrees((siderealTimeHours * 15) + longitude);
  const obliquity = getMeanObliquity(date);
  const roots: number[] = [];
  const step = 2;
  let previousLongitude = 0;
  let previousAltitude = getAltitudeForEclipticLongitude(0, localSiderealDegrees, latitude, obliquity);

  for (let currentLongitude = step; currentLongitude <= FULL_CIRCLE; currentLongitude += step) {
    const normalizedLongitude = currentLongitude === FULL_CIRCLE ? FULL_CIRCLE : currentLongitude;
    const currentAltitude = getAltitudeForEclipticLongitude(
      normalizedLongitude === FULL_CIRCLE ? 0 : normalizedLongitude,
      localSiderealDegrees,
      latitude,
      obliquity
    );

    if (previousAltitude === 0 || Math.sign(previousAltitude) !== Math.sign(currentAltitude)) {
      roots.push(refineHorizonRoot(
        previousLongitude,
        normalizedLongitude,
        localSiderealDegrees,
        latitude,
        obliquity
      ));
    }

    previousLongitude = normalizedLongitude;
    previousAltitude = currentAltitude;
  }

  const risingRoot = roots.find(root => {
    const nowAltitude = getAltitudeForEclipticLongitude(root, localSiderealDegrees, latitude, obliquity);
    const nextAltitude = getAltitudeForEclipticLongitude(root, localSiderealDegrees + 0.01, latitude, obliquity);
    return nextAltitude > nowAltitude;
  });

  if (risingRoot === undefined) {
    throw new Error('Не удалось найти восточную точку пересечения эклиптики и горизонта');
  }

  return risingRoot;
}

// Zodiac signs
export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const SIGNS_RU = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
  'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

// Nakshatras (27 lunar mansions)
export const NAKSHATRAS = [
  { name: 'Ashwini', deity: 'Ashwini Kumaras', lord: 'Ketu' },
  { name: 'Bharani', deity: 'Yama', lord: 'Venus' },
  { name: 'Krittika', deity: 'Agni', lord: 'Sun' },
  { name: 'Rohini', deity: 'Brahma', lord: 'Moon' },
  { name: 'Mrigashira', deity: 'Soma', lord: 'Mars' },
  { name: 'Ardra', deity: 'Rudra', lord: 'Rahu' },
  { name: 'Punarvasu', deity: 'Aditi', lord: 'Jupiter' },
  { name: 'Pushya', deity: 'Brihaspati', lord: 'Saturn' },
  { name: 'Ashlesha', deity: 'Nagas', lord: 'Mercury' },
  { name: 'Magha', deity: 'Pitris', lord: 'Ketu' },
  { name: 'Purva Phalguni', deity: 'Bhaga', lord: 'Venus' },
  { name: 'Uttara Phalguni', deity: 'Aryaman', lord: 'Sun' },
  { name: 'Hasta', deity: 'Savitar', lord: 'Moon' },
  { name: 'Chitra', deity: 'Vishwakarma', lord: 'Mars' },
  { name: 'Swati', deity: 'Vayu', lord: 'Rahu' },
  { name: 'Vishakha', deity: 'Indra-Agni', lord: 'Jupiter' },
  { name: 'Anuradha', deity: 'Mitra', lord: 'Saturn' },
  { name: 'Jyeshtha', deity: 'Indra', lord: 'Mercury' },
  { name: 'Mula', deity: 'Nirriti', lord: 'Ketu' },
  { name: 'Purva Ashadha', deity: 'Apas', lord: 'Venus' },
  { name: 'Uttara Ashadha', deity: 'Vishvadevas', lord: 'Sun' },
  { name: 'Shravana', deity: 'Vishnu', lord: 'Moon' },
  { name: 'Dhanishta', deity: 'Vasus', lord: 'Mars' },
  { name: 'Shatabhisha', deity: 'Varuna', lord: 'Rahu' },
  { name: 'Purva Bhadrapada', deity: 'Aja Ekapada', lord: 'Jupiter' },
  { name: 'Uttara Bhadrapada', deity: 'Ahir Budhnya', lord: 'Saturn' },
  { name: 'Revati', deity: 'Pushan', lord: 'Mercury' }
];

// Get sign from longitude
export function getSign(longitude: number): number {
  return Math.floor(longitude / 30);
}

// Get nakshatra from longitude
export function getNakshatra(longitude: number): number {
  return Math.floor(longitude / 13.333333);
}

// Calculate planetary position
export interface PlanetPosition {
  name: string;
  tropicalLon: number;
  siderealLon: number;
  sign: number;
  signName: string;
  degree: number;
  nakshatra: number;
  nakshatraName: string;
  pada: number;
  vargas: AdditionalVargas;
}

export type PlanetName = keyof NatalChart['planets'];

export function calculatePlanetPosition(
  bodyName: string,
  date: Date
): PlanetPosition {
  // [ИСПРАВЛЕНО] Добавлена специальная обработка для Солнца и других тел
  try {
    // Валидация даты
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error(`Некорректная дата: ${date}`);
    }

    let tropicalLon: number;

    // Солнце требует специального метода (геоцентрическая позиция)
    if (bodyName === 'Sun') {
      try {
        const sunPos = Astronomy.SunPosition(date);
        tropicalLon = sunPos.elon; // ecliptic longitude
      } catch (err) {
        console.error('SunPosition error:', err);
        throw new Error(`API astronomy-engine вернул ошибку для Солнца: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Для других планет используем стандартный метод
      const body = bodyName as Astronomy.Body;
      try {
        tropicalLon = Astronomy.EclipticLongitude(body, date);
      } catch (err) {
        console.error(`EclipticLongitude error for ${bodyName}:`, err);
        throw new Error(`API astronomy-engine вернул ошибку для ${bodyName}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (typeof tropicalLon !== 'number' || isNaN(tropicalLon)) {
      throw new Error(`Некорректная долгота для планеты ${bodyName}: ${tropicalLon}`);
    }

    const siderealLon = tropicalToSidereal(tropicalLon, date);

    const sign = getSign(siderealLon);
    const degree = siderealLon % 30;
    const nakshatra = getNakshatra(siderealLon);
    const pada = Math.floor((siderealLon % 13.333333) / 3.333333) + 1;

    return {
      name: bodyName,
      tropicalLon,
      siderealLon,
      sign,
      signName: SIGNS[sign],
      degree,
      nakshatra,
      nakshatraName: NAKSHATRAS[nakshatra]?.name || '',
      pada,
      vargas: calculateAdditionalVargas(siderealLon)
    };
  } catch (error) {
    console.error(`calculatePlanetPosition error for ${bodyName}:`, error);
    throw new Error(`Ошибка расчёта позиции планеты ${bodyName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Calculate ascendant (Lagna)
export function calculateAscendant(
  date: Date,
  latitude: number,
  longitude: number
): PlanetPosition {
  // [ИСПРАВЛЕНО] Добавлена обработка ошибок
  try {
    // Валидация входных данных
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error(`Некорректная дата: ${date}`);
    }

    if (typeof latitude !== 'number' || isNaN(latitude)) {
      throw new Error(`Некорректная широта: ${latitude}`);
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      throw new Error(`Некорректная долгота: ${longitude}`);
    }

    const tropicalAsc = calculateTropicalAscendant(date, latitude, longitude);
    const siderealAsc = tropicalToSidereal(tropicalAsc, date);
    const sign = getSign(siderealAsc);
    const degree = siderealAsc % 30;
    const nakshatra = getNakshatra(siderealAsc);
    const pada = Math.floor((siderealAsc % 13.333333) / 3.333333) + 1;

    return {
      name: 'Ascendant',
      tropicalLon: tropicalAsc,
      siderealLon: siderealAsc,
      sign,
      signName: SIGNS[sign],
      degree,
      nakshatra,
      nakshatraName: NAKSHATRAS[nakshatra]?.name || '',
      pada,
      vargas: calculateAdditionalVargas(siderealAsc)
    };
  } catch (error) {
    console.error('calculateAscendant error:', error);
    throw new Error(`Ошибка расчёта асцендента: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function createCalculatedPoint(name: string, tropicalLon: number, siderealLon: number): PlanetPosition {
  const sign = getSign(siderealLon);
  const degree = siderealLon % 30;
  const nakshatra = getNakshatra(siderealLon);
  const pada = Math.floor((siderealLon % (360 / 27)) / (360 / 108)) + 1;

  return {
    name,
    tropicalLon,
    siderealLon,
    sign,
    signName: SIGNS[sign],
    degree,
    nakshatra,
    nakshatraName: NAKSHATRAS[nakshatra]?.name || '',
    pada,
    vargas: calculateAdditionalVargas(siderealLon)
  };
}

// House cusp interface
export interface HouseCusp {
  house: number; // 1-12
  cusp: number; // Degrees (0-360)
  sign: number; // Zodiac sign (0-11)
  signName: string; // Name of sign
  lord: string; // Ruling planet of the sign
}

/**
 * Get the ruling planet (lord) of a zodiac sign
 */
function getSignLord(signIndex: number): string {
  const lords = [
    'Mars',     // 0 - Aries
    'Venus',    // 1 - Taurus
    'Mercury',  // 2 - Gemini
    'Moon',     // 3 - Cancer
    'Sun',      // 4 - Leo
    'Mercury',  // 5 - Virgo
    'Venus',    // 6 - Libra
    'Mars',     // 7 - Scorpio
    'Jupiter',  // 8 - Sagittarius
    'Saturn',   // 9 - Capricorn
    'Saturn',   // 10 - Aquarius
    'Jupiter'   // 11 - Pisces
  ];
  return lords[signIndex % 12];
}

/**
 * Calculate 12 house cusps using Whole Sign house system
 * In Vedic astrology, the entire sign of the ascendant is the 1st house
 */
function calculateHouses(ascendantSign: number): HouseCusp[] {
  const houses: HouseCusp[] = [];

  for (let i = 0; i < 12; i++) {
    const signIndex = (ascendantSign + i) % 12;
    const signName = SIGNS[signIndex];
    const lord = getSignLord(signIndex);

    houses.push({
      house: i + 1,
      cusp: signIndex * 30, // Each sign is 30 degrees
      sign: signIndex,
      signName,
      lord
    });
  }

  return houses;
}

/**
 * Determine which house a planet is in based on natal chart houses
 */
export function getPlanetHouse(planetSign: number, houses: HouseCusp[]): number {
  // Find which house contains this sign
  const house = houses.find(h => h.sign === planetSign);
  return house ? house.house : 1;
}

/**
 * Get the life area associated with house numbers
 */
export function getLifeAreaHouses(): Record<string, number[]> {
  return {
    career: [6, 10, 11],        // Upachaya houses, career, profession
    relationships: [5, 7, 12],   // Romance, partnership, bed pleasures
    health: [1, 6, 8],           // Body, disease, longevity
    finances: [2, 6, 10, 11],    // Wealth, income, gains
    learning: [4, 5, 9],         // Education, intelligence, higher learning
    creativity: [3, 5, 9],       // Communication, creativity, fortune
    spirituality: [8, 9, 12],    // Transformation, dharma, moksha
    family: [2, 4, 7]            // Family, home, spouse
  };
}

/**
 * Vimshottari Dasha periods (in years)
 */
const DASHA_PERIODS: Record<string, number> = {
  'Ketu': 7,
  'Venus': 20,
  'Sun': 6,
  'Moon': 10,
  'Mars': 7,
  'Rahu': 18,
  'Jupiter': 16,
  'Saturn': 19,
  'Mercury': 17
};

// Dasha sequence order
const DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DAYS_IN_TROPICAL_YEAR = 365.2425;
const DAY_MS = 24 * 60 * 60 * 1000;
const NAKSHATRA_SIZE = 360 / 27;

export interface AntardashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
}

export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  antardasha?: AntardashaPeriod[];
}

/**
 * Calculate Vimshottari Dasha periods based on Moon nakshatra at birth
 */
export function calculateDasha(
  birthDate: Date,
  moonNakshatra: number,
  currentDate: Date = new Date(),
  moonSiderealLon?: number
): DashaPeriod {
  // Determine starting Dasha lord based on Moon nakshatra
  const dashaLordIndex = moonNakshatra % 9;
  const startingLord = DASHA_ORDER[dashaLordIndex];
  const startingBalanceRatio = getDashaBalanceRatio(moonSiderealLon);

  let currentPlanetIndex = dashaLordIndex;
  let dashaStartDate = new Date(birthDate);
  let isStartingDasha = true;

  // Iterate through Dashas to find the current one
  while (dashaStartDate <= currentDate) {
    const planet = DASHA_ORDER[currentPlanetIndex];
    const periodYears = DASHA_PERIODS[planet] * (isStartingDasha ? startingBalanceRatio : 1);
    const dashaEndDate = addFractionalYears(dashaStartDate, periodYears);

    if (currentDate >= dashaStartDate && currentDate < dashaEndDate) {
      // Found the current Mahadasha
      // Calculate Antardasha (sub-periods)
      const antardashas: DashaPeriod['antardasha'] = [];
      let antardashaStart = new Date(dashaStartDate);
      const totalDashaDays = (dashaEndDate.getTime() - dashaStartDate.getTime()) / (1000 * 60 * 60 * 24);

      for (let i = 0; i < 9; i++) {
        const antarPlanetIndex = (currentPlanetIndex + i) % 9;
        const antarPlanet = DASHA_ORDER[antarPlanetIndex];
        const antarPeriodRatio = DASHA_PERIODS[antarPlanet] / 120; // Total Dasha cycle is 120 years
        const antarDays = totalDashaDays * antarPeriodRatio;
        const antarEnd = addFractionalDays(antardashaStart, antarDays);

        antardashas.push({
          planet: antarPlanet,
          startDate: new Date(antardashaStart),
          endDate: new Date(antarEnd)
        });

        antardashaStart = new Date(antarEnd);
      }

      return {
        planet,
        startDate: dashaStartDate,
        endDate: dashaEndDate,
        isActive: true,
        antardasha: antardashas
      };
    }

    // Move to next Dasha
    dashaStartDate = new Date(dashaEndDate);
    currentPlanetIndex = (currentPlanetIndex + 1) % 9;
    isStartingDasha = false;
  }

  // Fallback (should not reach here if logic is correct)
  return {
    planet: startingLord,
    startDate: birthDate,
    endDate: addFractionalYears(birthDate, DASHA_PERIODS[startingLord] * startingBalanceRatio),
    isActive: false
  };
}

function getDashaBalanceRatio(moonSiderealLon?: number): number {
  if (typeof moonSiderealLon !== 'number' || !Number.isFinite(moonSiderealLon)) {
    return 1;
  }

  const positionInNakshatra = ((moonSiderealLon % NAKSHATRA_SIZE) + NAKSHATRA_SIZE) % NAKSHATRA_SIZE;
  const remainingRatio = (NAKSHATRA_SIZE - positionInNakshatra) / NAKSHATRA_SIZE;
  return Math.max(0.001, Math.min(1, remainingRatio));
}

function addFractionalYears(date: Date, years: number): Date {
  return addFractionalDays(date, years * DAYS_IN_TROPICAL_YEAR);
}

function addFractionalDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Get current active Antardasha from a Dasha period
 */
export function getCurrentAntardasha(dasha: DashaPeriod, currentDate: Date = new Date()): AntardashaPeriod | null {
  if (!dasha.antardasha) return null;

  for (const antar of dasha.antardasha) {
    if (currentDate >= antar.startDate && currentDate < antar.endDate) {
      return antar;
    }
  }

  return null;
}

// Calculate natal chart
export interface NatalChart {
  date: Date;
  latitude: number;
  longitude: number;
  ascendant: PlanetPosition;
  houses?: HouseCusp[]; // 12 houses (only if birth time available)
  planets: {
    Sun: PlanetPosition;
    Moon: PlanetPosition;
    Mars: PlanetPosition;
    Mercury: PlanetPosition;
    Jupiter: PlanetPosition;
    Venus: PlanetPosition;
    Saturn: PlanetPosition;
    Rahu: PlanetPosition; // North Node (Mean)
    Ketu: PlanetPosition; // South Node (always 180° from Rahu)
  };
}

export function calculateNatalChart(
  birthDate: Date,
  latitude: number,
  longitude: number
): NatalChart {
  // [ИСПРАВЛЕНО] Добавлена обработка ошибок и детальная диагностика
  try {
    // Валидация входных данных
    if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      throw new Error('Некорректная дата рождения');
    }

    if (typeof latitude !== 'number' || isNaN(latitude)) {
      throw new Error('Некорректная широта');
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      throw new Error('Некорректная долгота');
    }

    // Расчёт асцендента
    let ascendant;
    try {
      ascendant = calculateAscendant(birthDate, latitude, longitude);
    } catch (error) {
      throw new Error(`Не удалось рассчитать асцендент: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    }

    // Расчёт позиций планет
    const planets: Partial<NatalChart['planets']> = {};
    const planetNames: Array<Exclude<PlanetName, 'Rahu' | 'Ketu'>> = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

    for (const planetName of planetNames) {
      try {
        planets[planetName] = calculatePlanetPosition(planetName, birthDate);
      } catch (error) {
        throw new Error(`Не удалось рассчитать позицию ${planetName}: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
      }
    }

    // Расчёт Раху и Кету (лунные узлы)
    try {
      // Вычисляем Mean Longitude of Ascending Node (Ω) вручную
      // Формула: Ω = 125.0445479 - 1934.1362891 * T + 0.0020754 * T^2 + T^3 / 467441 - T^4 / 60616000
      // где T - время в юлианских столетиях от J2000.0

      const astroTime = Astronomy.MakeTime(birthDate);
      const jd = astroTime.ut; // Julian Day
      const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0

      // Mean Longitude of Ascending Node в градусах (тропическая)
      let meanNodeLon = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0;

      // Нормализуем к диапазону 0-360
      meanNodeLon = meanNodeLon % 360;
      if (meanNodeLon < 0) meanNodeLon += 360;

      // Раху (North Node) - используем Mean Node
      const rahuTropicalLon = meanNodeLon;
      const rahuSiderealLon = tropicalToSidereal(rahuTropicalLon, birthDate);
      planets.Rahu = createCalculatedPoint('Rahu', rahuTropicalLon, rahuSiderealLon);

      // Кету (South Node) - всегда в оппозиции к Раху (180°)
      const ketuTropicalLon = (rahuTropicalLon + 180) % 360;
      const ketuSiderealLon = (rahuSiderealLon + 180) % 360;
      planets.Ketu = createCalculatedPoint('Ketu', ketuTropicalLon, ketuSiderealLon);
    } catch (error) {
      throw new Error(`Не удалось рассчитать Раху/Кету: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    }

    // Расчёт домов (если есть асцендент)
    const houses = calculateHouses(ascendant.sign);

    return {
      date: birthDate,
      latitude,
      longitude,
      ascendant,
      houses,
      planets: {
        Sun: planets.Sun!,
        Moon: planets.Moon!,
        Mars: planets.Mars!,
        Mercury: planets.Mercury!,
        Jupiter: planets.Jupiter!,
        Venus: planets.Venus!,
        Saturn: planets.Saturn!,
        Rahu: planets.Rahu!,
        Ketu: planets.Ketu!
      }
    };
  } catch (error) {
    // Добавляем контекст к ошибке
    const message = error instanceof Error ? error.message : 'неизвестная ошибка';
    throw new Error(`Ошибка расчёта натальной карты: ${message}`);
  }
}

// Calculate aspects (Drishti)
export interface Aspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'special';
  angle: number;
  orb: number;
  strength: number;
  description: string;
  isTransit?: boolean;
  isApplying?: boolean;
  context?: 'natal' | 'transit';
}
