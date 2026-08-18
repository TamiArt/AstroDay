/**
 * Vedic Astrology Calculations Module
 * Free and open-source implementation using astronomy-engine
 */

import * as Astronomy from 'astronomy-engine';
import { calculateAdditionalVargas, type AdditionalVargas } from './divisionalCharts';
import { getLahiriAyanamsha } from './ayanamsha';

const DEG_TO_RAD = Math.PI / 180;
const FULL_CIRCLE = 360;

// Keep the public API stable while delegating the calculation to the dedicated,
// regression-tested Lahiri module.
export function getAyanamsha(date: Date): number {
  return getLahiriAyanamsha(date);
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
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error(`Некорректная дата: ${date}`);
    }

    let tropicalLon: number;

    if (bodyName === 'Sun') {
      try {
        const sunPos = Astronomy.SunPosition(date);
        tropicalLon = sunPos.elon;
      } catch (err) {
        console.error('SunPosition error:', err);
        throw new Error(`API astronomy-engine вернул ошибку для Солнца: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
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
  try {
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

export interface HouseCusp {
  house: number;
  cusp: number;
  sign: number;
  signName: string;
  lord: string;
}

function getSignLord(signIndex: number): string {
  const lords = [
    'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
    'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
  ];
  return lords[signIndex % 12];
}

function calculateHouses(ascendantSign: number): HouseCusp[] {
  const houses: HouseCusp[] = [];

  for (let i = 0; i < 12; i++) {
    const signIndex = (ascendantSign + i) % 12;
    houses.push({
      house: i + 1,
      cusp: signIndex * 30,
      sign: signIndex,
      signName: SIGNS[signIndex],
      lord: getSignLord(signIndex)
    });
  }

  return houses;
}

export function getPlanetHouse(planetSign: number, houses: HouseCusp[]): number {
  const house = houses.find(h => h.sign === planetSign);
  return house ? house.house : 1;
}

export function getLifeAreaHouses(): Record<string, number[]> {
  return {
    career: [6, 10, 11],
    relationships: [5, 7, 12],
    health: [1, 6, 8],
    finances: [2, 6, 10, 11],
    learning: [4, 5, 9],
    creativity: [3, 5, 9],
    spirituality: [8, 9, 12],
    family: [2, 4, 7]
  };
}

const DASHA_PERIODS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

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

export function calculateDasha(
  birthDate: Date,
  moonNakshatra: number,
  currentDate: Date = new Date(),
  moonSiderealLon?: number
): DashaPeriod {
  const dashaLordIndex = moonNakshatra % 9;
  const startingLord = DASHA_ORDER[dashaLordIndex];
  const startingBalanceRatio = getDashaBalanceRatio(moonSiderealLon);

  let currentPlanetIndex = dashaLordIndex;
  let dashaStartDate = new Date(birthDate);
  let isStartingDasha = true;

  while (dashaStartDate <= currentDate) {
    const planet = DASHA_ORDER[currentPlanetIndex];
    const periodYears = DASHA_PERIODS[planet] * (isStartingDasha ? startingBalanceRatio : 1);
    const dashaEndDate = addFractionalYears(dashaStartDate, periodYears);

    if (currentDate >= dashaStartDate && currentDate < dashaEndDate) {
      const antardashas: DashaPeriod['antardasha'] = [];
      let antardashaStart = new Date(dashaStartDate);
      const totalDashaDays = (dashaEndDate.getTime() - dashaStartDate.getTime()) / DAY_MS;

      for (let i = 0; i < 9; i++) {
        const antarPlanetIndex = (currentPlanetIndex + i) % 9;
        const antarPlanet = DASHA_ORDER[antarPlanetIndex];
        const antarPeriodRatio = DASHA_PERIODS[antarPlanet] / 120;
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

    dashaStartDate = new Date(dashaEndDate);
    currentPlanetIndex = (currentPlanetIndex + 1) % 9;
    isStartingDasha = false;
  }

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

export function getCurrentAntardasha(dasha: DashaPeriod, currentDate: Date = new Date()): AntardashaPeriod | null {
  if (!dasha.antardasha) return null;

  for (const antar of dasha.antardasha) {
    if (currentDate >= antar.startDate && currentDate < antar.endDate) {
      return antar;
    }
  }

  return null;
}

export interface NatalChart {
  date: Date;
  latitude: number;
  longitude: number;
  ascendant: PlanetPosition;
  houses?: HouseCusp[];
  planets: {
    Sun: PlanetPosition;
    Moon: PlanetPosition;
    Mars: PlanetPosition;
    Mercury: PlanetPosition;
    Jupiter: PlanetPosition;
    Venus: PlanetPosition;
    Saturn: PlanetPosition;
    Rahu: PlanetPosition;
    Ketu: PlanetPosition;
  };
}

export function calculateNatalChart(
  birthDate: Date,
  latitude: number,
  longitude: number
): NatalChart {
  try {
    if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      throw new Error('Некорректная дата рождения');
    }

    if (typeof latitude !== 'number' || isNaN(latitude)) {
      throw new Error('Некорректная широта');
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      throw new Error('Некорректная долгота');
    }

    let ascendant;
    try {
      ascendant = calculateAscendant(birthDate, latitude, longitude);
    } catch (error) {
      throw new Error(`Не удалось рассчитать асцендент: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    }

    const planets: Partial<NatalChart['planets']> = {};
    const planetNames: Array<Exclude<PlanetName, 'Rahu' | 'Ketu'>> = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

    for (const planetName of planetNames) {
      try {
        planets[planetName] = calculatePlanetPosition(planetName, birthDate);
      } catch (error) {
        throw new Error(`Не удалось рассчитать позицию ${planetName}: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
      }
    }

    try {
      const astroTime = Astronomy.MakeTime(birthDate);
      const jd = astroTime.ut;
      const T = (jd - 2451545.0) / 36525.0;
      let meanNodeLon = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441.0 - (T * T * T * T) / 60616000.0;

      meanNodeLon = meanNodeLon % 360;
      if (meanNodeLon < 0) meanNodeLon += 360;

      const rahuTropicalLon = meanNodeLon;
      const rahuSiderealLon = tropicalToSidereal(rahuTropicalLon, birthDate);
      planets.Rahu = createCalculatedPoint('Rahu', rahuTropicalLon, rahuSiderealLon);

      const ketuTropicalLon = (rahuTropicalLon + 180) % 360;
      const ketuSiderealLon = (rahuSiderealLon + 180) % 360;
      planets.Ketu = createCalculatedPoint('Ketu', ketuTropicalLon, ketuSiderealLon);
    } catch (error) {
      throw new Error(`Не удалось рассчитать Раху/Кету: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    }

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
    const message = error instanceof Error ? error.message : 'неизвестная ошибка';
    throw new Error(`Ошибка расчёта натальной карты: ${message}`);
  }
}

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
