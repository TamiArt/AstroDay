import { Aspect, calculateDasha, getCurrentAntardasha, getPlanetHouse, NatalChart } from './astrology';
import { calculatePersonalEnergyLevel } from './energyUtils';
import { PanchangData } from './panchang';
import { PlanetaryHourInfo } from './planetaryHours';
import { getPlanetName } from './planetUtils';
import { composePersonalRecommendationText } from './recommendationComposer';
import { getUpayaForDay, Upaya } from './remedies';
import { UserProfile } from './storage';

export interface DataPrecisionInfo {
  level: 'high' | 'medium' | 'low';
  notes: string[];
}

export interface PersonalRecommendationResult {
  mainRecommendation: string;
  avoidRecommendation: string;
  bestAreas: string[];
  microUpaya: Upaya;
  reasoning: string[];
  precision: DataPrecisionInfo;
  energyLevel: number;
  dashaPlanet: string;
  antardashaPlanet?: string;
}

export interface PersonalRecommendationContext {
  profile: UserProfile;
  date: Date;
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
  planetaryHour: PlanetaryHourInfo;
}

const PLANET_AREAS: Record<string, { action: string; avoid: string; areas: string[] }> = {
  Sun: {
    action: 'выберите одно заметное действие, где нужны уверенность, ясность и личная позиция',
    avoid: 'не спорьте из желания доказать правоту',
    areas: ['Карьера', 'Самопрезентация', 'Решения'],
  },
  Moon: {
    action: 'сначала стабилизируйте эмоциональный фон, затем переходите к делам',
    avoid: 'не принимайте решения на эмоциональной волне',
    areas: ['Дом', 'Семья', 'Восстановление'],
  },
  Mars: {
    action: 'направьте энергию в конкретное физическое или рабочее действие',
    avoid: 'не подогревайте конфликт и не ускоряйте то, что требует паузы',
    areas: ['Энергия', 'Спорт', 'Смелые шаги'],
  },
  Mercury: {
    action: 'используйте день для переговоров, документов, обучения и ясного планирования',
    avoid: 'не распыляйтесь на слишком много задач одновременно',
    areas: ['Общение', 'Обучение', 'Документы'],
  },
  Jupiter: {
    action: 'делайте шаг, который расширяет возможности: обучение, наставник, стратегия, щедрость',
    avoid: 'не обещайте больше, чем реально сможете выполнить',
    areas: ['Рост', 'Финансы', 'Наставничество'],
  },
  Venus: {
    action: 'выбирайте мягкое согласование, отношения, красоту и восстановление гармонии',
    avoid: 'не покупайте и не соглашайтесь только из желания понравиться',
    areas: ['Отношения', 'Творчество', 'Комфорт'],
  },
  Saturn: {
    action: 'закройте старую задачу, наведите порядок и укрепите долгосрочную структуру',
    avoid: 'не уходите в самокритику и ощущение тяжести',
    areas: ['Дисциплина', 'Карьера', 'Долгосрочные планы'],
  },
  Rahu: {
    action: 'используйте нестандартный подход, но проверяйте факты перед резким шагом',
    avoid: 'не гонитесь за быстрым эффектом ценой устойчивости',
    areas: ['Амбиции', 'Технологии', 'Новые возможности'],
  },
  Ketu: {
    action: 'упростите день, уберите лишнее и доверьтесь опыту, который уже есть',
    avoid: 'не отстраняйтесь от важных практических обязанностей',
    areas: ['Духовность', 'Очищение', 'Завершение'],
  },
};

const DIFFICULT_YOGAS = ['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата', 'Вайдхрити'];
const SUPPORTIVE_YOGAS = ['Прити', 'Саубхагья', 'Шобхана', 'Сиддхи', 'Сиддха', 'Шубха'];

const HOUSE_THEMES: Record<number, string> = {
  1: 'тело, самочувствие и личная инициатива',
  2: 'деньги, речь и семейные ресурсы',
  3: 'общение, навыки и смелые небольшие шаги',
  4: 'дом, внутренний покой и опора',
  5: 'творчество, дети, обучение и радость',
  6: 'работа, здоровье, дисциплина и бытовые задачи',
  7: 'партнёрство, договорённости и открытый диалог',
  8: 'глубокие перемены, тайные процессы и осторожность',
  9: 'смысл, наставники, вера и дальние горизонты',
  10: 'карьера, статус и видимый результат',
  11: 'доходы, друзья, поддержка и планы на будущее',
  12: 'отдых, завершение, уединение и духовная практика',
};

const VARGA_HINTS = {
  D12: {
    1: 'D12 подчёркивает личную ответственность перед родом и телом.',
    4: 'D12 выводит на первый план дом, родителей и внутреннюю опору.',
    5: 'D12 показывает: повторяющиеся семейные сценарии сегодня требуют внимания.',
    8: 'D12 просит бережно относиться к наследственным и семейным темам.',
    12: 'D12 лучше проживать через прощение, завершение и мягкое отпускание.',
  },
  D20: {
    1: 'D20 усиливает волю и способность вести за собой через личный пример.',
    5: 'D20 поддерживает мантры, обучение и практику, где нужен огонь сердца.',
    7: 'D20 показывает: сила и лидерские качества проявляются особенно сильно.',
    9: 'D20 раскрывает духовную смелость через наставника, веру и дисциплину.',
    12: 'D20 рекомендует уединённую практику вместо борьбы за внешний результат.',
  },
  D24: {
    1: 'D24 помогает через самостоятельное обучение и ясную цель практики.',
    4: 'D24 поддерживает спокойную учёбу дома, чтение и работу с памятью.',
    8: 'D24 даёт глубину: полезны исследование, тишина и работа с внутренними блоками.',
    9: 'D24 усиливает знание через учителя, традицию и регулярную практику.',
    12: 'D24 показывает: духовные практики и медитация помогут сбалансировать энергию.',
  },
} as const;

export function getDataPrecision(profile: UserProfile): DataPrecisionInfo {
  const notes: string[] = [];
  const uncertainty = profile.timeUncertainty ?? 0;

  if (uncertainty > 0) {
    notes.push(`Время рождения указано с погрешностью ±${uncertainty} мин: Лагна, дома и варги трактуются осторожнее.`);
  }

  if (profile.timezoneAccuracy === 'estimated-longitude') {
    notes.push('Часовой пояс рождения определён приблизительно по долготе: проверьте timezone для точной карты.');
  }

  if (profile.currentLocation?.timezoneAccuracy === 'estimated-longitude') {
    notes.push('Часовой пояс текущего места определён приблизительно, поэтому планетарные часы могут требовать проверки.');
  }

  if (uncertainty > 10 || notes.length >= 2) {
    return { level: 'low', notes };
  }

  if (uncertainty > 0 || notes.length > 0) {
    return { level: 'medium', notes };
  }

  return { level: 'high', notes: ['Данные достаточны для уверенной персональной интерпретации.'] };
}

export function getCurrentDashaForChart(natalChart: NatalChart, date: Date) {
  const moonNakshatra = Math.floor(natalChart.planets.Moon.siderealLon / (360 / 27));
  const dasha = calculateDasha(natalChart.date, moonNakshatra, date, natalChart.planets.Moon.siderealLon);
  return {
    dasha,
    antardasha: getCurrentAntardasha(dasha, date),
  };
}

function getPlanetHouseText(planet: string, chart: NatalChart): string | null {
  const position = chart.planets[planet as keyof typeof chart.planets];
  if (!position || !chart.houses) return null;

  const house = getPlanetHouse(position.sign, chart.houses);
  return `${getPlanetName(planet)} в вашей карте связан с ${house}-м домом: ${HOUSE_THEMES[house]}`;
}

function getTransitHouseText(planet: string, natalChart: NatalChart, currentChart: NatalChart): string | null {
  const transitPosition = currentChart.planets[planet as keyof typeof currentChart.planets];
  if (!transitPosition || !natalChart.houses) return null;

  const house = getPlanetHouse(transitPosition.sign, natalChart.houses);
  return `транзитный ${getPlanetName(planet)} сейчас активирует ваш ${house}-й дом: ${HOUSE_THEMES[house]}`;
}

function getStrongestAspect(aspects: Aspect[]): Aspect | null {
  return aspects.length > 0 ? aspects[0] : null;
}

function getAspectTypeText(aspect: Aspect): string {
  if (aspect.type === 'trine' || aspect.type === 'sextile') return 'поддерживающий аспект';
  if (aspect.type === 'square' || aspect.type === 'opposition') return 'напряжённый аспект';
  return 'фокусирующий аспект';
}

function getAspectReason(aspect: Aspect): string {
  const context = aspect.context === 'transit' || aspect.isTransit
    ? `транзитный ${getPlanetName(aspect.planet1)} касается натального ${getPlanetName(aspect.planet2)}`
    : `натальные ${getPlanetName(aspect.planet1)} и ${getPlanetName(aspect.planet2)} связаны между собой`;

  return `${context}: ${getAspectTypeText(aspect)}, сила ${aspect.strength}/100`;
}

function getAspectAdvice(aspect: Aspect | null): string | null {
  if (!aspect) return null;

  if (aspect.type === 'trine' || aspect.type === 'sextile') {
    return `используйте поддержку ${getPlanetName(aspect.planet1)} и ${getPlanetName(aspect.planet2)} через мягкий, но конкретный шаг`;
  }

  if (aspect.type === 'square' || aspect.type === 'opposition') {
    return `не форсируйте темы ${getPlanetName(aspect.planet1)} и ${getPlanetName(aspect.planet2)}: сначала пауза, затем действие`;
  }

  return `соберите темы ${getPlanetName(aspect.planet1)} и ${getPlanetName(aspect.planet2)} в один ясный фокус`;
}

function getVargaHints(planet: string, chart: NatalChart): string[] {
  const position = chart.planets[planet as keyof typeof chart.planets];
  if (!position?.vargas) return [];

  const hints: string[] = [];
  const d12Hint = VARGA_HINTS.D12[position.vargas.D12 as keyof typeof VARGA_HINTS.D12];
  const d20Hint = VARGA_HINTS.D20[position.vargas.D20 as keyof typeof VARGA_HINTS.D20];
  const d24Hint = VARGA_HINTS.D24[position.vargas.D24 as keyof typeof VARGA_HINTS.D24];

  if (d12Hint) hints.push(`${getPlanetName(planet)}: ${d12Hint}`);
  if (d20Hint) hints.push(`${getPlanetName(planet)}: ${d20Hint}`);
  if (d24Hint) hints.push(`${getPlanetName(planet)}: ${d24Hint}`);

  return hints;
}

function getPanchangFocus(panchang: PanchangData): string {
  if (panchang.tithi.index === 14) return 'полнолуние поддерживает завершение и ясное подведение итогов';
  if (panchang.tithi.index === 29) return 'новолуние лучше использовать для очищения и намерения';
  if (panchang.tithi.index === 10 || panchang.tithi.index === 25) return 'Экадаши усиливает практики дисциплины и внутренней чистоты';
  if (SUPPORTIVE_YOGAS.includes(panchang.yoga.name)) return `${panchang.yoga.name} поддерживает созидательные шаги`;
  if (DIFFICULT_YOGAS.includes(panchang.yoga.name)) return `${panchang.yoga.name} требует аккуратности и меньшего давления`;
  return `${panchang.tithi.name}: ${panchang.tithi.meaning.toLowerCase()}`;
}

export function generatePersonalRecommendations(
  context: PersonalRecommendationContext
): PersonalRecommendationResult {
  const { profile, date, natalChart, currentChart, aspects, panchang, planetaryHour } = context;
  const precision = getDataPrecision(profile);
  const { dasha, antardasha } = getCurrentDashaForChart(natalChart, date);
  const hourPlanet = planetaryHour.planet;
  const hourContext = PLANET_AREAS[hourPlanet] || PLANET_AREAS.Sun;
  const dashaContext = PLANET_AREAS[dasha.planet] || PLANET_AREAS.Sun;
  const strongestAspect = getStrongestAspect(aspects);
  const dashaHouseText = getPlanetHouseText(dasha.planet, natalChart);
  const hourHouseText = getPlanetHouseText(hourPlanet, natalChart);
  const currentMoonSign = currentChart.planets.Moon.signName;
  const moonTransitText = getTransitHouseText('Moon', natalChart, currentChart);
  const aspectAdvice = getAspectAdvice(strongestAspect);
  const panchangFocus = getPanchangFocus(panchang);
  const vargaHints = Array.from(new Set([
    ...getVargaHints(dasha.planet, natalChart),
    ...getVargaHints(hourPlanet, natalChart),
  ])).slice(0, 3);

  const energyLevel = calculatePersonalEnergyLevel(
    date,
    currentChart.planets.Moon.siderealLon,
    panchang.tithi.index,
    {
      ascendantSign: natalChart.ascendant.signName,
      natalMoonSign: natalChart.planets.Moon.signName,
      currentMoonSign,
      dashaPlanet: dasha.planet,
      strongestAspectStrength: strongestAspect?.strength,
      timeUncertainty: profile.timeUncertainty,
    }
  );

  const textBundle = composePersonalRecommendationText({
    precisionLevel: precision.level,
    hourPlanet,
    dashaPlanet: dasha.planet,
    antardashaPlanet: antardasha?.planet,
    hourAction: hourContext.action,
    hourAvoid: hourContext.avoid,
    dashaAction: dashaContext.action,
    dashaAreas: dashaContext.areas,
    hourAreas: hourContext.areas,
    dashaHouseText,
    hourHouseText,
    moonTransitText,
    panchangFocus,
    aspectReason: strongestAspect ? getAspectReason(strongestAspect) : null,
    aspectAdvice,
    vargaHints,
    energyLevel,
    currentMoonSign,
    difficultYogaName: DIFFICULT_YOGAS.includes(panchang.yoga.name) ? panchang.yoga.name : null,
    tenseAspectText: strongestAspect && (strongestAspect.type === 'square' || strongestAspect.type === 'opposition')
      ? `напряжение ${getPlanetName(strongestAspect.planet1)} и ${getPlanetName(strongestAspect.planet2)} лучше не переводить в спор`
      : null,
  });
  const microUpaya = getUpayaForDay(date, hourPlanet);

  return {
    mainRecommendation: textBundle.mainRecommendation,
    avoidRecommendation: textBundle.avoidRecommendation,
    bestAreas: textBundle.bestAreas,
    microUpaya,
    reasoning: textBundle.reasoning,
    precision,
    energyLevel,
    dashaPlanet: dasha.planet,
    antardashaPlanet: antardasha?.planet,
  };
}
