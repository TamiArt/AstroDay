import type { NatalChart } from './astrology';
import { analyzeDivisionalCharts } from './divisionalChartAnalysis';
import { analyzeTransits } from './transitAnalysis';
import { buildNatalChartFacts } from './natalChartFacts';
import { analyzeNatalYogas } from './natalYogaAnalysis';
import { analyzeLifeTopics, analyzePersonalizedHouses } from './personalizedHouseAnalysis';
import { buildTransitTimeline, type TransitTimelineReport } from './transitTimeline';
import { analyzeVimshottariDasha } from './vimshottariDashaAnalysis';

export type ForecastAreaId =
  | 'career' | 'finances' | 'relationships' | 'children'
  | 'learning' | 'creativity' | 'home' | 'personal-growth';

interface AreaDefinition {
  id: ForecastAreaId;
  title: string;
  houses: number[];
  primaryHouses: number[];
  vargas: number[];
  keywords: string[];
  limitation: string;
}
export interface ForecastEvidence {
  source: 'house' | 'planet' | 'yoga' | 'varga' | 'dasha' | 'transit';
  label: string;
  detail: string;
}
export interface UnifiedLifeAreaForecast {
  id: ForecastAreaId;
  title: string;
  houses: number[];
  supportingFactors: string[];
  tensionFactors: string[];
  timingIndicators: string[];
  evidence: ForecastEvidence[];
  transitEvents: string[];
  dashaPeriods: Array<{ layer: string; planet: string; startsAt: Date; endsAt: Date; evidence: string[] }>;
  vargaEvidence: string[];
  synthesis: string;
  dataStatus: 'complete' | 'partial' | 'unavailable';
  limitations: string[];
}
export interface UnifiedLifeForecastReport {
  generatedAt: Date;
  startDate: Date;
  endDate: Date;
  areas: UnifiedLifeAreaForecast[];
  transitTimeline: TransitTimelineReport;
  methodology: string[];
  warnings: string[];
}

const PLANET_NAMES_RU: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };

const AREAS: AreaDefinition[] = [
  { id: 'career', title: 'Работа и профессиональная реализация', houses: [2, 6, 10, 11], primaryHouses: [6, 10], vargas: [10], keywords: ['карьер', 'работ', 'професс'], limitation: 'D10 уточняет профессиональную тему, но не определяет должность, рынок труда или гарантированный карьерный результат.' },
  { id: 'finances', title: 'Финансы и источники дохода', houses: [2, 5, 9, 11], primaryHouses: [2, 11], vargas: [2], keywords: ['деньг', 'финанс', 'ресурс', 'доход'], limitation: 'D2 и связи домов не прогнозируют сумму дохода и не заменяют бюджет, проверку спроса и финансовый анализ.' },
  { id: 'relationships', title: 'Отношения и партнёрство', houses: [5, 7, 8, 12], primaryHouses: [7], vargas: [9], keywords: ['отнош', 'партнёр', 'партнер', 'брак'], limitation: 'D9 и 7-й дом не определяют решения другого человека и не гарантируют заключение или сохранение союза.' },
  { id: 'children', title: 'Дети и родительство', houses: [5, 9], primaryHouses: [5], vargas: [7], keywords: ['дет', 'родитель', 'семь'], limitation: 'Астрологические показатели и D7 не являются оценкой фертильности, беременности, здоровья или количества детей. Медицинские вопросы решаются с врачом.' },
  { id: 'learning', title: 'Обучение и интеллектуальное развитие', houses: [4, 5, 9], primaryHouses: [4, 5, 9], vargas: [24], keywords: ['обуч', 'знан', 'интеллект', 'образован'], limitation: 'D24 символически соотносится с обучением, но не измеряет интеллект, способности или вероятность академического результата.' },
  { id: 'creativity', title: 'Творчество и самореализация', houses: [3, 5, 9, 10], primaryHouses: [3, 5], vargas: [3, 7, 10], keywords: ['твор', 'искус', 'самовыраж', 'созид'], limitation: 'Показатели творчества не предсказывают популярность, продажи, признание или профессиональный успех.' },
  { id: 'home', title: 'Дом, семья и недвижимость', houses: [2, 4, 11], primaryHouses: [4], vargas: [4, 12], keywords: ['дом', 'семь', 'недвиж', 'род'], limitation: 'D4 и дома не заменяют юридическую, техническую и финансовую проверку недвижимости.' },
  { id: 'personal-growth', title: 'Личное развитие', houses: [1, 5, 8, 9, 12], primaryHouses: [1, 9], vargas: [20, 27], keywords: ['развит', 'духов', 'мировозз', 'личност'], limitation: 'D20/D27 и символические связи не являются психологической диагностикой или оценкой психического здоровья.' },
];

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
function areaMatches(text: string, area: AreaDefinition): boolean {
  const value = text.toLocaleLowerCase('ru-RU');
  return area.keywords.some((keyword) => value.includes(keyword));
}
function inRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Combines the existing D1 house/planet, yoga, varga, dasha and transit engines.
 * It deliberately preserves evidence by source and does not create a single
 * deterministic score or a binary "good/bad" prediction.
 */
export function buildUnifiedLifeForecast(
  chart: NatalChart,
  startDate: Date = new Date(),
  endDate: Date = new Date(startDate.getTime() + 365 * 86400000),
  options: { stepHours?: number } = {},
): UnifiedLifeForecastReport {
  if (!(startDate instanceof Date) || !Number.isFinite(startDate.getTime()) ||
      !(endDate instanceof Date) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
    throw new Error('Укажите корректный период единого прогноза');
  }
  if (startDate < chart.date) throw new Error('Период прогноза не может начинаться раньше даты рождения');

  const houseInsights = analyzePersonalizedHouses(chart);
  const housesByNumber = new Map(houseInsights.map((item) => [item.house, item]));
  const lifeTopics = analyzeLifeTopics(chart, startDate);
  const lifeTopicById = new Map(lifeTopics.map((item) => [item.id, item]));
  const facts = buildNatalChartFacts(chart);
  const yoga = analyzeNatalYogas(facts);
  const vargaReport = analyzeDivisionalCharts(chart);
  const dasha = analyzeVimshottariDasha(chart, startDate);
  const transitNow = analyzeTransits(chart, startDate);
  const transitTimeline = buildTransitTimeline(chart, startDate, endDate, { stepHours: options.stepHours ?? 24 });
  const areas = AREAS.map((area): UnifiedLifeAreaForecast => {
    const evidence: ForecastEvidence[] = [];
    const supporting = new Set<string>();
    const tension = new Set<string>();
    for (const houseNumber of area.houses) {
      const insight = housesByNumber.get(houseNumber);
      if (!insight) continue;
      evidence.push({ source: 'house', label: `${houseNumber}-й дом · ${insight.sign}`, detail: insight.evidence.join(' ') });
      if (insight.lord) evidence.push({
        source: 'planet', label: `Управитель ${houseNumber}-го дома: ${insight.lord}`,
        detail: insight.interpretation,
      });
    }

    const lifeTopicId = area.id === 'finances' ? 'money'
      : area.id === 'home' ? 'home_family'
        : area.id === 'personal-growth' ? 'inner_growth'
          : area.id === 'learning' || area.id === 'creativity' ? 'talents'
            : area.id;
    const topicInsight = lifeTopicById.get(lifeTopicId as 'talents' | 'money' | 'career' | 'children' | 'relationships' | 'home_family' | 'wellbeing' | 'inner_growth');
    if (topicInsight) {
      topicInsight.supportingFactors.forEach((item) => supporting.add(item));
      topicInsight.attentionPoints.forEach((item) => tension.add(item));
      evidence.push({ source: 'house', label: topicInsight.title, detail: topicInsight.evidence.join(' ') });
      evidence.push({ source: 'dasha', label: 'Временной контекст сферы', detail: topicInsight.timingNote });
    }

    for (const finding of yoga.findings) {
      if (!finding.houses.some((house) => area.houses.includes(house))) continue;
      evidence.push({ source: 'yoga', label: finding.name, detail: finding.evidence.join(' ') + ' ' + finding.formalRule });
      finding.assessment.supportingFactors.forEach((item) => supporting.add(`${finding.name}: ${item}`));
      finding.assessment.weakeningFactors.forEach((item) => tension.add(`${finding.name}: ${item}`));
    }

    const vargaEvidence = area.vargas.flatMap((division) => {
      const varga = vargaReport.analyses.find((item) => item.division === division);
      if (!varga) return [];
      const relevant = [
        ...varga.d1Evidence.map((item) => `D1 · ${item.house}-й дом: ${item.sign}, управитель ${item.lord}, положение управителя ${item.lordHouse ?? 'не определено'}.`),
        ...varga.vargaEvidence.map((item) => `D${division} · ${item.house}-й дом: ${item.sign}, управитель ${item.lord}, положение управителя ${item.lordHouse ?? 'не определено'}.`),
        ...varga.comparisons.map((item) => `${item.planet}: D1 ${item.d1Sign}, ${item.d1House}-й дом → D${division} ${item.vargaSign}, ${item.vargaHouse}-й дом.`),
      ];
      return relevant;
    });
    if (vargaEvidence.length) evidence.push({
      source: 'varga', label: `Профильные варги: ${area.vargas.map((item) => 'D' + item).join(', ')}`,
      detail: vargaEvidence.join(' '),
    });

    const dashaPeriods: UnifiedLifeAreaForecast['dashaPeriods'] = [];
    const dashaLayers = [
      dasha.current.mahadasha,
      dasha.current.antardasha,
      dasha.current.pratyantardasha,
    ].filter((item): item is NonNullable<typeof item> => item !== null);
    for (const layer of dashaLayers) {
      const matches = layer.profile.lifeAreaLinks.filter((link) => areaMatches(link.label + ' ' + link.reasons.join(' '), area));
      if (!matches.length) continue;
      const reasons = matches.flatMap((link) => link.reasons);
      dashaPeriods.push({
        layer: layer.layer === 'mahadasha' ? 'Махадаша' : layer.layer === 'antardasha' ? 'Антардаша' : 'Пратьянтардаша',
        planet: layer.profile.planetName, startsAt: layer.startDate, endsAt: layer.endDate,
        evidence: unique(reasons),
      });
      evidence.push({ source: 'dasha', label: `${layer.profile.planetName} · ${layer.layer}`, detail: unique(reasons).join(' ') });
    }

    const transitEvents = transitTimeline.events.filter((event) => {
      if (event.kind === 'house-ingress') return area.houses.includes(event.natalHouse ?? 0);
      if (event.kind === 'sign-ingress') {
        const transitPlanetKey = Object.keys(PLANET_NAMES_RU).find((name) => PLANET_NAMES_RU[name] === event.planet);
        return Boolean(transitPlanetKey && chart.houses?.some((house) => area.houses.includes(house.house) && house.lord === transitPlanetKey));
      }
      if (event.kind === 'exact-aspect') {
        const natalPlanet = Object.keys(chart.planets).find((name) => PLANET_NAMES_RU[name] === event.natalPlanet);
        const ruled = chart.houses?.filter((house) => house.lord === natalPlanet).map((house) => house.house) ?? [];
        const natalHouse = chart.houses?.find((house) => house.sign === chart.planets[natalPlanet as keyof NatalChart['planets']]?.sign)?.house;
        return area.houses.includes(natalHouse ?? 0) || ruled.some((house) => area.houses.includes(house));
      }
      return false;
    });
    const relevantAspectWindows = transitTimeline.aspectWindows.filter((window) => {
      const natalPlanet = Object.keys(chart.planets).find((name) => PLANET_NAMES_RU[name] === window.natalPlanet);
      if (!natalPlanet) return false;
      const natalPosition = chart.planets[natalPlanet as keyof NatalChart['planets']];
      const natalHouse = chart.houses?.find((house) => house.sign === natalPosition.sign)?.house ?? 0;
      const ruledHouses = chart.houses?.filter((house) => house.lord === natalPlanet).map((house) => house.house) ?? [];
      return area.houses.includes(natalHouse) || ruledHouses.some((house) => area.houses.includes(house));
    });
    transitEvents.forEach((event) => evidence.push({
      source: 'transit', label: event.kind === 'exact-aspect' ? `${event.planet} · ${event.aspect} · ${event.natalPlanet}` : `${event.planet} · ${event.kind === 'house-ingress' ? 'вход в дом' : 'вход в знак'}`,
      detail: event.evidence.join(' '),
    }));

    const currentTransitArea = transitNow.lifeAreas.find((item) => area.houses.some((house) => item.houses.includes(house)));
    if (currentTransitArea) {
      currentTransitArea.transitEvidence.forEach((item) => evidence.push({ source: 'transit', label: 'Текущая транзитная связь', detail: item }));
    }
    const activations = transitTimeline.dashaActivations.filter((item) =>
      item.themes.some((theme) => areaMatches(theme, area)) ||
      item.evidence.some((item) => areaMatches(item, area)),
    );
    activations.forEach((item) => {
      if (item.repeatedByTransit) supporting.add(`Повторная активация: ${item.layer} ${item.planet} пересекается с транзитным аспектным окном.`);
      evidence.push({ source: 'dasha', label: `Календарь Даши · ${item.layer} ${item.planet}`, detail: item.evidence.join(' ') });
    });

    relevantAspectWindows.forEach((window) => evidence.push({
      source: 'transit', label: 'Окно транзитного аспекта · ' + window.transitPlanet + ' / ' + window.natalPlanet,
      detail: window.evidence.join(' '),
    }));

    const timingIndicators = [
      ...dashaPeriods.map((item) => `${item.layer} ${item.planet}: ${item.startsAt.toLocaleDateString('ru-RU')} — ${item.endsAt.toLocaleDateString('ru-RU')}.`),
      ...activations.map((item) => `${item.layer} ${item.planet}: ${item.startsAt.toLocaleDateString('ru-RU')} — ${item.endsAt.toLocaleDateString('ru-RU')}; ${item.repeatedByTransit ? 'есть транзитное пересечение' : 'без найденного пересечения'}.`),
      ...relevantAspectWindows.slice(0, 12).map((item) => `Аспект ${item.transitPlanet} — ${item.aspect} — ${item.natalPlanet}: действует ${item.startsAt.toLocaleString('ru-RU')} — ${item.endsAt.toLocaleString('ru-RU')}; точность ${item.exactAt.toLocaleString('ru-RU')}. Связь усиливается к точному моменту и ослабевает после него.`),
      ...transitEvents.slice(0, 12).map((item) => `${item.exactAt.toLocaleString('ru-RU')}: ${item.evidence[0]}`),
    ];
    const sourceCount = evidence.length;
    const dataStatus = sourceCount === 0 ? 'unavailable' : houseInsights.length >= 12 && yoga.dataQuality.complete ? 'complete' : 'partial';
    const synthesis = sourceCount === 0
      ? 'Недостаточно прямых данных для персонального вывода по этой сфере. Отсутствие найденных связей не означает запрет или неблагоприятный исход.'
      : supporting.size && tension.size
        ? 'Смешанная картина: одновременно присутствуют поддерживающие показатели и факторы напряжения. Итог зависит от контекста, поведения и обстоятельств; ни один слой не отменяет остальные.'
        : supporting.size
          ? 'В выбранных правилах заметны поддерживающие факторы. Они описывают символические ресурсы, но не гарантируют результат.'
          : tension.size
            ? 'Есть факторы, требующие внимания и осознанной работы. Они не означают неизбежную проблему или неудачу.'
            : 'Показатели не дают однозначного перевеса. Сферу следует оценивать по совокупности оснований и реальным обстоятельствам.';
    return {
      id: area.id, title: area.title, houses: area.houses,
      supportingFactors: [...supporting], tensionFactors: [...tension],
      timingIndicators: unique(timingIndicators), evidence,
      transitEvents: transitEvents.map((item) => item.id),
      dashaPeriods, vargaEvidence, synthesis,
      dataStatus,
      limitations: [area.limitation, 'Варги и Даша — дополнительные символические слои; D1 остаётся основой.'],
    };
  });

  return {
    generatedAt: new Date(), startDate: new Date(startDate), endDate: new Date(endDate),
    areas, transitTimeline,
    methodology: [
      'D1 — базовый слой: дома, знаки, управители, планеты и их фактические связи.',
      'Йоги учитываются только при выполнении формальных правил; статус incomplete не превращается в not-detected.',
      'Профильные варги используются по назначению (D2/D4/D7/D9/D10/D20/D24 и др.) как уточнение D1, без суммарного балла.',
      'Вимшоттари показывает активные Махадашу, Антардашу и Пратьянтардашу и тематические связи их управителей.',
      'Транзиты показывают фактические положения, точные градусные аспекты и входы в знак/дом относительно натальной Лагны.',
      'Поддержка и напряжение выводятся отдельными списками; противоречащие факторы не сводятся к искусственному рейтингу.',
      'Каждый вывод хранит тип источника и текст evidence, чтобы можно было проследить его происхождение.',
    ],
    warnings: [
      'Астрологическая интерпретация символическая и не является научно подтверждённым прогнозом.',
      'Ни один показатель не гарантирует событие, доход, брак, беременность, рождение ребёнка, карьерный результат или переезд.',
      'Раздел «Дети и родительство» не оценивает фертильность, беременность, здоровье родителей или ребёнка и не прогнозирует медицинские исходы.',
      'Финансовые, медицинские, юридические, психологические и профессиональные решения требуют проверки реальных обстоятельств и профильных специалистов.',
      'Точность варг зависит от достоверности времени рождения; приложение не может независимо подтвердить точность исходного времени.',
    ],
  };
}
