import type { NatalChart } from './astrology';
import { calculateDasha, getCurrentAntardasha, getCurrentPratyantardasha, type DashaPeriod } from './astrology';
import { calculateAllDivisionalCharts } from './divisionalCharts';
import { VARGA_ANALYSIS_RULES } from './divisionalChartAnalysis';
import { evaluatePlanetCondition, getGrahaDrishti, getPlanetHouse, getPlanetToPlanetAspects, type PlanetCondition } from './natalStrengthAnalysis';

export type DashaLayer = 'mahadasha' | 'antardasha' | 'pratyantardasha';
export interface DashaPeriodWindow {
  layer: DashaLayer;
  planet: string;
  startDate: Date;
  endDate: Date;
}
export interface DashaVargaEvidence {
  division: number;
  name: string;
  topic: string;
  planetSign: string | null;
  planetHouse: number | null;
  relevantHouses: number[];
  relevantHouseRelation: 'occupies' | 'rules' | 'occupies-and-rules' | 'no-direct-house-link' | 'unavailable';
  explanation: string;
}
export interface DashaPlanetProfile {
  planet: string;
  planetName: string;
  sign: string;
  degreeInSign: number;
  house: number | null;
  ruledHouses: number[];
  dignity: PlanetCondition | null;
  dispositor: {
    planet: string;
    sign: string;
    house: number | null;
    dignity: PlanetCondition | null;
    ruledHouses: number[];
  } | null;
  aspectsFromPlanet: Array<{ target: string; kind: string; targetHouse: number }>;
  aspectsToPlanet: Array<{ source: string; kind: string; sourceHouse: number }>;
  aspectsToHouses: number[];
  lifeAreaLinks: Array<{
    area: string;
    label: string;
    relevantHouses: number[];
    reasons: string[];
    strength: 'direct' | 'supporting';
  }>;
  vargas: DashaVargaEvidence[];
  evidence: string[];
  limitations: string[];
}
export interface DashaLayerAnalysis extends DashaPeriodWindow {
  profile: DashaPlanetProfile;
  whyHighlighted: string[];
}
export interface VimshottariAnalysisReport {
  methodology: string[];
  current: {
    mahadasha: DashaLayerAnalysis;
    antardasha: DashaLayerAnalysis | null;
    pratyantardasha: DashaLayerAnalysis | null;
  };
  mahadashaAntardashas: DashaLayerAnalysis[];
  antardashaPratyantardashas: DashaLayerAnalysis[];
  warnings: string[];
}

const PLANET_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн',
  Rahu: 'Раху', Ketu: 'Кету',
};
const SIGN_NAMES = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const LIFE_AREAS = [
  { id: 'finances', label: 'Деньги и ресурсы', houses: [2, 11] },
  { id: 'career', label: 'Работа и карьера', houses: [2, 6, 10, 11] },
  { id: 'relationships', label: 'Отношения и партнёрство', houses: [5, 7, 12] },
  { id: 'home', label: 'Дом и недвижимость', houses: [4, 11] },
  { id: 'family', label: 'Семья и род', houses: [2, 4, 9] },
  { id: 'children', label: 'Дети и созидание', houses: [5, 9] },
  { id: 'learning', label: 'Обучение и знания', houses: [4, 5, 9] },
  { id: 'creativity', label: 'Творчество и самовыражение', houses: [3, 5, 9] },
  { id: 'spirituality', label: 'Духовные практики', houses: [8, 9, 12] },
  { id: 'health', label: 'Режим и здоровье', houses: [1, 6, 8] },
] as const;
const VARGA_BY_AREA: Record<string, number[]> = {
  finances: [2], career: [10], relationships: [9], home: [4, 16],
  family: [12], children: [7], learning: [24], creativity: [3, 24],
  spirituality: [20], health: [27],
};

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
function getPlanetRu(planet: string): string { return PLANET_NAMES[planet] ?? planet; }
function getPlanetSignHouse(chart: NatalChart, planet: string): { sign: string; house: number | null; degree: number } | null {
  const position = chart.planets[planet as keyof NatalChart['planets']];
  if (!position) return null;
  return { sign: SIGN_NAMES[position.sign] ?? position.signName, house: getPlanetHouse(chart, planet), degree: position.degree };
}
function getRuledHouses(chart: NatalChart, planet: string): number[] {
  return (chart.houses ?? []).filter((house) => house.lord === planet).map((house) => house.house);
}
function getDispositor(chart: NatalChart, planet: string) {
  const position = chart.planets[planet as keyof NatalChart['planets']];
  if (!position) return null;
  const signHouse = (chart.houses ?? []).find((house) => house.sign === position.sign);
  const dispositor = signHouse?.lord;
  if (!dispositor || !chart.planets[dispositor as keyof NatalChart['planets']]) return null;
  const positionInfo = getPlanetSignHouse(chart, dispositor);
  if (!positionInfo) return null;
  return {
    planet: dispositor,
    sign: positionInfo.sign,
    house: positionInfo.house,
    dignity: evaluatePlanetCondition(chart, dispositor),
    ruledHouses: getRuledHouses(chart, dispositor),
  };
}

function buildPlanetProfile(chart: NatalChart, planet: string): DashaPlanetProfile {
  const position = getPlanetSignHouse(chart, planet);
  if (!position) {
    return {
      planet, planetName: getPlanetRu(planet), sign: 'неизвестен', degreeInSign: 0, house: null,
      ruledHouses: [], dignity: null, dispositor: null, aspectsFromPlanet: [], aspectsToPlanet: [],
      aspectsToHouses: [], lifeAreaLinks: [], vargas: [], evidence: [],
      limitations: ['Положение планеты периода отсутствует в исходной натальной карте; персональная интерпретация не строится.'],
    };
  }

  const ruledHouses = getRuledHouses(chart, planet);
  const dignity = evaluatePlanetCondition(chart, planet);
  const dispositor = getDispositor(chart, planet);
  const houseAspects = getGrahaDrishti(chart);
  const aspectsToHouses = unique(houseAspects.filter((aspect) => aspect.source === getPlanetRu(planet)).map((aspect) => aspect.targetHouse));
  const planetAspects = getPlanetToPlanetAspects(chart, Object.keys(chart.planets));
  const aspectsFromPlanet = planetAspects.filter((aspect) => aspect.sourceKey === planet)
    .map((aspect) => ({ target: getPlanetRu(aspect.targetKey), kind: aspect.kind, targetHouse: aspect.targetHouse }));
  const aspectsToPlanet = planetAspects.filter((aspect) => aspect.targetKey === planet)
    .map((aspect) => ({ source: getPlanetRu(aspect.sourceKey), kind: aspect.kind, sourceHouse: aspect.sourceHouse }));

  const lifeAreaLinks = LIFE_AREAS.map((area) => {
    const reasons: string[] = [];
    const ruled = ruledHouses.filter((house) => (area.houses as readonly number[]).includes(house));
    if (ruled.length) reasons.push(`управляет домом/домами ${ruled.join(', ')}`);
    if (position.house !== null && (area.houses as readonly number[]).includes(position.house)) reasons.push(`расположена в ${position.house}-м доме этой темы`);
    const aspected = aspectsToHouses.filter((house) => (area.houses as readonly number[]).includes(house));
    if (aspected.length) reasons.push(`даёт граха-дришти на дом/дома ${aspected.join(', ')}`);
    const received = aspectsToPlanet.filter((aspect) => (area.houses as readonly number[]).includes(aspect.sourceHouse));
    if (received.length) reasons.push(`получает аспект от планеты из тематического дома: ${received.map((item) => item.source).join(', ')}`);
    return {
      area: area.id, label: area.label, relevantHouses: [...area.houses], reasons,
      strength: ruled.length || (position.house !== null && (area.houses as readonly number[]).includes(position.house)) ? 'direct' as const : 'supporting' as const,
    };
  }).filter((area) => area.reasons.length > 0);

  const vargaCharts = calculateAllDivisionalCharts(chart.planets, chart.ascendant.siderealLon);
  const vargas: DashaVargaEvidence[] = [];
  for (const area of lifeAreaLinks) {
    for (const division of VARGA_BY_AREA[area.area] ?? []) {
      const rule = VARGA_ANALYSIS_RULES.find((item) => item.division === division);
      const varga = vargaCharts.find((item) => item.division === division);
      const vargaPosition = varga?.planets[planet];
      if (!rule || !varga || !vargaPosition) {
        vargas.push({
          division, name: `D${division}`, topic: area.label, planetSign: null, planetHouse: null,
          relevantHouses: [], relevantHouseRelation: 'unavailable',
          explanation: `Данные D${division} для планеты периода недоступны; вывод по варге не добавляется.`,
        });
        continue;
      }
      const relevantHouses = rule.vargaHouses;
      const vargaRules = relevantHouses.filter((house) => {
        const ascSign = Math.floor(varga.ascendant.longitude / 30);
        const signIndex = (ascSign + house - 1) % 12;
        return varga.planets[planet]?.longitude !== undefined &&
          (varga.planets[planet]?.house === house || getVargaHouseLord(signIndex) === planet);
      });
      const occupies = relevantHouses.includes(vargaPosition.house);
      const rules = vargaRules.some((house) => {
        const ascSign = Math.floor(varga.ascendant.longitude / 30);
        return getVargaHouseLord((ascSign + house - 1) % 12) === planet;
      });
      const relation = occupies && rules ? 'occupies-and-rules' : occupies ? 'occupies' : rules ? 'rules' : 'no-direct-house-link';
      vargas.push({
        division, name: `D${division}`, topic: rule.topic, planetSign: vargaPosition.signName,
        planetHouse: vargaPosition.house, relevantHouses,
        relevantHouseRelation: relation,
        explanation: relation === 'occupies-and-rules'
          ? `В D${division} планета периода занимает и управляет тематическим домом/домами ${relevantHouses.join(', ')}.`
          : relation === 'occupies'
            ? `В D${division} планета периода занимает тематический ${vargaPosition.house}-й дом.`
            : relation === 'rules'
              ? `В D${division} планета периода управляет одним из тематических домов: ${relevantHouses.join(', ')}.`
              : `В D${division} прямое положение или управление тематическими домами не обнаружено; варга не используется как подтверждение.`,
      });
    }
  }

  const evidence = [
    `Планета периода: ${getPlanetRu(planet)} в знаке ${position.sign}${position.house ? `, в ${position.house}-м доме D1` : ', дом не определён'}.`,
    ruledHouses.length ? `Управляемые дома D1: ${ruledHouses.join(', ')}.` : 'Управляемые дома D1 по используемой системе не определены.',
    dignity ? `Достоинство: ${dignity.label}. ${dignity.explanation}` : 'Достоинство не определено.',
    dispositor ? `Диспозитор: ${getPlanetRu(dispositor.planet)} в знаке ${dispositor.sign}${dispositor.house ? `, в ${dispositor.house}-м доме` : ''}; ${dispositor.dignity?.label ?? 'достоинство не определено'}.` : 'Диспозитор не определён по доступным данным.',
    aspectsFromPlanet.length ? `Исходящие связи: ${aspectsFromPlanet.map((item) => `${item.kind} → ${item.target}`).join(', ')}.` : 'Исходящие аспекты к планетам по выбранной системе не обнаружены.',
    aspectsToPlanet.length ? `Входящие связи: ${aspectsToPlanet.map((item) => `${item.source} (${item.kind})`).join(', ')}.` : 'Входящие аспекты к планете периода по выбранной системе не обнаружены.',
  ];
  const limitations = [
    'Достоинство по знаку — один фактор, а не полная Shadbala; балл силы и итоговая оценка благоприятности не рассчитываются.',
    'Граха-дришти использует классические аспекты Парашари; аспекты Раху/Кету исключены из-за разночтений школ.',
    'Для узлов достоинство не оценивается; их символическая связь рассматривается через знак, дом и диспозитора.',
    'Положения варг — дополнительные свидетельства, а не самостоятельное основание для события; D1 остаётся главным контекстом.',
    'Отсутствие связи с тематической варгой не трактуется как запрет или отрицательный прогноз.',
  ];
  return {
    planet, planetName: getPlanetRu(planet), sign: position.sign, degreeInSign: position.degree, house: position.house,
    ruledHouses, dignity, dispositor, aspectsFromPlanet, aspectsToPlanet, aspectsToHouses,
    lifeAreaLinks, vargas, evidence, limitations,
  };
}

function getVargaHouseLord(signIndex: number): string {
  return ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'][signIndex];
}

function buildLayer(chart: NatalChart, window: DashaPeriodWindow): DashaLayerAnalysis {
  const profile = buildPlanetProfile(chart, window.planet);
  const whyHighlighted: string[] = [];
  whyHighlighted.push(`${profile.planetName} управляет ${profile.ruledHouses.length ? `домами ${profile.ruledHouses.join(', ')}` : 'не управляет домами в используемой схеме'} и расположена ${profile.house ? `в ${profile.house}-м доме D1` : 'в доме, который не удалось определить'}.`);
  if (profile.dignity) whyHighlighted.push(`В качестве фактора качества проявления учитывается достоинство по знаку: «${profile.dignity.label}»; это не суммарная оценка силы.`);
  if (profile.dispositor) whyHighlighted.push(`Цепочка связи идёт через диспозитора ${getPlanetRu(profile.dispositor.planet)}: ${profile.dispositor.sign}${profile.dispositor.house ? `, ${profile.dispositor.house}-й дом` : ''}.`);
  if (profile.lifeAreaLinks.length) {
    for (const area of profile.lifeAreaLinks) whyHighlighted.push(`Тема «${area.label}» выделена, потому что ${area.reasons.join('; ')}.`);
  } else {
    whyHighlighted.push('Прямая связь управлением, положением или аспектом с перечисленными жизненными сферами не обнаружена; универсальная тема планеты не подставляется.');
  }
  const confirmedVargas = profile.vargas.filter((item) => item.relevantHouseRelation === 'occupies' || item.relevantHouseRelation === 'rules' || item.relevantHouseRelation === 'occupies-and-rules');
  if (confirmedVargas.length) whyHighlighted.push(`Дополнительное подтверждение в профильных варгах: ${confirmedVargas.map((item) => `${item.name} (${item.topic})`).join(', ')}.`);
  return { ...window, profile, whyHighlighted };
}

export function analyzeVimshottariDasha(chart: NatalChart, currentDate: Date = new Date()): VimshottariAnalysisReport {
  if (!(currentDate instanceof Date) || !Number.isFinite(currentDate.getTime())) throw new Error('Некорректная дата анализа Вимшоттари-даши');
  if (currentDate < chart.date) throw new Error('Дата анализа не может быть раньше даты рождения');
  const moonNakshatra = Math.floor(chart.planets.Moon.siderealLon / (360 / 27));
  const dasha: DashaPeriod = calculateDasha(chart.date, moonNakshatra, currentDate, chart.planets.Moon.siderealLon);
  if (!dasha.isActive) throw new Error('Не удалось определить активную Махадашу для выбранной даты');
  const antar = getCurrentAntardasha(dasha, currentDate);
  const pratyantar = getCurrentPratyantardasha(antar, currentDate);
  const mahadasha = buildLayer(chart, { layer: 'mahadasha', planet: dasha.planet, startDate: dasha.startDate, endDate: dasha.endDate });
  const antardasha = antar ? buildLayer(chart, { layer: 'antardasha', planet: antar.planet, startDate: antar.startDate, endDate: antar.endDate }) : null;
  const pratyantardasha = pratyantar ? buildLayer(chart, { layer: 'pratyantardasha', planet: pratyantar.planet, startDate: pratyantar.startDate, endDate: pratyantar.endDate }) : null;
  const mahadashaAntardashas = (dasha.antardasha ?? []).map((item) => buildLayer(chart, { layer: 'antardasha', planet: item.planet, startDate: item.startDate, endDate: item.endDate }));
  const antardashaPratyantardashas = (antar?.pratyantardasha ?? []).map((item) => buildLayer(chart, { layer: 'pratyantardasha', planet: item.planet, startDate: item.startDate, endDate: item.endDate }));
  return {
    methodology: [
      'Вимшоттари рассчитывается от сидерической долготы Луны и её положения в одной из 27 равных накшатр; стартовый управитель определяется накшатрой, остаток Махадаши — пройденной долей накшатры.',
      'Длительность цикла — 120 лет; последовательность управителей: Кету → Венера → Солнце → Луна → Марс → Раху → Юпитер → Сатурн → Меркурий.',
      'Подпериоды рассчитываются пропорционально длительностям планет в полном 120-летнем цикле; границы дат включают дробные сутки.',
      'Символическая трактовка строится на положении управителя периода в D1, его управляемых домах, достоинстве, диспозиторе и классических граха-дришти.',
      'D2/D3/D4/D7/D9/D10/D12/D16/D20/D24/D27 используются только для профильных тем и только как дополнительное сопоставление с D1.',
      'Варга подтверждает тему лишь при фактическом занятии или управлении релевантным домом; простое присутствие планеты в карте не считается доказательством.',
      'Аспекты рассчитаны в Whole Sign по классической граха-дришти; аспекты узлов намеренно не добавляются.',
    ],
    current: { mahadasha, antardasha, pratyantardasha },
    mahadashaAntardashas,
    antardashaPratyantardashas,
    warnings: [
      'Астрологическая система является символической традицией, а не научно подтверждённым методом прогноза событий.',
      'Период не гарантирует событие; он показывает, какие символические связи карты традиционно рассматриваются как активные.',
      'Планетарное достоинство по знаку не заменяет Shadbala, авастхи, варготтаму и другие факторы силы.',
      'Профильные варги чувствительны к точности времени рождения; приложение не знает реальную погрешность указанного времени.',
      'Медицинские, финансовые, юридические и иные значимые решения нельзя принимать на основании Даши.',
    ],
  };
}
