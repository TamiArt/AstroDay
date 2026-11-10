import {
  NATAL_PLANET_KEYS,
  type NatalChartFacts,
  type NatalPlanetFacts,
  type NatalPlanetKey,
} from './natalChartFacts';

const PLANET_FUNCTIONS: Record<NatalPlanetKey, string> = {
  Sun: 'воля, самоопределение, авторство, ответственность и способность занимать центральную позицию',
  Moon: 'эмоциональные потребности, адаптация, память, забота и повседневные ритмы',
  Mars: 'инициатива, энергия действия, защита границ, конкуренция и решение задач',
  Mercury: 'мышление, анализ, обучение, речь, обмен информацией и навыки',
  Jupiter: 'знания, наставничество, мировоззрение, принципы и расширение горизонтов',
  Venus: 'отношения, ценности, эстетика, удовольствие, согласование интересов и комфорт',
  Saturn: 'структура, дисциплина, обязательства, ограничения и долгосрочное мастерство',
  Rahu: 'необычный опыт, амбиции, усиление интереса к новому и нетрадиционные стратегии',
  Ketu: 'исследование, специализация, концентрация и дистанцирование от привычных сценариев',
};

const PLANET_NAMES: Record<NatalPlanetKey, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

export type DispositorChainEnd = 'self-dispositor' | 'cycle' | 'missing-dispositor' | 'missing-planet' | 'limit';

export interface NatalPlanetDispositorStep {
  planet: NatalPlanetKey;
  sign: string;
  house: number | null;
  dignity: string | null;
  dignityKind: NatalPlanetFacts['dignity'] extends infer T ? T extends { dignity: infer D } ? D : never : never;
  receivesAspectsFrom: NatalPlanetKey[];
}

export interface NatalPlanetPersonalizedAnalysis {
  planet: NatalPlanetKey;
  name: string;
  available: boolean;
  function: string;
  sign: string | null;
  degreeInSign: number | null;
  house: number | null;
  nakshatra: string | null;
  pada: number | null;
  ruledHouses: number[];
  dignity: NatalPlanetFacts['dignity'];
  conjunctions: NatalPlanetKey[];
  aspectsToPlanets: NatalPlanetKey[];
  receivesAspectsFrom: NatalPlanetKey[];
  aspectsToHouses: number[];
  dispositor: NatalPlanetKey | null;
  dispositorHouse: number | null;
  dispositorChain: NatalPlanetDispositorStep[];
  dispositorChainEnd: DispositorChainEnd;
  supportingFactors: string[];
  attentionFactors: string[];
  synthesis: 'supportive' | 'challenging' | 'mixed' | 'neutral' | 'incomplete';
  interpretation: string;
  evidence: string[];
  limitations: string[];
}

function getDispositorChain(
  facts: NatalChartFacts,
  start: NatalPlanetKey,
): { steps: NatalPlanetDispositorStep[]; end: DispositorChainEnd } {
  const steps: NatalPlanetDispositorStep[] = [];
  const visited = new Set<NatalPlanetKey>();
  let current: NatalPlanetKey | null = start;

  while (current && steps.length < NATAL_PLANET_KEYS.length) {
    if (visited.has(current)) return { steps, end: 'cycle' };
    const item = facts.planets[current];
    if (!item) return { steps, end: 'missing-planet' };
    visited.add(current);
    steps.push({
      planet: current,
      sign: item.sign,
      house: item.house,
      dignity: item.dignity?.label ?? null,
      dignityKind: item.dignity?.dignity ?? null,
      receivesAspectsFrom: item.receivesAspectsFrom,
    });
    if (!item.dispositor) return { steps, end: 'missing-dispositor' };
    if (item.dispositor === current) return { steps, end: 'self-dispositor' };
    current = item.dispositor;
  }

  return { steps, end: current ? 'limit' : 'missing-dispositor' };
}

function analyzePlanet(
  facts: NatalChartFacts,
  key: NatalPlanetKey,
): NatalPlanetPersonalizedAnalysis {
  const item = facts.planets[key];
  const base = {
    planet: key,
    name: PLANET_NAMES[key],
    function: PLANET_FUNCTIONS[key],
  };
  const limitations = [
    'Положение рассчитывается в сидерическом зодиаке с айанамшей Лахири и системой домов Whole Sign.',
    'Достоинство — качественная оценка знака, а не полная Shadbala и не измерение объективной силы.',
    'Соединение фиксируется по общему знаку; точный орбис соединения не рассчитывается.',
    'Аспекты планет рассчитаны по Parashari graha drishti; аспекты Раху/Кету исключены из-за различий школ.',
    'Ретроградность и сожжение не выводятся, поскольку эти валидированные показатели отсутствуют в исходной модели.',
    'Интерпретация описывает традиционную символическую модель и не предсказывает неизбежные события.',
  ];

  if (!item) {
    return {
      ...base, available: false, sign: null, degreeInSign: null, house: null,
      nakshatra: null, pada: null, ruledHouses: [], dignity: null,
      conjunctions: [], aspectsToPlanets: [], receivesAspectsFrom: [],
      aspectsToHouses: [], dispositor: null, dispositorHouse: null,
      dispositorChain: [], dispositorChainEnd: 'missing-planet',
      supportingFactors: [], attentionFactors: [], synthesis: 'incomplete',
      interpretation: `${PLANET_NAMES[key]} отсутствует в исходных данных карты. Персональный анализ положения, достоинства, аспектов и диспозитора не строится.`,
      evidence: [`В модели NatalChartFacts для ${PLANET_NAMES[key]} нет рассчитанной позиции.`],
      limitations,
    };
  }

  const chain = getDispositorChain(facts, key);
  const dignity = item.dignity;
  const supportingFactors: string[] = [];
  const attentionFactors: string[] = [];
  const evidence = [
    `${PLANET_NAMES[key]} находится в знаке ${item.sign}, на ${item.degreeInSign.toFixed(2)}° знака.`,
    item.house === null
      ? 'Дом планеты не определён по доступным данным.'
      : `Планета расположена в ${item.house}-м доме Whole Sign.`,
    `Накшатра: ${item.nakshatra}, пада: ${item.pada}.`,
    dignity
      ? `Оценка достоинства: «${dignity.label}»; категория: ${dignity.dignity}${dignity.score === null ? '' : `; условный индекс проекта ${dignity.score}/100`}.`
      : 'Оценка достоинства недоступна.',
    item.ruledHouses.length
      ? `Управляет домами: ${item.ruledHouses.join(', ')}.`
      : 'В списке управителей домов эта планета не указана.',
    item.conjunctions.length
      ? `Соединения по общему знаку: ${item.conjunctions.map((planet) => PLANET_NAMES[planet]).join(', ')}.`
      : 'Других планет в том же знаке по правилу соединения проекта нет.',
    item.aspectsToPlanets.length
      ? `Аспектирует планеты: ${item.aspectsToPlanets.map((planet) => PLANET_NAMES[planet]).join(', ')}.`
      : 'Исходящие межпланетные аспекты по принятой схеме не обнаружены.',
    item.receivesAspectsFrom.length
      ? `Получает аспекты от: ${item.receivesAspectsFrom.map((planet) => PLANET_NAMES[planet]).join(', ')}.`
      : 'Входящие межпланетные аспекты по принятой схеме не обнаружены.',
    item.aspectsToHouses.length
      ? `Аспектирует дома: ${item.aspectsToHouses.join(', ')}.`
      : 'Исходящие аспекты на дома по принятой схеме не обнаружены.',
  ];

  if (dignity?.dignity === 'exalted' || dignity?.dignity === 'own') {
    supportingFactors.push(`${PLANET_NAMES[key]} находится в положении «${dignity.label}»; в традиционной трактовке это считается поддержкой качеств планеты.`);
  }
  if (item.receivesAspectsFrom.includes('Jupiter')) {
    supportingFactors.push('Планета получает аспект Юпитера; в символической трактовке он может добавлять тему знаний, наставничества или расширения.');
  }
  if (dignity?.dignity === 'debilitated') {
    attentionFactors.push(`${PLANET_NAMES[key]} находится в знаке падения; это фактор для дополнительного анализа, но не самостоятельный вывод о неудаче.`);
  }
  const pressureAspects = item.receivesAspectsFrom.filter((planet) => planet === 'Mars' || planet === 'Saturn');
  if (pressureAspects.length) {
    attentionFactors.push(`Планета получает аспект ${pressureAspects.map((planet) => PLANET_NAMES[planet]).join(' и ')}; в традиционной трактовке это может указывать на более интенсивный или дисциплинирующий контекст.`);
  }
  if (item.conjunctions.length) {
    const conjunctions = item.conjunctions.map((planet) => PLANET_NAMES[planet]).join(', ');
    evidence.push(`Соединение по знаку: ${PLANET_NAMES[key]} вместе с ${conjunctions}; точный орбис не оценивался.`);
  }

  const chainText = chain.steps.map((step) =>
    `${PLANET_NAMES[step.planet]} в ${step.sign}${step.house === null ? '' : `, ${step.house}-м доме`}${step.dignity ? ` (${step.dignity})` : ''}`,
  );
  if (chain.steps.length) {
    evidence.push(`Цепочка диспозиторов: ${chainText.join(' → ')}.`);
    const last = chain.steps[chain.steps.length - 1];
    if (chain.end === 'self-dispositor') {
      evidence.push(`Цепочка завершается на ${PLANET_NAMES[last.planet]}: планета находится в собственном знаке и является собственным диспозитором.`);
    } else if (chain.end === 'cycle') {
      evidence.push('В цепочке обнаружен цикл диспозиторов; повторное звено не добавлялось.');
    } else if (chain.end === 'missing-dispositor' || chain.end === 'missing-planet') {
      evidence.push('Цепочка диспозиторов неполная: следующий диспозитор отсутствует в доступных данных.');
    }
  }

  const synthesis = item.dataAvailability.house === 'missing' || item.dataAvailability.dignity === 'missing'
    ? 'incomplete'
    : supportingFactors.length && attentionFactors.length
      ? 'mixed'
      : supportingFactors.length
        ? 'supportive'
        : attentionFactors.length
          ? 'challenging'
          : 'neutral';

  const houseText = item.house === null ? 'дом не определён' : `${item.house}-й дом`;
  const dignityText = dignity
    ? dignity.dignity === 'not_applicable'
      ? 'для узла отдельная оценка достоинства не применяется'
      : `оценка достоинства — «${dignity.label}»`
    : 'достоинство не определено';
  const ruledText = item.ruledHouses.length
    ? `Планета управляет домами ${item.ruledHouses.join(', ')}.`
    : 'В доступной модели управляемые дома не указаны.';
  const conjunctionText = item.conjunctions.length
    ? `Соединение по знаку с ${item.conjunctions.map((planet) => PLANET_NAMES[planet]).join(', ')} связывает символические функции этих планет; без точного орбиса нельзя судить о тесноте соединения.`
    : 'Соединений с другими планетами по принятому правилу нет.';
  const aspectText = [
    item.aspectsToPlanets.length ? `Исходящие аспекты направлены к ${item.aspectsToPlanets.map((planet) => PLANET_NAMES[planet]).join(', ')}` : '',
    item.receivesAspectsFrom.length ? `входящие аспекты идут от ${item.receivesAspectsFrom.map((planet) => PLANET_NAMES[planet]).join(', ')}` : '',
    item.aspectsToHouses.length ? `также затрагиваются дома ${item.aspectsToHouses.join(', ')}` : '',
  ].filter(Boolean).join('; ');
  const dispositorText = item.dispositor
    ? item.dispositor === key
      ? 'Планета является собственным диспозитором: её знак управляется ею самой.'
      : `Диспозитор — ${PLANET_NAMES[item.dispositor]}${item.dispositorHouse === null ? ', его дом не определён' : `, расположен в ${item.dispositorHouse}-м доме`}.`
    : 'Диспозитор не определён по доступным данным.';
  const factorText = synthesis === 'mixed'
    ? 'Показатели неоднородны: есть как поддерживающие факторы, так и факторы, требующие внимания.'
    : synthesis === 'supportive'
      ? 'По выбранным критериям присутствуют традиционные поддерживающие факторы; они не гарантируют конкретных результатов.'
      : synthesis === 'challenging'
        ? 'Есть показатели, требующие дополнительного внимания; они не означают неизбежных трудностей.'
        : synthesis === 'incomplete'
          ? 'Для целостной оценки не хватает части исходных показателей.'
          : 'По выбранным критериям нет явного перевеса поддерживающих или требующих внимания факторов.';

  return {
    ...base,
    available: true,
    sign: item.sign,
    degreeInSign: item.degreeInSign,
    house: item.house,
    nakshatra: item.nakshatra,
    pada: item.pada,
    ruledHouses: item.ruledHouses,
    dignity,
    conjunctions: item.conjunctions,
    aspectsToPlanets: item.aspectsToPlanets,
    receivesAspectsFrom: item.receivesAspectsFrom,
    aspectsToHouses: item.aspectsToHouses,
    dispositor: item.dispositor,
    dispositorHouse: item.dispositorHouse,
    dispositorChain: chain.steps,
    dispositorChainEnd: chain.end,
    supportingFactors,
    attentionFactors,
    synthesis,
    interpretation: `${PLANET_NAMES[key]} в ${item.sign}, ${houseText}: ${PLANET_FUNCTIONS[key]}. ${dignityText}. ${ruledText} ${dispositorText} ${conjunctionText}${aspectText ? ` ${aspectText}.` : ''} ${factorText}`,
    evidence,
    limitations,
  };
}

/** Returns one personalized analysis record for each of the nine grahas. */
export function analyzeAllNatalPlanets(facts: NatalChartFacts): NatalPlanetPersonalizedAnalysis[] {
  return NATAL_PLANET_KEYS.map((key) => analyzePlanet(facts, key));
}
