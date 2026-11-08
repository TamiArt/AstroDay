import assert from 'node:assert/strict';
import { analyzeLifeTopics, analyzePersonalizedHouses, getVargaEvidence } from './personalizedHouseAnalysis';
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

const houses = analyzePersonalizedHouses(chart);
assert.equal(houses.length, 12);
const fifth = houses.find((item) => item.house === 5);
assert.ok(fifth);
assert.equal(fifth?.sign, 'Лев');
assert.equal(fifth?.lord, 'Солнце');
assert.equal(fifth?.lordHouse, 5);
assert.ok(fifth?.evidence.some((item) => item.includes('накшатра')));
assert.ok(fifth?.practicalActions.some((item) => item.includes('творческое')));

const topics = analyzeLifeTopics(chart, new Date('2026-11-08T12:00:00Z'));
assert.deepEqual(topics.map((topic) => topic.id), ['talents', 'money', 'career', 'children', 'relationships']);
assert.ok(topics.find((topic) => topic.id === 'money')?.evidence.length);
assert.ok(topics.find((topic) => topic.id === 'children')?.timingNote.includes('дату зачатия'));
assert.ok(topics.find((topic) => topic.id === 'talents')?.directions.length);

assert.ok(getVargaEvidence(chart, 7).some((item) => item.includes('D7')));
assert.ok(getVargaEvidence(chart, 10).some((item) => item.includes('D10')));
console.log('personalized house analysis tests passed');
