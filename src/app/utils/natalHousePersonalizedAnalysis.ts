import {
  NATAL_PLANET_KEYS,
  type NatalChartFacts,
  type NatalHouseFacts,
  type NatalPlanetKey,
} from './natalChartFacts';

const HOUSE_THEMES: Record<number, string> = {
  1: 'личность, самоощущение, тело и способ начинать действия',
  2: 'личные ресурсы, деньги, накопления, речь и семейные ценности',
  3: 'коммуникация, навыки, обучение через практику и самостоятельные инициативы',
  4: 'дом, семья, образование, эмоциональная опора и личное пространство',
  5: 'творчество, интеллект, увлечения, романтика и тема детей',
  6: 'повседневная работа, обязанности, процессы и решение проблем',
  7: 'партнёрство, брак, клиенты, договорённости и сотрудничество',
  8: 'общие ресурсы, доверие, кризисы, исследование и глубокие перемены',
  9: 'высшее обучение, мировоззрение, наставники и дальние горизонты',
  10: 'профессия, ответственность, репутация и общественная реализация',
  11: 'доходы от деятельности, аудитория, сообщества и долгосрочные цели',
  12: 'уединение, восстановление, расходы, закулисная работа и завершение циклов',
};

const PLANET_FUNCTIONS: Record<NatalPlanetKey, string> = {
  Sun: 'воля, авторство, ответственность и проявление личной позиции',
  Moon: 'эмоциональные потребности, адаптация, забота и повседневные ритмы',
  Mars: 'инициатива, действие, конкуренция и решение сложных задач',
  Mercury: 'анализ, обучение, коммуникация, данные и обмен информацией',
  Jupiter: 'знания, наставничество, принципы и расширение горизонтов',
  Venus: 'отношения, ценности, эстетика, комфорт и согласование интересов',
  Saturn: 'структура, дисциплина, обязательства и долгосрочное мастерство',
  Rahu: 'новый опыт, технологии, амбиции и нестандартные сценарии',
  Ketu: 'исследование, концентрация, специализация и дистанцирование от лишнего',
};

const PLANET_NAMES: Record<NatalPlanetKey, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

export interface NatalHousePersonalizedAnalysis {
  house: number;
  theme: string;
  available: boolean;
  sign: string | null;
  lord: NatalPlanetKey | null;
  lordName: string | null;
  lordHouse: number | null;
  lordSign: string | null;
  lordDignity: string | null;
  ruledHouses: number[];
  occupants: NatalPlanetKey[];
  aspects: NatalPlanetKey[];
  dispositorChain: Array<{ planet: NatalPlanetKey; sign: string; house: number | null; dignity: string | null; aspectedBy: NatalPlanetKey[] }>;
  connectedHouses: number[];
  supportingFactors: string[];
  attentionFactors: string[];
  synthesis: 'supportive' | 'challenging' | 'mixed' | 'neutral' | 'incomplete';
  interpretation: string;
  evidence: string[];
  limitations: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function getDispositorChain(
  facts: NatalChartFacts,
  lord: NatalPlanetKey | null,
): NatalHousePersonalizedAnalysis['dispositorChain'] {
  const chain: NatalHousePersonalizedAnalysis['dispositorChain'] = [];
  const visited = new Set<NatalPlanetKey>();
  let current = lord;

  while (current && !visited.has(current) && chain.length < NATAL_PLANET_KEYS.length) {
    visited.add(current);
    const planet = facts.planets[current];
    if (!planet) break;
    chain.push({ planet: current, sign: planet.sign, house: planet.house, dignity: planet.dignity?.label ?? null, aspectedBy: planet.receivesAspectsFrom });
    current = planet.dispositor;
  }

  return chain;
}

function getHouseRelations(facts: NatalChartFacts, houseNumber: number): number[] {
  const relations = facts.links
    .filter((link) => link.relation === 'house-lord-placed-in' && link.sourceId === `house:${houseNumber}`)
    .map((link) => Number(link.targetId.replace('house:', '')))
    .filter((number) => Number.isInteger(number) && number >= 1 && number <= 12);
  return unique(relations.map(String)).map(Number);
}

function buildHouseAnalysis(
  facts: NatalChartFacts,
  houseNumber: number,
): NatalHousePersonalizedAnalysis {
  const house: NatalHouseFacts | null = facts.houses.find((item) => item.number === houseNumber) ?? null;
  const theme = HOUSE_THEMES[houseNumber];
  if (!house) {
    return {
      house: houseNumber, theme, available: false, sign: null, lord: null, lordName: null,
      lordHouse: null, lordSign: null, lordDignity: null, ruledHouses: [], occupants: [],
      aspects: [], dispositorChain: [], connectedHouses: [], supportingFactors: [],
      attentionFactors: [], synthesis: 'incomplete',
      interpretation: `${houseNumber}-й дом относится к теме «${theme}», но исходные данные этого дома отсутствуют. Персональная трактовка не строится, чтобы не подменять неизвестные показатели предположениями.`,
      evidence: [], limitations: ['Нет записи дома в исходной натальной карте.'],
    };
  }

  const lord = house.lord;
  const lordFacts = lord ? facts.planets[lord] : null;
  const dignity = lordFacts?.dignity?.label ?? null;
  const chain = getDispositorChain(facts, lord);
  const chainText = chain.map((item) =>
    `${PLANET_NAMES[item.planet]} в ${item.sign}${item.house === null ? '' : `, ${item.house}-м доме`}${item.dignity ? `, достоинство: ${item.dignity}` : ''}${item.aspectedBy.length ? `, аспекты от: ${item.aspectedBy.map((key) => PLANET_NAMES[key]).join(', ')}` : ''}`,
  );
  const ruledHouses = lordFacts?.ruledHouses ?? house.ruledBySamePlanet;
  const connectedHouses = getHouseRelations(facts, houseNumber);
  const occupants = house.occupants;
  const aspects = house.aspectedBy;
  const supportingFactors: string[] = [];
  const attentionFactors: string[] = [];
  const evidence: string[] = [
    `Дом ${houseNumber}: знак ${house.sign}; тема — ${theme}.`,
    lord ? `Управитель: ${PLANET_NAMES[lord]}.` : 'Управитель дома не определён.',
    lordFacts?.house === null || !lordFacts
      ? 'Дом управителя не определён по доступным данным.'
      : `${PLANET_NAMES[lord]} расположен в ${lordFacts.house}-м доме.`,
    lordFacts?.dignity ? `Достоинство управителя: ${lordFacts.dignity.label} (качественная оценка ${lordFacts.dignity.score}/100; это не Shadbala).` : 'Достоинство управителя не определено.',
    occupants.length
      ? `Планеты в доме: ${occupants.map((key) => PLANET_NAMES[key]).join(', ')}.`
      : 'Планет в доме нет по используемой модели.',
    aspects.length
      ? `Аспекты на дом: ${aspects.map((key) => PLANET_NAMES[key]).join(', ')} (Parashari graha drishti).`
      : 'Прямые аспекты на дом по используемой схеме не обнаружены.',
  ];

  if (lordFacts?.ruledHouses.length) {
    evidence.push(`${PLANET_NAMES[lord!]} управляет домами: ${lordFacts.ruledHouses.join(', ')}.`);
  }
  if (chain.length) evidence.push(`Цепочка диспозиторов: ${chainText.join(' → ')}.`);
  if (lordFacts?.receivesAspectsFrom.length) evidence.push(`Аспекты на управителя: ${lordFacts.receivesAspectsFrom.map((key) => PLANET_NAMES[key]).join(', ')}.`);
  if (connectedHouses.length) evidence.push(`Дом управителя связывает эту сферу с домом/домами: ${connectedHouses.join(', ')}.`);

  if (lordFacts?.dignity?.dignity === 'exalted' || lordFacts?.dignity?.dignity === 'own') {
    supportingFactors.push(`${PLANET_NAMES[lord!]} — управитель дома — находится в положении «${dignity}»; в традиционной трактовке это поддерживающий показатель.`);
  }
  if (aspects.includes('Jupiter')) {
    supportingFactors.push('Дом получает аспект Юпитера; в традиционной трактовке это может добавлять тему знаний, поддержки или расширения.');
  }
  if (lordFacts?.receivesAspectsFrom.includes('Jupiter')) {
    supportingFactors.push(`Управитель дома получает аспект Юпитера; это дополнительный символический поддерживающий фактор.`);
  }
  if (lordFacts?.dignity?.dignity === 'debilitated') {
    attentionFactors.push(`${PLANET_NAMES[lord!]} находится в знаке падения; этот фактор требует сопоставления с диспозитором, аспектами и другими показателями и не означает неизбежной неудачи.`);
  }
  const pressure = aspects.filter((key) => key === 'Mars' || key === 'Saturn');
  if (pressure.length) {
    attentionFactors.push(`Дом аспектируют ${pressure.map((key) => PLANET_NAMES[key]).join(' и ')}; символически это может усиливать интенсивность, необходимость действовать или выдерживать ограничения.`);
  }
  const lordPressure = lordFacts?.receivesAspectsFrom.filter((key) => key === 'Mars' || key === 'Saturn') ?? [];
  if (lordPressure.length) {
    attentionFactors.push(`Управитель дома получает аспект ${lordPressure.map((key) => PLANET_NAMES[key]).join(' и ')}; важно учитывать эту дополнительную нагрузку в трактовке.`);
  }

  const synthesis = house.dataAvailability.lord !== 'available' || !lord || !lordFacts || house.dataAvailability.lordPlacement === 'missing'
    ? 'incomplete'
    : supportingFactors.length && attentionFactors.length
      ? 'mixed'
      : supportingFactors.length
        ? 'supportive'
        : attentionFactors.length
          ? 'challenging'
          : 'neutral';

  const occupantText = occupants.length
    ? occupants.map((key) => `${PLANET_NAMES[key]} (${PLANET_FUNCTIONS[key]})`).join('; ')
    : 'планет в доме нет, поэтому акцент анализа смещается на знак, управителя и связи';
  const lordText = lord && lordFacts
    ? `Управитель — ${PLANET_NAMES[lord]} (${PLANET_FUNCTIONS[lord]})${lordFacts.house === null ? ', его дом не определён' : `, расположен в ${lordFacts.house}-м доме и связывает тему с этой сферой`}.`
    : 'Управитель или его положение не определены, поэтому вывод о переносе темы между домами ограничен.';
  const signText = `Знак ${house.sign} задаёт общий стиль проявления темы; сам по себе знак не определяет конкретные события.`;
  const connectionText = ruledHouses.length > 1
    ? `Этот же управитель отвечает также за дома ${ruledHouses.filter((number) => number !== houseNumber).join(', ')}; в рамках традиционной модели темы этих домов связываются через одну планету.`
    : '';
  const factorsText = synthesis === 'mixed'
    ? 'Показатели неоднородны: одновременно присутствуют поддерживающие факторы и факторы, требующие внимания.'
    : synthesis === 'supportive'
      ? 'Среди выбранных показателей есть поддерживающие факторы; они не гарантируют конкретный результат.'
      : synthesis === 'challenging'
        ? 'Есть факторы, требующие более внимательного отношения; они не являются приговором или прогнозом неудачи.'
        : synthesis === 'incomplete'
          ? 'Данных недостаточно для целостного вывода.'
          : 'По выбранным критериям нет явного перевеса поддерживающих или напряжённых показателей; это нейтральная, а не отрицательная оценка.';
  const limitations = [
    'Трактовка основана на сидерическом зодиаке, айанамше Лахири, Whole Sign и Parashari graha drishti.',
    'Достоинство — качественный индикатор проекта, а не полная Shadbala; точные орбисы не рассчитываются.',
    'Ретроградность и сожжение не выводятся; аспекты Раху/Кету исключены из принятой схемы.',
    'Это традиционная символическая интерпретация, а не научный прогноз событий.',
  ];

  return {
    house: houseNumber, theme, available: true, sign: house.sign, lord,
    lordName: lord ? PLANET_NAMES[lord] : null,
    lordHouse: lordFacts?.house ?? null,
    lordSign: lordFacts?.sign ?? null,
    lordDignity: dignity,
    ruledHouses,
    occupants,
    aspects,
    dispositorChain: chain,
    connectedHouses,
    supportingFactors,
    attentionFactors,
    synthesis,
    interpretation: `${signText} ${lordText} ${connectionText} Планеты в доме: ${occupantText}. ${factorsText}`,
    evidence,
    limitations,
  };
}

/** Builds a complete 12-house analysis from the canonical chart facts only. */
export function analyzeAllNatalHouses(facts: NatalChartFacts): NatalHousePersonalizedAnalysis[] {
  return Array.from({ length: 12 }, (_, index) => buildHouseAnalysis(facts, index + 1));
}
