import {
  NATAL_PLANET_KEYS,
  type NatalChartFacts,
  type NatalPlanetKey,
} from './natalChartFacts';
import { analyzeAllNatalHouses } from './natalHousePersonalizedAnalysis';
import { analyzeAllNatalPlanets } from './natalPlanetPersonalizedAnalysis';

const PLANET_NAMES: Record<NatalPlanetKey, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const HOUSE_THEMES: Record<number, string> = {
  1: 'личность и самостоятельные действия', 2: 'ресурсы и ценности',
  3: 'обучение и коммуникация', 4: 'дом и внутренняя опора',
  5: 'творчество и самовыражение', 6: 'работа и повседневные задачи',
  7: 'партнёрство и договорённости', 8: 'общие ресурсы и перемены',
  9: 'знания и мировоззрение', 10: 'профессия и ответственность',
  11: 'результаты, сообщества и цели', 12: 'уединение и завершение циклов',
};

export interface NatalSynthesisEvidence {
  id: string;
  title: string;
  statement: string;
  evidence: string[];
  relatedHouses: number[];
  relatedPlanets: NatalPlanetKey[];
  kind: 'chart-anchor' | 'concentration' | 'house-bridge' | 'planet-network' | 'dispositor-pattern' | 'balance';
}

export interface NatalChartSynthesis {
  headline: string;
  overview: string;
  dominantThemes: Array<{ house: number; theme: string; score: number; evidence: string[] }>;
  bridges: Array<{ fromHouse: number; toHouse: number; lord: NatalPlanetKey; evidence: string }>;
  planetNetworks: Array<{ planets: NatalPlanetKey[]; relation: 'conjunction' | 'aspect'; evidence: string }>;
  dispositorPatterns: Array<{ planet: NatalPlanetKey; count: number; evidence: string }>;
  conclusions: NatalSynthesisEvidence[];
  tensions: string[];
  dataQuality: { completeness: number; missingPlanets: NatalPlanetKey[]; missingHouses: number[]; caveats: string[] };
  methodology: string[];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * Combines the canonical fact graph with the detailed house and planet
 * analyses. Every chart-level conclusion carries traceable chart evidence.
 * This is a traditional symbolic synthesis, not a deterministic prediction.
 */
export function synthesizeNatalChart(facts: NatalChartFacts): NatalChartSynthesis {
  const houses = analyzeAllNatalHouses(facts);
  const planets = analyzeAllNatalPlanets(facts);
  const available = NATAL_PLANET_KEYS.filter((key) => facts.planets[key]);
  const conclusions: NatalSynthesisEvidence[] = [];
  const bridges: NatalChartSynthesis['bridges'] = [];
  const planetNetworks: NatalChartSynthesis['planetNetworks'] = [];
  const dispositorCounts = new Map<NatalPlanetKey, number>();
  const houseScores = new Map<number, { score: number; evidence: string[] }>();

  const addHouseSignal = (house: number | null, points: number, evidence: string) => {
    if (house === null) return;
    const current = houseScores.get(house) ?? { score: 0, evidence: [] };
    current.score += points;
    current.evidence.push(evidence);
    houseScores.set(house, current);
  };

  for (const key of available) {
    const planet = facts.planets[key]!;
    addHouseSignal(planet.house, 2, `${PLANET_NAMES[key]} расположена в ${planet.house ?? 'неопределённом'} доме.`);
    for (const ruledHouse of planet.ruledHouses) {
      addHouseSignal(ruledHouse, 1, `${PLANET_NAMES[key]} управляет ${ruledHouse}-м домом.`);
    }
    if (planet.dispositor) dispositorCounts.set(planet.dispositor, (dispositorCounts.get(planet.dispositor) ?? 0) + 1);
  }

  for (const house of houses) {
    if (!house.available || !house.lord || house.lordHouse === null) continue;
    if (house.lordHouse !== house.house) {
      const evidence = `Управитель ${house.house}-го дома ${PLANET_NAMES[house.lord]} расположен в ${house.lordHouse}-м доме; темы «${HOUSE_THEMES[house.house]}» и «${HOUSE_THEMES[house.lordHouse]}» связываются через управителя.`;
      bridges.push({ fromHouse: house.house, toHouse: house.lordHouse, lord: house.lord, evidence });
      addHouseSignal(house.lordHouse, 1, evidence);
    }
  }

  for (const link of facts.links) {
    if (link.relation === 'conjuncts') {
      const source = link.sourceId.replace('planet:', '') as NatalPlanetKey;
      const target = link.targetId.replace('planet:', '') as NatalPlanetKey;
      if (NATAL_PLANET_KEYS.includes(source) && NATAL_PLANET_KEYS.includes(target)) {
        planetNetworks.push({
          planets: [source, target], relation: 'conjunction',
          evidence: `${link.sourceLabel} и ${link.targetLabel} находятся в одном сидерическом знаке. Точный орбис не рассчитывается.`,
        });
      }
    } else if (link.relation === 'aspects-planet') {
      const source = link.sourceId.replace('planet:', '') as NatalPlanetKey;
      const target = link.targetId.replace('planet:', '') as NatalPlanetKey;
      if (NATAL_PLANET_KEYS.includes(source) && NATAL_PLANET_KEYS.includes(target)) {
        planetNetworks.push({ planets: [source, target], relation: 'aspect', evidence: link.evidence });
      }
    }
  }

  const ascendantLord = facts.houses.find((house) => house.number === 1)?.lord ?? null;
  if (facts.chart.ascendantSign && ascendantLord) {
    const lordFacts = facts.planets[ascendantLord];
    const evidence = [
      `Асцендент находится в знаке ${facts.chart.ascendantSign}.`,
      `Управитель 1-го дома — ${PLANET_NAMES[ascendantLord]}.`,
      lordFacts
        ? lordFacts.house === null
          ? `Дом расположения ${PLANET_NAMES[ascendantLord]} не определён.`
          : `${PLANET_NAMES[ascendantLord]} расположен в ${lordFacts.house}-м доме.`
        : `Положение управителя ${PLANET_NAMES[ascendantLord]} отсутствует в данных.`,
    ];
    conclusions.push({
      id: 'chart-anchor', kind: 'chart-anchor', title: 'Базовая конфигурация карты',
      statement: lordFacts?.house
        ? `Отправная точка анализа — Асцендент в ${facts.chart.ascendantSign}; управитель личности ${PLANET_NAMES[ascendantLord]} переносит акцент в ${lordFacts.house}-й дом.`
        : `Асцендент в ${facts.chart.ascendantSign} определён, но положение его управителя нельзя подтвердить полностью.`,
      evidence, relatedHouses: lordFacts?.house ? [1, lordFacts.house] : [1],
      relatedPlanets: [ascendantLord],
    });
  }

  const dominantThemes = [...houseScores.entries()]
    .map(([house, item]) => ({
      house, theme: HOUSE_THEMES[house], score: item.score,
      evidence: unique(item.evidence),
    }))
    .sort((a, b) => b.score - a.score || a.house - b.house)
    .slice(0, 5);

  for (const [index, theme] of dominantThemes.entries()) {
    if (theme.score < 3) continue;
    conclusions.push({
      id: `theme-${theme.house}`, kind: 'concentration',
      title: `Повторяющийся акцент: ${theme.house}-й дом`,
      statement: `В карте несколько независимых связей указывают на тему «${theme.theme}» (${theme.house}-й дом). Это заметный тематический акцент, а не гарантия событий.`,
      evidence: theme.evidence, relatedHouses: [theme.house],
      relatedPlanets: available.filter((key) => facts.planets[key]?.house === theme.house
        || facts.planets[key]?.ruledHouses.includes(theme.house)),
    });
    if (index >= 2) break;
  }

  for (const bridge of bridges) {
    conclusions.push({
      id: `bridge-${bridge.fromHouse}-${bridge.toHouse}`, kind: 'house-bridge',
      title: `Связь ${bridge.fromHouse}-го и ${bridge.toHouse}-го домов`,
      statement: bridge.evidence,
      evidence: [bridge.evidence], relatedHouses: [bridge.fromHouse, bridge.toHouse],
      relatedPlanets: [bridge.lord],
    });
  }

  const groupedNetworks = new Map<string, NatalChartSynthesis['planetNetworks'][number]>();
  for (const network of planetNetworks) {
    const key = `${network.relation}:${[...network.planets].sort().join(':')}`;
    groupedNetworks.set(key, network);
  }
  for (const [index, network] of [...groupedNetworks.values()].entries()) {
    if (index >= 8) break;
    conclusions.push({
      id: `network-${index}`, kind: 'planet-network',
      title: network.relation === 'conjunction' ? 'Соединение планет' : 'Межпланетная связь',
      statement: network.evidence, evidence: [network.evidence],
      relatedHouses: unique(network.planets.map((key) => facts.planets[key]?.house ?? null).filter((value): value is number => value !== null)),
      relatedPlanets: network.planets,
    });
  }

  const dispositorPatterns = [...dispositorCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([planet, count]) => ({
      planet, count,
      evidence: `${count} планет(ы) имеют ${PLANET_NAMES[planet]} диспозитором; это повторяющийся узел диспозиторных связей, а не самостоятельная оценка силы.`,
    }))
    .sort((a, b) => b.count - a.count || a.planet.localeCompare(b.planet));

  for (const pattern of dispositorPatterns) {
    conclusions.push({
      id: `dispositor-${pattern.planet}`, kind: 'dispositor-pattern',
      title: `Повторяющийся диспозитор: ${PLANET_NAMES[pattern.planet]}`,
      statement: pattern.evidence, evidence: [pattern.evidence],
      relatedHouses: unique(available.map((key) => facts.planets[key]?.house ?? null).filter((value): value is number => value !== null)),
      relatedPlanets: available.filter((key) => facts.planets[key]?.dispositor === pattern.planet).concat(pattern.planet),
    });
  }

  const supportive = houses.filter((house) => house.synthesis === 'supportive').length;
  const challenging = houses.filter((house) => house.synthesis === 'challenging').length;
  const mixed = houses.filter((house) => house.synthesis === 'mixed').length;
  const tensions: string[] = [];
  if (supportive && challenging) tensions.push(`Оценки домов неоднородны: ${supportive} домов имеют поддерживающий профиль, ${challenging} — профиль с факторами внимания. Это не противоречие расчёта, а различие показателей по жизненным темам.`);
  if (mixed) tensions.push(`${mixed} домов содержат одновременно поддерживающие и требующие внимания факторы; их нельзя сводить к однозначно положительной или отрицательной оценке.`);
  if (facts.dataQuality.missingPlanetKeys.length || facts.dataQuality.missingHouseNumbers.length) {
    tensions.push('Часть исходных данных отсутствует; общие выводы следует считать предварительными и читать вместе с ограничениями.');
  }

  const completeness = Math.round((available.length / NATAL_PLANET_KEYS.length * 0.6
    + (12 - facts.dataQuality.missingHouseNumbers.length) / 12 * 0.4) * 100);
  const caveats = unique([
    ...facts.dataQuality.warnings,
    ...facts.dataQuality.unsupportedFactors,
    'Синтез объединяет традиционные символические показатели; он не является научно подтверждённым прогнозом.',
  ]);
  const methodology = [
    'Единый источник фактов: NatalChartFacts; положения и связи повторно не рассчитываются.',
    'Сидерический зодиак, айанамша Лахири, система Whole Sign.',
    'Аспекты: Parashari graha drishti; аспекты Раху/Кету исключены.',
    'Соединения определяются по общему знаку без точного орбиса.',
    'Вес тематических акцентов — прозрачная эвристика: положение планеты 2 балла, управление домом и связь управителя 1 балл; это не шкала силы.',
  ];

  const headline = dominantThemes[0]
    ? `Главный повторяющийся акцент — ${dominantThemes[0].house}-й дом: ${dominantThemes[0].theme}.`
    : 'Для выделения доминирующих тем недостаточно согласованных показателей.';
  const overview = `В синтез включены ${available.length} из 9 планет и ${12 - facts.dataQuality.missingHouseNumbers.length} из 12 домов. Выводы строятся по повторяющимся положениям, управлению домами, связям управителей, аспектам и диспозиторным отношениям; отдельные показатели не трактуются изолированно.`;

  return {
    headline, overview, dominantThemes, bridges, planetNetworks: [...groupedNetworks.values()],
    dispositorPatterns, conclusions, tensions,
    dataQuality: {
      completeness, missingPlanets: facts.dataQuality.missingPlanetKeys,
      missingHouses: facts.dataQuality.missingHouseNumbers, caveats,
    },
    methodology,
  };
}
