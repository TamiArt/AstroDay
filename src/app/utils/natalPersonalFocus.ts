import type { NatalChart } from './astrology';
import { buildNatalChartFacts, getNatalPlanetFacts, type NatalPlanetKey } from './natalChartFacts';
import { describeHouseDrishti, evaluatePlanetCondition, getPlanetHouse, getPlanetToPlanetAspects } from './natalStrengthAnalysis';

const SIGN_NAMES = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const PLANET_THEMES: Record<string, string> = { Sun: 'самостоятельность, авторство, воля и ответственность', Moon: 'эмоциональные потребности, привычки, забота и безопасность', Mars: 'инициатива, действие, конкуренция и защита границ', Mercury: 'анализ, обучение, коммуникация, данные и систематизация', Jupiter: 'обучение, наставничество и расширение знаний', Venus: 'отношения, эстетика, творчество и согласование интересов', Saturn: 'структура, дисциплина, качество и долгосрочная работа', Rahu: 'эксперименты, технологии и нестандартные задачи', Ketu: 'специализация, исследование и углублённое изучение' };
const HOUSE_THEMES: Record<number, string> = { 1: 'личность, самостоятельность и инициативы', 2: 'личные ресурсы, накопления, речь и семейные ценности', 3: 'коммуникация, навыки, обучение и собственные усилия', 4: 'дом, семья, недвижимость и внутренняя опора', 5: 'творчество, обучение, дети и интеллектуальные проекты', 6: 'повседневная работа, сервис, обязанности и решение проблем', 7: 'партнёрство, клиенты и договорённости', 8: 'общие ресурсы, трансформации и исследования', 9: 'высшее образование, мировоззрение и дальние поездки', 10: 'профессия, ответственность и общественная реализация', 11: 'доходы, профессиональные связи и долгосрочные цели', 12: 'уединение, удалённая и международная среда, восстановление' };
const PLANET_RU: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };

function conditionText(chart: NatalChart, name: string): string {
  const condition = evaluatePlanetCondition(chart, name);
  return condition ? 'Достоинство: ' + condition.label + '. ' + condition.explanation : 'Достоинство планеты не удалось определить по доступным данным.';
}
function aspectText(chart: NatalChart, house: number): string {
  const aspects = describeHouseDrishti(chart, house);
  return aspects.length ? 'Аспекты на эту сферу: ' + aspects.join(' ') : 'По используемой схеме классической граха-дришти прямые аспекты на этот дом не найдены.';
}
function getSignDispositor(chart: NatalChart, name: string): string | null {
  const planet = chart.planets[name as keyof NatalChart['planets']];
  if (!planet) return null;
  return chart.houses?.find((house) => house.sign === planet.sign)?.lord ?? null;
}

function dispositorText(chart: NatalChart, name: string): string {
  const planet = chart.planets[name as keyof NatalChart['planets']];
  if (!planet) return '';
  const signHouse = chart.houses?.find((house) => house.sign === planet.sign);
  const dispositor = signHouse?.lord;
  if (!dispositor) return ' Диспозитор знака не определён по данным домов.';
  if (dispositor === name) return ' Диспозитор знака — сама планета: она находится в собственном знаке.';
  const dispositorPosition = chart.planets[dispositor as keyof NatalChart['planets']];
  if (!dispositorPosition) return ' Диспозитор знака — ' + (PLANET_RU[dispositor] ?? dispositor) + ', но его положение в карте не найдено.';
  const house = getPlanetHouse(chart, dispositor);
  const ruledHouses = chart.houses?.filter((item) => item.lord === dispositor).map((item) => item.house) ?? [];
  const condition = evaluatePlanetCondition(chart, dispositor);
  const location = house ? 'расположен в ' + house + '-м доме' : 'его дом не определён';
  const rulership = ruledHouses.length ? ' и управляет домами ' + ruledHouses.join(', ') : '';
  return ' Диспозитор знака — ' + (PLANET_RU[dispositor] ?? dispositor) + ': ' + location + rulership + (condition ? '; достоинство — ' + condition.label : '') + '.';
}

function placementText(chart: NatalChart, name: string, role: string): string {
  const planet = chart.planets[name as keyof NatalChart['planets']];
  if (!planet) return role + ': данные планеты отсутствуют.';
  const house = getPlanetHouse(chart, name);
  const sign = SIGN_NAMES[planet.sign] ?? planet.signName;
  const nakshatra = planet.nakshatraName ? '; накшатра ' + planet.nakshatraName + ', пада ' + planet.pada : '';
  const houseText = house ? house + '-й дом (' + HOUSE_THEMES[house] + ')' : 'дом не определён';
  return role + ' — ' + (PLANET_RU[name] ?? name) + ' в знаке ' + sign + ', ' + houseText + nakshatra + '. Функция планеты: ' + (PLANET_THEMES[name] ?? 'символические качества планеты') + '. ' + conditionText(chart, name) + dispositorText(chart, name) + ' ' + (house ? aspectText(chart, house) : '');
}

export function getAscendantLordFocus(chart: NatalChart): string {
  const firstHouse = chart.houses?.find((house) => house.house === 1);
  if (!firstHouse) return 'Данные первого дома недоступны; интерпретацию управителя Лагны построить нельзя.';
  const lord = firstHouse.lord;
  const placement = chart.planets[lord as keyof NatalChart['planets']];
  if (!placement) return 'Управитель Лагны — ' + (PLANET_RU[lord] ?? lord) + ', но его положение в карте не найдено.';
  const house = getPlanetHouse(chart, lord);
  const sign = SIGN_NAMES[firstHouse.sign] ?? firstHouse.signName;
  const houseMeaning = house ? HOUSE_THEMES[house] : 'сфера положения управителя';
  const nakshatra = placement.nakshatraName ? ', накшатра ' + placement.nakshatraName + ', пада ' + placement.pada : '';
  return 'Лагна в знаке ' + sign + '. Её управитель — ' + (PLANET_RU[lord] ?? lord) + ': ' + (PLANET_THEMES[lord] ?? 'качества планеты') + '. Он расположен в ' + (house ? house + '-м доме — ' + houseMeaning : 'доме, который не удалось определить') + nakshatra + '. Поэтому темы личности и самостоятельных решений символически связываются с ' + houseMeaning + '. ' + conditionText(chart, lord) + ' ' + (house ? aspectText(chart, house) : 'Аспекты на дом управителя не перечислены, поскольку его положение не определено.');
}

export function getMoonHouseFocus(chart: NatalChart, house: number | null): string {
  const moon = chart.planets.Moon;
  if (!moon) return 'Положение Луны в карте не найдено.';
  if (house === null) return 'Знак Луны известен, но дом не определён. Вывод о конкретной жизненной сфере и аспектах дома не строится.';
  const houseMeaning = HOUSE_THEMES[house] ?? 'сферу соответствующего дома';
  const sign = SIGN_NAMES[moon.sign] ?? moon.signName;
  const nakshatra = moon.nakshatraName ? ' Накшатра ' + moon.nakshatraName + ', пада ' + moon.pada + ', добавляет традиционный символический оттенок, но не является психологическим диагнозом.' : '';
  return 'Луна в ' + sign + ', ' + house + '-м доме: эмоциональный комфорт и привычные способы восстановления особенно связаны с темами «' + houseMeaning + '». ' + PLANET_THEMES.Moon + '. ' + conditionText(chart, 'Moon') + nakshatra + ' ' + aspectText(chart, house);
}

function coreIndicatorRole(planet: string, ascendantLord: string): string {
  const roles = [
    ...(planet === ascendantLord ? ['управитель Лагны — базовый способ действовать'] : []),
    ...(planet === 'Sun' ? ['Солнце — воля и самореализация'] : []),
    ...(planet === 'Moon' ? ['Луна — эмоциональные потребности и адаптация'] : []),
  ];
  return roles.join(' и ') || (PLANET_RU[planet] ?? planet);
}

function describeCoreInteraction(
  source: string,
  target: string,
  ascendantLord: string,
  kind: 'conjunction' | 'graha-drishti',
): string {
  const sourceRole = coreIndicatorRole(source, ascendantLord);
  const targetRole = coreIndicatorRole(target, ascendantLord);
  const sourceTheme = PLANET_THEMES[source] ?? 'функции планеты';
  const targetTheme = PLANET_THEMES[target] ?? 'функции планеты';
  if (kind === 'conjunction') {
    return sourceRole + ' и ' + targetRole + ' соединены по знаку: темы «' + sourceTheme + '» и «' + targetTheme + '» в традиционной трактовке действуют совместно. Практический вопрос для самоанализа: где эти две потребности поддерживают друг друга, а где требуют баланса?';
  }
  return sourceRole + ' аспектирует ' + targetRole + ': темы «' + sourceTheme + '» символически влияют на проявление «' + targetTheme + '». Для практического анализа стоит проверить, помогает ли этот канал направлять намерения в конкретные действия или создаёт внутреннее напряжение.';
}

/** Synthesizes the three Jyotish reference points without treating them as interchangeable. */
export function getCoreChartSynthesis(chart: NatalChart): string {
  const firstHouse = chart.houses?.find((house) => house.house === 1);
  if (!firstHouse) return 'Недостаточно данных первого дома для объединённой интерпретации.';
  const ascendantLord = firstHouse.lord;
  const ascendantLordHouse = getPlanetHouse(chart, ascendantLord);
  const sunHouse = getPlanetHouse(chart, 'Sun');
  const moonHouse = getPlanetHouse(chart, 'Moon');
  const lines = [
    placementText(chart, ascendantLord, 'Базовый способ действовать (управитель Лагны)'),
    placementText(chart, 'Sun', 'Вектор воли и самореализации'),
    placementText(chart, 'Moon', 'Эмоциональные потребности и привычный способ адаптации'),
  ];
  const available = [
    { label: 'управитель Лагны', house: ascendantLordHouse },
    { label: 'Солнце', house: sunHouse },
    { label: 'Луна', house: moonHouse },
  ].filter((item): item is { label: string; house: number } => item.house !== null);
  const grouped = new Map<number, string[]>();
  for (const item of available) grouped.set(item.house, [...(grouped.get(item.house) ?? []), item.label]);
  const shared = [...grouped.entries()].filter(([, labels]) => labels.length > 1);
  const synthesis = shared.length
    ? 'Общая точка акцента: ' + shared.map(([house, labels]) => labels.join(' и ') + ' связаны с ' + house + '-м домом (' + HOUSE_THEMES[house] + '). В традиционной символике эта сфера объединяет несколько ключевых показателей карты.').join(' ')
    : 'Ключевые показатели распределены по разным домам. Это не противоречие: управитель Лагны описывает базовый способ действовать, Солнце — волю и самореализацию, Луна — эмоциональные потребности. Их темы раскрываются в разных жизненных областях.';
  const keyPlanets = [...new Set([ascendantLord, 'Sun', 'Moon'])];
  const directAspects = getPlanetToPlanetAspects(chart, keyPlanets);
  const relationshipText = directAspects.length
    ? 'Прямые связи между ключевыми показателями: ' + directAspects.map((aspect) =>
      (aspect.kind === 'conjunction'
        ? aspect.source + ' и ' + aspect.target + ' находятся в одном знаке (' + aspect.sourceHouse + '-й дом). Это соединение по знаку; точная сила соединения по градусному орбису здесь не оценивается. '
        : aspect.source + ' из ' + aspect.sourceHouse + '-го дома аспектирует ' + aspect.target + ' в ' + aspect.targetHouse + '-м доме (' + aspect.offset + '-й аспект). ')
      + describeCoreInteraction(aspect.sourceKey, aspect.targetKey, ascendantLord, aspect.kind)
    ).join(' ') + ' В этой схеме узлы не используют для прямых аспектов.'
    : 'Между управителем Лагны, Солнцем и Луной прямые соединения по знаку или классические взаимные аспекты по используемой схеме не обнаружены.';
  return lines.join('\n\n') + '\n\n' + synthesis + '\n\n' + relationshipText + '\n\nЭто обобщение традиционной астрологической символики, а не научная оценка личности или прогноз событий.';
}

export interface CoreLifeAreaEvidence {
  id: string;
  type: 'planet-placement' | 'house-rulership' | 'dispositor-placement' | 'dispositor-rulership';
  planetKey: string;
  planetLabel: string;
  /** Present for dispositor evidence: the planet whose sign is ruled by this dispositor. */
  dispositedPlanetKey?: string;
  dispositedPlanetLabel?: string;
  house: number;
  /** 0 for a direct placement/rulership; 1–3 for a dispositor-chain step. */
  chainDepth: number;
}

export function formatCoreLifeAreaEvidence(evidence: CoreLifeAreaEvidence): string {
  if (evidence.type === 'planet-placement') {
    return `${evidence.planetLabel} расположен в ${evidence.house}-м доме этой сферы`;
  }
  if (evidence.type === 'house-rulership') {
    return `${evidence.planetLabel} управляет ${evidence.house}-м домом этой сферы`;
  }
  const relation = `диспозитор ${evidence.dispositedPlanetLabel ?? evidence.dispositedPlanetKey ?? 'планеты'}`;
  return evidence.type === 'dispositor-placement'
    ? `${evidence.planetLabel} — ${relation}; расположен в ${evidence.house}-м доме этой сферы`
    : `${evidence.planetLabel} — ${relation}; управляет ${evidence.house}-м домом этой сферы`;
}

export interface CorePlanetaryLink {
  /** Stable, locale-independent identity for this directed planetary relationship. */
  id: string;
  sourceKey: string;
  targetKey: string;
  source: string;
  target: string;
  kind: 'conjunction' | 'graha-drishti';
  offset: number | null;
  sourceHouse: number;
  targetHouse: number;
  /** Concrete chart facts supporting the link's relevance to a life area. */
  evidence: CoreLifeAreaEvidence[];
  description: string;
}

export interface CoreLifeAreaInteraction {
  id: 'career' | 'relationships' | 'money' | 'talents' | 'home';
  title: string;
  /** Structured links are the source of truth; connections remains a display-ready compatibility field. */
  links: CorePlanetaryLink[];
  connections: string[];
}

const CORE_LIFE_AREAS: Array<{
  id: CoreLifeAreaInteraction['id'];
  title: string;
  houses: number[];
}> = [
  { id: 'career', title: 'Профессия и работа', houses: [6, 10, 11] },
  { id: 'relationships', title: 'Отношения и партнёрство', houses: [2, 7] },
  { id: 'money', title: 'Деньги и ресурсы', houses: [2, 8, 11] },
  { id: 'talents', title: 'Обучение и таланты', houses: [3, 5, 9] },
  { id: 'home', title: 'Дом и эмоциональная опора', houses: [4, 12] },
];

function getPlanetaryLinkId(link: {
  sourceKey: string;
  targetKey: string;
  kind: 'conjunction' | 'graha-drishti';
  offset: number | null;
}): string {
  // Keys are astronomical identifiers, not translated labels. Direction is
  // retained because a graha-drishti relationship is directional.
  const [sourceKey, targetKey] = link.kind === 'conjunction'
    ? [link.sourceKey, link.targetKey].sort()
    : [link.sourceKey, link.targetKey];
  return [sourceKey, targetKey, link.kind, link.offset ?? 'same-sign'].join(':');
}

function describePlanetaryLink(link: {
  source: string;
  target: string;
  kind: 'conjunction' | 'graha-drishti';
  offset: number | null;
}): string {
  return link.kind === 'conjunction'
    ? `${link.source} и ${link.target} связаны соединением по знаку`
    : `${link.source} и ${link.target} связаны аспектом ${link.offset}-го дома`;
}

/**
 * Connects calculated direct links between Lagna lord, Sun and Moon with
 * life areas supported by placement, house lordship, or a bounded dispositor
 * chain. Structured link identity and evidence are independent of UI copy.
 */
export function getCoreInteractionsByLifeArea(chart: NatalChart): CoreLifeAreaInteraction[] {
  const firstHouse = chart.houses?.find((house) => house.house === 1);
  if (!firstHouse || !chart.houses?.length) return [];

  const ascendantLord = firstHouse.lord;
  const keyPlanets = [...new Set([ascendantLord, 'Sun', 'Moon'])];
  const directLinks = getPlanetToPlanetAspects(chart, keyPlanets);
  if (!directLinks.length) return [];

  const areaLinks = CORE_LIFE_AREAS.map((area) => {
    // Preserve the existing one-narrative-per-unordered-pair behavior, but
    // select the representative deterministically rather than by input order.
    const uniquePairs = new Map<string, typeof directLinks[number]>();
    for (const link of [...directLinks].sort((a, b) =>
      getPlanetaryLinkId(a) < getPlanetaryLinkId(b) ? -1 : getPlanetaryLinkId(a) > getPlanetaryLinkId(b) ? 1 : 0,
    )) {
      const pairKey = [link.sourceKey, link.targetKey].sort().join(':');
      if (!uniquePairs.has(pairKey)) uniquePairs.set(pairKey, link);
    }

    const links = [...uniquePairs.values()].flatMap((link): CorePlanetaryLink[] => {
      const sourceHouse = getPlanetHouse(chart, link.sourceKey);
      const targetHouse = getPlanetHouse(chart, link.targetKey);
      const sourceRules = chart.houses!.filter((house) => house.lord === link.sourceKey).map((house) => house.house);
      const targetRules = chart.houses!.filter((house) => house.lord === link.targetKey).map((house) => house.house);
      const evidence: CoreLifeAreaEvidence[] = [
        ...(sourceHouse && area.houses.includes(sourceHouse) ? [{
          id: `placement:${link.sourceKey}:${sourceHouse}`, type: 'planet-placement' as const,
          planetKey: link.sourceKey, planetLabel: link.source, house: sourceHouse, chainDepth: 0,
        }] : []),
        ...sourceRules.filter((house) => area.houses.includes(house)).map((house) => ({
          id: `rulership:${link.sourceKey}:${house}`, type: 'house-rulership' as const,
          planetKey: link.sourceKey, planetLabel: link.source, house, chainDepth: 0,
        })),
        ...(targetHouse && area.houses.includes(targetHouse) ? [{
          id: `placement:${link.targetKey}:${targetHouse}`, type: 'planet-placement' as const,
          planetKey: link.targetKey, planetLabel: link.target, house: targetHouse, chainDepth: 0,
        }] : []),
        ...targetRules.filter((house) => area.houses.includes(house)).map((house) => ({
          id: `rulership:${link.targetKey}:${house}`, type: 'house-rulership' as const,
          planetKey: link.targetKey, planetLabel: link.target, house, chainDepth: 0,
        })),
      ];

      const getDispositorEvidence = (planetKey: string, planetLabel: string): CoreLifeAreaEvidence[] => {
        const result: CoreLifeAreaEvidence[] = [];
        const visited = new Set([planetKey]);
        let currentKey = planetKey;
        let currentLabel = planetLabel;

        // The depth bound and visited set protect against incomplete data and cycles.
        for (let depth = 0; depth < 3; depth += 1) {
          const dispositor = getSignDispositor(chart, currentKey);
          if (!dispositor || visited.has(dispositor)) break;
          visited.add(dispositor);
          if (!chart.planets[dispositor as keyof NatalChart['planets']]) break;

          const dispositorLabel = PLANET_RU[dispositor] ?? dispositor;
          const dispositorHouse = getPlanetHouse(chart, dispositor);
          const dispositorRules = chart.houses!.filter((house) => house.lord === dispositor).map((house) => house.house);
          if (dispositorHouse && area.houses.includes(dispositorHouse)) {
            result.push({
              id: `dispositor-placement:${dispositor}:${currentKey}:${dispositorHouse}`,
              type: 'dispositor-placement', planetKey: dispositor, planetLabel: dispositorLabel,
              dispositedPlanetKey: currentKey, dispositedPlanetLabel: currentLabel,
              house: dispositorHouse, chainDepth: depth + 1,
            });
          }
          for (const house of dispositorRules.filter((item) => area.houses.includes(item))) {
            result.push({
              id: `dispositor-rulership:${dispositor}:${currentKey}:${house}`,
              type: 'dispositor-rulership', planetKey: dispositor, planetLabel: dispositorLabel,
              dispositedPlanetKey: currentKey, dispositedPlanetLabel: currentLabel,
              house, chainDepth: depth + 1,
            });
          }

          currentKey = dispositor;
          currentLabel = dispositorLabel;
        }
        return result;
      };

      evidence.push(
        ...getDispositorEvidence(link.sourceKey, link.source),
        ...getDispositorEvidence(link.targetKey, link.target),
      );
      const uniqueEvidence = [...new Map(evidence.map((item) => [item.id, item])).values()];
      if (!uniqueEvidence.length) return [];

      return [{
        id: getPlanetaryLinkId(link),
        sourceKey: link.sourceKey,
        targetKey: link.targetKey,
        source: link.source,
        target: link.target,
        kind: link.kind,
        offset: link.offset,
        sourceHouse: link.sourceHouse,
        targetHouse: link.targetHouse,
        evidence: uniqueEvidence,
        description: describePlanetaryLink(link),
      }];
    });

    if (!links.length) return null;
    return {
      id: area.id,
      title: area.title,
      links,
      connections: links.map((link) =>
        `${link.description}. Основание связи со сферой: ${link.evidence.map(formatCoreLifeAreaEvidence).join('; ')}. Это показывает символическую связь показателей с темой, но не гарантирует событие или результат.`,
      ),
    };
  });

  return areaLinks.filter((item): item is CoreLifeAreaInteraction => item !== null);
}

export interface CoreLifeAreaBridge {
  /** Stable planetary-link identity; never derived from localized prose. */
  id: string;
  connection: string;
  areas: string[];
  evidenceByArea: Array<{ areaId: CoreLifeAreaInteraction['id']; areaTitle: string; evidence: CoreLifeAreaEvidence[] }>;
  explanation: string;
}

/**
 * Finds one structured planetary link when it has independent evidence in
 * at least two life areas. Grouping uses the stable link id, not UI text.
 */
export function getCoreLifeAreaBridges(chart: NatalChart): CoreLifeAreaBridge[] {
  const interactions = getCoreInteractionsByLifeArea(chart);
  const grouped = new Map<string, {
    link: CorePlanetaryLink;
    areas: string[];
    evidenceByArea: CoreLifeAreaBridge['evidenceByArea'];
  }>();

  for (const area of interactions) {
    for (const link of area.links) {
      const current = grouped.get(link.id) ?? {
        link,
        areas: [],
        evidenceByArea: [],
      };
      if (!current.areas.includes(area.title)) {
        current.areas.push(area.title);
        current.evidenceByArea.push({
          areaId: area.id,
          areaTitle: area.title,
          evidence: [...link.evidence],
        });
      }
      grouped.set(link.id, current);
    }
  }

  return [...grouped.entries()]
    .filter(([, value]) => value.areas.length >= 2)
    .map(([id, value]) => ({
      id,
      connection: value.link.description,
      areas: value.areas,
      evidenceByArea: value.evidenceByArea,
      explanation: 'Одна и та же связь ключевых показателей имеет отдельные подтверждения в нескольких сферах. Это помогает увидеть пересечение тем, но не означает, что одна сфера автоматически вызывает события в другой.',
    }));
}


/**
 * Chart-grounded Ascendant reading. Generic sign descriptions are deliberately
 * kept separate from facts that can be verified in the supplied chart.
 */
export function getAscendantChartFocus(chart: NatalChart): string {
  const facts = buildNatalChartFacts(chart);
  const firstHouse = facts.houses.find((house) => house.number === 1);
  if (!firstHouse) return 'Данные первого дома отсутствуют: знак Лагны и её управителя нельзя надёжно связать с домами карты.';
  const degree = facts.chart.ascendantDegree === null ? '' : `, долгота в знаке ${facts.chart.ascendantDegree.toFixed(2)}°`;
  const nakshatra = facts.chart.ascendantNakshatra ? `; накшатра ${facts.chart.ascendantNakshatra}, пада ${facts.chart.ascendantPada ?? 'не определена'}` : '';
  return `Факты вашей карты: Лагна находится в знаке ${firstHouse.sign}${degree}${nakshatra}. Управитель этого знака — ${PLANET_RU[firstHouse.lord ?? ''] ?? firstHouse.lord ?? 'не определён'}. ${getAscendantLordFocus(chart)}`;
}

/** Returns only chart-derived facts for a planet; no sign-only generic text is injected. */
export function getPlanetChartFocus(chart: NatalChart, planetKey: string): string {
  if (!Object.prototype.hasOwnProperty.call(chart.planets, planetKey)) {
    return `Положение планеты ${PLANET_RU[planetKey] ?? planetKey} отсутствует в данных карты.`;
  }
  const facts = buildNatalChartFacts(chart);
  const planet = getNatalPlanetFacts(facts, planetKey as NatalPlanetKey);
  if (!planet) return `Положение планеты ${PLANET_RU[planetKey] ?? planetKey} отсутствует в данных карты.`;
  const placement = planet.house
    ? `${planet.name} находится в ${planet.sign}, ${planet.house}-м доме (долгота ${planet.longitude.toFixed(2)}°).`
    : `${planet.name} находится в знаке ${planet.sign}; дом по имеющимся данным не определён.`;
  const rulership = planet.ruledHouses.length
    ? ` Управляет домами ${planet.ruledHouses.join(', ')}.`
    : ' Управляемые дома по текущим данным не определены.';
  const nakshatra = planet.nakshatra
    ? ` Накшатра: ${planet.nakshatra}, пада ${planet.pada}.`
    : '';
  const dignity = planet.dignity
    ? ` Достоинство: ${planet.dignity.label}. ${planet.dignity.explanation}`
    : ' Достоинство не определено по доступным данным.';
  const dispositor = planet.dispositor
    ? ` Диспозитор знака — ${PLANET_RU[planet.dispositor]}; ${planet.dispositorHouse ? `расположен в ${planet.dispositorHouse}-м доме` : 'его дом не определён'}.`
    : ' Диспозитор знака не определён по доступным данным.';
  const conjunctions = planet.conjunctions.length
    ? ` Соединение по знаку с: ${planet.conjunctions.map((key) => PLANET_RU[key]).join(', ')}; точный орбис не рассчитывается.`
    : ' Другие планеты в том же знаке не обнаружены.';
  const aspects = planet.aspectsToHouses.length
    ? ` Аспектирует дома: ${planet.aspectsToHouses.join(', ')} по используемой схеме граха-дришти.`
    : ' Исходящие аспекты на дома по используемой схеме не найдены.';
  const receives = planet.receivesAspectsFrom.length
    ? ` На положение планеты приходят аспекты: ${planet.receivesAspectsFrom.map((key) => PLANET_RU[key]).join(', ')}.`
    : ' Входящие межпланетные аспекты по используемой схеме не найдены.';
  return placement + rulership + nakshatra + dignity + dispositor + conjunctions + aspects + receives;
}
