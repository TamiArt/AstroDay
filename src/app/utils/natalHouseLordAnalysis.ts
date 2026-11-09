import type { NatalChart } from './astrology';
import {
  evaluatePlanetCondition,
  getGrahaDrishti,
  getPlanetHouse,
  type HouseDrishti,
} from './natalStrengthAnalysis';

const PLANET_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const SIGN_RU = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const HOUSE_THEMES: Record<number, string> = {
  1: 'личность, самостоятельность и жизненная стратегия',
  2: 'личные ресурсы, накопления, речь и семейные ценности',
  3: 'коммуникация, навыки, обучение и собственные усилия',
  4: 'дом, семья, недвижимость и внутренняя опора',
  5: 'творчество, интеллект, дети и личные проекты',
  6: 'повседневная работа, обязанности, сервис и решение проблем',
  7: 'партнёрство, клиенты и договорённости',
  8: 'общие ресурсы, перемены, исследование и управление рисками',
  9: 'высшее обучение, мировоззрение и наставники',
  10: 'профессия, ответственность и общественная реализация',
  11: 'доходы, аудитория, профессиональные связи и долгосрочные цели',
  12: 'уединение, восстановление, удалённая и международная среда',
};

export interface DispositorStep {
  planet: string;
  planetKey: string;
  sign: string;
  house: number | null;
  ruledHouses: number[];
  dignity: string;
  depth: number;
  relation: string;
}

export interface HouseLordInsight {
  house: number;
  houseSign: string;
  houseTheme: string;
  lord: string;
  lordKey: string;
  lordSign: string | null;
  lordHouse: number | null;
  lordNakshatra: string | null;
  dignity: string;
  dignityExplanation: string;
  ruledHouses: number[];
  dispositorChain: DispositorStep[];
  chainCycleDetected: boolean;
  chainMissingPlanet: string | null;
  incomingAspects: HouseDrishti[];
  outgoingAspects: HouseDrishti[];
  conjunctions: string[];
  repeatedRulership: string | null;
  supportingFactors: string[];
  attentionFactors: string[];
  overallSynthesis: string;
  interpretation: string;
  evidence: string[];
}

function planetLabel(key: string): string {
  return PLANET_RU[key] ?? key;
}

function houseLabel(house: number | null): string {
  return house ? `${house}-й дом (${HOUSE_THEMES[house] ?? 'сфера дома'})` : 'дом не определён';
}

function getDispositor(chart: NatalChart, planetKey: string): string | null {
  const position = chart.planets[planetKey as keyof NatalChart['planets']];
  if (!position) return null;
  return chart.houses?.find((house) => house.sign === position.sign)?.lord ?? null;
}

function buildDispositorChain(chart: NatalChart, initialLord: string): {
  steps: DispositorStep[];
  cycleDetected: boolean;
  missingPlanet: string | null;
} {
  const steps: DispositorStep[] = [];
  const visited = new Set<string>();
  let current = initialLord;
  let cycleDetected = false;
  let missingPlanet: string | null = null;

  // Three transitions are enough to expose a useful dependency chain without
  // turning a chart interpretation into an unbounded graph traversal.
  for (let depth = 0; depth <= 3; depth += 1) {
    if (visited.has(current)) {
      cycleDetected = true;
      break;
    }
    visited.add(current);
    const position = chart.planets[current as keyof NatalChart['planets']];
    if (!position) {
      missingPlanet = current;
      break;
    }
    const condition = evaluatePlanetCondition(chart, current);
    const house = getPlanetHouse(chart, current);
    const ruledHouses = chart.houses?.filter((item) => item.lord === current).map((item) => item.house) ?? [];
    steps.push({
      planet: planetLabel(current),
      planetKey: current,
      sign: SIGN_RU[position.sign] ?? position.signName,
      house,
      ruledHouses,
      dignity: condition?.label ?? 'не определено',
      depth,
      relation: depth === 0 ? 'управитель дома' : 'диспозитор предыдущей планеты',
    });
    const next = getDispositor(chart, current);
    if (!next) break;
    if (visited.has(next)) {
      cycleDetected = true;
      break;
    }
    if (depth === 3) break;
    current = next;
  }

  return { steps, cycleDetected, missingPlanet };
}

function describeAspect(aspect: HouseDrishti): string {
  return `${aspect.source} из ${aspect.sourceHouse}-го дома направляет ${aspect.kind.toLowerCase()} на ${aspect.targetHouse}-й дом`;
}

/**
 * Builds a complete, evidence-led profile for each available house lord.
 * It uses whole-sign house placement and the classical Parashari drishti
 * implementation already shared by the rest of the natal-chart analysis.
 */
export function analyzeHouseLords(chart: NatalChart): HouseLordInsight[] {
  if (!chart.houses?.length) return [];
  const aspects = getGrahaDrishti(chart);
  const sortedHouses = [...chart.houses].sort((a, b) => a.house - b.house);
  const rulershipCounts = new Map<string, number[]>();
  for (const house of sortedHouses) {
    rulershipCounts.set(house.lord, [...(rulershipCounts.get(house.lord) ?? []), house.house]);
  }

  return sortedHouses.map((house) => {
    const lordKey = house.lord;
    const lordPosition = chart.planets[lordKey as keyof NatalChart['planets']];
    const lordHouse = lordPosition ? getPlanetHouse(chart, lordKey) : null;
    const lordCondition = lordPosition ? evaluatePlanetCondition(chart, lordKey) : null;
    const ruledHouses = rulershipCounts.get(lordKey) ?? [];
    const incomingAspects = lordHouse
      ? aspects.filter((item) => item.targetHouse === lordHouse)
      : [];
    const outgoingAspects = aspects.filter((item) => item.source === planetLabel(lordKey));
    const conjunctions = lordPosition
      ? Object.keys(chart.planets)
        .filter((name) => name !== lordKey && chart.planets[name as keyof NatalChart['planets']].sign === lordPosition.sign)
        .map(planetLabel)
      : [];
    const chain = lordPosition
      ? buildDispositorChain(chart, lordKey)
      : { steps: [], cycleDetected: false, missingPlanet: lordKey };
    const repeatedRulership = ruledHouses.length > 1
      ? `${planetLabel(lordKey)} управляет также домами ${ruledHouses.filter((item) => item !== house.house).join(', ')}. Темы этих домов в традиционной трактовке переплетены через одного управителя.`
      : null;

    const supportingFactors: string[] = [];
    const attentionFactors: string[] = [];
    if (lordCondition?.dignity === 'exalted' || lordCondition?.dignity === 'own') {
      supportingFactors.push(`${planetLabel(lordKey)} находится в положении «${lordCondition.label}» — это традиционно считается ресурсом для проявления функций управителя.`);
    }
    if (incomingAspects.some((item) => item.source === 'Юпитер')) {
      supportingFactors.push('Положение управителя получает аспект Юпитера по используемой схеме граха-дришти; это отдельный поддерживающий символический фактор.');
    }
    if (lordCondition?.dignity === 'debilitated') {
      attentionFactors.push(`${planetLabel(lordKey)} находится в знаке падения. Это не отменяет управляемые темы, но в традиционной трактовке предлагает внимательнее рассмотреть способы реализации функций планеты.`);
    }
    const challengingAspects = incomingAspects.filter((item) => item.source === 'Марс' || item.source === 'Сатурн');
    if (challengingAspects.length) {
      attentionFactors.push(`На положение управителя приходят аспекты ${[...new Set(challengingAspects.map((item) => item.source))].join(' и ')}. Их трактовка зависит от всей карты; здесь они отмечены как факторы дополнительной нагрузки, а не как однозначно неблагоприятный результат.`);
    }
    if (chain.cycleDetected) {
      attentionFactors.push('В цепочке диспозиторов обнаружен цикл. Анализ остановлен на повторе планеты, чтобы не создавать искусственную бесконечную последовательность.');
    }
    if (!supportingFactors.length) {
      supportingFactors.push('По выбранным узким критериям экзальтации, собственного знака и аспекта Юпитера выраженная поддержка не выделена; это не означает отсутствия ресурсов.');
    }
    if (!attentionFactors.length) {
      attentionFactors.push('По выбранным критериям падения и аспектов Марса/Сатурна отдельный фактор повышенного внимания не выделен.');
    }
    const hasSupport = lordCondition?.dignity === 'exalted' || lordCondition?.dignity === 'own'
      || incomingAspects.some((item) => item.source === 'Юпитер');
    const hasAttention = lordCondition?.dignity === 'debilitated' || challengingAspects.length > 0 || chain.cycleDetected;
    const overallSynthesis = hasSupport && hasAttention
      ? 'Смешанная картина: у управителя есть поддерживающие показатели и одновременно факторы, требующие внимания. Их следует читать вместе, не сводя положение к ярлыку «хорошее» или «плохое».'
      : hasSupport
        ? 'В выбранной системе критериев заметнее поддерживающие показатели. Это символический ресурс, а не гарантия результата.'
        : hasAttention
          ? 'В выбранной системе критериев заметнее факторы дополнительной нагрузки. Они обозначают темы для осознанной работы, а не неизбежные препятствия.'
          : 'Выраженного перевеса по выбранным критериям нет. Вывод остаётся нейтральным и зависит от контекста всей карты.';

    const houseTheme = HOUSE_THEMES[house.house] ?? 'сфера дома';
    const placementTheme = lordHouse ? HOUSE_THEMES[lordHouse] : null;
    const interpretation = lordPosition && lordHouse
      ? `Управитель ${house.house}-го дома — ${planetLabel(lordKey)} — находится в ${houseLabel(lordHouse)}. Поэтому темы «${houseTheme}» и «${placementTheme}» связываются: дела исходного дома символически направляются в сферу дома положения управителя. Сам управитель находится в знаке ${SIGN_RU[lordPosition.sign] ?? lordPosition.signName}; его достоинство — «${lordCondition?.label ?? 'не определено'}». ${repeatedRulership ?? ''}`
      : `Управитель ${house.house}-го дома — ${planetLabel(lordKey)}, но его положение не найдено в данных карты. Надёжно связать темы исходного дома с домом положения управителя нельзя.`;
    const evidence = [
      `Дом ${house.house}: знак ${SIGN_RU[house.sign] ?? house.signName}; тема — ${houseTheme}.`,
      `Управитель: ${planetLabel(lordKey)}.`,
      lordPosition
        ? `Положение управителя: ${SIGN_RU[lordPosition.sign] ?? lordPosition.signName}, ${houseLabel(lordHouse)}; накшатра ${lordPosition.nakshatraName}, пада ${lordPosition.pada}.`
        : 'Положение управителя отсутствует в данных карты.',
      lordCondition
        ? `Достоинство: ${lordCondition.label}. ${lordCondition.explanation}`
        : 'Достоинство не оценено: позиция управителя недоступна.',
      `Управляемые тем же управителем дома: ${ruledHouses.join(', ')}.`,
      ...chain.steps.map((step) => `Цепочка, шаг ${step.depth}: ${step.planet} в ${step.sign}, ${houseLabel(step.house)}; управляет домами ${step.ruledHouses.join(', ') || 'не определены'}; достоинство — ${step.dignity}.`),
      ...incomingAspects.map((item) => `Входящее влияние на управителя: ${describeAspect(item)}.`),
      ...outgoingAspects.map((item) => `Аспект управителя: ${describeAspect(item)}.`),
      ...(conjunctions.length ? [`Соединение по знаку с планетами: ${conjunctions.join(', ')}. Точный орбис соединения не рассчитывается.`] : ['Другие планеты в том же знаке с управителем не обнаружены.']),
      ...(chain.cycleDetected ? ['Цикл диспозиторов обнаружен и остановлен.'] : []),
      ...(chain.missingPlanet ? [`Не найдены данные планеты ${planetLabel(chain.missingPlanet)} в цепочке.`] : []),
    ];

    return {
      house: house.house,
      houseSign: SIGN_RU[house.sign] ?? house.signName,
      houseTheme,
      lord: planetLabel(lordKey),
      lordKey,
      lordSign: lordPosition ? SIGN_RU[lordPosition.sign] ?? lordPosition.signName : null,
      lordHouse,
      lordNakshatra: lordPosition?.nakshatraName ?? null,
      dignity: lordCondition?.label ?? 'не определено',
      dignityExplanation: lordCondition?.explanation ?? 'Недостаточно данных для оценки достоинства.',
      ruledHouses,
      dispositorChain: chain.steps,
      chainCycleDetected: chain.cycleDetected,
      chainMissingPlanet: chain.missingPlanet,
      incomingAspects,
      outgoingAspects,
      conjunctions,
      repeatedRulership,
      supportingFactors,
      attentionFactors,
      overallSynthesis,
      interpretation,
      evidence,
    };
  });
}
