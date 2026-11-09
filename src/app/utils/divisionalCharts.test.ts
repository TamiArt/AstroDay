import assert from 'node:assert/strict';
import { calculateDivisionalChart } from './divisionalCharts';

function mappedSign(longitude: number, division: number): string {
  const chart = calculateDivisionalChart(
    { Sun: longitude },
    0,
    division,
    `D${division}`,
    'test',
    'test',
  );
  return chart.planets.Sun.signName;
}

function mappedLongitude(longitude: number, division: number): number {
  return calculateDivisionalChart(
    { Sun: longitude },
    0,
    division,
    `D${division}`,
    'test',
    'test',
  ).planets.Sun.longitude;
}

// Canonical Parashari sign-start rules and exact segment boundaries.
assert.equal(mappedSign(0, 2), 'Leo', 'D2 first half of an odd sign starts from Leo');
assert.equal(mappedSign(15, 2), 'Cancer', 'D2 second half of an odd sign starts from Cancer');
assert.equal(mappedSign(0, 3), 'Aries');
assert.equal(mappedSign(10, 3), 'Leo', 'D3 second decan starts from the fifth sign');
assert.equal(mappedSign(0, 4), 'Aries', 'D4 movable signs start from themselves');
assert.equal(mappedSign(30, 4), 'Leo', 'D4 fixed signs start from the fourth sign');
assert.equal(mappedSign(60, 4), 'Sagittarius', 'D4 dual signs start from the seventh sign');
assert.equal(mappedSign(0, 7), 'Aries');
assert.equal(mappedSign(30, 7), 'Scorpio', 'D7 even signs start from the seventh sign');
assert.equal(mappedSign(0, 9), 'Aries');
assert.equal(mappedSign(30, 9), 'Capricorn', 'D9 fixed signs start from the ninth sign');
assert.equal(mappedSign(60, 9), 'Libra', 'D9 dual signs start from the fifth sign');
assert.equal(mappedSign(0, 10), 'Aries');
assert.equal(mappedSign(30, 10), 'Capricorn', 'D10 even signs start from the ninth sign');
assert.equal(mappedSign(30, 12), 'Taurus', 'D12 starts counting from the natal sign');
assert.equal(mappedSign(30, 16), 'Leo', 'D16 fixed signs start from Leo');
assert.equal(mappedSign(60, 16), 'Sagittarius', 'D16 dual signs start from Sagittarius');
assert.equal(mappedSign(30, 20), 'Sagittarius', 'D20 fixed signs start from Sagittarius');
assert.equal(mappedSign(60, 20), 'Leo', 'D20 dual signs start from Leo');
assert.equal(mappedSign(0, 24), 'Leo');
assert.equal(mappedSign(30, 24), 'Cancer');
assert.equal(mappedSign(0, 27), 'Aries');
assert.equal(mappedSign(30, 27), 'Cancer', 'D27 earth signs start from Cancer');
assert.equal(mappedSign(60, 27), 'Libra', 'D27 air signs start from Libra');
assert.equal(mappedSign(90, 27), 'Capricorn', 'D27 water signs start from Capricorn');
assert.equal(mappedSign(0, 40), 'Aries');
assert.equal(mappedSign(30, 40), 'Libra');
assert.equal(mappedSign(0, 45), 'Aries');
assert.equal(mappedSign(30, 45), 'Leo');
assert.equal(mappedSign(60, 45), 'Sagittarius');

// D30 uses unequal 5°/5°/8°/7°/5° odd-sign and 5°/7°/8°/5°/5° even-sign divisions.
assert.equal(mappedSign(0, 30), 'Aries');
assert.equal(mappedSign(5, 30), 'Aquarius');
assert.equal(mappedSign(10, 30), 'Sagittarius');
assert.equal(mappedSign(18, 30), 'Gemini');
assert.equal(mappedSign(25, 30), 'Libra');
assert.equal(mappedSign(30, 30), 'Taurus');
assert.equal(mappedSign(35, 30), 'Virgo');
assert.equal(mappedSign(42, 30), 'Pisces');
assert.equal(mappedSign(50, 30), 'Capricorn');
assert.equal(mappedSign(55, 30), 'Scorpio');
assert.equal(mappedLongitude(360, 9), mappedLongitude(0, 9), '360° must normalize to 0°');
assert.equal(mappedLongitude(5, 30), 300, 'D30 segment starts at 0° of Aquarius');
assert.equal(mappedLongitude(10, 30), 240, 'D30 segment starts at 0° of Sagittarius');

const specific = calculateDivisionalChart({ Sun: 10 }, 0, 4, 'D4', 'Chaturthamsha', 'test');
assert.equal(specific.calculationRule, 'specific');
const generic = calculateDivisionalChart({ Sun: 10 }, 0, 60, 'D60', 'Shashtiamsha', 'test');
assert.equal(generic.calculationRule, 'generic', 'unverified D60 must remain explicitly generic');
assert.throws(() => calculateDivisionalChart({ Sun: 10 }, 0, 0, 'D0', 'invalid', 'test'), /деление от 1 до 60/);
assert.throws(() => calculateDivisionalChart({ Sun: Number.NaN }, 0, 9, 'D9', 'Navamsha', 'test'), /конечная долгота/);

console.log('Divisional chart accuracy regression tests passed.');
