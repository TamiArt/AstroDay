import type { NatalChart, PlanetPosition } from './astrology';
import type { UserProfile } from './storage';

const SIGN_NAMES_RU = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
  'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы',
] as const;

const PLANET_NAMES_RU: Record<keyof NatalChart['planets'], string> = {
  Sun: 'Солнце',
  Moon: 'Луна',
  Mars: 'Марс',
  Mercury: 'Меркурий',
  Jupiter: 'Юпитер',
  Venus: 'Венера',
  Saturn: 'Сатурн',
  Rahu: 'Раху (восходящий лунный узел)',
  Ketu: 'Кету (нисходящий лунный узел)',
};

const PLANET_ORDER = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Rahu', 'Ketu',
] as const satisfies ReadonlyArray<keyof NatalChart['planets']>;

function formatBirthDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value || 'не указана';
}

function formatNumber(value: number, digits = 5): string {
  return Number.isFinite(value) ? value.toFixed(digits) : 'не рассчитано';
}

function formatPosition(position: PlanetPosition): string {
  const sign = SIGN_NAMES_RU[position.sign] ?? position.signName ?? 'знак не определён';
  const degree = formatNumber(position.degree, 5);
  return `${sign} ${degree}°`;
}

function formatPoint(
  label: string,
  position: PlanetPosition,
  house: number | undefined,
): string[] {
  return [
    `${label}:`,
    `  Знак и градус: ${formatPosition(position)}`,
    `  Сидерическая долгота: ${formatNumber(position.siderealLon)}°`,
    `  Тропическая долгота: ${formatNumber(position.tropicalLon)}°`,
    `  Накшатра: ${position.nakshatraName || 'не указана'}`,
    `  Пада: ${Number.isInteger(position.pada) ? position.pada : 'не указана'}`,
    `  Дом: ${house ?? 'не определён'}`,
  ];
}

function getTimezoneAccuracyLabel(profile: UserProfile): string {
  switch (profile.timezoneAccuracy) {
    case 'matched-region':
      return 'определён по географическому региону';
    case 'estimated-longitude':
      return 'приближённо оценён по долготе';
    case 'manual':
      return 'указан вручную';
    default:
      return 'способ определения не указан';
  }
}

/**
 * Builds a stable, plain-text report using only the birth profile and the
 * already calculated natal chart. No unrelated profile or storage data is read.
 */
export function serializeNatalChart(profile: UserProfile, chart: NatalChart): string {
  const houses = chart.houses ?? [];
  const houseBySign = new Map(houses.map((house) => [house.sign, house.house]));
  const uncertainty = profile.timeUncertainty;

  const lines = [
    'ДАННЫЕ НАТАЛЬНОЙ КАРТЫ ASTRODAY',
    '',
    '1. ИСХОДНЫЕ ДАННЫЕ РОЖДЕНИЯ',
    `Дата рождения: ${formatBirthDate(profile.birthDate)}`,
    `Местное время рождения: ${profile.birthTime || 'не указано'}`,
    `Погрешность времени: ${typeof uncertainty === 'number' && Number.isFinite(uncertainty) && uncertainty >= 0 ? `±${uncertainty} мин` : 'не указана'}`,
    `Место рождения: ${profile.birthPlace || 'не указано'}`,
    `Широта: ${formatNumber(profile.latitude)}°`,
    `Долгота: ${formatNumber(profile.longitude)}°`,
    `Часовой пояс IANA: ${profile.timezone || 'не указан'}`,
    `Точность часового пояса: ${getTimezoneAccuracyLabel(profile)}`,
    `Момент расчёта (UTC): ${Number.isFinite(chart.date.getTime()) ? chart.date.toISOString() : 'не указан'}`,
    '',
    '2. ПАРАМЕТРЫ РАСЧЁТА ASTRODAY',
    'Зодиак: сидерический',
    'Айанамша: Lahiri (средняя, модель прецессии IAU 1976 / Lieske)',
    'Система домов: Whole Sign (целые знаки)',
    'Планетные долготы: геоцентрические тропические положения, преобразованные в сидерические',
    'Лунные узлы: средний узел (Mean Node); Кету расположен напротив Раху',
    'Эфемеридная библиотека: astronomy-engine',
    '',
    '3. АСЦЕНДЕНТ / ЛАГНА',
    ...formatPoint('Асцендент', chart.ascendant, 1),
    '',
    '4. ПЛАНЕТЫ И ЛУННЫЕ УЗЛЫ',
  ];

  for (const planetName of PLANET_ORDER) {
    const position = chart.planets[planetName];
    lines.push(
      ...formatPoint(
        `${PLANET_NAMES_RU[planetName]} (${planetName})`,
        position,
        houseBySign.get(position.sign),
      ),
      '',
    );
  }

  lines.push('5. ДОМА НАТАЛЬНОЙ КАРТЫ');
  if (houses.length > 0) {
    for (const houseNumber of Array.from({ length: 12 }, (_, index) => index + 1)) {
      const house = houses.find((item) => item.house === houseNumber);
      if (!house) {
        lines.push(`${houseNumber}-й дом: данные отсутствуют`);
        continue;
      }
      const sign = SIGN_NAMES_RU[house.sign] ?? house.signName ?? 'знак не определён';
      lines.push(
        `${houseNumber}-й дом: ${sign}`,
        `  Начало знака: ${formatNumber(house.cusp)}°`,
        `  Управитель знака: ${house.lord || 'не указан'}`,
      );
    }
  } else {
    lines.push('Данные домов отсутствуют.');
  }

  lines.push(
    '',
    '6. АСПЕКТЫ',
    'Натальные аспекты не включены в объект NatalChart и в этот экспорт не входят.',
    '',
    '7. ОГОВОРКИ ДЛЯ НЕЗАВИСИМОЙ ПРОВЕРКИ',
    typeof uncertainty === 'number' && uncertainty > 0
      ? `Время рождения указано с погрешностью ±${uncertainty} минут. Асцендент и дома чувствительны к точности времени.`
      : 'Погрешность времени не превышает указанное пользователем значение; это не является независимым подтверждением точности исходного времени.',
    profile.timezoneAccuracy === 'estimated-longitude'
      ? 'Часовой пояс оценён по долготе, поэтому историческое смещение времени может отличаться от фактического местного времени.'
      : 'Для сравнения с другим калькулятором проверьте совпадение часового пояса и исторического смещения на дату рождения.',
    'Различия между сервисами возможны из-за эфемерид, настроек зодиака, айанамши, системы домов, часового пояса и округления.',
    '',
    'Текст сформирован локально в AstroDay. Данные не отправляются на сервер автоматически.',
  );

  return lines.join('\n');
}
