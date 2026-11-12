import type { DayForecast } from './indexedDB';

export type SmartCalendarAreaId =
  | 'career' | 'finances' | 'relationships' | 'children'
  | 'learning' | 'creativity' | 'home' | 'personal-growth';

export interface SmartCalendarArea {
  id: SmartCalendarAreaId;
  label: string;
  keywords: string[];
}

export const SMART_CALENDAR_AREAS: SmartCalendarArea[] = [
  { id: 'career', label: 'Работа и карьера', keywords: ['карьер', 'работ', 'професс', 'руковод', 'проект', 'статус'] },
  { id: 'finances', label: 'Финансы', keywords: ['финанс', 'деньг', 'доход', 'ресурс', 'покуп', 'бюджет'] },
  { id: 'relationships', label: 'Отношения', keywords: ['отнош', 'партн', 'любов', 'переговор', 'контакт', 'соглас'] },
  { id: 'children', label: 'Дети и родительство', keywords: ['дет', 'родител', 'семья', 'забот'] },
  { id: 'learning', label: 'Обучение', keywords: ['обуч', 'учеб', 'знан', 'курс', 'чтен', 'аналит', 'документ'] },
  { id: 'creativity', label: 'Творчество', keywords: ['твор', 'искус', 'креатив', 'самовыраж', 'дизайн', 'красот'] },
  { id: 'home', label: 'Дом и семья', keywords: ['дом', 'семь', 'быт', 'недвиж', 'родител'] },
  { id: 'personal-growth', label: 'Личное развитие', keywords: ['развит', 'духов', 'практик', 'восстанов', 'самопозн', 'внутрен'] },
];

export interface SmartDayFactor {
  source: 'natal' | 'varga' | 'dasha' | 'transit' | 'panchang' | 'energy' | 'timing' | 'data-quality';
  title: string;
  explanation: string;
}
export interface SmartDayConflict {
  level: 'mixed' | 'caution';
  title: string;
  explanation: string;
  resolution: string;
}
export interface SmartDayPlan {
  date: string;
  recommendation: string;
  avoid: string;
  areas: SmartCalendarAreaId[];
  factors: SmartDayFactor[];
  conflicts: SmartDayConflict[];
  confidence: 'high' | 'medium' | 'low';
  confidenceNotes: string[];
}
export interface SmartPeriodComparison {
  currentDate: string;
  targetDate: string;
  energyDelta: number;
  currentEnergy: number;
  targetEnergy: number;
  currentAreas: string[];
  targetAreas: string[];
  newlyHighlighted: string[];
  lessHighlighted: string[];
  changes: string[];
  caveat: string;
}
export interface SmartPeriodRangeComparison {
  currentLabel: string;
  targetLabel: string;
  currentDays: number;
  targetDays: number;
  currentAverageEnergy: number | null;
  targetAverageEnergy: number | null;
  energyDelta: number | null;
  currentTopAreas: string[];
  targetTopAreas: string[];
  newlyHighlighted: string[];
  lessHighlighted: string[];
  caveat: string;
}
export interface SmartMonthSummary {
  daysWithData: number;
  totalDays: number;
  averageEnergy: number | null;
  areaCounts: Array<{ id: SmartCalendarAreaId; label: string; days: number }>;
  recurringFactors: string[];
  bestEnergyDates: string[];
  lowEnergyDates: string[];
}

function matchesArea(text: string, area: SmartCalendarArea): boolean {
  const normalized = text.toLocaleLowerCase('ru-RU');
  return area.keywords.some((keyword) => normalized.includes(keyword));
}

export function getForecastAreaIds(forecast: DayForecast): SmartCalendarAreaId[] {
  const text = [...(forecast.bestAreas ?? []), ...(forecast.reasoning ?? []), forecast.topRecommendation].join(' ');
  return SMART_CALENDAR_AREAS.filter((area) => matchesArea(text, area)).map((area) => area.id);
}

function classifyFactor(reason: string): SmartDayFactor {
  const value = reason.toLocaleLowerCase('ru-RU');
  if (/d12|d20|d24|варг/.test(value)) return { source: 'varga', title: 'Профильная дробная карта', explanation: reason };
  if (/махадаша|антардаша|пратьянтардаша|главный период|под-период/.test(value)) {
    return { source: 'dasha', title: 'Фон периода Даши', explanation: reason };
  }
  if (/транзит|аспект|луна идёт|луна идет|касается натальн/.test(value)) {
    return { source: 'transit', title: 'Транзитный фактор', explanation: reason };
  }
  if (/натальн|вашей карте|домом|управител/.test(value)) {
    return { source: 'natal', title: 'Связь с натальной картой', explanation: reason };
  }
  if (/титхи|йога|экадаши|новолуние|полнолуние|сиддхи|сиддха|прити|саубхагья|шобхана|атиганда|шула|вьягхата|вьятипата|вайдхрити|ганда/.test(value)) {
    return { source: 'panchang', title: 'Панчанга дня', explanation: reason };
  }
  if (/энерг|темп дня|паузы|короткие действия/.test(value)) {
    return { source: 'energy', title: 'Ресурс и темп', explanation: reason };
  }
  if (/час /.test(value)) {
    return { source: 'timing', title: 'Планетарный час', explanation: reason };
  }
  return { source: 'data-quality', title: 'Дополнительный фактор', explanation: reason };
}

export function buildSmartDayPlan(forecast: DayForecast): SmartDayPlan {
  const factors = (forecast.reasoning ?? []).map(classifyFactor);
  if (forecast.warning) factors.push({ source: 'panchang', title: 'Предупреждение панчанги', explanation: forecast.warning });
  for (const note of forecast.precisionNotes ?? []) {
    factors.push({ source: 'data-quality', title: 'Точность исходных данных', explanation: note });
  }

  const difficultPanchang = Boolean(forecast.warning);
  const strongEnergy = forecast.energyLevel >= 70;
  const positiveDirection = /начинайте|начните|проявляйте инициатив|активн|смелый шаг|новые проекты|расширяйте возможности/i.test(forecast.topRecommendation);
  const cautionDirection = /не форсируйте|не принимайте важных решений|не спешите|пауза|осторож|не подогревайте конфликт/i.test(forecast.avoidRecommendation);
  const conflicts: SmartDayConflict[] = [];

  if ((strongEnergy || positiveDirection) && (difficultPanchang || cautionDirection)) {
    conflicts.push({
      level: 'mixed',
      title: 'Смешанные сигналы: ресурс есть, но нужна избирательность',
      explanation: [
        strongEnergy ? `Расчётный уровень энергии высокий (${forecast.energyLevel}/100).` : '',
        positiveDirection ? 'Основная рекомендация предлагает активный шаг.' : '',
        difficultPanchang ? `При этом панчанга отмечает фактор внимания: ${forecast.warning}.` : '',
        cautionDirection ? `Ограничение: ${forecast.avoidRecommendation}` : '',
      ].filter(Boolean).join(' '),
      resolution: 'Оставьте активность для подготовки, обучения, переговоров и обратимых шагов. Не превращайте символическое предупреждение в запрет, но отложите необратимые решения, если для них не хватает фактов.',
    });
  } else if (difficultPanchang || cautionDirection) {
    conflicts.push({
      level: 'caution',
      title: 'Рекомендация с оговоркой',
      explanation: forecast.avoidRecommendation || forecast.warning || 'Есть факторы, предлагающие более спокойный темп.',
      resolution: 'Выберите небольшой проверяемый шаг и заранее определите, при каких условиях продолжите действие.',
    });
  }

  const uncertain = (forecast.precisionNotes ?? []).filter((note) => /погрешност|приблизительно|проверьте|требуют проверки|не делайте жёстких выводов/i.test(note));
  return {
    date: forecast.date,
    recommendation: forecast.topRecommendation,
    avoid: forecast.avoidRecommendation ?? '',
    areas: getForecastAreaIds(forecast),
    factors,
    conflicts,
    confidence: uncertain.length > 1 ? 'low' : uncertain.length === 1 ? 'medium' : 'high',
    confidenceNotes: forecast.precisionNotes ?? [],
  };
}

export function compareSmartPeriods(current: DayForecast, target: DayForecast): SmartPeriodComparison {
  const currentAreas = current.bestAreas ?? [];
  const targetAreas = target.bestAreas ?? [];
  const currentSet = new Set(currentAreas);
  const targetSet = new Set(targetAreas);
  const newlyHighlighted = targetAreas.filter((area) => !currentSet.has(area));
  const lessHighlighted = currentAreas.filter((area) => !targetSet.has(area));
  const energyDelta = target.energyLevel - current.energyLevel;
  const changes: string[] = [
    energyDelta === 0 ? 'Расчётный уровень энергии не изменился.' : `Уровень энергии ${energyDelta > 0 ? 'выше' : 'ниже'} на ${Math.abs(energyDelta)} пункт(ов).`,
  ];
  if (newlyHighlighted.length) changes.push(`Новые акценты: ${newlyHighlighted.join(', ')}.`);
  if (lessHighlighted.length) changes.push(`Меньше выделены: ${lessHighlighted.join(', ')}.`);
  if (!newlyHighlighted.length && !lessHighlighted.length) changes.push('Список приоритетных сфер совпадает.');
  return {
    currentDate: current.date, targetDate: target.date, energyDelta,
    currentEnergy: current.energyLevel, targetEnergy: target.energyLevel,
    currentAreas, targetAreas, newlyHighlighted, lessHighlighted, changes,
    caveat: 'Сравниваются символические показатели и тексты двух дневных расчётов. Это не оценка вероятности события и не замена фактического планирования.',
  };
}

export function compareSmartForecastPeriods(
  current: DayForecast[],
  target: DayForecast[],
  currentLabel: string,
  targetLabel: string,
): SmartPeriodRangeComparison {
  const average = (items: DayForecast[]) => items.length
    ? Math.round(items.reduce((sum, item) => sum + item.energyLevel, 0) / items.length)
    : null;
  const countAreas = (items: DayForecast[]) => SMART_CALENDAR_AREAS.map((area) => ({
    label: area.label,
    count: items.filter((item) => getForecastAreaIds(item).includes(area.id)).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3).map((item) => item.label);
  const currentTopAreas = countAreas(current);
  const targetTopAreas = countAreas(target);
  const currentSet = new Set(currentTopAreas);
  const targetSet = new Set(targetTopAreas);
  const currentAverageEnergy = average(current);
  const targetAverageEnergy = average(target);
  return {
    currentLabel, targetLabel,
    currentDays: current.length, targetDays: target.length,
    currentAverageEnergy, targetAverageEnergy,
    energyDelta: currentAverageEnergy === null || targetAverageEnergy === null
      ? null : targetAverageEnergy - currentAverageEnergy,
    currentTopAreas, targetTopAreas,
    newlyHighlighted: targetTopAreas.filter((area) => !currentSet.has(area)),
    lessHighlighted: currentTopAreas.filter((area) => !targetSet.has(area)),
    caveat: 'Сравниваются только дни с рассчитанными прогнозами. Неполное покрытие месяца может смещать средние значения и частоту сфер; сравнение не является прогнозом вероятности событий.',
  };
}

export function summarizeSmartMonth(forecasts: DayForecast[], totalDays: number): SmartMonthSummary {
  const areaCounts = SMART_CALENDAR_AREAS.map((area) => ({
    id: area.id, label: area.label,
    days: forecasts.filter((forecast) => getForecastAreaIds(forecast).includes(area.id)).length,
  })).sort((a, b) => b.days - a.days);
  const averageEnergy = forecasts.length
    ? Math.round(forecasts.reduce((sum, item) => sum + item.energyLevel, 0) / forecasts.length)
    : null;
  const factorCounts = new Map<string, number>();
  forecasts.forEach((forecast) => (forecast.reasoning ?? []).forEach((reason) => {
    const normalized = reason.replace(/[.:;].*$/, '').trim();
    if (normalized.length > 12) factorCounts.set(normalized, (factorCounts.get(normalized) ?? 0) + 1);
  }));
  return {
    daysWithData: forecasts.length, totalDays, averageEnergy,
    areaCounts: areaCounts.filter((item) => item.days > 0),
    recurringFactors: [...factorCounts.entries()].filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => `${reason} · ${count} дн.`),
    bestEnergyDates: [...forecasts].sort((a, b) => b.energyLevel - a.energyLevel).slice(0, 3).map((item) => item.date),
    lowEnergyDates: [...forecasts].sort((a, b) => a.energyLevel - b.energyLevel).slice(0, 3).map((item) => item.date),
  };
}
