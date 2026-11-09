import assert from 'node:assert/strict';
import { analyzeLifeTopics, analyzePersonalizedHouses, getVargaEvidence } from './personalizedHouseAnalysis';
import { describeHouseDrishti, describePeriodConnection, evaluatePlanetCondition, getGrahaDrishti, getPlanetToPlanetAspects } from './natalStrengthAnalysis';
import { getSunHouseFocus } from './natalAnalysisGuidance';
import { getAscendantLordFocus, getCoreChartSynthesis, getCoreInteractionsByLifeArea, getCoreLifeAreaBridges, getMoonHouseFocus } from './natalPersonalFocus';
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
assert.deepEqual(lifeAreaBridges[0].evidenceByArea.map((item) => item.areaId), ['career', 'relationships', 'money']);
assert.ok(lifeAreaBridges[0].evidenceByArea.every((item) => item.evidence.length > 0));
assert.deepEqual(lifeAreaBridges[0].areas, ['Профессия и работа', 'Отношения и партнёрство', 'Деньги и ресурсы'].filter((title) =>
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
const fifth = houses.find((item) => item.house === 5);
assert.ok(fifth);
assert.equal(fifth?.sign, 'Лев');
assert.equal(fifth?.lord, 'Солнце');
assert.equal(fifth?.lordHouse, 5);
assert.ok(fifth?.evidence.some((item) => item.includes('накшатра')));
assert.ok(fifth?.practicalActions.some((item) => item.includes('творческое')));
assert.ok(fifth?.interpretation.includes('собственный знак'));
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
assert.ok(moneyTopic?.developmentPoints.length);
assert.ok(moneyTopic?.directions.some((direction) => direction.includes('управление') || direction.includes('эксперт')));
assert.ok(moneyTopic?.directions.some((direction) => direction.startsWith('Солнце:')));
const careerTopic = topics.find((topic) => topic.id === 'career');
assert.ok(careerTopic?.keyFactors.some((factor) => factor.includes('10-й дом')));
assert.ok(careerTopic?.evidence.some((item) => item.includes('аспект')));
assert.ok(topics.every((topic) => topic.keyFactors.length === topic.houses.length));
assert.deepEqual(topics.find((topic) => topic.id === 'home_family')?.houses, [4, 2]);
assert.deepEqual(topics.find((topic) => topic.id === 'wellbeing')?.houses, [1, 6, 8, 12]);
assert.ok(topics.find((topic) => topic.id === 'wellbeing')?.actions.some((action) => action.includes('не диагностирует')));
assert.deepEqual(topics.find((topic) => topic.id === 'inner_growth')?.houses, [9, 12, 5]);
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('зачатия'));
assert.ok(topics.find((topic) => topic.id === 'talents')?.directions.length);
assert.ok(topics.find((topic) => topic.id === 'money')?.timingNote.includes('Связь Махадаши с этой сферой'));
assert.ok(topics.find((topic) => topic.id === 'career')?.timingNote.includes('Сатурн'));
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('Связь Антардаши'));

assert.ok(getVargaEvidence(chart, 2).some((item) => item.includes('D2')));
assert.ok(getVargaEvidence(chart, 7).some((item) => item.includes('D7')));
assert.ok(getVargaEvidence(chart, 9).some((item) => item.includes('D9')));
assert.ok(getVargaEvidence(chart, 10).some((item) => item.includes('D10')));
assert.ok(getVargaEvidence(chart, 24).some((item) => item.includes('D24')));
console.log('personalized house analysis tests passed');
