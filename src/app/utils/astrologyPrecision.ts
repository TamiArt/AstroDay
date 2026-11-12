import { calculatePlanetPosition, getNakshatra, getNakshatraPada, getSign, type NatalChart, type PlanetPosition } from './astrology';

export type PrecisionStatus = 'validated-reference' | 'calculated-model' | 'exact-mathematics' | 'school-dependent';
export type MotionState = 'direct' | 'retrograde' | 'stationary';
export interface PlanetMotion { planet: string; dailyMotion: number; state: MotionState; sampleWindowHours: number; }
export interface CombustionResult {
  planet: string; separation: number | null; threshold: number | null; isCombust: boolean | null;
  retrograde: boolean | null; rule: string; status: 'combust' | 'not-combust' | 'not-assessed';
}
export interface AngularAspectResult {
  planet1: string; planet2: string; aspect: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  exactAngle: number; separation: number; orb: number; maxOrb: number;
  isApplying: boolean | null; phase: 'applying' | 'separating' | 'unknown';
}
export interface ConjunctionResult {
  planet1: string; planet2: string; sameSign: boolean; angularSeparation: number;
  degreeOrb: number; withinDegreeOrb: boolean; maxDegreeOrb: number;
  classification: 'same-sign-and-degree' | 'same-sign-only' | 'degree-orb-only' | 'none';
}
export interface PlanetPrecisionResult {
  planet: string; tropicalLongitude: number; siderealLongitude: number; signIndex: number;
  degreeInSign: number; nakshatraIndex: number; pada: number; motion: PlanetMotion | null;
  combustion: CombustionResult;
}
export interface NatalPrecisionReport {
  methodology: Record<string, string>;
  ascendant: { tropicalLongitude: number; siderealLongitude: number; signIndex: number;
    degreeInSign: number; nakshatraIndex: number; pada: number; status: PrecisionStatus; limitation: string; };
  planets: PlanetPrecisionResult[]; conjunctions: ConjunctionResult[]; aspects: AngularAspectResult[];
  quality: Array<{ topic: string; status: PrecisionStatus; explanation: string }>;
  limitations: string[];
}

const CLASSICAL = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
const MOTION_PLANETS = ['Sun', 'Moon', ...CLASSICAL] as const;
const ASPECTS = [
  { aspect: 'conjunction', angle: 0, orb: 10 }, { aspect: 'sextile', angle: 60, orb: 6 },
  { aspect: 'square', angle: 90, orb: 8 }, { aspect: 'trine', angle: 120, orb: 8 },
  { aspect: 'opposition', angle: 180, orb: 10 },
] as const;
const COMBUSTION_ORBS: Record<typeof CLASSICAL[number], { direct: number; retrograde: number; source: string }> = {
  Mercury: { direct: 14, retrograde: 12, source: 'Surya Siddhanta IX.6–8; Mercury 14° direct / 12° retrograde' },
  Venus: { direct: 10, retrograde: 8, source: 'Surya Siddhanta IX.6–8; Venus 10° direct / 8° retrograde' },
  Mars: { direct: 17, retrograde: 17, source: 'Surya Siddhanta IX.6–8; Mars 17°' },
  Jupiter: { direct: 11, retrograde: 11, source: 'Surya Siddhanta IX.6–8; Jupiter 11°' },
  Saturn: { direct: 15, retrograde: 15, source: 'Surya Siddhanta IX.6–8; Saturn 15° convention' },
};
const CONJUNCTION_ORB = 8;
const STATIONARY_EPSILON = 0.02;

function normalize(value: number): number { const n = value % 360; return n < 0 ? n + 360 : n; }
function signedDelta(from: number, to: number): number {
  const d = normalize(to - from); return d > 180 ? d - 360 : d;
}
export function angularSeparation(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Долготы для углового расстояния должны быть конечными числами');
  const d = normalize(a - b); return Math.min(d, 360 - d);
}
export function calculatePlanetMotion(planet: string, date: Date, sampleWindowHours = 12): PlanetMotion {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new Error('Некорректная дата для расчёта скорости планеты');
  if (!Number.isFinite(sampleWindowHours) || sampleWindowHours <= 0 || sampleWindowHours > 72) throw new Error('Окно расчёта движения должно быть больше 0 и не превышать 72 часа');
  if (!(MOTION_PLANETS as readonly string[]).includes(planet)) throw new Error('Расчёт движения для этой точки не поддерживается: ' + planet);
  const half = sampleWindowHours * 3600000;
  const before = calculatePlanetPosition(planet, new Date(date.getTime() - half));
  const after = calculatePlanetPosition(planet, new Date(date.getTime() + half));
  const dailyMotion = signedDelta(before.tropicalLon, after.tropicalLon) / (sampleWindowHours / 12);
  const state: MotionState = Math.abs(dailyMotion) <= STATIONARY_EPSILON ? 'stationary' : dailyMotion < 0 ? 'retrograde' : 'direct';
  return { planet, dailyMotion, state, sampleWindowHours };
}
export function classifyCombustion(planet: string, separation: number, retrograde: boolean): CombustionResult {
  if (!Number.isFinite(separation) || separation < 0 || separation > 180) throw new Error('Угловое расстояние для сожжения должно находиться в диапазоне 0–180°');
  if (!(CLASSICAL as readonly string[]).includes(planet)) return {
    planet, separation, threshold: null, isCombust: null, retrograde: null,
    rule: 'В выбранной модели сожжение оценивается только для пяти классических планет', status: 'not-assessed',
  };
  const rule = COMBUSTION_ORBS[planet as typeof CLASSICAL[number]];
  const threshold = retrograde ? rule.retrograde : rule.direct;
  const isCombust = separation <= threshold;
  return { planet, separation, threshold, isCombust, retrograde, rule: rule.source, status: isCombust ? 'combust' : 'not-combust' };
}
function conjunction(p1: string, a: PlanetPosition, p2: string, b: PlanetPosition, maxOrb: number): ConjunctionResult {
  const sameSign = a.sign === b.sign, degreeOrb = angularSeparation(a.siderealLon, b.siderealLon);
  const withinDegreeOrb = degreeOrb <= maxOrb;
  const classification = sameSign && withinDegreeOrb ? 'same-sign-and-degree' : sameSign ? 'same-sign-only' : withinDegreeOrb ? 'degree-orb-only' : 'none';
  return { planet1: p1, planet2: p2, sameSign, angularSeparation: degreeOrb, degreeOrb, withinDegreeOrb, maxDegreeOrb: maxOrb, classification };
}
export function calculateAngularAspects(
  positions: Record<string, PlanetPosition>,
  motions: Record<string, PlanetMotion | null> = {},
  maxOrbs: Partial<Record<AngularAspectResult['aspect'], number>> = {},
): AngularAspectResult[] {
  const entries = Object.entries(positions), results: AngularAspectResult[] = [];
  for (let i = 0; i < entries.length - 1; i++) for (let j = i + 1; j < entries.length; j++) {
    const [planet1, a] = entries[i], [planet2, b] = entries[j];
    const separation = angularSeparation(a.siderealLon, b.siderealLon);
    const v1 = motions[planet1]?.dailyMotion, v2 = motions[planet2]?.dailyMotion;
    const known = Number.isFinite(v1) && Number.isFinite(v2);
    for (const definition of ASPECTS) {
      const maxOrb = maxOrbs[definition.aspect] ?? definition.orb, orb = Math.abs(separation - definition.angle);
      if (orb > maxOrb) continue;
      let phase: AngularAspectResult['phase'] = 'unknown', isApplying: boolean | null = null;
      if (known) {
        const future = angularSeparation(a.siderealLon + (v1 as number) / 24, b.siderealLon + (v2 as number) / 24);
        if (orb <= 1e-8) {
          isApplying = null;
          phase = 'unknown';
        } else {
          isApplying = Math.abs(future - definition.angle) < orb;
          phase = isApplying ? 'applying' : 'separating';
        }
      }
      results.push({ planet1, planet2, aspect: definition.aspect, exactAngle: definition.angle, separation, orb, maxOrb, isApplying, phase });
    }
  }
  return results.sort((a, b) => a.orb - b.orb || a.planet1.localeCompare(b.planet1) || a.planet2.localeCompare(b.planet2));
}
export function buildNatalPrecisionReport(
  chart: NatalChart,
  options: { conjunctionOrb?: number; aspectOrbs?: Partial<Record<AngularAspectResult['aspect'], number>> } = {},
): NatalPrecisionReport {
  const conjunctionOrb = options.conjunctionOrb ?? CONJUNCTION_ORB;
  if (!Number.isFinite(conjunctionOrb) || conjunctionOrb < 0 || conjunctionOrb > 30) throw new Error('Орбис соединения должен находиться в диапазоне 0–30°');
  const motions: Record<string, PlanetMotion | null> = {};
  for (const planet of MOTION_PLANETS) motions[planet] = calculatePlanetMotion(planet, chart.date);
  const planets = Object.entries(chart.planets).map(([planet, position]) => {
    const motion = motions[planet] ?? null;
    const distance = planet === 'Sun' ? null : angularSeparation(position.tropicalLon, chart.planets.Sun.tropicalLon);
    const combustion = distance === null
      ? { planet, separation: null, threshold: null, isCombust: null, retrograde: null, rule: 'Солнце не может быть сожжено', status: 'not-assessed' as const }
      : classifyCombustion(planet, distance, motion?.state === 'retrograde');
    return {
      planet, tropicalLongitude: position.tropicalLon, siderealLongitude: position.siderealLon,
      signIndex: getSign(position.siderealLon), degreeInSign: position.siderealLon % 30,
      nakshatraIndex: getNakshatra(position.siderealLon), pada: getNakshatraPada(position.siderealLon),
      motion, combustion,
    };
  });
  const positions = chart.planets as Record<string, PlanetPosition>, names = Object.keys(positions), conjunctions: ConjunctionResult[] = [];
  for (let i = 0; i < names.length - 1; i++) for (let j = i + 1; j < names.length; j++) conjunctions.push(conjunction(names[i], positions[names[i]], names[j], positions[names[j]], conjunctionOrb));
  return {
    methodology: {
      ephemeris: 'Geocentric ecliptic-of-date coordinates from astronomy-engine; model calculation, not observational measurement.',
      zodiac: 'Sidereal zodiac.', ayanamsha: 'Mean Lahiri; nutation is not included.',
      nakshatra: '27 equal sectors (13°20′); pada is one of 108 equal sectors (3°20′).',
      ascendant: 'Intersection of the ecliptic and eastern horizon using local sidereal time and mean obliquity.',
      combustion: 'Surya Siddhanta working orbs: Mercury 14°/12° retrograde, Venus 10°/8°, Mars 17°, Jupiter 11°, Saturn 15°. Alternative modern tables use Mercury 12°/8° and sometimes Saturn 16°; school-dependent.',
      aspects: 'Ecliptic angular aspects: 0°/60°/90°/120°/180°; defaults 10°/6°/8°/8°/10°; orbs are configurable.',
      conjunction: 'Same-sign conjunction and degree conjunction within ' + conjunctionOrb + '° are independent flags.',
    },
    ascendant: {
      tropicalLongitude: chart.ascendant.tropicalLon, siderealLongitude: chart.ascendant.siderealLon,
      signIndex: chart.ascendant.sign, degreeInSign: chart.ascendant.degree,
      nakshatraIndex: chart.ascendant.nakshatra, pada: chart.ascendant.pada,
      status: 'calculated-model',
      limitation: 'Есть один независимый опубликованный эталон; высокие широты и широкий диапазон эпох требуют дополнительной матрицы.',
    },
    planets, conjunctions, aspects: calculateAngularAspects(positions, motions, options.aspectOrbs),
    quality: [
      { topic: 'Долготы планет', status: 'validated-reference', explanation: 'Сверяются с независимыми Swiss Ephemeris/Drik Panchang fixtures; точность ограничена моделью эфемерид.' },
      { topic: 'Асцендент', status: 'calculated-model', explanation: 'Геометрический расчёт; независимая регрессия пока покрывает одну опубликованную точку.' },
      { topic: 'Накшатры и пады', status: 'exact-mathematics', explanation: 'Границы секторов математически точны для переданной долготы; её погрешность сохраняется.' },
      { topic: 'Ретроградность', status: 'calculated-model', explanation: 'Направление видимого геоцентрического движения определяется симметричной разностью долгот за 24 часа.' },
      { topic: 'Сожжение', status: 'school-dependent', explanation: 'Численное расстояние точно в рамках координатной модели; порог зависит от школы.' },
      { topic: 'Аспекты и орбисы', status: 'school-dependent', explanation: 'Угол вычисляется численно; допустимый орбис является настройкой интерпретационной системы.' },
      { topic: 'Соединения', status: 'exact-mathematics', explanation: 'Совпадение знака и градусный орбис отображаются отдельно.' },
    ],
    limitations: [
      'Долготы — результат модели эфемерид astronomy-engine, а не абсолютные наблюдаемые величины.',
      'Mean Lahiri не включает нутацию; true Lahiri может отличаться на десятки угловых секунд.',
      'Асцендент требует дополнительных эталонов для разных эпох и широт.',
      'Ретроградность — видимое геоцентрическое движение; узлы не получают отдельного статуса движения.',
      'Пороги сожжения зависят от школы; здесь используется Surya Siddhanta, а не расчёт heliacal visibility.',
      'Орбисы аспектов не являются астрономическими константами.',
      'Точность координат не доказывает научную валидность астрологических интерпретаций.',
    ],
  };
}
