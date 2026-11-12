import type { NatalChart } from './astrology';
import { buildNatalChartFacts, NATAL_PLANET_KEYS, type NatalPlanetKey } from './natalChartFacts';
import { analyzeAllNatalHouses } from './natalHousePersonalizedAnalysis';
import { analyzeAllNatalPlanets } from './natalPlanetPersonalizedAnalysis';
import { analyzeNatalYogas } from './natalYogaAnalysis';
import { analyzeDivisionalCharts } from './divisionalChartAnalysis';
import { analyzeVimshottariDasha } from './vimshottariDashaAnalysis';
import { analyzeTransits } from './transitAnalysis';

export type IntegratedAreaId = 'identity' | 'resources' | 'skills' | 'home' | 'creativity' | 'work' | 'relationships' | 'transformation' | 'wisdom' | 'career' | 'gains' | 'retreat';
export type IntegratedSource = 'house' | 'planet' | 'yoga' | 'varga' | 'dasha' | 'transit';
export type IntegratedPolarity = 'supportive' | 'tension' | 'mixed' | 'neutral';
export interface IntegratedEvidence {
  id: string;
  factorId: string;
  source: IntegratedSource;
  sourceFamily: 'natal-structure' | 'varga-projection' | 'timing-dasha' | 'timing-transit';
  area: IntegratedAreaId;
  title: string;
  statement: string;
  polarity: IntegratedPolarity;
  references: string[];
  duplicateMentions: number;
}
export interface IntegratedAreaSynthesis {
  id: IntegratedAreaId;
  title: string;
  houses: number[];
  evidence: IntegratedEvidence[];
  uniqueFactorCount: number;
  sourceFamilies: string[];
  repeatedTheme: boolean;
  contradictions: string[];
  summary: string;
  dataStatus: 'complete' | 'partial' | 'unavailable';
}
export interface IntegratedNatalAnalysis {
  generatedAt: Date;
  headline: string;
  overview: string;
  areas: IntegratedAreaSynthesis[];
  evidence: IntegratedEvidence[];
  contradictions: Array<{ area: IntegratedAreaId; title: string; explanation: string; evidenceIds: string[] }>;
  repeatedThemes: Array<{ area: IntegratedAreaId; title: string; sourceFamilies: string[]; factorIds: string[]; explanation: string }>;
  dataQuality: { status: 'complete' | 'partial'; missingPlanets: NatalPlanetKey[]; missingHouses: number[]; warnings: string[] };
  methodology: string[];
}
const AREAS: Array<{ id: IntegratedAreaId; title: string; houses: number[] }> = [
  { id: 'identity', title: 'Личность и самоопределение', houses: [1] },
  { id: 'resources', title: 'Деньги и личные ресурсы', houses: [2, 11] },
  { id: 'skills', title: 'Навыки и коммуникация', houses: [3] },
  { id: 'home', title: 'Дом и внутренняя опора', houses: [4] },
  { id: 'creativity', title: 'Творчество и дети', houses: [5] },
  { id: 'work', title: 'Работа и повседневные задачи', houses: [6] },
  { id: 'relationships', title: 'Отношения и партнёрство', houses: [7] },
  { id: 'transformation', title: 'Общие ресурсы и перемены', houses: [8] },
  { id: 'wisdom', title: 'Обучение и мировоззрение', houses: [9] },
  { id: 'career', title: 'Профессия и реализация', houses: [10] },
  { id: 'gains', title: 'Результаты и сообщества', houses: [11] },
  { id: 'retreat', title: 'Восстановление и завершение циклов', houses: [12] },
];
const PLANET_NAMES: Record<NatalPlanetKey, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };
const DASHA_AREAS: Record<string, IntegratedAreaId> = { finances: 'resources', career: 'career', relationships: 'relationships', home: 'home', family: 'home', children: 'creativity', learning: 'wisdom', creativity: 'creativity', spirituality: 'retreat', health: 'work' };\nconst VARGA_AREAS: Record<number, IntegratedAreaId[]> = {
  2: ['resources'], 3: ['skills'], 4: ['home'], 7: ['creativity'],
  9: ['relationships', 'wisdom'], 10: ['career', 'work'], 12: ['home'],
  16: ['home', 'retreat'], 20: ['wisdom', 'retreat'], 24: ['skills', 'creativity'], 27: ['identity', 'work'],
};
const unique = <T,>(items: T[]): T[] => [...new Set(items)];
function addFactor(list: IntegratedEvidence[], item: Omit<IntegratedEvidence, 'id' | 'duplicateMentions'>): void {
  const existing = list.find((entry) => entry.factorId === item.factorId && entry.area === item.area);
  if (existing) {
    existing.duplicateMentions += 1;
    existing.references = unique([...existing.references, ...item.references]);
    if (existing.polarity !== item.polarity && item.polarity !== 'neutral') existing.polarity = 'mixed';
    return;
  }
  list.push({ ...item, id: item.factorId + ':' + item.area, duplicateMentions: 1 });
}
function getPolarity(value: string): IntegratedPolarity {
  if (/challeng|attention|weak|напряж|ослаб|требу.*вниман|ограничен/i.test(value)) return 'tension';
  if (/support|поддерж|благоприят|устойчив|сильн/i.test(value)) return 'supportive';
  return 'neutral';
}

/** Evidence-first cross-layer synthesis. Duplicate references to the same factor never increase corroboration. */
export function buildIntegratedNatalAnalysis(chart: NatalChart, asOf: Date = new Date()): IntegratedNatalAnalysis {
  if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) throw new Error('Некорректная дата интегрированного анализа');
  if (asOf < chart.date) throw new Error('Дата анализа не может быть раньше даты рождения');
  const facts = buildNatalChartFacts(chart);
  const houses = analyzeAllNatalHouses(facts);
  const planets = analyzeAllNatalPlanets(facts);
  const yogas = analyzeNatalYogas(facts);
  const vargas = analyzeDivisionalCharts(chart);
  const dasha = analyzeVimshottariDasha(chart, asOf);
  const transits = analyzeTransits(chart, asOf);
  const evidence: IntegratedEvidence[] = [];

  for (const house of houses) {
    if (!house.available) continue;
    for (const area of AREAS.filter((item) => item.houses.includes(house.house))) {
      addFactor(evidence, {
        factorId: `natal:house:${house.house}:lord:${house.lord ?? 'unknown'}`,
        source: 'house', sourceFamily: 'natal-structure', area: area.id,
        title: `${house.house}-й дом: ${house.theme}`, statement: house.interpretation,
        polarity: house.synthesis === 'supportive' ? 'supportive' : house.synthesis === 'challenging' ? 'tension' : house.synthesis === 'mixed' ? 'mixed' : 'neutral',
        references: house.evidence,
      });
    }
  }
  for (const planet of planets) {
    if (!planet.available) continue;
    const relatedHouses = unique([...planet.ruledHouses, ...(planet.house ? [planet.house] : [])]);
    for (const area of AREAS.filter((item) => item.houses.some((house) => relatedHouses.includes(house)))) {
      addFactor(evidence, {
        factorId: `natal:planet:${planet.planet}:placement`, source: 'planet',
        sourceFamily: 'natal-structure', area: area.id, title: `${planet.name}: положение и управление`,
        statement: planet.interpretation, polarity: planet.synthesis === 'supportive' ? 'supportive' : planet.synthesis === 'challenging' ? 'tension' : planet.synthesis === 'mixed' ? 'mixed' : 'neutral',
        references: planet.evidence,
      });
    }
  }
  for (const yoga of yogas.findings) {
    const relevant = yoga.houses.filter((house) => house >= 1 && house <= 12);
    for (const area of AREAS.filter((item) => item.houses.some((house) => relevant.includes(house)))) {
      addFactor(evidence, {
        factorId: `natal:yoga:${yoga.id}`, source: 'yoga', sourceFamily: 'natal-structure',
        area: area.id, title: yoga.name, statement: yoga.description, polarity: 'neutral',
        references: [...yoga.evidence, ...yoga.caveats],
      });
    }
  }
  for (const varga of vargas.analyses) {
    for (const areaId of VARGA_AREAS[varga.division] ?? []) {
      const area = AREAS.find((item) => item.id === areaId);
      if (!area) continue;
      const relevant = varga.vargaEvidence.filter((item) => area.houses.includes(item.house));
      const d1 = varga.d1Evidence.map((item) => `D1 дом ${item.house}: ${item.sign}, управитель ${item.lord}, дом управителя ${item.lordHouse ?? 'не определён'}.`);
      const projected = relevant.map((item) => `D${varga.division}, дом ${item.house}: ${item.sign}, управитель ${item.lord}, дом управителя ${item.lordHouse ?? 'не определён'}, планеты: ${item.occupants.join(', ') || 'нет'}.`);
      addFactor(evidence, {
        factorId: `varga:D${varga.division}:${areaId}`, source: 'varga',
        sourceFamily: 'varga-projection', area: areaId, title: `D${varga.division} — ${varga.topic}`,
        statement: projected.length ? projected.join(' ') : `Варга D${varga.division} рассмотрена как дополнительная проверка темы «${varga.topic}».`,
        polarity: 'neutral', references: [...d1, ...projected, ...varga.comparisons.map((item) => `${item.planet}: D1 ${item.d1Sign} → D${varga.division} ${item.vargaSign}.`), ...varga.limitations],
      });
    }
  }
  const activeLayers = [dasha.current.mahadasha, dasha.current.antardasha, dasha.current.pratyantardasha].filter((item): item is NonNullable<typeof item> => Boolean(item));
  for (const layer of activeLayers) {
    for (const link of layer.profile.lifeAreaLinks) {
      const area = AREAS.find((item) => item.id === DASHA_AREAS[link.area]) ?? AREAS.find((item) => item.houses.some((house) => link.relevantHouses.includes(house)));
      if (!area) continue;
      addFactor(evidence, {
        factorId: `dasha:${layer.planet}:${area.id}`, source: 'dasha',
        sourceFamily: 'timing-dasha', area: area.id,
        title: `${layer.layer === 'mahadasha' ? 'Махадаша' : layer.layer === 'antardasha' ? 'Антардаша' : 'Пратьянтардаша'}: ${PLANET_NAMES[layer.planet as NatalPlanetKey] ?? layer.planet}`,
        statement: link.reasons.join(' ') || link.label, polarity: 'neutral',
        references: [...link.reasons, ...layer.profile.evidence, ...layer.whyHighlighted],
      });
    }
  }
  for (const aspect of transits.aspects) {
    const linkedHouses = [aspect.natalHouse, aspect.transitHouse].filter((house): house is number => house !== null);
    for (const area of AREAS.filter((item) => item.houses.some((house) => linkedHouses.includes(house)))) {
      addFactor(evidence, {
        factorId: `transit:${aspect.transitPlanet}:${aspect.natalPlanet}:${aspect.aspect}:${aspect.angle.toFixed(2)}`,
        source: 'transit', sourceFamily: 'timing-transit', area: area.id,
        title: `Точный транзитный аспект: ${aspect.transitPlanet} — ${aspect.natalPlanet}`,
        statement: `${aspect.aspect}; угол ${aspect.angle.toFixed(2)}°, орбис ${aspect.orb.toFixed(2)}°; ${aspect.applying === null ? 'фаза не определена' : aspect.applying ? 'сходящийся' : 'расходящийся'}.`,
        polarity: 'neutral', references: [aspect.evidence, `Транзитный дом ${aspect.transitHouse}; натальный дом ${aspect.natalHouse ?? 'не определён'}.`],
      });
    }
  }

  const missingPlanets = NATAL_PLANET_KEYS.filter((key) => !facts.planets[key]);
  const missingHouses = Array.from({ length: 12 }, (_, index) => index + 1).filter((number) => !facts.houses.some((item) => item.number === number));
  const warnings = unique([...facts.dataQuality.warnings, ...yogas.dataQuality.warnings, ...vargas.warnings, ...dasha.warnings, ...transits.warnings]);
  const areas: IntegratedAreaSynthesis[] = AREAS.map((definition) => {
    const items = evidence.filter((item) => item.area === definition.id);
    const families = unique(items.map((item) => item.sourceFamily));
    const polarities = new Set(items.map((item) => item.polarity).filter((item) => item === 'supportive' || item === 'tension'));
    const contradictions = polarities.size > 1 ? ['Одновременно присутствуют поддерживающие и напряжённые натальные факторы; однозначная оценка была бы некорректна.'] : [];
    const repeatedTheme = families.length >= 2 && unique(items.map((item) => item.factorId)).length >= 2;
    const dataStatus = items.length === 0 ? 'unavailable' : missingPlanets.length || missingHouses.length ? 'partial' : 'complete';
    return {
      id: definition.id, title: definition.title, houses: definition.houses, evidence: items,
      uniqueFactorCount: unique(items.map((item) => item.factorId)).length, sourceFamilies: families,
      repeatedTheme, contradictions, dataStatus,
      summary: !items.length
        ? 'В доступных расчётах нет прямых оснований для персонального вывода по этой сфере.'
        : repeatedTheme
          ? `Тема отражена в нескольких слоях (${families.join(', ')}). Это согласование символических указаний, а не статистически независимые подтверждения или гарантия события.`
          : 'Основания найдены, но они сосредоточены в одном слое или пока недостаточны для вывода о повторяющейся теме.',
    };
  });
  const contradictions = areas.flatMap((area) => area.contradictions.map((explanation) => ({
    area: area.id, title: area.title, explanation,
    evidenceIds: area.evidence.filter((item) => item.polarity === 'supportive' || item.polarity === 'tension').map((item) => item.id),
  })));
  const repeatedThemes = areas.filter((area) => area.repeatedTheme).map((area) => ({
    area: area.id, title: area.title, sourceFamilies: area.sourceFamilies,
    factorIds: unique(area.evidence.map((item) => item.factorId)), explanation: area.summary,
  }));
  const complete = missingPlanets.length === 0 && missingHouses.length === 0 && warnings.length === 0;
  return {
    generatedAt: asOf,
    headline: repeatedThemes.length ? `Выявлено ${repeatedThemes.length} тематических сфер с совпадениями между слоями анализа.` : 'Недостаточно межслойных совпадений для выделения повторяющихся тем.',
    overview: 'Сопоставлены 12 домов, 9 планет, управители, диспозиторы, йоги, профильные варги, три уровня Вимшоттари-даши и точные транзитные аспекты. Повторные упоминания одного фактора объединяются до оценки тематических совпадений.',
    areas, evidence, contradictions, repeatedThemes,
    dataQuality: { status: complete ? 'complete' : 'partial', missingPlanets, missingHouses, warnings },
    methodology: [
      'D1 — базовая карта; профильная варга только уточняет тематическую область и не заменяет D1.',
      'Повторные описания одного положения дома или планеты объединяются по factorId.',
      'Йоги — производные комбинации натальных факторов, а не независимый источник подтверждения.',
      'Махадаша, Антардаша и Пратьянтардаша одного управителя не суммируются: фактор одного управителя учитывается один раз на сферу.',
      'Точные транзитные аспекты имеют собственные идентификаторы; текстовые повторы не увеличивают число факторов.',
      'Повторяющаяся тема требует как минимум двух разных семейств источников; повтор одного факта не считается подтверждением.',
      'Противоречивые показатели сохраняются как смешанная картина, без искусственного усреднения.',
      'Интерпретации символические и не являются научно подтверждёнными предсказаниями или оценкой вероятности событий.',
    ],
  };
}
