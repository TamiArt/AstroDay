import type { NatalChart } from './astrology';
import {
  evaluatePlanetCondition,
  getGrahaDrishti,
  getPlanetHouse,
  getPlanetToPlanetAspects,
  type HouseDrishti,
  type PlanetCondition,
  type PlanetToPlanetAspect,
} from './natalStrengthAnalysis';

export const NATAL_PLANET_KEYS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
] as const;
export type NatalPlanetKey = typeof NATAL_PLANET_KEYS[number];

const PLANET_NAMES: Record<NatalPlanetKey, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const SIGN_NAMES = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];

export type NatalFactRelation =
  | 'occupies-house'
  | 'rules-house'
  | 'dispositor-of'
  | 'aspects-house'
  | 'aspects-planet'
  | 'conjuncts'
  | 'house-lord-placed-in'
  | 'shares-ruler-with';

export interface NatalFactLink {
  id: string;
  relation: NatalFactRelation;
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  method: string;
  evidence: string;
}

export interface NatalPlanetFacts {
  key: NatalPlanetKey;
  name: string;
  signIndex: number;
  sign: string;
  longitude: number;
  degreeInSign: number;
  nakshatraIndex: number;
  nakshatra: string;
  pada: number;
  house: number | null;
  ruledHouses: number[];
  dispositor: NatalPlanetKey | null;
  dispositorHouse: number | null;
  dignity: PlanetCondition | null;
  conjunctions: NatalPlanetKey[];
  aspectsToHouses: number[];
  aspectsToPlanets: NatalPlanetKey[];
  receivesAspectsFrom: NatalPlanetKey[];
  dataAvailability: {
    house: 'available' | 'missing';
    dignity: 'available' | 'not-applicable' | 'missing';
    dispositor: 'available' | 'missing';
  };
}

export interface NatalHouseFacts {
  number: number;
  signIndex: number;
  sign: string;
  lord: NatalPlanetKey | null;
  lordHouse: number | null;
  occupants: NatalPlanetKey[];
  aspectedBy: NatalPlanetKey[];
  ruledBySamePlanet: number[];
  dataAvailability: {
    lord: 'available' | 'missing';
    lordPlacement: 'available' | 'missing';
  };
}

export interface NatalChartFacts {
  schemaVersion: 1;
  chart: {
    birthDate: string;
    latitude: number;
    longitude: number;
    ascendantSign: string | null;
    ascendantDegree: number | null;
    ascendantNakshatra: string | null;
    ascendantPada: number | null;
  };
  methodology: {
    houseSystem: 'Whole Sign';
    zodiac: 'Sidereal';
    ayanamsha: 'Lahiri';
    aspectSystem: 'Parashari graha drishti';
    conjunctionRule: 'same sidereal sign; exact orb is not calculated';
    nodesAspectRule: 'Rahu/Ketu aspects excluded; conjunctions retained';
  };
  planets: Record<NatalPlanetKey, NatalPlanetFacts | null>;
  houses: NatalHouseFacts[];
  aspects: {
    house: HouseDrishti[];
    planet: PlanetToPlanetAspect[];
  };
  links: NatalFactLink[];
  dataQuality: {
    completePlanetCount: number;
    missingPlanetKeys: NatalPlanetKey[];
    missingHouseNumbers: number[];
    warnings: string[];
    unsupportedFactors: string[];
  };
}

function isPlanetKey(value: string | null | undefined): value is NatalPlanetKey {
  return Boolean(value && (NATAL_PLANET_KEYS as readonly string[]).includes(value));
}

function planetLabel(key: string | null): string {
  return key && isPlanetKey(key) ? PLANET_NAMES[key] : 'неизвестный управитель';
}

function addLink(
  links: NatalFactLink[],
  relation: NatalFactRelation,
  sourceId: string,
  targetId: string,
  sourceLabel: string,
  targetLabel: string,
  method: string,
  evidence: string,
): void {
  const id = [relation, sourceId, targetId].join(':');
  if (links.some((link) => link.id === id)) return;
  links.push({ id, relation, sourceId, targetId, sourceLabel, targetLabel, method, evidence });
}

/**
 * Creates the canonical, read-only facts-and-relations model consumed by
 * interpretation features. It deliberately records missing data instead of
 * filling gaps with defaults or inferred values.
 */
export function buildNatalChartFacts(chart: NatalChart): NatalChartFacts {
  const houseRows = chart.houses ?? [];
  const houseAspects = getGrahaDrishti(chart);
  const planetAspects = getPlanetToPlanetAspects(chart, [...NATAL_PLANET_KEYS]);
  const links: NatalFactLink[] = [];
  const planetFacts = {} as Record<NatalPlanetKey, NatalPlanetFacts | null>;
  const houseFacts: NatalHouseFacts[] = [];
  const warnings: string[] = [];

  const ruledHousesByPlanet = new Map<NatalPlanetKey, number[]>();
  for (const house of houseRows) {
    if (!isPlanetKey(house.lord)) continue;
    ruledHousesByPlanet.set(house.lord, [...(ruledHousesByPlanet.get(house.lord) ?? []), house.house]);
  }

  for (const key of NATAL_PLANET_KEYS) {
    const position = chart.planets[key];
    if (!position) {
      planetFacts[key] = null;
      continue;
    }

    const house = getPlanetHouse(chart, key);
    const signHouse = houseRows.find((item) => item.sign === position.sign);
    const dispositor = signHouse && isPlanetKey(signHouse.lord) ? signHouse.lord : null;
    const dignity = evaluatePlanetCondition(chart, key);
    const ruledHouses = ruledHousesByPlanet.get(key) ?? [];
    const conjunctions = NATAL_PLANET_KEYS.filter((other) =>
      other !== key && Boolean(chart.planets[other]) && chart.planets[other].sign === position.sign,
    );
    const outgoingHouseAspects = houseAspects
      .filter((aspect) => aspect.source === PLANET_NAMES[key])
      .map((aspect) => aspect.targetHouse);
    const outgoingPlanetAspects = planetAspects
      .filter((aspect) => aspect.sourceKey === key)
      .map((aspect) => aspect.targetKey as NatalPlanetKey);
    const incomingPlanetAspects = planetAspects
      .filter((aspect) => aspect.targetKey === key)
      .map((aspect) => aspect.sourceKey as NatalPlanetKey);
    const dispositorHouse = dispositor ? getPlanetHouse(chart, dispositor) : null;

    planetFacts[key] = {
      key,
      name: PLANET_NAMES[key],
      signIndex: position.sign,
      sign: SIGN_NAMES[position.sign] ?? position.signName,
      longitude: position.siderealLon,
      degreeInSign: position.degree,
      nakshatraIndex: position.nakshatra,
      nakshatra: position.nakshatraName,
      pada: position.pada,
      house,
      ruledHouses,
      dispositor,
      dispositorHouse,
      dignity,
      conjunctions,
      aspectsToHouses: [...new Set(outgoingHouseAspects)].sort((a, b) => a - b),
      aspectsToPlanets: [...new Set(outgoingPlanetAspects)],
      receivesAspectsFrom: [...new Set(incomingPlanetAspects)],
      dataAvailability: {
        house: house === null ? 'missing' : 'available',
        dignity: !dignity ? 'missing' : dignity.dignity === 'not_applicable' ? 'not-applicable' : 'available',
        dispositor: dispositor ? 'available' : 'missing',
      },
    };

    if (house !== null) {
      addLink(links, 'occupies-house', `planet:${key}`, `house:${house}`, PLANET_NAMES[key], `${house}-й дом`, 'Whole Sign', `${PLANET_NAMES[key]} в знаке ${SIGN_NAMES[position.sign] ?? position.signName} соответствует ${house}-му дому.`);
    }
    for (const ruledHouse of ruledHouses) {
      addLink(links, 'rules-house', `planet:${key}`, `house:${ruledHouse}`, PLANET_NAMES[key], `${ruledHouse}-й дом`, 'sign lordship', `${PLANET_NAMES[key]} является управителем ${ruledHouse}-го дома.`);
    }
    if (dispositor) {
      addLink(links, 'dispositor-of', `planet:${dispositor}`, `planet:${key}`, PLANET_NAMES[dispositor], PLANET_NAMES[key], 'sign dispositor', `${PLANET_NAMES[key]} находится в знаке, которым управляет ${PLANET_NAMES[dispositor]}.`);
    }
    for (const other of conjunctions) {
      if (NATAL_PLANET_KEYS.indexOf(key) < NATAL_PLANET_KEYS.indexOf(other)) {
        addLink(links, 'conjuncts', `planet:${key}`, `planet:${other}`, PLANET_NAMES[key], PLANET_NAMES[other], 'same sidereal sign', `${PLANET_NAMES[key]} и ${PLANET_NAMES[other]} находятся в одном сидерическом знаке; точный орбис не рассчитывается.`);
      }
    }
  }

  for (const house of houseRows) {
    const lord = isPlanetKey(house.lord) ? house.lord : null;
    const lordHouse = lord ? getPlanetHouse(chart, lord) : null;
    const occupants = NATAL_PLANET_KEYS.filter((key) =>
      Boolean(chart.planets[key]) && chart.planets[key].sign === house.sign,
    );
    const aspectedBy = [...new Set(houseAspects.filter((aspect) => aspect.targetHouse === house.house)
      .map((aspect) => NATAL_PLANET_KEYS.find((key) => PLANET_NAMES[key] === aspect.source))
      .filter((key): key is NatalPlanetKey => Boolean(key)))];
    const ruledBySamePlanet = lord ? ruledHousesByPlanet.get(lord) ?? [] : [];

    houseFacts.push({
      number: house.house,
      signIndex: house.sign,
      sign: SIGN_NAMES[house.sign] ?? house.signName,
      lord,
      lordHouse,
      occupants,
      aspectedBy,
      ruledBySamePlanet,
      dataAvailability: {
        lord: lord ? 'available' : 'missing',
        lordPlacement: lordHouse === null ? 'missing' : 'available',
      },
    });

    if (lord) {
      addLink(links, 'rules-house', `planet:${lord}`, `house:${house.house}`, PLANET_NAMES[lord], `${house.house}-й дом`, 'sign lordship', `${PLANET_NAMES[lord]} управляет ${house.house}-м домом.`);
      if (lordHouse !== null) {
        addLink(links, 'house-lord-placed-in', `house:${house.house}`, `house:${lordHouse}`, `${house.house}-й дом`, `${lordHouse}-й дом`, 'lord placement', `Управитель ${house.house}-го дома расположен в ${lordHouse}-м доме.`);
      }
    }
    for (const occupant of occupants) {
      addLink(links, 'occupies-house', `planet:${occupant}`, `house:${house.house}`, PLANET_NAMES[occupant], `${house.house}-й дом`, 'Whole Sign', `${PLANET_NAMES[occupant]} занимает ${house.house}-й дом.`);
    }
    for (const source of aspectedBy) {
      addLink(links, 'aspects-house', `planet:${source}`, `house:${house.house}`, PLANET_NAMES[source], `${house.house}-й дом`, 'Parashari graha drishti', `${PLANET_NAMES[source]} аспектирует ${house.house}-й дом по используемой схеме граха-дришти.`);
    }
    if (lord && ruledBySamePlanet.length > 1) {
      for (const relatedHouse of ruledBySamePlanet.filter((item) => item !== house.house)) {
        addLink(links, 'shares-ruler-with', `house:${house.house}`, `house:${relatedHouse}`, `${house.house}-й дом`, `${relatedHouse}-й дом`, 'shared lord', `Оба дома управляются планетой ${PLANET_NAMES[lord]}.`);
      }
    }
  }

  for (const aspect of planetAspects) {
    const source = aspect.sourceKey as NatalPlanetKey;
    const target = aspect.targetKey as NatalPlanetKey;
    addLink(
      links,
      aspect.kind === 'conjunction' ? 'conjuncts' : 'aspects-planet',
      `planet:${source}`,
      `planet:${target}`,
      PLANET_NAMES[source],
      PLANET_NAMES[target],
      aspect.kind === 'conjunction' ? 'same sidereal sign' : 'Parashari graha drishti',
      aspect.kind === 'conjunction'
        ? 'Планеты находятся в одном сидерическом знаке; точный орбис не рассчитывается.'
        : `${PLANET_NAMES[source]} направляет граха-дришти на ${PLANET_NAMES[target]}.`,
    );
  }

  for (const [key, facts] of Object.entries(planetFacts) as Array<[NatalPlanetKey, NatalPlanetFacts | null]>) {
    if (facts && facts.dataAvailability.house === 'missing') warnings.push(`Дом планеты ${PLANET_NAMES[key]} не определён по доступным данным.`);
    if (facts && facts.dataAvailability.dispositor === 'missing') warnings.push(`Диспозитор планеты ${PLANET_NAMES[key]} не определён по доступным данным.`);
  }

  const missingPlanetKeys = NATAL_PLANET_KEYS.filter((key) => !planetFacts[key]);
  const missingHouseNumbers = Array.from({ length: 12 }, (_, index) => index + 1)
    .filter((number) => !houseRows.some((house) => house.house === number));
  if (missingHouseNumbers.length) warnings.push(`В модели отсутствуют дома: ${missingHouseNumbers.join(', ')}.`);
  if (!chart.ascendant) warnings.push('Положение Асцендента отсутствует.');
  if (missingPlanetKeys.length) warnings.push(`Отсутствуют планеты: ${missingPlanetKeys.map((key) => PLANET_NAMES[key]).join(', ')}.`);

  return {
    schemaVersion: 1,
    chart: {
      birthDate: chart.date instanceof Date && Number.isFinite(chart.date.getTime()) ? chart.date.toISOString() : '',
      latitude: chart.latitude,
      longitude: chart.longitude,
      ascendantSign: chart.ascendant ? SIGN_NAMES[chart.ascendant.sign] ?? chart.ascendant.signName : null,
      ascendantDegree: chart.ascendant && Number.isFinite(chart.ascendant.degree) ? chart.ascendant.degree : null,
      ascendantNakshatra: chart.ascendant?.nakshatraName ?? null,
      ascendantPada: chart.ascendant?.pada ?? null,
    },
    methodology: {
      houseSystem: 'Whole Sign',
      zodiac: 'Sidereal',
      ayanamsha: 'Lahiri',
      aspectSystem: 'Parashari graha drishti',
      conjunctionRule: 'same sidereal sign; exact orb is not calculated',
      nodesAspectRule: 'Rahu/Ketu aspects excluded; conjunctions retained',
    },
    planets: planetFacts,
    houses: houseFacts.sort((a, b) => a.number - b.number),
    aspects: { house: houseAspects, planet: planetAspects },
    links,
    dataQuality: {
      completePlanetCount: NATAL_PLANET_KEYS.length - missingPlanetKeys.length,
      missingPlanetKeys,
      missingHouseNumbers,
      warnings: [...new Set(warnings)],
      unsupportedFactors: [
        'Ретроградность не хранится в PlanetPosition и не выводится из знака/долготы.',
        'Сожжение не рассчитывается: в модели нет отдельного валидированного правила и порогов орбиса.',
        'Точные орбисы соединений и аспектов не рассчитываются; соединение фиксируется по одному сидерическому знаку.',
        'Аспекты Раху/Кету исключены из-за различий школ; соединения узлов с планетами по знаку сохраняются.',
      ],
    },
  };
}

export function getNatalFactLinks(
  facts: NatalChartFacts,
  relation?: NatalFactRelation,
): NatalFactLink[] {
  return relation ? facts.links.filter((link) => link.relation === relation) : [...facts.links];
}

export function getNatalPlanetFacts(facts: NatalChartFacts, planet: NatalPlanetKey): NatalPlanetFacts | null {
  return facts.planets[planet];
}

export function getNatalHouseFacts(facts: NatalChartFacts, house: number): NatalHouseFacts | null {
  return facts.houses.find((item) => item.number === house) ?? null;
}
