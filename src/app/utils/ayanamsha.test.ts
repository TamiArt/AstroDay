import { getLahiriAyanamsha } from './ayanamsha';

const ARCSECONDS_PER_DEGREE = 3600;

function dmsToDegrees(degrees: number, minutes: number, seconds: number): number {
  return degrees + (minutes / 60) + (seconds / ARCSECONDS_PER_DEGREE);
}

function assertCloseArcseconds(
  label: string,
  actualDegrees: number,
  expectedDegrees: number,
  toleranceArcseconds = 0.02
): void {
  const differenceArcseconds = Math.abs(actualDegrees - expectedDegrees) * ARCSECONDS_PER_DEGREE;
  if (differenceArcseconds > toleranceArcseconds) {
    throw new Error(
      `${label}: expected ${expectedDegrees.toFixed(9)}°, got ${actualDegrees.toFixed(9)}° ` +
      `(difference ${differenceArcseconds.toFixed(4)}″)`
    );
  }
}

// Reference mean Lahiri values published in Swiss Ephemeris documentation,
// reproducing Indian Astronomical Ephemeris values with IAU 1976 precession.
const fixtures = [
  {
    label: 'J2000.0',
    date: new Date('2000-01-01T12:00:00Z'),
    expected: dmsToDegrees(23, 51, 25.5324),
  },
  {
    label: '2019-01-01',
    date: new Date('2019-01-01T12:00:00Z'),
    expected: dmsToDegrees(24, 7, 21.1353),
  },
  {
    label: '2020-01-01',
    date: new Date('2020-01-01T12:00:00Z'),
    expected: dmsToDegrees(24, 8, 11.3962),
  },
];

for (const fixture of fixtures) {
  assertCloseArcseconds(
    fixture.label,
    getLahiriAyanamsha(fixture.date),
    fixture.expected
  );
}

console.log(`Lahiri ayanamsha: ${fixtures.length} regression fixtures passed.`);
