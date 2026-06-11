// Расчет дробных карт (Divisional Charts / Vargas)

export interface DivisionalChart {
  division: number;
  name: string;
  sanskritName: string;
  area: string;
  planets: Record<string, {
    longitude: number;
    signName: string;
    house: number;
  }>;
  ascendant: {
    longitude: number;
    signName: string;
  };
  calculationRule: 'specific' | 'generic';
}

export interface AdditionalVargas {
  D12: number;
  D20: number;
  D24: number;
}

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Получить название знака по долготе
function getSignName(longitude: number): string {
  const signIndex = Math.floor(longitude / 30);
  return SIGN_NAMES[signIndex % 12];
}

// Расчет дробной карты методом деления
export function calculateDivisionalChart(
  natalLongitudes: Record<string, number>,
  ascendantLon: number,
  division: number,
  name: string,
  sanskritName: string,
  area: string
): DivisionalChart {
  const planets: DivisionalChart['planets'] = {};
  const calculationRule = hasSpecificVargaRule(division) ? 'specific' : 'generic';

  // Рассчитываем позиции планет в дробной карте
  Object.entries(natalLongitudes).forEach(([planetName, natLon]) => {
    const divisionalLon = calculateDivisionalLongitude(natLon, division);

    // Определяем дом относительно Асцендента дробной карты
    const divisionalAsc = calculateDivisionalLongitude(ascendantLon, division);
    const houseDeg = (divisionalLon - divisionalAsc + 360) % 360;
    const house = Math.floor(houseDeg / 30) + 1;

    planets[planetName] = {
      longitude: divisionalLon,
      signName: getSignName(divisionalLon),
      house
    };
  });

  // Рассчитываем Асцендент дробной карты
  const divisionalAscLon = calculateDivisionalLongitude(ascendantLon, division);

  return {
    division,
    name,
    sanskritName,
    area,
    planets,
    ascendant: {
      longitude: divisionalAscLon,
      signName: getSignName(divisionalAscLon)
    },
    calculationRule
  };
}

export function calculateAdditionalVargas(planetLongitude: number): AdditionalVargas {
  const degreeInSign = ((planetLongitude % 30) + 30) % 30;

  return {
    D12: Math.floor(degreeInSign / (30 / 12)) + 1,
    D20: Math.floor(degreeInSign / (30 / 20)) + 1,
    D24: Math.floor(degreeInSign / (30 / 24)) + 1,
  };
}

// Вспомогательная функция для расчета долготы в дробной карте
function calculateDivisionalLongitude(natLon: number, division: number): number {
  const signIndex = Math.floor(natLon / 30);
  const degreeInSign = natLon % 30;
  const partIndex = Math.floor((degreeInSign * division) / 30);
  const newSignIndex = getDivisionalSign(signIndex, degreeInSign, partIndex, division);
  const newDegreeInSign = ((degreeInSign * division) % 30);
  return newSignIndex * 30 + newDegreeInSign;
}

function hasSpecificVargaRule(division: number): boolean {
  return [2, 3, 7, 9, 10, 12, 20, 24].includes(division);
}

function getDivisionalSign(signIndex: number, degreeInSign: number, partIndex: number, division: number): number {
  const isOddSign = signIndex % 2 === 0;
  const isMovable = [0, 3, 6, 9].includes(signIndex);
  const isFixed = [1, 4, 7, 10].includes(signIndex);

  if (division === 2) {
    const isFirstHalf = degreeInSign < 15;
    if (isOddSign) return isFirstHalf ? 4 : 3; // Leo/Sun, Cancer/Moon
    return isFirstHalf ? 3 : 4;
  }

  if (division === 3) {
    return (signIndex + partIndex * 4) % 12; // same, 5th, 9th
  }

  if (division === 7) {
    const start = isOddSign ? signIndex : (signIndex + 6) % 12;
    return (start + partIndex) % 12;
  }

  if (division === 9) {
    const start = isMovable ? signIndex : isFixed ? (signIndex + 8) % 12 : (signIndex + 4) % 12;
    return (start + partIndex) % 12;
  }

  if (division === 10) {
    const start = isOddSign ? signIndex : (signIndex + 8) % 12;
    return (start + partIndex) % 12;
  }

  if (division === 12) {
    return (signIndex + partIndex) % 12; // Dvadasamsha: count from the natal sign
  }

  if (division === 20) {
    const isDual = !isMovable && !isFixed;
    const start = isMovable ? 0 : isFixed ? 8 : isDual ? 4 : signIndex; // Aries/Sagittarius/Leo
    return (start + partIndex) % 12;
  }

  if (division === 24) {
    const start = isOddSign ? 4 : 3; // Leo for odd signs, Cancer for even signs
    return (start + partIndex) % 12;
  }

  return (signIndex * division + partIndex) % 12;
}

// Определения всех стандартных дробных карт
export const DIVISIONAL_CHART_DEFINITIONS = [
  { division: 1, name: 'D1 — Раши', sanskritName: 'Rashi', area: 'Основная карта (тело и личность)' },
  { division: 2, name: 'D2 — Хора', sanskritName: 'Hora', area: 'Богатство' },
  { division: 3, name: 'D3 — Дреккана', sanskritName: 'Drekkana', area: 'Братья/сестры' },
  { division: 4, name: 'D4 — Чатуртхамша', sanskritName: 'Chaturthamsha', area: 'Удача и имущество' },
  { division: 7, name: 'D7 — Саптамша', sanskritName: 'Saptamsha', area: 'Дети' },
  { division: 9, name: 'D9 — Навамша', sanskritName: 'Navamsha', area: 'Брак и духовность' },
  { division: 10, name: 'D10 — Дашамша', sanskritName: 'Dashamsha', area: 'Карьера' },
  { division: 12, name: 'D12 — Двадашамша', sanskritName: 'Dvadashamsha', area: 'Родители' },
  { division: 16, name: 'D16 — Шодашамша', sanskritName: 'Shodashamsha', area: 'Транспорт и комфорт' },
  { division: 20, name: 'D20 — Вимшамша', sanskritName: 'Vimshamsha', area: 'Духовность' },
  { division: 24, name: 'D24 — Сиддхамша', sanskritName: 'Siddhamsha', area: 'Образование' },
  { division: 27, name: 'D27 — Бхамша', sanskritName: 'Bhamsha', area: 'Сила и слабость' },
  { division: 30, name: 'D30 — Тримшамша', sanskritName: 'Trimshamsha', area: 'Несчастья' },
  { division: 40, name: 'D40 — Кхаведамша', sanskritName: 'Khavedamsha', area: 'Благословения' },
  { division: 45, name: 'D45 — Акшаведамша', sanskritName: 'Akshavedamsha', area: 'Общее благополучие' },
  { division: 60, name: 'D60 — Шаштьямша', sanskritName: 'Shashtiamsha', area: 'Карма прошлых жизней' }
];

// Расчет всех дробных карт для натальной карты
export function calculateAllDivisionalCharts(
  planets: Record<string, { siderealLon: number }>,
  ascendantLon: number
): DivisionalChart[] {
  const natalLongitudes: Record<string, number> = {};

  Object.entries(planets).forEach(([name, data]) => {
    natalLongitudes[name] = data.siderealLon;
  });

  return DIVISIONAL_CHART_DEFINITIONS.map(def =>
    calculateDivisionalChart(
      natalLongitudes,
      ascendantLon,
      def.division,
      def.name,
      def.sanskritName,
      def.area
    )
  );
}
