import assert from 'node:assert/strict';
import { analyzeLifeTopics, analyzePersonalizedHouses, getVargaEvidence } from './personalizedHouseAnalysis';
import { describePlanetInHouse } from './natalHouseInterpretation';
import { describeHouseDrishti, describePeriodConnection, evaluatePlanetCondition, getGrahaDrishti, getPlanetToPlanetAspects } from './natalStrengthAnalysis';
import { getSunHouseFocus } from './natalAnalysisGuidance';
import { getMoonDescription, getSunDescription } from './natalChartDescriptions';
import { getAscendantChartFocus, getAscendantLordFocus, getCoreChartSynthesis, getCoreInteractionsByLifeArea, getCoreLifeAreaBridges, getMoonHouseFocus, getPlanetChartFocus } from './natalPersonalFocus';
import { analyzeHouseLords } from './natalHouseLordAnalysis';
import { auditNatalChartInterpretations, validateInterpretationQuality } from './natalInterpretationQuality';
import { buildNatalChartFacts, getNatalFactLinks, getNatalHouseFacts, getNatalPlanetFacts, NATAL_PLANET_KEYS } from './natalChartFacts';
import { analyzeAllNatalHouses } from './natalHousePersonalizedAnalysis';
import { analyzeAllNatalPlanets } from './natalPlanetPersonalizedAnalysis';
import { synthesizeNatalChart } from './natalChartSynthesis';
import { buildConclusionUnifiedAdvice, buildHouseUnifiedAdvice, buildNarrativeUnifiedAdvice, buildPlanetUnifiedAdvice, buildSynthesisUnifiedAdvice } from './unifiedNatalAdvice';
import type { NatalChart, PlanetPosition } from './astrology';

function position(name: string, longitude: number, signName: string, nakshatraName: string) {
  return {
    name, tropicalLon: longitude, siderealLon: longitude, sign: Math.floor(longitude / 30),
    signName, degree: longitude % 30, nakshatra: Math.floor(longitude / (360 / 27)),
    nakshatraName, pada: 2, vargas: { D12: 0, D20: 0, D24: 0 },
  } as PlanetPosition;
}

const chart = {
  date: new Date('1990-01-01T12:00:00Z'),
  latitude: 55.75,
  longitude: 37.62,
  ascendant: position('Ascendant', 0, 'Aries', 'Ashwini'),
  houses: Array.from({ length: 12 }, (_, index) => {
    const signIndex = index;
    const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const lords = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
    return { house: index + 1, cusp: index * 30, sign: signIndex, signName: signNames[signIndex], lord: lords[signIndex] };
  }),
  planets: {
    Sun: position('Sun', 130, 'Leo', 'Magha'),
    Moon: position('Moon', 65, 'Gemini', 'Mrigashira'),
    Mars: position('Mars', 10, 'Aries', 'Ashwini'),
    Mercury: position('Mercury', 155, 'Virgo', 'Hasta'),
    Jupiter: position('Jupiter', 185, 'Libra', 'Swati'),
    Venus: position('Venus', 245, 'Sagittarius', 'Mula'),
    Saturn: position('Saturn', 305, 'Aquarius', 'Dhanishta'),
    Rahu: position('Rahu', 95, 'Cancer', 'Pushya'),
    Ketu: position('Ketu', 275, 'Capricorn', 'Shravana'),
  },
} as unknown as NatalChart;

const leoTwelfthChart = {
  ...chart,
  houses: chart.houses?.map((house) => ({
    ...house,
    house: ((house.sign - 5 + 12) % 12) + 1,
  })),
} as NatalChart;
const leoTwelfthFocus = getSunHouseFocus(leoTwelfthChart, 12);
assert.ok(leoTwelfthFocus.includes('закулисная стратегия'));
assert.ok(leoTwelfthFocus.includes('Лев добавляет лидерский и творческий способ проявления'));
assert.ok(leoTwelfthFocus.includes('собственный знак'));
assert.ok(leoTwelfthFocus.includes('управляет 12-м домом'));
const virgoAscendantFirstHouse = analyzePersonalizedHouses(leoTwelfthChart).find((item) => item.house === 1);
assert.equal(virgoAscendantFirstHouse?.sign, 'Дева');
assert.equal(virgoAscendantFirstHouse?.lord, 'Меркурий');
assert.ok(virgoAscendantFirstHouse?.interpretation.includes('аналитика'));

// Canonical natal facts: one deterministic source for placements and chart relationships.
const natalFacts = buildNatalChartFacts(chart);
assert.equal(natalFacts.schemaVersion, 1);
assert.equal(natalFacts.methodology.houseSystem, 'Whole Sign');
assert.equal(natalFacts.methodology.ayanamsha, 'Lahiri');
assert.equal(natalFacts.houses.length, 12);
assert.deepEqual(Object.keys(natalFacts.planets).sort(), [...NATAL_PLANET_KEYS].sort());
assert.equal(natalFacts.dataQuality.completePlanetCount, 9);
const canonicalSun = getNatalPlanetFacts(natalFacts, 'Sun');
assert.equal(canonicalSun?.sign, 'Лев');
assert.equal(canonicalSun?.house, 5);
assert.deepEqual(canonicalSun?.ruledHouses, [5]);
assert.equal(canonicalSun?.dispositor, 'Sun');
assert.deepEqual(canonicalSun?.conjunctions, []);
const canonicalMoon = getNatalPlanetFacts(natalFacts, 'Moon');
assert.equal(canonicalMoon?.house, 3);
assert.equal(canonicalMoon?.dispositor, 'Mercury');
assert.equal(canonicalMoon?.dispositorHouse, 6);
const canonicalFifthHouse = getNatalHouseFacts(natalFacts, 5);
assert.equal(canonicalFifthHouse?.lord, 'Sun');
assert.equal(canonicalFifthHouse?.lordHouse, 5);
assert.ok(canonicalFifthHouse?.occupants.includes('Sun'));
assert.ok(natalFacts.links.some((link) => link.relation === 'rules-house' && link.sourceId === 'planet:Sun' && link.targetId === 'house:5'));
assert.ok(natalFacts.links.some((link) => link.relation === 'dispositor-of' && link.sourceId === 'planet:Mercury' && link.targetId === 'planet:Moon'));
assert.ok(natalFacts.links.some((link) => link.relation === 'shares-ruler-with' && link.sourceId === 'house:3' && link.targetId === 'house:6'));
assert.ok(getNatalFactLinks(natalFacts, 'aspects-house').some((link) => link.sourceId === 'planet:Mars' && link.targetId === 'house:7'));
assert.ok(natalFacts.aspects.planet.some((aspect) => aspect.sourceKey === 'Mars' && aspect.targetKey === 'Jupiter' && aspect.kind === 'graha-drishti'));
assert.ok(natalFacts.dataQuality.unsupportedFactors.some((item) => item.includes('Ретроградность')));
assert.ok(natalFacts.dataQuality.unsupportedFactors.some((item) => item.includes('Сожжение')));

// Missing source data must stay missing; the graph must never invent a first-house placement.
const chartWithoutFifthHouse = { ...chart, houses: chart.houses?.filter((house) => house.house !== 5) } as NatalChart;
const incompleteFacts = buildNatalChartFacts(chartWithoutFifthHouse);
assert.equal(getNatalPlanetFacts(incompleteFacts, 'Sun')?.house, null);
assert.equal(getNatalPlanetFacts(incompleteFacts, 'Sun')?.dispositor, null);
assert.ok(incompleteFacts.dataQuality.missingHouseNumbers.includes(5));
assert.equal(getNatalHouseFacts(incompleteFacts, 5), null);
const chartWithoutVenus = { ...chart, planets: { ...chart.planets, Venus: undefined } } as unknown as NatalChart;
const missingPlanetFacts = buildNatalChartFacts(chartWithoutVenus);
assert.equal(missingPlanetFacts.planets.Venus, null);
assert.equal(missingPlanetFacts.dataQuality.completePlanetCount, 8);
assert.ok(missingPlanetFacts.dataQuality.missingPlanetKeys.includes('Venus'));

// User-visible analysis must derive its claims from this chart, not a default house.
const ascendantFacts = getAscendantChartFocus(chart);
assert.ok(ascendantFacts.includes('Лагна находится в знаке Овен'));
assert.ok(ascendantFacts.includes('управитель — Марс'));
const changedAscendantFacts = getAscendantChartFocus(leoTwelfthChart);
assert.ok(changedAscendantFacts.includes('Лагна находится в знаке Дева'));
assert.notEqual(changedAscendantFacts, ascendantFacts);

const sunFacts = getPlanetChartFocus(chart, 'Sun');
assert.ok(sunFacts.includes('Солнце находится в Лев, 5-м доме'));
assert.ok(sunFacts.includes('Управляет домами 5'));
const alteredSunChart = {
  ...chart,
  planets: { ...chart.planets, Sun: position('Sun', 190, 'Libra', 'Swati') },
} as NatalChart;
assert.notEqual(getPlanetChartFocus(alteredSunChart, 'Sun'), sunFacts);
const missingSunHouseChart = { ...chart, houses: chart.houses?.filter((item) => item.house !== 5) } as NatalChart;
assert.ok(getPlanetChartFocus(missingSunHouseChart, 'Sun').includes('дом по имеющимся данным не определён'));
assert.ok(getSunHouseFocus(missingSunHouseChart, null).includes('дом не определён'));
assert.ok(getSunDescription('Лев', null).inHouse.includes('не определён'));
assert.equal(getSunDescription('Лев', null).practicalSteps.length, 0);
assert.ok(getMoonDescription('Близнецы', null).inHouse.includes('не определён'));
assert.ok(getMoonDescription('Близнецы', null).comfort.includes('не определён'));

const lagnaFocus = getAscendantLordFocus(chart);
assert.ok(lagnaFocus.includes('управитель — Марс'));
assert.ok(lagnaFocus.includes('1-м доме'));
assert.ok(lagnaFocus.includes('собственный знак'));
const virgoLagnaFocus = getAscendantLordFocus(leoTwelfthChart);
assert.ok(virgoLagnaFocus.includes('управитель — Меркурий'));
assert.ok(virgoLagnaFocus.includes('анализ'));
const moonFocus = getMoonHouseFocus(chart, 3);
assert.ok(moonFocus.includes('3-м доме'));
assert.ok(moonFocus.includes('Mrigashira'));
assert.ok(moonFocus.includes('Аспекты'));
const moonDispositorSynthesis = getCoreChartSynthesis(chart);
assert.ok(moonDispositorSynthesis.includes('Диспозитор знака — Меркурий'));
assert.ok(moonDispositorSynthesis.includes('расположен в 6-м доме и управляет домами 3, 6'));
assert.ok(moonDispositorSynthesis.includes('достоинство — экзальтация'));
assert.ok(moonDispositorSynthesis.includes('Диспозитор знака — сама планета: она находится в собственном знаке.'));
const chartWithoutMercury = {
  ...chart,
  planets: Object.fromEntries(Object.entries(chart.planets).filter(([name]) => name !== 'Mercury')),
} as unknown as NatalChart;
assert.ok(getCoreChartSynthesis(chartWithoutMercury).includes('Диспозитор знака — Меркурий, но его положение в карте не найдено.'));
assert.ok(getPlanetChartFocus(chartWithoutMercury, 'Moon').includes('Диспозитор знака — Меркурий, но его положение в карте не найдено.'));

const synthesis = getCoreChartSynthesis(chart);
assert.ok(synthesis.includes('Базовый способ действовать'));
assert.ok(synthesis.includes('Вектор воли и самореализации'));
assert.ok(synthesis.includes('Эмоциональные потребности'));
assert.ok(synthesis.includes('распределены по разным домам'));
const alignedCoreChart = {
  ...chart,
  planets: { ...chart.planets, Moon: position('Moon', 130, 'Leo', 'Magha') },
} as NatalChart;
const alignedSynthesis = getCoreChartSynthesis(alignedCoreChart);
assert.ok(alignedSynthesis.includes('Общая точка акцента'));
assert.ok(alignedSynthesis.includes('Солнце и Луна связаны с 5-м домом'));

const marsAspectsSunChart = {
  ...chart,
  planets: { ...chart.planets, Sun: position('Sun', 190, 'Libra', 'Swati') },
} as NatalChart;
const directLinks = getPlanetToPlanetAspects(marsAspectsSunChart, ['Mars', 'Sun', 'Moon']);
assert.ok(directLinks.some((item) => item.source === 'Марс' && item.target === 'Солнце' && item.kind === 'graha-drishti' && item.offset === 7));
assert.ok(directLinks.some((item) => item.sourceKey === 'Mars' && item.targetKey === 'Sun'));
assert.ok(getCoreChartSynthesis(marsAspectsSunChart).includes('воля и самореализация'));
assert.ok(getCoreChartSynthesis(marsAspectsSunChart).includes('направлять намерения в конкретные действия'));
const directSynthesis = getCoreChartSynthesis(marsAspectsSunChart);
assert.ok(directSynthesis.includes('Марс из 1-го дома аспектирует Солнце'));
const areaInteractions = getCoreInteractionsByLifeArea(marsAspectsSunChart);
const structuredCareerLink = areaInteractions.flatMap((area) => area.links).find((link) =>
  link.sourceKey === 'Mars' && link.targetKey === 'Sun' && link.kind === 'graha-drishti' && link.offset === 7,
);
assert.ok(structuredCareerLink);
assert.equal(structuredCareerLink?.id, 'Mars:Sun:graha-drishti:7');
assert.ok(structuredCareerLink?.evidence.length);
assert.equal(new Set(structuredCareerLink?.evidence.map((item) => item.id)).size, structuredCareerLink?.evidence.length);
assert.ok(structuredCareerLink?.evidence.every((item) => item.chainDepth >= 0 && item.chainDepth <= 3));
assert.equal(structuredCareerLink?.sourceHouse, 1);
assert.equal(structuredCareerLink?.targetHouse, 7);
assert.ok(areaInteractions.some((area) => area.id === 'relationships'));
assert.ok(areaInteractions.find((area) => area.id === 'relationships')?.connections.some((line) => line.includes('Солнце расположен в 7-м доме')));
assert.ok(!areaInteractions.some((area) => area.id === 'career'));
assert.ok(areaInteractions.find((area) => area.id === 'money')?.connections.some((line) => line.includes('Марс управляет 8-м домом')));
const lifeAreaBridges = getCoreLifeAreaBridges(marsAspectsSunChart);
assert.equal(lifeAreaBridges.length, 1);
assert.equal(lifeAreaBridges[0].id, 'Mars:Sun:graha-drishti:7');
// The fixture links Mars (1st/8th-house lord) and Sun (5th-house lord in the 7th):
// their direct placements/rulerships and bounded dispositors support these four areas.
assert.deepEqual(lifeAreaBridges[0].evidenceByArea.map((item) => item.areaId), ['relationships', 'money', 'talents', 'home']);
assert.ok(lifeAreaBridges[0].evidenceByArea.every((item) => item.evidence.length > 0));
assert.deepEqual(lifeAreaBridges[0].areas, ['Отношения и партнёрство', 'Деньги и ресурсы', 'Обучение и таланты', 'Дом и эмоциональная опора'].filter((title) =>
  areaInteractions.some((area) => area.title === title && area.connections.some((line) => line.startsWith(lifeAreaBridges[0].connection))),
));
assert.ok(lifeAreaBridges[0].explanation.includes('не означает'));
const dispositorAreaChart = {
  ...marsAspectsSunChart,
  planets: {
    ...marsAspectsSunChart.planets,
    Venus: position('Venus', 275, 'Capricorn', 'Uttara Ashadha'),
  },
} as NatalChart;
const dispositorAreaInteractions = getCoreInteractionsByLifeArea(dispositorAreaChart);
assert.ok(dispositorAreaInteractions.find((area) => area.id === 'career')?.connections.some((line) =>
  line.includes('Венера — диспозитор Солнце; расположен в 10-м доме этой сферы'),
));
assert.ok(dispositorAreaInteractions.find((area) => area.id === 'career')?.connections.some((line) =>
  line.includes('Сатурн — диспозитор Венера; расположен в 11-м доме этой сферы'),
));
const structuredDispositorLinks = dispositorAreaInteractions.find((area) => area.id === 'career')?.links ?? [];
assert.ok(structuredDispositorLinks.some((link) => link.evidence.some((item) =>
  item.type === 'dispositor-placement' && item.planetKey === 'Venus' &&
  item.dispositedPlanetKey === 'Sun' && item.house === 10 && item.chainDepth === 1,
)));
assert.ok(structuredDispositorLinks.some((link) => link.evidence.some((item) =>
  item.type === 'dispositor-placement' && item.planetKey === 'Saturn' &&
  item.dispositedPlanetKey === 'Venus' && item.house === 11 && item.chainDepth === 2,
)));
assert.equal(
  dispositorAreaInteractions.find((area) => area.id === 'career')?.connections
    .filter((line) => line.includes('Сатурн — диспозитор Венера')).length,
  1,
);

assert.deepEqual(getCoreInteractionsByLifeArea(chart), []);

const sameSignCoreChart = {
  ...chart,
  planets: {
    ...chart.planets,
    Sun: position('Sun', 130, 'Leo', 'Magha'),
    Moon: position('Moon', 140, 'Leo', 'Purva Phalguni'),
  },
} as NatalChart;
const conjunctions = getPlanetToPlanetAspects(sameSignCoreChart, ['Sun', 'Moon']);
assert.equal(conjunctions.find((item) => item.kind === 'conjunction')?.sourceKey, 'Sun');
assert.equal(conjunctions.find((item) => item.kind === 'conjunction')?.targetKey, 'Moon');
assert.equal(conjunctions.filter((item) => item.kind === 'conjunction').length, 1);
const conjunctionAreaLink = getCoreInteractionsByLifeArea(sameSignCoreChart)
  .flatMap((area) => area.links)
  .find((link) => link.kind === 'conjunction');
assert.equal(conjunctionAreaLink?.id, 'Moon:Sun:conjunction:same-sign');
assert.ok(getCoreChartSynthesis(sameSignCoreChart).includes('Солнце и Луна находятся в одном знаке'));
assert.ok(getCoreChartSynthesis(sameSignCoreChart).includes('темы «самостоятельность, авторство, воля и ответственность» и «эмоциональные потребности'));
assert.ok(!getPlanetToPlanetAspects(chart, ['Rahu', 'Ketu']).length);

const houses = analyzePersonalizedHouses(chart);
assert.equal(houses.length, 12);
assert.ok(houses.find((item) => item.house === 1)?.interpretation.includes('Овен на куспиде 1-го дома задаёт инициативный'));
const fifth = houses.find((item) => item.house === 5);
assert.ok(fifth);
assert.equal(fifth?.sign, 'Лев');
assert.equal(fifth?.lord, 'Солнце');
assert.equal(fifth?.lordHouse, 5);
assert.ok(fifth?.evidence.some((item) => item.includes('накшатра')));
assert.ok(fifth?.practicalActions.some((item) => item.includes('творческое')));
assert.ok(fifth?.interpretation.includes('собственный знак'));
assert.equal(fifth?.occupantInterpretations.length, 1);
assert.ok(fifth?.occupantInterpretations[0].includes('Солнце в 5-м доме'));
assert.ok(fifth?.occupantInterpretations[0].includes('авторское творчество'));
assert.ok(fifth?.occupantInterpretations[0].includes('Лев'));
assert.ok(fifth?.planetaryConnections.some((item) => item.includes('Сатурн') && item.includes('полный 7-й аспект на Солнце')));
const sixth = houses.find((item) => item.house === 6);
assert.ok(sixth?.occupantInterpretations.some((item) =>
  item.includes('Меркурий в 6-м доме') && item.includes('анализ процессов') && item.includes('Дева'),
));
for (const planetName of Object.keys(chart.planets)) {
  for (let houseNumber = 1; houseNumber <= 12; houseNumber += 1) {
    assert.ok(describePlanetInHouse(chart, planetName, houseNumber), `missing interpretation: ${planetName} in house ${houseNumber}`);
  }
}

assert.ok(fifth?.evidence.some((item) => item.includes('Достоинство управителя')));
assert.ok(fifth?.evidence.some((item) => item.includes('Сатурн') && item.includes('аспект')));
assert.equal(evaluatePlanetCondition(chart, 'Mercury')?.dignity, 'exalted');
assert.equal(evaluatePlanetCondition(chart, 'Saturn')?.dignity, 'own');
assert.equal(evaluatePlanetCondition(chart, 'Jupiter')?.dignity, 'other');
assert.equal(evaluatePlanetCondition(chart, 'Rahu')?.dignity, 'not_applicable');
assert.equal(evaluatePlanetCondition(chart, 'Ketu')?.score, null);
assert.ok(describePeriodConnection(chart, 'Rahu', [4], []).includes('Диспозитор Луна'));
assert.ok(describePeriodConnection(chart, 'Ketu', [10], []).includes('Диспозитор Сатурн'));
assert.ok(describePeriodConnection(chart, 'Moon', [3], []).includes('получает аспект на своё положение от Юпитер'));
assert.ok(describeHouseDrishti(chart, 5).some((item) => item.includes('Сатурн')));
const drishti = getGrahaDrishti(chart);
assert.deepEqual(drishti.filter((item) => item.source === 'Марс').map((item) => item.targetHouse), [4, 7, 8]);
assert.deepEqual(drishti.filter((item) => item.source === 'Юпитер').map((item) => item.targetHouse), [11, 1, 3]);
assert.deepEqual(drishti.filter((item) => item.source === 'Сатурн').map((item) => item.targetHouse), [1, 5, 8]);
assert.ok(!drishti.some((item) => item.source === 'Раху' || item.source === 'Кету'));

const topics = analyzeLifeTopics(chart, new Date('2026-11-08T12:00:00Z'));
assert.deepEqual(topics.map((topic) => topic.id), ['talents', 'money', 'career', 'children', 'home_family', 'wellbeing', 'inner_growth', 'relationships']);
assert.ok(topics.find((topic) => topic.id === 'money')?.evidence.length);
const moneyTopic = topics.find((topic) => topic.id === 'money');
assert.ok(moneyTopic?.keyFactors.some((factor) => factor.includes('2-й дом') && factor.includes('управитель')));
assert.ok(moneyTopic?.interpretation.includes('Управитель'));
assert.ok(moneyTopic?.interpretation.includes('диспозитор'));
assert.ok(moneyTopic?.interpretation.includes('Функция управителя'));
assert.ok(moneyTopic?.interpretation.includes('международные контакты'));
assert.ok(moneyTopic?.interpretation.includes('источники дохода'));
assert.ok(moneyTopic?.developmentPoints.length);
assert.ok(moneyTopic?.supportingFactors.length);
assert.ok(moneyTopic?.supportingFactors.some((item) => item.includes('Юпитера')));
assert.ok(moneyTopic?.attentionPoints.length);
assert.ok(moneyTopic?.synthesis.includes('картина'));
assert.ok(moneyTopic?.interpretation.includes('поддерживающие'));
assert.ok(moneyTopic?.interpretation.includes('требующие внимания'));
assert.ok(moneyTopic?.keyFactors.some((factor) => factor.includes('9-й дом')));
assert.ok(moneyTopic?.keyFactors.some((factor) => factor.includes('11-й дом')));
assert.ok(moneyTopic?.directions.some((direction) => direction.includes('управление') || direction.includes('эксперт')));
assert.ok(moneyTopic?.directions.some((direction) => direction.startsWith('Солнце:')));
const careerTopic = topics.find((topic) => topic.id === 'career');
assert.ok(careerTopic?.keyFactors.some((factor) => factor.includes('10-й дом')));
assert.ok(careerTopic?.evidence.some((item) => item.includes('аспект')));
assert.ok(topics.every((topic) => topic.keyFactors.length === topic.houses.length));
assert.deepEqual(topics.find((topic) => topic.id === 'home_family')?.houses, [2, 4, 12]);
assert.deepEqual(topics.find((topic) => topic.id === 'wellbeing')?.houses, [1, 6, 8, 12]);
assert.ok(topics.find((topic) => topic.id === 'wellbeing')?.actions.some((action) => action.includes('не диагностирует')));
assert.deepEqual(topics.find((topic) => topic.id === 'inner_growth')?.houses, [9, 12, 5]);
assert.deepEqual(topics.find((topic) => topic.id === 'children')?.houses, [2, 5, 9, 11]);
assert.deepEqual(topics.find((topic) => topic.id === 'children')?.primaryHouses, [5]);
assert.deepEqual(topics.find((topic) => topic.id === 'children')?.supportingHouses, [2, 9, 11]);
assert.deepEqual(topics.find((topic) => topic.id === 'relationships')?.primaryHouses, [7]);
assert.deepEqual(topics.find((topic) => topic.id === 'relationships')?.houses, [2, 5, 7, 8, 12]);
assert.deepEqual(topics.find((topic) => topic.id === 'career')?.houses, [2, 6, 10, 11]);
assert.ok(topics.every((topic) => topic.supportingFactors.length + topic.attentionPoints.length > 0));
assert.ok(topics.every((topic) => topic.synthesis.length > 30));
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('зачатия'));
assert.ok(topics.find((topic) => topic.id === 'talents')?.directions.length);
const debilitatedTalentChart = {
  ...chart,
  planets: { ...chart.planets, Mercury: position('Mercury', 335, 'Pisces', 'Revati') },
} as NatalChart;
const debilitatedTalentTopic = analyzeLifeTopics(debilitatedTalentChart, new Date('2026-11-08T12:00:00Z'))
  .find((topic) => topic.id === 'talents');
assert.ok(debilitatedTalentTopic?.attentionPoints.some((item) => item.includes('падения')));
assert.ok(debilitatedTalentTopic?.supportingFactors.length);
assert.ok(debilitatedTalentTopic?.synthesis.includes('Смешанная картина'));
assert.ok(topics.find((topic) => topic.id === 'money')?.timingNote.includes('Связь Махадаши с этой сферой'));
assert.ok(topics.every((topic) => topic.timingNote.includes('Связь Пратьянтардаши')));
assert.ok(topics.every((topic) => topic.timingNote.includes('Пратьянтардаша')));
assert.ok(topics.find((topic) => topic.id === 'career')?.timingNote.includes('Сатурн'));
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('Связь Антардаши'));

assert.ok(getVargaEvidence(chart, 2).some((item) => item.includes('D2')));
assert.ok(getVargaEvidence(chart, 2).some((item) => item.includes('Лагна D2')));
assert.ok(getVargaEvidence(chart, 2).some((item) => item.includes('в D1')));
assert.ok(getVargaEvidence(chart, 7).some((item) => item.includes('D7')));
assert.ok(getVargaEvidence(chart, 9).some((item) => item.includes('D9')));
assert.ok(getVargaEvidence(chart, 10).some((item) => item.includes('D10')));
assert.ok(getVargaEvidence(chart, 24).some((item) => item.includes('D24')));
assert.ok(getVargaEvidence(chart, 4).some((item) => item.includes('Лагна D4')));
assert.ok(getVargaEvidence(chart, 12).some((item) => item.includes('Лагна D12')));
assert.ok(getVargaEvidence(chart, 16).some((item) => item.includes('Лагна D16')));
assert.ok(getVargaEvidence(chart, 20).some((item) => item.includes('Лагна D20')));
assert.ok(getVargaEvidence(chart, 27).some((item) => item.includes('Лагна D27')));

const houseLordInsights = analyzeHouseLords(chart);
assert.equal(houseLordInsights.length, 12);
const firstHouseLord = houseLordInsights.find((item) => item.house === 1);
assert.ok(firstHouseLord);
assert.equal(firstHouseLord?.lordKey, 'Mars');
assert.equal(firstHouseLord?.lordHouse, 1);
assert.equal(firstHouseLord?.dignity, 'собственный знак');
assert.deepEqual(firstHouseLord?.ruledHouses, [1, 8]);
assert.ok(firstHouseLord?.repeatedRulership?.includes('управляет также домами 8'));
assert.ok(firstHouseLord?.dispositorChain.some((step) => step.planetKey === 'Mars' && step.depth === 0));
assert.equal(firstHouseLord?.chainCycleDetected, true);
assert.ok(firstHouseLord?.attentionFactors.some((item) => item.includes('цикл')));
assert.ok(firstHouseLord?.overallSynthesis.includes('Смешанная картина'));
assert.ok(firstHouseLord?.incomingAspects.some((item) => item.source === 'Юпитер'));
assert.ok(firstHouseLord?.outgoingAspects.some((item) => item.targetHouse === 7));
assert.ok(firstHouseLord?.evidence.some((item) => item.includes('Цепочка, шаг 0')));
const fifthHouseLord = houseLordInsights.find((item) => item.house === 5);
assert.equal(fifthHouseLord?.lordKey, 'Sun');
assert.equal(fifthHouseLord?.lordHouse, 5);
assert.ok(fifthHouseLord?.interpretation.includes('творчество, интеллект'));
assert.ok(fifthHouseLord?.evidence.some((item) => item.includes('накшатра Magha')));
const missingHouseLordChart = {
  ...chart,
  planets: Object.fromEntries(Object.entries(chart.planets).filter(([name]) => name !== 'Sun')),
} as unknown as NatalChart;
const missingLordInsight = analyzeHouseLords(missingHouseLordChart).find((item) => item.house === 5);
assert.equal(missingLordInsight?.lordHouse, null);
assert.equal(missingLordInsight?.chainMissingPlanet, 'Sun');
assert.ok(missingLordInsight?.interpretation.includes('положение не найдено'));


const qualityReport = auditNatalChartInterpretations(chart, new Date('2026-11-08T12:00:00Z'));
assert.ok(qualityReport.checked >= 140, 'quality gate should inspect all generated house, topic, lord and planet-placement narratives');
assert.equal(qualityReport.blocked, 0, JSON.stringify(qualityReport.results.filter((item) => !item.publishable), null, 2));
assert.equal(qualityReport.publishable, qualityReport.checked);
assert.ok(qualityReport.averageScore >= 90);
assert.ok(qualityReport.results.some((item) => item.id === 'topic:money'));
assert.ok(qualityReport.results.some((item) => item.id === 'house-lord:1'));
assert.ok(qualityReport.results.some((item) => item.id === 'placement:Sun:12'));

const unsupportedClaim = validateInterpretationQuality({
  id: 'bad-guarantee',
  title: 'Недопустимый прогноз',
  narrative: 'Положение Юпитера гарантирует богатство и доход в следующем году.',
  evidence: ['Юпитер находится в 11-м доме.'],
  houses: [11],
});
assert.equal(unsupportedClaim.publishable, false);
assert.ok(unsupportedClaim.issues.some((item) => item.code === 'unsupported-certainty'));
assert.ok(unsupportedClaim.issues.some((item) => item.code === 'financial-guarantee'));

const medicalClaim = validateInterpretationQuality({
  id: 'bad-medical',
  title: 'Недопустимая медицинская трактовка',
  narrative: 'Натальная карта диагностирует заболевание и определяет необходимое лечение.',
  evidence: ['Марс в 6-м доме.'],
});
assert.equal(medicalClaim.publishable, false);
assert.ok(medicalClaim.issues.some((item) => item.code === 'medical-determinism'));

const fertilityClaim = validateInterpretationQuality({
  id: 'bad-fertility',
  title: 'Недопустимое обещание зачатия',
  narrative: 'Положение планет гарантирует беременность в ближайший период.',
  evidence: ['Юпитер аспектирует 5-й дом.'],
});
assert.equal(fertilityClaim.publishable, false);
assert.ok(fertilityClaim.issues.some((item) => item.code === 'fertility-determinism'));

const missingEvidence = validateInterpretationQuality({
  id: 'missing-evidence',
  title: 'Вывод без оснований',
  narrative: 'Это развёрнутая интерпретация, которая описывает много аспектов жизни, но не содержит ни одного исходного показателя карты.',
  evidence: [],
});
assert.equal(missingEvidence.publishable, false);
assert.ok(missingEvidence.issues.some((item) => item.code === 'missing-evidence'));

const invalidHouseScope = validateInterpretationQuality({
  id: 'invalid-scope',
  title: 'Неверная область',
  narrative: 'Нейтральное краткое описание.',
  evidence: ['Факт карты.'],
  houses: [0, 13],
  primaryHouses: [2],
});
assert.equal(invalidHouseScope.publishable, false);
assert.ok(invalidHouseScope.issues.some((item) => item.code === 'invalid-house'));
assert.ok(invalidHouseScope.issues.some((item) => item.code === 'invalid-primary-house'));

const qualifiedClaim = validateInterpretationQuality({
  id: 'qualified',
  title: 'Осторожная формулировка',
  narrative: 'Положение планеты не гарантирует финансовый результат и может рассматриваться только как символическая тема для размышления.',
  evidence: ['Положение планеты в 11-м доме.'],
  houses: [11],
});
assert.equal(qualifiedClaim.publishable, true);

const incompleteChartReport = auditNatalChartInterpretations({
  ...chart,
  houses: chart.houses?.slice(0, 11),
} as NatalChart);
assert.equal(incompleteChartReport.blocked, 1);
assert.ok(incompleteChartReport.results[0].issues.some((item) => item.code === 'incomplete-chart'));

const duplicateEvidence = validateInterpretationQuality({
  id: 'duplicate-evidence',
  title: 'Повторяющиеся основания',
  narrative: 'Короткий нейтральный вывод.',
  evidence: ['Марс в 1-м доме.', 'Марс в 1-м доме.'],
});
assert.equal(duplicateEvidence.publishable, true);
assert.ok(duplicateEvidence.issues.some((item) => item.code === 'duplicate-evidence' && item.severity === 'warning'));

const medicalDisclaimer = validateInterpretationQuality({
  id: 'medical-disclaimer',
  title: 'Корректное ограничение',
  narrative: 'Натальная карта не диагностирует заболевание и не заменяет консультацию врача.',
  evidence: ['Это символическая интерпретация, не медицинский факт.'],
});
assert.equal(medicalDisclaimer.publishable, true);

const unbalancedSynthesis = validateInterpretationQuality({
  id: 'unbalanced-synthesis',
  title: 'Противоречивый синтез',
  narrative: 'В сфере есть несколько разнонаправленных факторов.',
  evidence: ['Управитель в собственном знаке.', 'На тематический дом направлен аспект Сатурна.'],
  supportingFactors: ['Управитель в собственном знаке.'],
  attentionPoints: ['На тематический дом направлен аспект Сатурна.'],
  synthesis: 'В целом положение выглядит благоприятным.',
});
assert.ok(unbalancedSynthesis.issues.some((item) => item.code === 'unbalanced-synthesis'));

const balancedSynthesis = validateInterpretationQuality({
  id: 'balanced-synthesis',
  title: 'Смешанный синтез',
  narrative: 'В сфере есть несколько разнонаправленных факторов.',
  evidence: ['Управитель в собственном знаке.', 'На тематический дом направлен аспект Сатурна.'],
  supportingFactors: ['Управитель в собственном знаке.'],
  attentionPoints: ['На тематический дом направлен аспект Сатурна.'],
  synthesis: 'Смешанная картина: присутствуют поддерживающие факторы и одновременно факторы, требующие внимания.',
});
assert.ok(!balancedSynthesis.issues.some((item) => item.code === 'unbalanced-synthesis'));



console.log('personalized house analysis tests passed');


// Stage 20: all twelve houses are returned and each analysis is derived from canonical facts.
const allHouseAnalyses = analyzeAllNatalHouses(natalFacts);
assert.equal(allHouseAnalyses.length, 12);
assert.deepEqual(allHouseAnalyses.map((item) => item.house), Array.from({ length: 12 }, (_, index) => index + 1));
const fifthHouseAnalysis = allHouseAnalyses[4];
assert.equal(fifthHouseAnalysis.sign, 'Лев');
assert.equal(fifthHouseAnalysis.lord, 'Sun');
assert.equal(fifthHouseAnalysis.lordHouse, 5);
assert.ok(fifthHouseAnalysis.occupants.includes('Sun'));
assert.ok(fifthHouseAnalysis.dispositorChain.some((item) => item.planet === 'Sun'));
assert.ok(fifthHouseAnalysis.evidence.some((item) => item.includes('управитель')));
assert.ok(fifthHouseAnalysis.interpretation.includes('Солнце'));
assert.ok(allHouseAnalyses.every((item) => item.evidence.length > 0));

// A materially different chart changes house-specific evidence, rather than reusing generic prose.
const alteredHouseAnalyses = analyzeAllNatalHouses(buildNatalChartFacts(leoTwelfthChart));
assert.notEqual(alteredHouseAnalyses[0].sign, allHouseAnalyses[0].sign);
assert.notEqual(alteredHouseAnalyses[0].lord, allHouseAnalyses[0].lord);
assert.notEqual(alteredHouseAnalyses[0].interpretation, allHouseAnalyses[0].interpretation);

// Missing house and lord data remain explicitly incomplete and do not invent a first-house placement.
const chartMissingHouseOne = {
  ...chart,
  houses: chart.houses?.filter((item) => item.house !== 1),
} as NatalChart;
const missingHouseAnalysis = analyzeAllNatalHouses(buildNatalChartFacts(chartMissingHouseOne))[0];
assert.equal(missingHouseAnalysis.available, false);
assert.equal(missingHouseAnalysis.sign, null);
assert.equal(missingHouseAnalysis.synthesis, 'incomplete');
assert.ok(missingHouseAnalysis.limitations.some((item) => item.includes('отсутствуют')));

const chartMissingMars = {
  ...chart,
  planets: { ...chart.planets, Mars: undefined },
} as unknown as NatalChart;
const missingLordAnalysis = analyzeAllNatalHouses(buildNatalChartFacts(chartMissingMars))[0];
assert.equal(missingLordAnalysis.lord, 'Mars');
assert.equal(missingLordAnalysis.lordHouse, null);
assert.equal(missingLordAnalysis.synthesis, 'incomplete');
assert.ok(missingLordAnalysis.interpretation.includes('не определены'));


const chartWithoutLordPlacementHouse = {
  ...chart,
  houses: chart.houses?.filter((item) => item.house !== 9),
} as NatalChart;
const secondHouseWithUnknownLordPlacement = analyzeAllNatalHouses(buildNatalChartFacts(chartWithoutLordPlacementHouse))[1];
assert.equal(secondHouseWithUnknownLordPlacement.available, true);
assert.equal(secondHouseWithUnknownLordPlacement.lord, 'Venus');
assert.equal(secondHouseWithUnknownLordPlacement.lordHouse, null);
assert.equal(secondHouseWithUnknownLordPlacement.synthesis, 'incomplete');
assert.ok(secondHouseWithUnknownLordPlacement.interpretation.includes('дом не определён'));


// Stage 21: every graha has an evidence-backed, chart-specific analysis.
const allPlanetAnalyses = analyzeAllNatalPlanets(natalFacts);
assert.equal(allPlanetAnalyses.length, 9);
assert.deepEqual(allPlanetAnalyses.map((item) => item.planet), [...NATAL_PLANET_KEYS]);
assert.ok(allPlanetAnalyses.every((item) => item.evidence.length > 0));
const sunAnalysis = allPlanetAnalyses.find((item) => item.planet === 'Sun');
assert.equal(sunAnalysis?.sign, 'Лев');
assert.equal(sunAnalysis?.house, 5);
assert.equal(sunAnalysis?.dignity?.dignity, 'own');
assert.deepEqual(sunAnalysis?.ruledHouses, [5]);
assert.equal(sunAnalysis?.dispositor, 'Sun');
assert.equal(sunAnalysis?.dispositorChainEnd, 'self-dispositor');
assert.ok(sunAnalysis?.evidence.some((item) => item.includes('экзальтация') || item.includes('собственный знак')));
const moonAnalysis = allPlanetAnalyses.find((item) => item.planet === 'Moon');
assert.equal(moonAnalysis?.dispositor, 'Mercury');
assert.equal(moonAnalysis?.dispositorHouse, 6);
assert.ok(moonAnalysis?.dispositorChain.some((step) => step.planet === 'Mercury'));
const marsAnalysis = allPlanetAnalyses.find((item) => item.planet === 'Mars');
assert.ok(marsAnalysis?.aspectsToPlanets.includes('Jupiter'));
assert.ok(marsAnalysis?.aspectsToHouses.includes(7));
const jupiterAnalysis = allPlanetAnalyses.find((item) => item.planet === 'Jupiter');
assert.ok(jupiterAnalysis?.receivesAspectsFrom.includes('Mars'));
const venusAnalysis = allPlanetAnalyses.find((item) => item.planet === 'Venus');
assert.equal(venusAnalysis?.dispositorChainEnd, 'cycle');
assert.ok(venusAnalysis?.evidence.some((item) => item.includes('цикл диспозиторов')));
const rahuAnalysis = allPlanetAnalyses.find((item) => item.planet === 'Rahu');
assert.equal(rahuAnalysis?.dignity?.dignity, 'not_applicable');
assert.ok(rahuAnalysis?.limitations.some((item) => item.includes('Раху/Кету')));

// Same planet in a different sign/house must produce a different interpretation and chain.
const changedSunAnalysis = analyzeAllNatalPlanets(buildNatalChartFacts(alteredSunChart)).find((item) => item.planet === 'Sun');
assert.equal(changedSunAnalysis?.sign, 'Весы');
assert.equal(changedSunAnalysis?.house, 7);
assert.notEqual(changedSunAnalysis?.interpretation, sunAnalysis?.interpretation);
assert.equal(changedSunAnalysis?.dispositor, 'Venus');

// A conjunction is explicit, while missing source planets never get fabricated.
const sunMercuryConjunctionChart = {
  ...chart,
  planets: { ...chart.planets, Mercury: position('Mercury', 135, 'Leo', 'Purva Phalguni') },
} as NatalChart;
const conjunctionSun = analyzeAllNatalPlanets(buildNatalChartFacts(sunMercuryConjunctionChart)).find((item) => item.planet === 'Sun');
assert.ok(conjunctionSun?.conjunctions.includes('Mercury'));
assert.ok(conjunctionSun?.evidence.some((item) => item.includes('Соединение по знаку')));
assert.ok(!conjunctionSun?.aspectsToPlanets.includes('Mercury'));
assert.ok(!conjunctionSun?.outgoingAspectDetails.some((aspect) => aspect.planet === 'Mercury'));
const missingKetuChart = {
  ...chart,
  planets: { ...chart.planets, Ketu: undefined },
} as unknown as NatalChart;
const missingKetuAnalysis = analyzeAllNatalPlanets(buildNatalChartFacts(missingKetuChart)).find((item) => item.planet === 'Ketu');
assert.equal(missingKetuAnalysis?.available, false);
assert.equal(missingKetuAnalysis?.synthesis, 'incomplete');
assert.equal(missingKetuAnalysis?.sign, null);

assert.ok(marsAnalysis?.outgoingAspectDetails.some((aspect) =>
  aspect.planet === 'Jupiter' && aspect.offset === 7 && aspect.sourceHouse === 1 && aspect.targetHouse === 7,
));
assert.ok(jupiterAnalysis?.incomingAspectDetails.some((aspect) =>
  aspect.planet === 'Mars' && aspect.offset === 7,
));
assert.ok(marsAnalysis?.houseAspectDetails.some((aspect) => aspect.house === 7));


// Whole-chart synthesis: chart-wide conclusions must be traceable to canonical facts.
const wholeChart = synthesizeNatalChart(natalFacts);
assert.equal(wholeChart.dataQuality.completeness, 100);
assert.ok(wholeChart.headline.length > 0);
assert.ok(wholeChart.dominantThemes.some((item) => item.house === 11));
assert.ok(wholeChart.bridges.some((item) => item.fromHouse === 3 && item.toHouse === 6 && item.lord === 'Mercury'));
assert.ok(wholeChart.planetNetworks.some((item) => item.relation === 'aspect' && item.planets.includes('Mars') && item.planets.includes('Jupiter')));
assert.ok(wholeChart.conclusions.every((item) => item.evidence.length > 0));
assert.equal(new Set(wholeChart.conclusions.map((item) => item.id)).size, wholeChart.conclusions.length);
assert.ok(wholeChart.conclusions.every((item) =>
  item.relatedPlanets.every((planet) => NATAL_PLANET_KEYS.includes(planet)),
));
assert.ok(wholeChart.conclusions.every((item) => item.relatedHouses.every((house) => house >= 1 && house <= 12)));
assert.ok(wholeChart.methodology.some((item) => item.includes('эвристика')));

const unifiedHouseAdvice = analyzeAllNatalHouses(natalFacts).map(buildHouseUnifiedAdvice);
const unifiedPlanetAdvice = allPlanetAnalyses.map(buildPlanetUnifiedAdvice);
const unifiedSynthesisAdvice = buildSynthesisUnifiedAdvice(wholeChart);
const unifiedConclusionAdvice = wholeChart.conclusions.map((item) =>
  buildConclusionUnifiedAdvice(item, wholeChart.tensions),
);
for (const advice of [...unifiedHouseAdvice, ...unifiedPlanetAdvice, unifiedSynthesisAdvice, ...unifiedConclusionAdvice]) {
  assert.ok(advice.connection.length > 0);
  assert.ok(advice.combinedMeaning.length > 0);
  assert.ok(advice.tension.length > 0);
  assert.ok(advice.practicalStep.length > 0);
  assert.ok(advice.limitation.length > 0);
}
assert.ok(unifiedHouseAdvice[6].connection.includes('7-го дома'));
assert.ok(unifiedPlanetAdvice.find((item) => item.connection.includes('аспекты'))?.connection.length);
assert.ok(unifiedSynthesisAdvice.connection.length > 0);
const unifiedAscendantAdvice = buildNarrativeUnifiedAdvice({
  connection: 'Управитель Асцендента расположен в 10-м доме и получает аспект Сатурна.',
  combinedMeaning: 'Личная стратегия связана с профессиональной реализацией.',
  tensions: ['Аспект Сатурна добавляет необходимость учитывать сроки и обязательства.'],
  practicalStep: 'Разбейте профессиональную цель на этапы.',
});
assert.ok(unifiedAscendantAdvice.connection.includes('10-м доме'));
assert.ok(unifiedAscendantAdvice.tension.includes('Сатурна'));
assert.ok(unifiedAscendantAdvice.practicalStep.includes('этапы'));

// Missing source data must be stated explicitly instead of being replaced with generic chart claims.
const missingPlanetUnified = buildPlanetUnifiedAdvice(missingKetuAnalysis!);
assert.ok(missingPlanetUnified.connection.includes('отсутствует'));
const unavailableHouseUnified = buildHouseUnifiedAdvice(analyzeAllNatalHouses(incompleteFacts).find((item) => item.house === 5)!);
assert.ok(unavailableHouseUnified.combinedMeaning.includes('не формируется'));


const shiftedSunChart = {
  ...chart,
  planets: { ...chart.planets, Sun: position('Sun', 30, 'Taurus', 'Krittika') },
} as NatalChart;
const shiftedFacts = buildNatalChartFacts(shiftedSunChart);
assert.equal(shiftedFacts.planets.Sun?.sign, 'Телец');
const shiftedSynthesis = synthesizeNatalChart(shiftedFacts);
assert.notDeepEqual(shiftedSynthesis.dominantThemes, wholeChart.dominantThemes);
assert.ok(shiftedSynthesis.conclusions.some((item) => item.evidence.some((line) => line.includes('Телец'))));

const incompleteSynthesis = synthesizeNatalChart(incompleteFacts);
assert.ok(incompleteSynthesis.dataQuality.completeness < 100);
assert.ok(incompleteSynthesis.dataQuality.missingHouses.includes(5));
assert.ok(incompleteSynthesis.tensions.some((item) => item.includes('отсутствует')));
assert.ok(incompleteSynthesis.dataQuality.caveats.length > 0);

// A chart with all nine planets but no usable Ascendant must not report full completeness.
const chartWithoutAscendant = { ...chart, ascendant: undefined } as unknown as NatalChart;
const noAscendantSynthesis = synthesizeNatalChart(buildNatalChartFacts(chartWithoutAscendant));
assert.ok(noAscendantSynthesis.dataQuality.completeness < 100);
assert.ok(noAscendantSynthesis.dataQuality.caveats.some((item) => item.includes('Асцендент')));

// A present planet whose sign has no corresponding house remains incomplete in the planet analysis.
const chartWithUnplacedSun = {
  ...chart,
  planets: { ...chart.planets, Sun: position('Sun', 360, 'Aries', 'Ashwini') },
} as NatalChart;
const unplacedSunFacts = buildNatalChartFacts(chartWithUnplacedSun);
const unplacedSunAnalysis = analyzeAllNatalPlanets(unplacedSunFacts).find((item) => item.planet === 'Sun');
assert.equal(unplacedSunAnalysis?.available, true);
assert.equal(unplacedSunAnalysis?.house, null);
assert.equal(unplacedSunAnalysis?.synthesis, 'incomplete');
const unplacedSunSynthesis = synthesizeNatalChart(unplacedSunFacts);
assert.ok(unplacedSunSynthesis.dataQuality.completeness < 100);

// A house whose lord has no placement is incomplete and the omission is surfaced in caveats.
const noMarsChart = {
  ...chart,
  planets: { ...chart.planets, Mars: undefined },
} as unknown as NatalChart;
const noMarsFacts = buildNatalChartFacts(noMarsChart);
const firstHouseWithoutLordPlacement = analyzeAllNatalHouses(noMarsFacts)[0];
assert.equal(firstHouseWithoutLordPlacement.synthesis, 'incomplete');
assert.ok(noMarsFacts.dataQuality.warnings.some((item) => item.includes('управителя 1-го дома')));
const noMarsSynthesis = synthesizeNatalChart(noMarsFacts);
assert.ok(noMarsSynthesis.dataQuality.completeness < 100);
assert.ok(noMarsSynthesis.dataQuality.caveats.some((item) => item.includes('управителя 1-го дома')));
