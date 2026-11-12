import type { NatalChart } from './astrology';
import { calculateNatalChart } from './astrology';
import { calculateTransitAspects } from './aspectCalculations';
import { analyzeVimshottariDasha } from './vimshottariDashaAnalysis';

export const TRANSIT_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
type TransitPlanet = typeof TRANSIT_PLANETS[number];

const PLANET_RU: Record<TransitPlanet, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const SIGN_RU = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const SPECIAL_ASPECTS: Partial<Record<TransitPlanet, number[]>> = {
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
};
const LIFE_AREAS: Array<{ id: string; label: string; houses: number[] }> = [
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
];;

export interface TransitHousePosition {
  planet: TransitPlanet;
  planetName: string;
  longitude: number;
  sign: string;
  degree: number;
  natalHouse: number;
  retrograde: boolean | null;
  evidence: string;
}
export interface TransitNatalAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  angle: number;
  orb: number;
  strength: number;
  applying: boolean | null;
  transitHouse: number;
  natalHouse: number | null;
  evidence: string;
}
export interface TransitHouseLordHit {
  house: number;
  houseTopic: string;
  lord: string;
  lordName: string;
  natalLordHouse: number | null;
  transitPlanet: string;
  transitPlanetName: string;
  relation: 'exact-aspect' | 'graha-drishti' | 'same-house';
  detail: string;
}
export interface TransitLifeArea {
  id: string;
  label: string;
  houses: number[];
  transitEvidence: string[];
  dashaEvidence: string[];
  repeated: boolean;
  explanation: string;
}
export interface TransitDashaContext {
  mahadasha: string;
  antardasha: string | null;
  pratyantardasha: string | null;
  periodEnd: Date;
  activeThemes: string[];
  transitActivations: string[];
}
export interface TransitAnalysisReport {
  moment: Date;
  methodology: string[];
  positions: TransitHousePosition[];
  aspects: TransitNatalAspect[];
  houseLordHits: TransitHouseLordHit[];
  dasha: TransitDashaContext;
  lifeAreas: TransitLifeArea[];
  repeatedThemes: string[];
  warnings: string[];
}

function houseFromSign(sign: number, ascendantSign: number): number {
  return ((sign - ascendantSign + 12) % 12) + 1;
}
function planetHouse(chart: NatalChart, planet: string): number | null {
  const position = chart.planets[planet as keyof NatalChart['planets']];
  if (!position || !chart.houses) return null;
  return chart.houses.find((house) => house.sign === position.sign)?.house ?? null;
}
function getLordHouses(chart: NatalChart, lord: string): number[] {
  return (chart.houses ?? []).filter((house) => house.lord === lord).map((house) => house.house);
}
function getTransitAspectOffsets(planet: TransitPlanet): number[] {
  return SPECIAL_ASPECTS[planet] ?? [7];
}
function getAspectLabel(type: string): string {
  const labels: Record<string, string> = {
    conjunction: 'соединение', opposition: 'оппозиция', trine: 'трин',
    square: 'квадратура', sextile: 'секстиль', special: 'специальный аспект',
  };
  return labels[type] ?? type;
}
const HOUSE_TOPICS: Record<number, string> = {
  1: 'личность, самоощущение и самостоятельные действия',
  2: 'личные деньги, накопления, речь и семейные ценности',
  3: 'общение, навыки, обучение и собственные инициативы',
  4: 'дом, семья, жильё и внутренняя опора',
  5: 'творчество, увлечения, романтика и дети',
  6: 'повседневная работа, обязанности, режим и решение проблем',
  7: 'брак, близкие отношения, партнёрство и договорённости',
  8: 'общие деньги, доверие, кризисы и глубокие перемены',
  9: 'образование, мировоззрение, наставники и дальние горизонты',
  10: 'профессия, карьера, ответственность и репутация',
  11: 'доходы, клиенты, друзья, сообщества и результаты усилий',
  12: 'отдых, восстановление, расходы, уединение и завершение циклов',
};
function getHouseTopic(house: number): string {
  return HOUSE_TOPICS[house] ?? `Тема ${house}-го дома`;
}

/** Evidence-first transit report. Houses are counted from the natal whole-sign Lagna. */
export function analyzeTransits(
  natalChart: NatalChart,
  moment: Date = new Date(),
): TransitAnalysisReport {
  if (!(moment instanceof Date) || !Number.isFinite(moment.getTime())) {
    throw new Error('Некорректная дата транзитного анализа');
  }
  if (moment < natalChart.date) throw new Error('Дата транзитного анализа не может быть раньше даты рождения');
  if (!natalChart.houses || natalChart.houses.length !== 12) {
    throw new Error('Для анализа транзитов нужны все 12 натальных домов');
  }

  // Geocentric sidereal positions use the app's Lahiri calculation. The transit
  // chart is cast at the natal coordinates, but its ascendant is deliberately
  // ignored: transit houses are counted from the natal whole-sign Lagna.
  const transitChart = calculateNatalChart(moment, natalChart.latitude, natalChart.longitude);
  const positions: TransitHousePosition[] = TRANSIT_PLANETS.map((planet) => {
    const position = transitChart.planets[planet];
    const house = houseFromSign(position.sign, natalChart.ascendant.sign);
    return {
      planet, planetName: PLANET_RU[planet], longitude: position.siderealLon,
      sign: SIGN_RU[position.sign], degree: position.degree, natalHouse: house,
      retrograde: null,
      evidence: `${PLANET_RU[planet]}: ${SIGN_RU[position.sign]} ${position.degree.toFixed(2)}°, натальный ${house}-й дом.`,
    };
  });

  // Exact degree-based aspects (conjunction/opposition/trine/square/sextile)
  // are kept separate from Parashari whole-sign graha-drishti below.
  const exactAspects = calculateTransitAspects(natalChart, transitChart);
  const aspects: TransitNatalAspect[] = exactAspects.map((aspect) => {
    const transitPlanet = aspect.planet1 as TransitPlanet;
    const natalPlanet = aspect.planet2 as TransitPlanet;
    const transitPosition = positions.find((item) => item.planet === transitPlanet);
    return {
      transitPlanet: aspect.planet1, natalPlanet: aspect.planet2,
      aspect: getAspectLabel(aspect.type), angle: aspect.angle, orb: aspect.orb,
      strength: aspect.strength, applying: aspect.isApplying ?? null,
      transitHouse: transitPosition?.natalHouse ?? 0,
      natalHouse: planetHouse(natalChart, aspect.planet2),
      evidence: `Транзитное ${PLANET_RU[transitPlanet]} ${getAspectLabel(aspect.type)} натальному ${PLANET_RU[natalPlanet]}: угол ${aspect.angle.toFixed(2)}°, орбис ${aspect.orb.toFixed(2)}°.`,
    };
  });

  const houseLordHits: TransitHouseLordHit[] = [];
  const seenHits = new Set<string>();
  for (const house of natalChart.houses) {
    const lord = house.lord as TransitPlanet;
    if (!TRANSIT_PLANETS.includes(lord)) continue;
    const lordHouse = planetHouse(natalChart, lord);
    const relevantAspects = aspects.filter((aspect) => aspect.natalPlanet === lord);
    for (const aspect of relevantAspects) {
      const key = `${house.house}:${aspect.transitPlanet}:exact`;
      if (seenHits.has(key)) continue;
      seenHits.add(key);
      houseLordHits.push({
        house: house.house, houseTopic: getHouseTopic(house.house), lord,
        lordName: PLANET_RU[lord], natalLordHouse: lordHouse,
        transitPlanet: aspect.transitPlanet, transitPlanetName: PLANET_RU[aspect.transitPlanet as TransitPlanet],
        relation: 'exact-aspect',
        detail: aspect.evidence + ` Натальный управитель ${house.house}-го дома — ${PLANET_RU[lord]}, расположенный в ${lordHouse ?? 'неизвестном'} доме.`,
      });
    }
  }

  // Whole-sign Parashari drishti from transiting classical planets to natal
  // planets and their houses. Nodes are excluded because their aspect doctrine
  // differs by lineage; their sign/house transit remains visible.
  for (const transit of positions) {
    if (transit.planet === 'Rahu' || transit.planet === 'Ketu') continue;
    const offsets = getTransitAspectOffsets(transit.planet);
    for (const house of natalChart.houses) {
      const natalLord = house.lord as TransitPlanet;
      const natalLordPosition = natalChart.planets[natalLord as keyof NatalChart['planets']];
      if (!natalLordPosition) continue;
      const natalLordHouse = planetHouse(natalChart, natalLord);
      const targetHouse = houseFromSign(natalLordPosition.sign, natalChart.ascendant.sign);
      const offset = ((targetHouse - transit.natalHouse + 12) % 12) + 1;
      const sameHouse = targetHouse === transit.natalHouse;
      const hasDrishti = offsets.includes(offset);
      if (!sameHouse && !hasDrishti) continue;
      const relation = sameHouse ? 'same-house' as const : 'graha-drishti' as const;
      const key = `${house.house}:${transit.planet}:${relation}`;
      if (seenHits.has(key)) continue;
      seenHits.add(key);
      houseLordHits.push({
        house: house.house, houseTopic: getHouseTopic(house.house),
        lord: natalLord, lordName: PLANET_RU[natalLord], natalLordHouse,
        transitPlanet: transit.planet, transitPlanetName: transit.planetName, relation,
        detail: sameHouse
          ? `Транзитное ${transit.planetName} находится в том же знаке и доме, что и натальный управитель ${house.house}-го дома ${PLANET_RU[natalLord]}.`
          : `Транзитное ${transit.planetName} из натального ${transit.natalHouse}-го дома даёт граха-дришти на натального управителя ${house.house}-го дома ${PLANET_RU[natalLord]} в ${natalLordHouse}-м доме (смещение ${offset}).`,
      });
    }
  }

  const dashaReport = analyzeVimshottariDasha(natalChart, moment);
  const activeLayers = [
    dashaReport.current.mahadasha,
    dashaReport.current.antardasha,
    dashaReport.current.pratyantardasha,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const dashaAreas = new Map<string, string[]>();
  for (const layer of activeLayers) {
    for (const area of layer.profile.lifeAreaLinks) {
      const reasons = dashaAreas.get(area.area) ?? [];
      reasons.push(`${layerNamesRu(layer.layer)} ${layer.profile.planetName}: ${area.reasons.join('; ')}`);
      dashaAreas.set(area.area, reasons);
    }
  }

  const transitEvidenceByArea = new Map<string, string[]>();
  for (const area of LIFE_AREAS) {
    const evidence: string[] = [];
    for (const transit of positions) {
      if (area.houses.includes(transit.natalHouse)) evidence.push(transit.evidence);
    }
    for (const aspect of aspects) {
      const natalLordHouses = getLordHouses(natalChart, aspect.natalPlanet);
      if (area.houses.includes(aspect.natalHouse ?? 0) || natalLordHouses.some((house) => area.houses.includes(house))) {
        evidence.push(aspect.evidence);
      }
    }
    for (const hit of houseLordHits) {
      if (area.houses.includes(hit.house)) evidence.push(hit.detail);
    }
    transitEvidenceByArea.set(area.id, [...new Set(evidence)]);
  }

  const lifeAreas: TransitLifeArea[] = LIFE_AREAS.map((area) => {
    const transitEvidence = transitEvidenceByArea.get(area.id) ?? [];
    const dashaEvidence = dashaAreas.get(area.id) ?? [];
    const repeated = transitEvidence.length > 0 && dashaEvidence.length > 0;
    return {
      id: area.id, label: area.label, houses: [...area.houses],
      transitEvidence, dashaEvidence, repeated,
      explanation: repeated
        ? `Тема повторяется: она связана с активными управителями Даши и одновременно получает транзитное подтверждение через дома, аспекты или их управителей.`
        : transitEvidence.length
          ? 'Тема отмечена транзитными положениями/аспектами; активные управители Даши не дают прямого совпадения по настроенным домам.'
          : dashaEvidence.length
            ? 'Тема связана с активными управителями Даши; прямого транзитного подтверждения по выбранным критериям сейчас нет.'
            : 'По выбранным фактическим критериям отдельное выделение темы не обнаружено.',
    };
  }).filter((area) => area.transitEvidence.length > 0 || area.dashaEvidence.length > 0);

  const repeatedThemes = lifeAreas.filter((area) => area.repeated).map((area) => area.label);
  const dasha: TransitDashaContext = {
    mahadasha: dashaReport.current.mahadasha.profile.planetName,
    antardasha: dashaReport.current.antardasha?.profile.planetName ?? null,
    pratyantardasha: dashaReport.current.pratyantardasha?.profile.planetName ?? null,
    periodEnd: dashaReport.current.pratyantardasha?.endDate ?? dashaReport.current.antardasha?.endDate ?? dashaReport.current.mahadasha.endDate,
    activeThemes: [...dashaAreas.keys()],
    transitActivations: aspects.filter((aspect) =>
      activeLayers.some((layer) => layer.planet === aspect.natalPlanet),
    ).map((aspect) => aspect.evidence),
  };

  return {
    moment: new Date(moment),
    methodology: [
      'Транзитные долготы рассчитываются геоцентрически в сидерическом зодиаке Лахири тем же движком, что и натальная карта.',
      'Дома транзитов считаются от натальной Лагны по Whole Sign; транзитная Лагна не заменяет натальную.',
      'Точные транзитные аспекты к натальным планетам рассчитываются отдельным градусным движком с орбисом и силой аспекта.',
      'Классическая граха-дришти для транзитных Марса, Юпитера, Сатурна и остальных видимых грах проверяется отдельно по Whole Sign; узловые аспекты исключены.',
      'Управители домов связываются с транзитами через точные аспекты к натальной планете-управителю, соединение по знаку или граха-дришти.',
      'Повторяющаяся тема отмечается только при одновременном наличии evidence от активных уровней Даши и транзитных факторов.',
      'Сила транзита не превращается в оценку благоприятности или обещание события; орбис и тип аспекта показаны как факты расчёта.',
    ],
    positions, aspects, houseLordHits, dasha, lifeAreas, repeatedThemes,
    warnings: [
      'Транзиты — символическая астрологическая система, не научно подтверждённый прогноз событий.',
      'Расчёт использует геоцентрические сидерические положения Лахири и Whole Sign; другие айанамши и системы домов могут давать иные результаты.',
      'Ретроградность пока не отображается: для неё нужен отдельный валидированный расчёт скорости/направления движения; значение null не трактуется как директность.',
      'Аспекты Раху и Кету не включены из-за различий между астрологическими школами.',
      'Медицинские, финансовые, юридические и иные значимые решения нельзя принимать на основании транзитов или Даши.',
    ],
  };
}

function layerNamesRu(layer: 'mahadasha' | 'antardasha' | 'pratyantardasha'): string {
  return layer === 'mahadasha' ? 'Махадаша' : layer === 'antardasha' ? 'Антардаша' : 'Пратьянтардаша';
}
