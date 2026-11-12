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
    lead: 'Как необязательную идею можно рассмотреть',
    avoidLead: 'На что можно обратить внимание',
  },
  medium: {
    lead: 'Если это подходит вашим обстоятельствам, можно',
    confidenceNote: 'Часть выводов по домам и варгам лучше читать как вероятную тенденцию из-за точности исходных данных.',
    avoidLead: 'В качестве напоминания можно учесть',
  },
  low: {
    lead: 'Как тему для размышления можно выбрать',
    confidenceNote: 'Не делайте жёстких выводов по домам, Лагне и варгам: исходное время или timezone требуют проверки.',
    avoidLead: 'Не воспринимайте это как запрет; просто учтите',
  },
};

function finishSentence(text: string): string {
  return text.endsWith('.') ? text : `${text}.`;
}

function energyAction(level: number): string {
  if (level >= 75) return 'условный индекс астрологической модели выше среднего; это не измерение вашей физической или эмоциональной энергии';
  if (level >= 55) return 'условный индекс модели находится в среднем диапазоне и не оценивает реальную продуктивность';
  return 'условный индекс модели ниже среднего; он не говорит о вашем самочувствии и не предписывает снижать активность';
}

function buildContextSentence(input: RecommendationTextInput): string {
  const factors = [
    `планетарный час ${getPlanetName(input.hourPlanet)} в традиции связывают с определёнными темами`,
    `период ${getPlanetName(input.dashaPlanet)} рассматривают как общий символический фон`,
  ];

  if (input.antardashaPlanet) {
    factors.push(`под-период ${getPlanetName(input.antardashaPlanet)} уточняет тему`);
  }

  return `В расчёте учтены следующие традиционные астрологические связи: ${factors.join(', ')}`;
}

function buildMainRecommendation(input: RecommendationTextInput): string {
  const tone = PRECISION_TONES[input.precisionLevel];
  const parts = [
    `${tone.lead}: ${input.hourAction}. Сопоставьте эту идею со своими реальными задачами и предпочтениями.`,
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
    `${tone.avoidLead}: ${input.hourAvoid}. Это не запрет и не прогноз; ориентируйтесь на факты и собственные решения.`,
  ];

  if (input.difficultYogaName) {
    avoidParts.push(`Йогу дня ${input.difficultYogaName} в традиции связывают с осторожностью; это символическая трактовка, а не указание на неблагоприятное событие`);
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
    `Планетарный час ${getPlanetName(input.hourPlanet)} традиционно связывают с темой: ${input.hourAction}.`,
    input.panchangFocus,
    energyAction(input.energyLevel),
  ];

  if (input.dashaHouseText) reasoning.push(input.dashaHouseText);
  if (input.hourHouseText && input.hourHouseText !== input.dashaHouseText) {
    reasoning.push(input.hourHouseText);
  }
  if (input.moonTransitText) reasoning.push(input.moonTransitText);
  if (input.aspectReason) reasoning.push(input.aspectReason);
  reasoning.push(...input.vargaHints.map((hint) => `Дополнительная символическая трактовка варги: ${hint}`));

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
