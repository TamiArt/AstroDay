import assert from 'node:assert/strict';
import {
  calculateAscendant,
  calculateDasha,
  calculateNatalChart,
  calculatePlanetPosition,
  getCurrentAntardasha,
  getNakshatra,
  getNakshatraPada,
  getSign,
} from './astrology';

// Independent Swiss Ephemeris sidereal (Lahiri) geocentric table:
 // 1990-03-15 00:00 UT, Sun 0°25′05″ Pisces, Moon 10°04′ Libra and Mercury 26°32′ Aquarius.
 // Minute-rounded source values are compared with conservative angular tolerances.
const referenceMoment = new Date('1990-03-15T00:00:00.000Z');
const referenceSun = calculatePlanetPosition('Sun', referenceMoment);
const referenceMoon = calculatePlanetPosition('Moon', referenceMoment);
const referenceMercury = calculatePlanetPosition('Mercury', referenceMoment);
const sunReferenceLongitude = 330 + 25 / 60 + 5 / 3600;
const moonReferenceLongitude = 180 + 10 + 4 / 60;
const mercuryReferenceLongitude = 300 + 26 + 32 / 60;
const angularDifference = (left: number, right: number) => Math.abs(((left - right + 540) % 360) - 180);
assert.ok(
  angularDifference(referenceSun.siderealLon, sunReferenceLongitude) < 0.03,
  `Swiss Ephemeris Sun reference: expected ${sunReferenceLongitude}°, got ${referenceSun.siderealLon}°`,
);
assert.ok(
  angularDifference(referenceMoon.siderealLon, moonReferenceLongitude) < 0.1,
  `Swiss Ephemeris Moon reference: expected ${moonReferenceLongitude}°, got ${referenceMoon.siderealLon}°`,
);
assert.ok(
  angularDifference(referenceMercury.siderealLon, mercuryReferenceLongitude) < 0.1,
  `Swiss Ephemeris Mercury reference: expected ${mercuryReferenceLongitude}°, got ${referenceMercury.siderealLon}°`,
);

// Independent chart-casting reference from Drik Panchang:
 // New Delhi, 1990-06-15 12:49:25 IST (07:19:25 UTC), Lahiri Lagna 6°48′13″ Virgo.
const ascendantReference = calculateAscendant(
  new Date('1990-06-15T07:19:25.000Z'),
  28.6139,
  77.2090,
);
const ascendantReferenceLongitude = 150 + 6 + 48 / 60 + 13 / 3600;
assert.ok(
  angularDifference(ascendantReference.siderealLon, ascendantReferenceLongitude) < 0.2,
  `Independent New Delhi ascendant reference: expected ${ascendantReferenceLongitude}°, got ${ascendantReference.siderealLon}°`,
);

// Independent full-chart fixture from Drik Panchang at the same birth instant.
// Values are the published decimal sidereal longitudes (rounded to 0.01°).
const drikReferenceChart = calculateNatalChart(
  new Date('1990-06-15T07:19:25.000Z'),
  28.6139,
  77.2090,
);
const drikPlanetReferences: Record<string, number> = {
  Sun: 60.21,
  Moon: 319.03,
  Mars: 347.17,
  Mercury: 41.62,
  Jupiter: 82.11,
  Venus: 24.81,
  Saturn: 270.31,
  Uranus: 254.44,
  Neptune: 259.99,
  Pluto: 201.83,
  Rahu: 285.97,
  Ketu: 105.97,
};
for (const [planetName, expectedLongitude] of Object.entries(drikPlanetReferences)) {
  const actualLongitude = drikReferenceChart.planets[planetName]?.siderealLon;
  assert.ok(
    typeof actualLongitude === 'number' && angularDifference(actualLongitude, expectedLongitude) < 0.1,
    `Drik Panchang ${planetName} reference: expected ${expectedLongitude}°, got ${actualLongitude}°`,
  );
}

const birthMoment = new Date('1990-06-15T08:30:00.000Z');
const chart = calculateNatalChart(birthMoment, 51.5074, -0.1278);

assert.equal(chart.houses?.length, 12, 'Whole Sign chart must contain 12 houses');
assert.equal(new Set(chart.houses?.map((house) => house.house)).size, 12, 'House numbers must be unique');
assert.ok(chart.ascendant.sign >= 0 && chart.ascendant.sign < 12, 'Ascendant sign must be valid');
assert.ok(Number.isFinite(chart.ascendant.tropicalLon), 'Ascendant tropical longitude must be finite');
assert.ok(
  chart.ascendant.siderealLon >= 0 && chart.ascendant.siderealLon < 360,
  'Ascendant sidereal longitude must be normalized'
);

const rahu = chart.planets.Rahu.siderealLon;
const ketu = chart.planets.Ketu.siderealLon;
const nodeSeparation = ((ketu - rahu) % 360 + 360) % 360;
assert.ok(Math.abs(nodeSeparation - 180) < 1e-9, 'Rahu and Ketu must remain exactly opposite');

for (const planet of Object.values(chart.planets)) {
  assert.ok(planet.siderealLon >= 0 && planet.siderealLon < 360, `${planet.name} sidereal longitude must be normalized`);
  assert.ok(planet.sign >= 0 && planet.sign < 12, `${planet.name} sign must be valid`);
  assert.ok(planet.nakshatra >= 0 && planet.nakshatra < 27, `${planet.name} nakshatra must be valid`);
  assert.ok(planet.pada >= 1 && planet.pada <= 4, `${planet.name} pada must be valid`);
}

assert.equal(getSign(0), 0);
assert.equal(getSign(359.999), 11);
assert.equal(getNakshatra(0), 0);
assert.equal(getNakshatra(359.9), 26);
const nakshatraWidth = 360 / 27;
assert.equal(getNakshatra(nakshatraWidth - 1e-10), 0, 'longitude immediately before a nakshatra boundary stays in the previous nakshatra');
assert.equal(getNakshatra(nakshatraWidth), 1, 'exact nakshatra boundary starts the next nakshatra');
assert.equal(getNakshatra(360), 0, '360° normalizes to the first nakshatra');
const padaWidth = 360 / 108;
assert.equal(getNakshatraPada(0), 1);
assert.equal(getNakshatraPada(padaWidth - 1e-10), 1);
assert.equal(getNakshatraPada(padaWidth), 2, 'exact pada boundary starts the next pada');
assert.equal(getNakshatraPada(4 * padaWidth), 1, 'nakshatra boundary resets pada to one');
assert.equal(getSign(360), 0, '360° normalizes to Aries');
assert.equal(getSign(-0.001), 11, 'negative longitudes normalize across 0°');
assert.throws(() => getNakshatra(Number.NaN), /конечным числом/);
assert.throws(() => calculateDasha(birthMoment, 27, new Date('2026-08-19T12:00:00.000Z')), /от 0 до 26/);
assert.throws(() => calculateDasha(birthMoment, 0, new Date('1989-01-01T00:00:00Z')), /раньше даты рождения/);

const moonNakshatra = chart.planets.Moon.nakshatra;
const currentDate = new Date('2026-08-19T12:00:00.000Z');
const dasha = calculateDasha(birthMoment, moonNakshatra, currentDate, chart.planets.Moon.siderealLon);
assert.ok(dasha.startDate <= currentDate && currentDate < dasha.endDate, 'Current Mahadasha must contain requested date');

// Vimshottari boundaries: exact nakshatra start gives the full starting mahadasha;
// antardashas are contiguous and their final boundary equals the mahadasha end.
const dashaBirth = new Date('2000-01-01T00:00:00.000Z');
const firstKetuDasha = calculateDasha(dashaBirth, 0, dashaBirth, 0);
assert.equal(firstKetuDasha.planet, 'Ketu');
assert.equal(firstKetuDasha.startDate.getTime(), dashaBirth.getTime());
assert.ok(Math.abs(firstKetuDasha.endDate.getTime() - (dashaBirth.getTime() + 7 * 365.2425 * 86400000)) < 1);
assert.equal(firstKetuDasha.antardasha?.[0].planet, 'Ketu');
assert.equal(firstKetuDasha.antardasha?.[0].startDate.getTime(), firstKetuDasha.startDate.getTime());
for (let index = 1; index < (firstKetuDasha.antardasha?.length ?? 0); index++) {
  assert.equal(
    firstKetuDasha.antardasha![index - 1].endDate.getTime(),
    firstKetuDasha.antardasha![index].startDate.getTime(),
    'Antardasha periods must be contiguous',
  );
}
assert.equal(
  firstKetuDasha.antardasha?.[8].endDate.getTime(),
  firstKetuDasha.endDate.getTime(),
  'The final antardasha must end with its mahadasha',
);
const nextMahadasha = calculateDasha(dashaBirth, 0, firstKetuDasha.endDate, 0);
assert.equal(nextMahadasha.planet, 'Venus', 'The next mahadasha begins exactly at the prior end boundary');
const nextNakshatraDasha = calculateDasha(dashaBirth, 1, dashaBirth, 360 / 27);
assert.equal(nextNakshatraDasha.planet, 'Venus', 'A Moon exactly on the next nakshatra boundary starts its lord sequence');
const antardasha = getCurrentAntardasha(dasha, currentDate);
assert.ok(antardasha, 'Active Mahadasha must expose an active Antardasha');
assert.ok(antardasha!.startDate <= currentDate && currentDate < antardasha!.endDate);

assert.throws(
  () => calculateNatalChart(birthMoment, 91, -0.1278),
  /Некорректная широта/,
  'latitude outside the geographic range must be rejected',
);
assert.throws(
  () => calculateNatalChart(birthMoment, 51.5074, 181),
  /Некорректная долгота/,
  'longitude outside the geographic range must be rejected',
);

console.log('astrology tests passed');
