import assert from 'node:assert/strict';
import { analyzeLifeTopics, analyzePersonalizedHouses, getVargaEvidence } from './personalizedHouseAnalysis';
import { describeHouseDrishti, describePeriodConnection, evaluatePlanetCondition, getGrahaDrishti } from './natalStrengthAnalysis';
import { getSunHouseFocus } from './natalAnalysisGuidance';
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
assert.equal(evaluatePlanetCondition(chart, 'Mercury')?.dignity, 'own');
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
assert.deepEqual(topics.map((topic) => topic.id), ['talents', 'money', 'career', 'children', 'relationships']);
assert.ok(topics.find((topic) => topic.id === 'money')?.evidence.length);
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('дату зачатия'));
assert.ok(topics.find((topic) => topic.id === 'talents')?.directions.length);
assert.ok(topics.find((topic) => topic.id === 'money')?.timingNote.includes('Связь Махадаши с этой сферой'));
assert.ok(topics.find((topic) => topic.id === 'career')?.timingNote.includes('Сатурн'));
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('Связь Антардаши'));

assert.ok(getVargaEvidence(chart, 7).some((item) => item.includes('D7')));
assert.ok(getVargaEvidence(chart, 10).some((item) => item.includes('D10')));
console.log('personalized house analysis tests passed');
