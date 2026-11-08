import type { NatalChart } from './astrology';

export interface PlanetCondition {
  planet: string;
  sign: string;
  dignity: 'exalted' | 'own' | 'debilitated' | 'other' | 'not_applicable';
  label: string;
  score: number | null;
  explanation: string;
  house: number | null;
}

const EXALTATION: Record<string, number> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const OWN_SIGNS: Record<string, number[]> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};
const PLANET_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const SIGN_RU = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];

export function getPlanetHouse(chart: NatalChart, planetName: string): number | null {
  const planet = chart.planets[planetName as keyof NatalChart['planets']];
  if (!planet || !chart.houses) return null;
  return chart.houses.find((house) => house.sign === planet.sign)?.house ?? null;
}

export function evaluatePlanetCondition(chart: NatalChart, planetName: string): PlanetCondition | null {
  const planet = chart.planets[planetName as keyof NatalChart['planets']];
  if (!planet) return null;
  const sign = planet.sign;
  if (planetName === 'Rahu' || planetName === 'Ketu') {
    return {
      planet: PLANET_RU[planetName],
      sign: SIGN_RU[sign] ?? planet.signName,
      dignity: 'not_applicable',
      label: 'отдельная оценка достоинства не применяется',
      score: null,
      explanation: 'Для лунных узлов экзальтация, падение и собственные знаки трактуются неодинаково в разных школах. Здесь их положение оценивается через дом, знак и диспозитора, без условного балла.',
      house: getPlanetHouse(chart, planetName),
    };
  }
  const debilitationSign = EXALTATION[planetName] === undefined ? undefined : (EXALTATION[planetName] + 6) % 12;
  let dignity: PlanetCondition['dignity'] = 'other';
  let label = 'в другом знаке';
  let score = 50;
  let explanation = 'Планета не находится в собственном, экзальтационном или знаке падения. Это нейтральная базовая оценка по достоинству знака; она не описывает всю силу планеты.';

  if (EXALTATION[planetName] === sign) {
    dignity = 'exalted';
    label = 'экзальтация';
    score = 90;
    explanation = 'В традиционной системе это положение считается усиленным: качества планеты получают заметную поддержку знака.';
  } else if (debilitationSign === sign) {
    dignity = 'debilitated';
    label = 'падение';
    score = 25;
    explanation = 'В традиционной системе это положение считается ослабленным: проявление качеств планеты может требовать больше осознанности и практики.';
  } else if (OWN_SIGNS[planetName]?.includes(sign)) {
    dignity = 'own';
    label = 'собственный знак';
    score = 75;
    explanation = 'Планета находится в собственном знаке: традиционно это трактуется как более устойчивое и самостоятельное проявление её функций.';
  }

  return {
    planet: PLANET_RU[planetName] ?? planetName,
    sign: SIGN_RU[sign] ?? planet.signName,
    dignity,
    label,
    score,
    explanation,
    house: getPlanetHouse(chart, planetName),
  };
}

const SPECIAL_DRISHTI: Record<string, number[]> = {
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
};

export interface HouseDrishti {
  source: string;
  sourceHouse: number;
  targetHouse: number;
  kind: string;
}

export function getGrahaDrishti(chart: NatalChart): HouseDrishti[] {
  const results: HouseDrishti[] = [];
  for (const planetName of Object.keys(chart.planets)) {
    // The lunar nodes have disputed special-aspect rules; omit them rather than imply one school is universal.
    if (planetName === 'Rahu' || planetName === 'Ketu') continue;
    const sourceHouse = getPlanetHouse(chart, planetName);
    if (!sourceHouse) continue;
    const offsets = SPECIAL_DRISHTI[planetName] ?? [7];
    for (const offset of offsets) {
      const targetHouse = ((sourceHouse - 1 + offset - 1) % 12) + 1;
      results.push({
        source: PLANET_RU[planetName] ?? planetName,
        sourceHouse,
        targetHouse,
        kind: offset === 7 ? 'полный аспект 7-го дома' : `специальный аспект ${offset}-го дома`,
      });
    }
  }
  return results;
}

export function describeHouseDrishti(chart: NatalChart, houseNumber: number): string[] {
  return getGrahaDrishti(chart)
    .filter((item) => item.targetHouse === houseNumber)
    .map((item) => `${item.source} из ${item.sourceHouse}-го дома даёт ${item.kind} на ${houseNumber}-й дом.`);
}

export function describePeriodConnection(
  chart: NatalChart,
  planetName: string,
  relevantHouses: number[],
  relevantPlanets: string[],
): string {
  const condition = evaluatePlanetCondition(chart, planetName);
  if (!condition) return `Положение планеты периода (${planetName}) не найдено в карте.`;
  const links: string[] = [];
  const rulesHouses = chart.houses?.filter((house) => house.lord === planetName).map((house) => house.house) ?? [];
  const occupiedHouse = condition.house;
  const aspects = occupiedHouse ? getGrahaDrishti(chart).filter((item) => item.source === condition.planet && relevantHouses.includes(item.targetHouse)) : [];
  if (rulesHouses.some((house) => relevantHouses.includes(house))) {
    links.push(`управляет тематическим домом ${rulesHouses.filter((house) => relevantHouses.includes(house)).join(', ')}`);
  }
  if (occupiedHouse && relevantHouses.includes(occupiedHouse)) links.push(`расположена непосредственно в ${occupiedHouse}-м тематическом доме`);
  if (aspects.length) links.push(`аспектирует тематический дом ${aspects.map((item) => item.targetHouse).join(', ')}`);
  const influencesOnPeriodLord = occupiedHouse
    ? getGrahaDrishti(chart).filter((item) => item.targetHouse === occupiedHouse && item.source !== condition.planet)
    : [];
  if (influencesOnPeriodLord.length) {
    links.push(`получает аспект на своё положение от ${influencesOnPeriodLord.map((item) => item.source).join(', ')}`);
  }
  if (relevantPlanets.includes(planetName) && !links.length) links.push('связана с тематикой как одна из планет, расположенных в рассматриваемых домах');
  let dispositorNote = '';
  if (planetName === 'Rahu' || planetName === 'Ketu') {
    const dispositor = chart.houses?.find((house) => house.sign === chart.planets[planetName as keyof NatalChart['planets']].sign)?.lord;
    if (dispositor) {
      const dispositorCondition = evaluatePlanetCondition(chart, dispositor);
      const dispositorHouse = getPlanetHouse(chart, dispositor);
      const dispositorRules = chart.houses?.filter((house) => house.lord === dispositor).map((house) => house.house) ?? [];
      const dispositorLinks = [
        dispositorRules.some((house) => relevantHouses.includes(house))
          ? `управляет тематическими домами ${dispositorRules.filter((house) => relevantHouses.includes(house)).join(', ')}`
          : '',
        dispositorHouse && relevantHouses.includes(dispositorHouse)
          ? `находится в тематическом ${dispositorHouse}-м доме`
          : '',
      ].filter(Boolean);
      dispositorNote = ` Диспозитор ${PLANET_RU[dispositor] ?? dispositor} (${dispositorCondition?.sign ?? 'знак неизвестен'}, ${dispositorHouse ? `${dispositorHouse}-й дом` : 'дом неизвестен'}, ${dispositorCondition?.label ?? 'достоинство не определено'})${dispositorLinks.length ? `: ${dispositorLinks.join('; ')}.` : ' не имеет прямой связи с указанными домами по управлению или положению.'}`;
    }
  }
  const connection = links.length ? links.join('; ') : 'прямой связи с выбранными домами по управлению, положению или аспекту не обнаружено';
  const houseLabel = condition.house ? `${condition.house}-м доме` : 'дом не определён';
  return `${condition.planet} (${condition.sign}, ${houseLabel}; ${condition.label}) ${connection}. ${condition.explanation}${dispositorNote}`;
}

export interface PlanetToPlanetAspect {
  source: string;
  target: string;
  sourceHouse: number;
  targetHouse: number;
  kind: 'conjunction' | 'graha-drishti';
  offset: number | null;
}

/** Direct relationships between planets using whole-sign houses and classical Parashari aspects. */
export function getPlanetToPlanetAspects(chart: NatalChart, planetNames: string[]): PlanetToPlanetAspect[] {
  const results: PlanetToPlanetAspect[] = [];
  const uniqueNames = [...new Set(planetNames)].filter((name) =>
    Boolean(chart.planets[name as keyof NatalChart['planets']]),
  );

  for (const source of uniqueNames) {
    const sourcePosition = chart.planets[source as keyof NatalChart['planets']];
    const sourceHouse = getPlanetHouse(chart, source);
    if (!sourceHouse || source === 'Rahu' || source === 'Ketu') continue;

    for (const target of uniqueNames) {
      if (source === target) continue;
      if (target === 'Rahu' || target === 'Ketu') continue;
      const targetPosition = chart.planets[target as keyof NatalChart['planets']];
      const targetHouse = getPlanetHouse(chart, target);
      if (!targetHouse) continue;

      if (sourcePosition.sign === targetPosition.sign) {
        if (uniqueNames.indexOf(source) < uniqueNames.indexOf(target)) {
          results.push({ source: PLANET_RU[source] ?? source, target: PLANET_RU[target] ?? target, sourceHouse, targetHouse, kind: 'conjunction', offset: null });
        }
        continue;
      }

      const offset = ((targetHouse - sourceHouse + 12) % 12) + 1;
      const allowedOffsets = SPECIAL_DRISHTI[source] ?? [7];
      if (allowedOffsets.includes(offset)) {
        results.push({ source: PLANET_RU[source] ?? source, target: PLANET_RU[target] ?? target, sourceHouse, targetHouse, kind: 'graha-drishti', offset });
      }
    }
  }
  return results;
}
