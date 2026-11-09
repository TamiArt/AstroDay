# Astrology calculation accuracy and validation

Updated: 2026-11-09

This document records the calculation conventions, independent regression references, tolerances, and known limitations used by AstroDay. Passing these tests means that the tested cases match the stated references; it is not a certification of every astrological school or every historical ephemeris value.

## Calculation conventions

- Zodiac: sidereal zodiac with a **mean Lahiri ayanamsha** implementation based on the IAU 1976/Lieske general precession polynomial anchored at J2000.0.
- Planetary positions: geocentric ecliptic longitudes from `astronomy-engine`; tropical longitudes are converted to sidereal by subtracting the configured ayanamsha.
- Lunar nodes: mean ascending node (Rahu); Ketu is placed exactly 180° opposite. True-node positions are not implemented.
- Houses: whole-sign houses from the sidereal Ascendant.
- Nakshatras: 27 equal sectors of exactly 360° / 27; padas use exactly 360° / 108.
- Panchang: tithi uses the normalized Moon–Sun longitude difference; yoga uses the normalized sidereal longitude sum; nakshatra uses the exact 27-sector division.
- Divisional charts: explicitly supported sign-start rules are marked `specific`; any unimplemented rule remains marked `generic` and must not be presented as a validated classical varga formula.
- Civil time: IANA timezone rules are used for wall-clock conversion. Ambiguous fall-back times resolve to the earlier instant; nonexistent spring-forward times are rejected.

## Independent reference fixtures

| Calculation | Reference | Tolerance / assertion |
|---|---|---|
| Mean Lahiri ayanamsha | Swiss Ephemeris `swetest -nonut`, 1990-01-01 00:00 UT: 23°43′02.6259″ | 0.02 arcsec |
| Sidereal Sun and Moon | Astrodienst Swiss Ephemeris sidereal (Lahiri), geocentric, 1990-03-15 00:00 UT: Sun 0°25′05″ Pisces; Moon 10°04′ Pisces | Sun 0.03°; Moon 0.1° (source table rounded to minutes) |
| Ascendant | Drik Panchang, New Delhi, 1990-06-15 12:49:25 IST: 6°48′13″ Virgo | 0.2° |
| Timezone conversion | IANA Europe/London and Europe/Paris DST transition fixtures | Exact UTC instant, including gap/overlap behavior |
| Angular divisions | Exact mathematical boundaries for signs, nakshatras, tithis, yogas and karanas | Exact index at and immediately before each tested boundary |
| Vargas | Canonical sign-start fixtures for D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40 and D45 | Exact sign and selected D30 longitude boundaries |

Reference links:
- [Swiss Ephemeris documentation: Lahiri mean ayanamsha / swetest examples](https://www.astro.com/swisseph/swisseph.htm)
- [Astrodienst Swiss Ephemeris sidereal ephemeris for 1990](https://www.astro.com/swisseph/slae/1900/slae_1990.pdf)
- [Drik Panchang: planetary positions for 15 June 1990](https://www.drikpanchang.com/planet/position/planetary-positions-sidereal.html?date=15%2F06%2F1990)

## Divisional chart rules

The current implementation has explicit sign-start rules for D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40 and D45.

D30 (Trimshamsha) uses unequal 5°/5°/8°/7°/5° segments for odd signs and 5°/7°/8°/5°/5° segments for even signs, mapping each segment proportionally into 30° of its target sign.

D60 remains marked `generic`. Its output is not considered a verified classical Shashtiamsha calculation and must not be used as evidence in personalized interpretations until a dedicated rule and independent fixtures are added.

## Known limitations — do not overstate accuracy

1. **Mean versus true Lahiri:** the current ayanamsha is mean and does not add nutation. Published true Lahiri values can differ by up to roughly 17 arcseconds. The app must label its convention rather than claim exact agreement with every Swiss Ephemeris/Jagannatha Hora configuration.
2. **Lunar nodes:** Rahu is a mean node; true-node mode is not supported.
3. **Ascendant:** the independent fixture covers one location/date/time. High-latitude edge cases and a broad multi-epoch reference matrix still need additional checks.
4. **Vimshottari dasha:** years currently use 365.2425 days. Alternative traditional year-length conventions can produce different period boundaries; this convention is not asserted to be universal.
5. **Panchang event timing:** important-date search samples the panchang at local noon once per civil day. It identifies a day on which a tithi index is present; it does not calculate the exact start/end instant of that tithi. Eclipse and Sankranti event times are not currently calculated.
6. **Planetary hours at polar latitudes:** when sunrise/sunset cannot be found, the existing 06:00/18:00 fallback is an estimate and is flagged with `isFallback`; it is not an astronomical sunrise calculation.
7. **Varga coverage:** D60 and any other `generic` division are not validated as classical varga rules. Do not use them as a basis for specific life-area claims.
8. **Interpretation versus astronomy:** accurate coordinates do not establish the scientific validity of astrological interpretations. All astrological readings remain symbolic/traditional and must not be presented as deterministic predictions.

## Regression test entry points

- `src/app/utils/ayanamsha.test.ts`
- `src/app/utils/astrology.test.ts`
- `src/app/utils/divisionalCharts.test.ts`
- `src/app/utils/panchang.test.ts`
- `src/app/utils/timezones.test.ts`
- `src/app/utils/planetaryHours.test.ts`

The complete project verification command is `npm run verify` (strict TypeScript, complete unit suite, production build). Do not mark this stage technically accepted until GitHub Actions completes that command successfully on the final stage commit.