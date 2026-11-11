import { NATAL_PLANET_KEYS, type NatalChartFacts, type NatalPlanetKey } from './natalChartFacts';

export type YogaCategory = 'raja' | 'wealth' | 'mahapurusha' | 'lunar' | 'exchange' | 'vipareeta';
export type YogaCheckStatus = 'detected' | 'not-detected' | 'incomplete';

export interface NatalYogaFinding {
  id: string;
  name: string;
  sanskritName: string;
  category: YogaCategory;
  description: string;
  formalRule: string;
  participants: NatalPlanetKey[];
  houses: number[];
  evidence: string[];
  caveats: string[];
}

export interface NatalYogaRuleCheck {
  id: string;
  name: string;
  status: YogaCheckStatus;
  findingId: string | null;
  findingIds: string[];
  reason: string;
  missingFacts: string[];
}

export interface NatalYogaAnalysis {
  findings: NatalYogaFinding[];
  checks: NatalYogaRuleCheck[];
  dataQuality: {
    complete: boolean;
    missingPlanets: NatalPlanetKey[];
    missingHouses: number[];
    warnings: string[];
  };
  methodology: string[];
}

const PLANET_NAMES: Record<NatalPlanetKey, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const SIGN_NAMES = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const SIGN_LORDS: NatalPlanetKey[] = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];
const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];
const DUSTHANA_HOUSES = [6, 8, 12];
const CLASSICAL_PLANETS: NatalPlanetKey[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function houseFromSignDistance(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1;
}

function isPresent(facts: NatalChartFacts, key: NatalPlanetKey): boolean {
  return Boolean(facts.planets[key]);
}

function lordOfHouse(facts: NatalChartFacts, house: number): NatalPlanetKey | null {
  return facts.houses.find((item) => item.number === house)?.lord ?? null;
}

function relationEvidence(facts: NatalChartFacts, a: NatalPlanetKey, b: NatalPlanetKey): string[] {
  const left = facts.planets[a];
  const right = facts.planets[b];
  if (!left || !right) return [];
  const evidence: string[] = [];
  if (left.signIndex === right.signIndex) {
    evidence.push(`${PLANET_NAMES[a]} и ${PLANET_NAMES[b]} находятся в одном сидерическом знаке ${SIGN_NAMES[left.signIndex]}; в текущей модели это соединение по знаку без оценки точного орбиса.`);
  }
  const aspects = facts.aspects.planet.filter((aspect) =>
    aspect.kind === 'graha-drishti'
    && ((aspect.sourceKey === a && aspect.targetKey === b) || (aspect.sourceKey === b && aspect.targetKey === a)),
  );
  for (const aspect of aspects) {
    evidence.push(`${PLANET_NAMES[aspect.sourceKey as NatalPlanetKey]} аспектирует ${PLANET_NAMES[aspect.targetKey as NatalPlanetKey]} по Parashari graha drishti (смещение ${aspect.offset ?? 'не определено'} домов).`);
  }
  if (SIGN_LORDS[left.signIndex] === b && SIGN_LORDS[right.signIndex] === a) {
    evidence.push(`Обмен знаками: ${PLANET_NAMES[a]} находится в знаке ${SIGN_NAMES[left.signIndex]} под управлением ${PLANET_NAMES[b]}, а ${PLANET_NAMES[b]} — в знаке ${SIGN_NAMES[right.signIndex]} под управлением ${PLANET_NAMES[a]}.`);
  }
  return unique(evidence);
}

function check(
  id: string,
  name: string,
  missingFacts: string[],
  finding: NatalYogaFinding | null,
  notFoundReason: string,
  additionalFindings: NatalYogaFinding[] = [],
): { check: NatalYogaRuleCheck; finding: NatalYogaFinding | null; additionalFindings: NatalYogaFinding[] } {
  const allFindings = [finding, ...additionalFindings].filter((item): item is NatalYogaFinding => Boolean(item));
  if (allFindings.length) {
    return {
      finding: allFindings[0], additionalFindings: allFindings.slice(1),
      check: {
        id, name, status: 'detected', findingId: allFindings[0].id,
        findingIds: allFindings.map((item) => item.id),
        reason: missingFacts.length
          ? 'Найдена как минимум одна комбинация; дополнительные сочетания нельзя проверить полностью из-за недостающих данных.'
          : 'Все обязательные условия формального правила выполнены.',
        missingFacts: unique(missingFacts),
      },
    };
  }
  if (missingFacts.length) {
    return {
      finding: null, additionalFindings: [],
      check: {
        id, name, status: 'incomplete', findingId: null, findingIds: [],
        reason: 'Правило нельзя проверить полностью: отсутствуют необходимые исходные данные.',
        missingFacts: unique(missingFacts),
      },
    };
  }
  return {
    finding: null,
    check: {
      id, name, status: 'not-detected', findingId: null, findingIds: [],
      reason: notFoundReason,
      missingFacts: [],
    },
  };
}

function createFinding(input: NatalYogaFinding): NatalYogaFinding {
  return { ...input, participants: unique(input.participants), houses: unique(input.houses).sort((a, b) => a - b), evidence: unique(input.evidence), caveats: unique(input.caveats) };
}

/**
 * Detects a deliberately bounded set of classical Jyotisha yogas.
 * Every positive result is backed by canonical facts; missing inputs are
 * reported as incomplete checks instead of silently treated as absence.
 */
export function analyzeNatalYogas(facts: NatalChartFacts): NatalYogaAnalysis {
  const findings: NatalYogaFinding[] = [];
  const checks: NatalYogaRuleCheck[] = [];
  const addCheck = (result: { check: NatalYogaRuleCheck; finding: NatalYogaFinding | null; additionalFindings?: NatalYogaFinding[] }) => {
    checks.push(result.check);
    if (result.finding) findings.push(result.finding);
    if (result.additionalFindings?.length) findings.push(...result.additionalFindings);
  };
  const missingHouses = Array.from({ length: 12 }, (_, index) => index + 1)
    .filter((house) => !facts.houses.some((item) => item.number === house));
  const hasAscendant = Boolean(facts.chart.ascendantSign);

  // Gaja Kesari: Jupiter in a kendra from the Moon.
  {
    const moon = facts.planets.Moon;
    const jupiter = facts.planets.Jupiter;
    const missing = [!moon ? 'Луна' : '', !jupiter ? 'Юпитер' : '', !moon?.house ? 'дом Луны' : '', !jupiter?.house ? 'дом Юпитера' : ''].filter(Boolean);
    const relativeHouse = moon && jupiter ? houseFromSignDistance(moon.signIndex, jupiter.signIndex) : null;
    const detected = missing.length === 0 && relativeHouse !== null && KENDRA_HOUSES.includes(relativeHouse);
    const finding = detected && moon && jupiter
      ? createFinding({
        id: 'gaja-kesari', name: 'Гаджа-Кесари-йога', sanskritName: 'Gaja Kesari Yoga', category: 'lunar',
        description: 'Юпитер расположен в кендре от Луны; в классической трактовке это связывают с поддержкой мудрости, обучения и социального авторитета.',
        formalRule: 'Юпитер находится в 1-м, 4-м, 7-м или 10-м знаке/доме относительно Луны.',
        participants: ['Moon', 'Jupiter'], houses: [moon.house!, jupiter.house!],
        evidence: [`Луна находится в ${moon.house}-м доме (${moon.sign}); Юпитер — в ${jupiter.house}-м доме (${jupiter.sign}).`, `От Луны до Юпитера — ${relativeHouse}-й дом; это кендра (1/4/7/10).`],
        caveats: ['Правило фиксирует базовое положение; сила йоги, достоинство Юпитера, поражения и дополнительные исключения оцениваются отдельно.'],
      })
      : null;
    addCheck(check('gaja-kesari', 'Гаджа-Кесари-йога', missing, finding, 'Юпитер не находится в кендре от Луны.'));
  }

  // Budha-Aditya: Sun and Mercury share a sign; exact combustion/orb is intentionally not claimed.
  {
    const sun = facts.planets.Sun;
    const mercury = facts.planets.Mercury;
    const missing = [!sun ? 'Солнце' : '', !mercury ? 'Меркурий' : ''].filter(Boolean);
    const detected = Boolean(sun && mercury && sun.signIndex === mercury.signIndex);
    const finding = detected && sun && mercury
      ? createFinding({
        id: 'budha-aditya', name: 'Буддха-Адитья-йога', sanskritName: 'Budha-Aditya Yoga', category: 'lunar',
        description: 'Солнце и Меркурий находятся в одном знаке; традиционно сочетание связывают с интеллектом, обучением и выражением мыслей.',
        formalRule: 'Солнце и Меркурий занимают один сидерический знак.',
        participants: ['Sun', 'Mercury'], houses: [sun.house ?? 0, mercury.house ?? 0].filter(Boolean),
        evidence: [`Солнце и Меркурий находятся в знаке ${sun.sign}.`, `Положение по домам: Солнце — ${sun.house ?? 'дом не определён'}, Меркурий — ${mercury.house ?? 'дом не определён'}.`],
        caveats: ['Соединение определяется только по знаку: точный орбис, сожжение Меркурия и ретроградность не оцениваются.'],
      })
      : null;
    addCheck(check('budha-aditya', 'Буддха-Адитья-йога', missing, finding, 'Солнце и Меркурий находятся в разных знаках.'));
  }

  // Chandra-Mangala: Moon and Mars share a sign or have a mutual classical aspect.
  {
    const moon = facts.planets.Moon;
    const mars = facts.planets.Mars;
    const missing = [!moon ? 'Луна' : '', !mars ? 'Марс' : ''].filter(Boolean);
    const links = moon && mars ? relationEvidence(facts, 'Moon', 'Mars') : [];
    const detected = Boolean(moon && mars && (moon.signIndex === mars.signIndex || links.some((item) => item.includes('аспектирует'))));
    const finding = detected && moon && mars
      ? createFinding({
        id: 'chandra-mangala', name: 'Чандра-Мангала-йога', sanskritName: 'Chandra-Mangala Yoga', category: 'lunar',
        description: 'Луна и Марс соединены по знаку или связаны аспектом; традиционно сочетание относят к активности в материальных и практических вопросах.',
        formalRule: 'Луна и Марс находятся в одном знаке либо между ними присутствует хотя бы один рассчитанный взаимный Parashari graha drishti.',
        participants: ['Moon', 'Mars'], houses: [moon.house ?? 0, mars.house ?? 0].filter(Boolean),
        evidence: links.length ? links : [`Луна и Марс находятся в одном знаке ${moon.sign}.`],
        caveats: ['Для этой комбинации используется связь по знаку или классический аспект; точный орбис и сила планет не рассчитываются.'],
      })
      : null;
    addCheck(check('chandra-mangala', 'Чандра-Мангала-йога', missing, finding, 'Не найдено соединение по знаку или аспектная связь Луны и Марса.'));
  }

  // Pancha Mahapurusha: own/exalted planet in a kendra from the Ascendant.
  const mahapurushaRules: Array<{ planet: NatalPlanetKey; name: string; sanskrit: string; signs: number[]; quality: string }> = [
    { planet: 'Mars', name: 'Ручака-йога', sanskrit: 'Ruchaka Yoga', signs: [0, 7, 9], quality: 'Марс в собственном знаке или экзальтации' },
    { planet: 'Mercury', name: 'Бхадра-йога', sanskrit: 'Bhadra Yoga', signs: [2, 5], quality: 'Меркурий в собственном знаке или экзальтации' },
    { planet: 'Jupiter', name: 'Хамса-йога', sanskrit: 'Hamsa Yoga', signs: [8, 11, 3], quality: 'Юпитер в собственном знаке или экзальтации' },
    { planet: 'Venus', name: 'Малавья-йога', sanskrit: 'Malavya Yoga', signs: [1, 6, 11], quality: 'Венера в собственном знаке или экзальтации' },
    { planet: 'Saturn', name: 'Шаша-йога', sanskrit: 'Shasha Yoga', signs: [9, 10, 6], quality: 'Сатурн в собственном знаке или экзальтации' },
  ];
  for (const rule of mahapurushaRules) {
    const planet = facts.planets[rule.planet];
    const missing = [!planet ? PLANET_NAMES[rule.planet] : '', !hasAscendant ? 'знак Асцендента' : '', !planet?.house ? `дом ${PLANET_NAMES[rule.planet]}` : ''].filter(Boolean);
    const detected = Boolean(planet && planet.house && hasAscendant && KENDRA_HOUSES.includes(planet.house) && rule.signs.includes(planet.signIndex));
    const finding = detected && planet
      ? createFinding({
        id: `mahapurusha-${rule.planet.toLowerCase()}`, name: rule.name, sanskritName: rule.sanskrit,
        category: 'mahapurusha',
        description: `${rule.quality}; планета расположена в кендре от Асцендента. Это одна из пяти комбинаций Панча-Махапуруша.`,
        formalRule: `${PLANET_NAMES[rule.planet]} находится в собственном знаке или знаке экзальтации и в доме 1/4/7/10 от Лагны.`,
        participants: [rule.planet], houses: planet.house === null ? [] : [planet.house],
        evidence: [`${PLANET_NAMES[rule.planet]} находится в знаке ${planet.sign}; этот знак входит в список собственного достоинства/экзальтации для данного правила.`, `Планета расположена в ${planet.house}-м доме от Асцендента; это кендра (1/4/7/10).`],
        caveats: ['Учитывается только базовый критерий знака и кендры; ретроградность, сожжение, точные градусы и дополнительные традиционные условия не проверяются.'],
      })
      : null;
    addCheck(check(`mahapurusha-${rule.planet.toLowerCase()}`, rule.name, missing, finding, `${PLANET_NAMES[rule.planet]} не одновременно в собственном/экзальтационном знаке и кендре от Асцендента.`));
  }

  // Raja yoga: a kendra lord and a trikona lord are associated.
  {
    const missing = [...missingHouses.filter((house) => [1, 4, 5, 7, 9, 10].includes(house)).map((house) => `${house}-й дом`)];
    if (!hasAscendant) missing.push('знак Асцендента');
    const found: NatalYogaFinding[] = [];
    {
      for (const kendra of [4, 7, 10]) {
        const kendraLord = lordOfHouse(facts, kendra);
        if (!kendraLord || !isPresent(facts, kendraLord)) continue;
        for (const trikona of [1, 5, 9]) {
          const trikonaLord = lordOfHouse(facts, trikona);
          if (!trikonaLord || trikonaLord === kendraLord || !isPresent(facts, trikonaLord)) continue;
          const evidence = relationEvidence(facts, kendraLord, trikonaLord);
          if (!evidence.length) continue;
          found.push(createFinding({
            id: `raja-${kendra}-${trikona}-${kendraLord.toLowerCase()}-${trikonaLord.toLowerCase()}`,
            name: 'Раджа-йога', sanskritName: 'Raja Yoga', category: 'raja',
            description: 'Управитель кендры связан с управителем триконы; в классической трактовке это сочетание связывают с возможностями реализации и ответственности.',
            formalRule: 'Управитель одного из домов 4/7/10 связан соединением по знаку, Parashari graha drishti или обменом знаками с управителем 1-го, 5-го или 9-го дома.',
            participants: [kendraLord, trikonaLord], houses: [kendra, trikona],
            evidence: [`Управитель ${kendra}-го дома — ${PLANET_NAMES[kendraLord]}; управитель ${trikona}-го дома — ${PLANET_NAMES[trikonaLord]}.`, ...evidence],
            caveats: ['Проверяется базовая связь управителей; достоинство, сила, функциональная благотворность и дополнительные условия конкретной школы не оцениваются.'],
          }));
        }
      }
    }
    addCheck(check('raja-yoga', 'Раджа-йога', missing, found[0] ?? null, 'Не найдена связь управителя кендры (4/7/10) с управителем триконы (1/5/9) по принятым типам отношений.', found.slice(1)));
  }

  // Dhana yoga: lords of 2/11 connected to lords of 5/9/1.
  {
    const housesToCheck = [1, 2, 5, 9, 11];
    const missing = missingHouses.filter((house) => housesToCheck.includes(house)).map((house) => `${house}-й дом`);
    if (!hasAscendant) missing.push('знак Асцендента');
    const found: NatalYogaFinding[] = [];
    {
      for (const wealthHouse of [2, 11]) {
        const wealthLord = lordOfHouse(facts, wealthHouse);
        if (!wealthLord || !isPresent(facts, wealthLord)) continue;
        for (const supportHouse of [1, 5, 9]) {
          const supportLord = lordOfHouse(facts, supportHouse);
          if (!supportLord || supportLord === wealthLord || !isPresent(facts, supportLord)) continue;
          const evidence = relationEvidence(facts, wealthLord, supportLord);
          if (!evidence.length) continue;
          found.push(createFinding({
            id: `dhana-${wealthHouse}-${supportHouse}-${wealthLord.toLowerCase()}-${supportLord.toLowerCase()}`,
            name: 'Дхана-йога', sanskritName: 'Dhana Yoga', category: 'wealth',
            description: 'Управитель 2-го или 11-го дома связан с управителем 1-го, 5-го или 9-го дома; традиционно комбинация относится к теме ресурсов и доходов.',
            formalRule: 'Управитель 2/11 дома связан соединением по знаку, Parashari graha drishti или обменом знаками с управителем 1/5/9 дома.',
            participants: [wealthLord, supportLord], houses: [wealthHouse, supportHouse],
            evidence: [`Управитель ${wealthHouse}-го дома — ${PLANET_NAMES[wealthLord]}; управитель ${supportHouse}-го дома — ${PLANET_NAMES[supportLord]}.`, ...evidence],
            caveats: ['Дхана-йога не является прогнозом богатства или суммы дохода; финансовый результат зависит от множества факторов вне карты.'],
          }));
        }
      }
    }
    addCheck(check('dhana-yoga', 'Дхана-йога', missing, found[0] ?? null, 'Не найдена связь управителей 2/11 домов с управителями 1/5/9 домов по принятым типам отношений.', found.slice(1)));
  }

  // Parivartana: two classical planets occupy each other's signs.
  {
    const missing = CLASSICAL_PLANETS.filter((key) => !isPresent(facts, key)).map((key) => PLANET_NAMES[key]);
    const found: NatalYogaFinding[] = [];
    {
      for (let i = 0; i < CLASSICAL_PLANETS.length; i += 1) {
        for (let j = i + 1; j < CLASSICAL_PLANETS.length; j += 1) {
          const a = CLASSICAL_PLANETS[i];
          const b = CLASSICAL_PLANETS[j];
          const evidence = relationEvidence(facts, a, b);
          if (!facts.planets[a] || !facts.planets[b]) continue;
          const exchange = SIGN_LORDS[facts.planets[a]!.signIndex] === b && SIGN_LORDS[facts.planets[b]!.signIndex] === a;
          if (!exchange) continue;
          const aHouse = facts.planets[a]!.house;
          const bHouse = facts.planets[b]!.house;
          found.push(createFinding({
            id: `parivartana-${a.toLowerCase()}-${b.toLowerCase()}`,
            name: 'Паривартана-йога', sanskritName: 'Parivartana Yoga', category: 'exchange',
            description: 'Два управителя находятся в знаках друг друга, формируя обмен знаками.',
            formalRule: 'Знак планеты A управляется планетой B, а знак планеты B — планетой A.',
            participants: [a, b], houses: [aHouse ?? 0, bHouse ?? 0].filter(Boolean),
            evidence: evidence.filter((item) => item.includes('Обмен знаками')),
            caveats: ['Классификация обмена на маха-, кахала- и дана-паривартану требует дополнительной оценки управляемых домов; здесь фиксируется только сам обмен.'],
          }));
        }
      }
    }
    addCheck(check('parivartana', 'Паривартана-йога', missing, found[0] ?? null, 'Обмен знаками между двумя классическими планетами не обнаружен.', found.slice(1)));
  }

  // Vipareeta Raja Yoga: a 6th/8th/12th lord placed in any dusthana.
  {
    const missing = missingHouses.filter((house) => DUSTHANA_HOUSES.includes(house)).map((house) => `${house}-й дом`);
    const found: NatalYogaFinding[] = [];
    {
      for (const sourceHouse of DUSTHANA_HOUSES) {
        const lord = lordOfHouse(facts, sourceHouse);
        const planet = lord ? facts.planets[lord] : null;
        if (!lord || !planet?.house || !DUSTHANA_HOUSES.includes(planet.house)) continue;
        found.push(createFinding({
          id: `vipareeta-${sourceHouse}-lord`,
          name: 'Випарита-раджа-йога', sanskritName: 'Vipareeta Raja Yoga', category: 'vipareeta',
          description: `Управитель ${sourceHouse}-го дома расположен в другом доме дустханы (6/8/12); это базовый критерий одной из разновидностей Випарита-раджа-йоги.`,
          formalRule: 'Управитель 6-го, 8-го или 12-го дома находится в одном из домов 6/8/12.',
          participants: [lord], houses: [sourceHouse, planet.house],
          evidence: [`Управитель ${sourceHouse}-го дома — ${PLANET_NAMES[lord]}.`, `${PLANET_NAMES[lord]} расположен в ${planet.house}-м доме; оба дома входят в группу дустхан 6/8/12.`],
          caveats: ['Это упрощённая базовая проверка; строгая классификация Harsha/Sarala/Vimala и условия отсутствия смешения с другими управителями требуют отдельной школы правил.'],
        }));
      }
    }
    addCheck(check('vipareeta-raja', 'Випарита-раджа-йога', missing, found[0] ?? null, 'Управители домов 6/8/12 не обнаружены в домах 6/8/12.', found.slice(1)));
  }

  const missingPlanets = NATAL_PLANET_KEYS.filter((key) => !facts.planets[key]);
  const warnings = [
    ...facts.dataQuality.warnings,
    ...(!hasAscendant ? ['Асцендент отсутствует: правила, зависящие от Лагны, отмечаются как неполные.'] : []),
    'Раху и Кету исключены из управителей и аспектных связей в этих правилах.',
    'Не рассчитываются Shadbala, авастхи, сожжение, ретроградность, точные орбисы и все исключения отдельных школ.',
  ];
  return {
    findings: findings.sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    checks,
    dataQuality: {
      complete: missingPlanets.length === 0 && missingHouses.length === 0 && hasAscendant,
      missingPlanets,
      missingHouses,
      warnings: unique(warnings),
    },
    methodology: [
      'Зодиак: сидерический, айанамша Лахири; дома: Whole Sign.',
      'Управители знаков: традиционная семипланетная схема; Раху/Кету не используются как управители.',
      'Аспекты: Parashari graha drishti из канонической модели; аспекты узлов не учитываются.',
      'Соединение: общий сидерический знак, без утверждения о точном орбисе.',
      'Положительный результат создаётся только при выполнении всех условий конкретного формального правила.',
      'Недостаток обязательных данных даёт статус «неполно», а не ложный статус «не обнаружено».',
    ],
  };
}
