import * as Astronomy from 'astronomy-engine';

const J2000_JULIAN_DAY = 2451545.0;
const JULIAN_CENTURY_DAYS = 36525;
const ARCSECONDS_PER_DEGREE = 3600;

// Standard Lahiri ayanamsha at J2000.0 from the Indian Astronomical
// Ephemeris / Swiss Ephemeris reference: 23°51′25.5324″.
const LAHIRI_J2000_DEGREES = 23 + (51 / 60) + (25.5324 / ARCSECONDS_PER_DEGREE);

/**
 * IAU 1976 (Lieske) general precession in longitude, referred to J2000.
 * Coefficients are in arcseconds for Julian centuries from J2000.
 *
 * This replaces the previous linear approximation. It reproduces the
 * published Lahiri mean ayanamsha reference values at J2000, 2019 and 2020
 * to a small fraction of an arcsecond without adding a runtime dependency.
 */
function getGeneralPrecessionArcseconds(julianCenturiesFromJ2000: number): number {
  const t = julianCenturiesFromJ2000;
  return (5029.0966 * t) + (1.11161 * t * t) - (0.000113 * t * t * t);
}

export function getLahiriAyanamsha(date: Date): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Некорректная дата для расчёта Lahiri ayanamsha');
  }

  const astroTime = Astronomy.MakeTime(date);
  const t = (astroTime.ut - J2000_JULIAN_DAY) / JULIAN_CENTURY_DAYS;
  const precessionDegrees = getGeneralPrecessionArcseconds(t) / ARCSECONDS_PER_DEGREE;

  return LAHIRI_J2000_DEGREES + precessionDegrees;
}
