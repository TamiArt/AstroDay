import { getPlanetName } from './planetUtils';

export type RecommendationPrecisionLevel = 'high' | 'medium' | 'low';

interface RecommendationTone {
  lead: string;
  confidenceNote?: string;
  avoidLead: string;
}

export interface RecommendationTextInput {
  precisionLevel: RecommendationPrecisionLevel;
  hourPlanet: string;
  dashaPlanet: string;
  antardashaPlanet?: string;
  hourAction: string;
  hourAvoid: string;
  dashaAction: string;
  dashaAreas: string[];
  hourAreas: string[];
  dashaHouseText?: string | null;
  hourHouseText?: string | null;
  moonTransitText?: string | null;
  panchangFocus: string;
  aspectReason?: string | null;
  aspectAdvice?: string | null;
  vargaHints: string[];
  energyLevel: number;
  currentMoonSign: string;
  difficultYogaName?: string | null;
  tenseAspectText?: string | null;
}

export interface RecommendationTextBundle {
  mainRecommendation: string;
  avoidRecommendation: string;
  reasoning: string[];
  bestAreas: string[];
}

const PRECISION_TONES: Record<RecommendationPrecisionLevel, RecommendationTone> = {
  high: {
    lead: 'Сегодня лучше',
    avoidLead: 'Избегайте',
  },
  medium: {
    lead: 'Сегодня разумнее',
    confidenceNote: 'Часть выводов по домам и варгам лучше читать как вероятную тенденцию из-за точности исходных данных.',
    avoidLead: 'С осторожностью избегайте',
  },
  low: {
    lead: 'Как мягкую тенденцию на сегодня можно взять',
    confidenceNote: 'Не делайте жёстких выводов по домам, Лагне и варгам: исходное время или timezone требуют проверки.',
    avoidLead: 'Особенно не спешите',
  },
};

function finishSentence(text: string): string {
  return text.endsWith('.') ? text : `${text}.`;
}

function energyAction(level: number): string {
  if (level >= 75) return 'энергии достаточно для видимого шага, но лучше держать один главный фокус';
  if (level >= 55) return 'темп дня рабочий: выбирайте задачи, где важна последовательность';
  return 'энергию стоит беречь: планируйте короткие действия и паузы между ними';
}

function buildContextSentence(input: RecommendationTextInput): string {
  const factors = [
    `час ${getPlanetName(input.hourPlanet)} задаёт способ действия`,
    `период ${getPlanetName(input.dashaPlanet)} держит долгий фон`,
  ];

  if (input.antardashaPlanet) {
    factors.push(`под-период ${getPlanetName(input.antardashaPlanet)} уточняет тему`);
  }

  return `Ключ дня складывается так: ${factors.join(', ')}`;
}

function buildMainRecommendation(input: RecommendationTextInput): string {
  const tone = PRECISION_TONES[input.precisionLevel];
  const parts = [
    `${tone.lead} ${input.hourAction}`,
    buildContextSentence(input),
    input.moonTransitText || `текущая Луна идёт через знак ${input.currentMoonSign}`,
    input.panchangFocus,
    input.aspectAdvice ? `Практический ход: ${input.aspectAdvice}` : energyAction(input.energyLevel),
  ];

  return parts.map(finishSentence).join(' ');
}

function buildAvoidRecommendation(input: RecommendationTextInput): string {
  const tone = PRECISION_TONES[input.precisionLevel];
  const avoidParts = [
    `${tone.avoidLead}: ${input.hourAvoid}`,
  ];

  if (input.difficultYogaName) {
    avoidParts.push(`${input.difficultYogaName} просит не давить на события и не обещать лишнего`);
  }

  if (input.tenseAspectText) {
    avoidParts.push(input.tenseAspectText);
  }

  if (tone.confidenceNote) {
    avoidParts.push(tone.confidenceNote);
  }

  return avoidParts.map(finishSentence).join(' ');
}

function buildReasoning(input: RecommendationTextInput): string[] {
  const reasoning = [
    `Главный период: ${getPlanetName(input.dashaPlanet)}${input.antardashaPlanet ? `, под-период ${getPlanetName(input.antardashaPlanet)}` : ''}.`,
    `Час ${getPlanetName(input.hourPlanet)} показывает ближайший способ действия: ${input.hourAction}.`,
    input.panchangFocus,
    energyAction(input.energyLevel),
  ];

  if (input.dashaHouseText) reasoning.push(input.dashaHouseText);
  if (input.hourHouseText && input.hourHouseText !== input.dashaHouseText) {
    reasoning.push(input.hourHouseText);
  }
  if (input.moonTransitText) reasoning.push(input.moonTransitText);
  if (input.aspectReason) reasoning.push(input.aspectReason);
  reasoning.push(...input.vargaHints);

  const tone = PRECISION_TONES[input.precisionLevel];
  if (tone.confidenceNote) reasoning.push(tone.confidenceNote);

  return reasoning;
}

function buildBestAreas(input: RecommendationTextInput): string[] {
  const areas: string[] = [];
  
  // Приоритет 1: Даша (долгосрочная тенденция, более важна для дневного прогноза)
  areas.push(...input.dashaAreas);
  
  // Приоритет 2: Лунный транзит или пальцы карты
  if (input.dashaHouseText) {
    areas.push('Личные темы карты');
  }
  
  // Приоритет 3: Специфика дня (энергия, практики)
  if (input.energyLevel >= 75) {
    areas.push('Активные действия');
  } else if (input.energyLevel <= 40) {
    areas.push('Восстановление');
  }
  
  // Приоритет 4: Практики если они рекомендованы
  if (input.vargaHints.some(hint => hint.includes('D24') || hint.includes('практик') || hint.includes('обучен'))) {
    areas.push('Практики и обучение');
  }
  
  // Приоритет 5: Час только если остальное не заполнило достаточно информации
  if (areas.length < 2) {
    areas.push(...input.hourAreas.filter(a => !areas.includes(a)));
  }
  
  // Удаляем дубликаты и берем максимум 3 области для календаря
  return Array.from(new Set(areas.filter(Boolean))).slice(0, 3);
}

export function composePersonalRecommendationText(input: RecommendationTextInput): RecommendationTextBundle {
  return {
    mainRecommendation: buildMainRecommendation(input),
    avoidRecommendation: buildAvoidRecommendation(input),
    reasoning: buildReasoning(input),
    bestAreas: buildBestAreas(input),
  };
}
