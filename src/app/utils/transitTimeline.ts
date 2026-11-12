import type { NatalChart, PlanetPosition } from './astrology';
import { calculateNatalChart } from './astrology';
import { calculatePlanetMotion } from './astrologyPrecision';
import { analyzeVimshottariDasha } from './vimshottariDashaAnalysis';

export type TimelinePlanet = keyof NatalChart['planets'];
export type TimelineAspect = 'соединение' | 'секстиль' | 'квадратура' | 'трин' | 'оппозиция';

const PLANETS: TimelinePlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const CLASSICAL: TimelinePlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PLANET_RU: Record<TimelinePlanet, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const SIGNS = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const ASPECTS: Array<{ angle: number; label: TimelineAspect; orb: number }> = [
  { angle: 0, label: 'соединение', orb: 3 },
  { angle: 60, label: 'секстиль', orb: 2 },
  { angle: 90, label: 'квадратура', orb: 3 },
  { angle: 120, label: 'трин', orb: 3 },
  { angle: 180, label: 'оппозиция', orb: 3 },
];

export interface TransitTimelineEvent {
  id: string;
  kind: 'exact-aspect' | 'sign-ingress' | 'house-ingress';
  planet: string;
  natalPlanet?: string;
  aspect?: TimelineAspect;
  exactAt: Date;
  from?: string;
  to: string;
  natalHouse?: number;
  orb?: number;
  maxOrb?: number;
  phase?: 'applying' | 'separating' | 'stationary' | 'unknown';
  evidence: string[];
}
export interface TransitAspectWindow {
  id: string;
  transitPlanet: string;
  natalPlanet: string;
  aspect: TimelineAspect;
  startsAt: Date;
  exactAt: Date;
  endsAt: Date;
  maxOrb: number;
  evidence: string[];
}
export interface DashaActivation {
  id: string;
  layer: 'Махадаша' | 'Антардаша' | 'Пратьянтардаша';
  planet: string;
  startsAt: Date;
  endsAt: Date;
  themes: string[];
  evidence: string[];
  repeatedByTransit: boolean;
  transitEvents: string[];
}
export interface TransitTimelineReport {
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  events: TransitTimelineEvent[];
  aspectWindows: TransitAspectWindow[];
  dashaActivations: DashaActivation[];
  methodology: string[];
  warnings: string[];
}

function normalize(value: number): number {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
}
function signedDelta(value: number): number {
  const normalized = normalize(value + 180) - 180;
  return normalized === -180 ? 180 : normalized;
}
function separation(a: number, b: number): number {
  return Math.abs(signedDelta(a - b));
}
function houseFromSign(sign: number, ascendantSign: number): number {
  return ((sign - ascendantSign + 12) % 12) + 1;
}
function getPosition(chart: NatalChart, planet: TimelinePlanet): PlanetPosition {
  return chart.planets[planet];
}
function snapshot(chart: NatalChart, date: Date) {
  const calculated = calculateNatalChart(date, chart.latitude, chart.longitude);
  return {
    date,
    positions: calculated.planets,
    houses: Object.fromEntries(PLANETS.map((planet) => [planet, houseFromSign(calculated.planets[planet].sign, chart.ascendant.sign)])) as Record<TimelinePlanet, number>,
  };
}
function validateRange(chart: NatalChart, start: Date, end: Date, stepHours: number) {
  if (!(start instanceof Date) || !Number.isFinite(start.getTime()) || !(end instanceof Date) || !Number.isFinite(end.getTime())) {
    throw new Error('Укажите корректные даты начала и окончания календаря транзитов');
  }
  if (start < chart.date) throw new Error('Начало календаря не может быть раньше даты рождения');
  if (end <= start) throw new Error('Дата окончания должна быть позже даты начала');
  if (end.getTime() - start.getTime() > 3 * 366 * 86400000) throw new Error('Календарь транзитов ограничен периодом до трёх лет');
  if (!Number.isFinite(stepHours) || stepHours < 6 || stepHours > 72) throw new Error('Шаг расчёта должен быть от 6 до 72 часов');
}
function findRoot(
  left: Date,
  right: Date,
  valueAt: (date: Date) => number,
): Date {
  let lo = left.getTime(), hi = right.getTime();
  let flo = valueAt(new Date(lo));
  for (let i = 0; i < 48 && hi - lo > 60000; i += 1) {
    const mid = (lo + hi) / 2;
    const fm = valueAt(new Date(mid));
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid;
      flo = fm;
    } else hi = mid;
  }
  return new Date((lo + hi) / 2);
}
function aspectOffset(longitude: number, natalLongitude: number, target: number): number {
  return signedDelta(longitude - natalLongitude - target);
}
function targetOrientations(angle: number): number[] {
  return angle === 0 || angle === 180 ? [angle] : [angle, -angle];
}
function aspectOrb(longitude: number, natalLongitude: number, angle: number): number {
  return Math.abs(separation(longitude, natalLongitude) - angle);
}
function formatPlanet(planet: string): string {
  return PLANET_RU[planet as TimelinePlanet] ?? planet;
}

function buildDashaActivations(chart: NatalChart, start: Date, end: Date, aspectWindows: TransitAspectWindow[]): DashaActivation[] {
  const report = analyzeVimshottariDasha(chart, start);
  const windows = [
    ...report.mahadashaAntardashas.map((item) => ({
      layer: 'Антардаша' as const, planet: item.profile.planetName, start: item.startDate, end: item.endDate,
      themes: item.profile.lifeAreaLinks.map((link) => link.label), evidence: item.whyHighlighted,
    })),
    ...report.antardashaPratyantardashas.map((item) => ({
      layer: 'Пратьянтардаша' as const, planet: item.profile.planetName, start: item.startDate, end: item.endDate,
      themes: item.profile.lifeAreaLinks.map((link) => link.label), evidence: item.whyHighlighted,
    })),
    {
      layer: 'Махадаша' as const,
      planet: report.current.mahadasha.profile.planetName,
      start: report.current.mahadasha.startDate,
      end: report.current.mahadasha.endDate,
      themes: report.current.mahadasha.profile.lifeAreaLinks.map((link) => link.label),
      evidence: report.current.mahadasha.whyHighlighted,
    },
  ];
  const activations: DashaActivation[] = [];
  for (const item of windows) {
    const startsAt = new Date(Math.max(start.getTime(), item.start.getTime()));
    const endsAt = new Date(Math.min(end.getTime(), item.end.getTime()));
    if (endsAt <= startsAt || item.themes.length === 0) continue;
    const matched = aspectWindows.filter((aspect) => {
      const overlap = aspect.exactAt >= startsAt && aspect.exactAt <= endsAt;
      return overlap && item.themes.some((theme) => theme.toLowerCase().includes('карьер') && /карьер|работ|професс/i.test(theme) ||
        theme.toLowerCase().includes('деньг') && /деньг|финанс|ресурс/i.test(theme));
    });
    activations.push({
      id: item.layer + ':' + item.planet + ':' + startsAt.toISOString(),
      layer: item.layer, planet: item.planet, startsAt, endsAt,
      themes: item.themes, evidence: item.evidence,
      repeatedByTransit: matched.length > 0,
      transitEvents: matched.map((entry) => entry.id),
    });
  }
  return activations.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Creates a bounded, evidence-first event calendar. Ephemeris positions are sampled,
 * then ingress and exact-aspect times are refined by bisection to minute precision.
 */
export function buildTransitTimeline(
  natalChart: NatalChart,
  startDate: Date,
  endDate: Date,
  options: { stepHours?: number } = {},
): TransitTimelineReport {
  const stepHours = options.stepHours ?? 24;
  validateRange(natalChart, startDate, endDate, stepHours);
  if (!natalChart.houses || natalChart.houses.length !== 12) throw new Error('Для календаря нужны все 12 натальных домов');

  const samples = [];
  for (let time = startDate.getTime(); time < endDate.getTime(); time += stepHours * 3600000) {
    samples.push(snapshot(natalChart, new Date(time)));
  }
  samples.push(snapshot(natalChart, endDate));
  const events: TransitTimelineEvent[] = [];
  const aspectWindows: TransitAspectWindow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    for (const planet of PLANETS) {
      const before = getPosition({ ...natalChart, planets: previous.positions }, planet);
      const after = getPosition({ ...natalChart, planets: current.positions }, planet);
      if (before.sign !== after.sign) {
        const boundary = ((before.sign + 1) % 12) * 30;
        const ingressAt = findRoot(previous.date, current.date, (date) => {
          const position = snapshot(natalChart, date).positions[planet];
          return signedDelta(position.siderealLon - boundary);
        });
        const id = 'sign:' + planet + ':' + ingressAt.toISOString();
        if (!seen.has(id)) {
          seen.add(id);
          events.push({
            id, kind: 'sign-ingress', planet: formatPlanet(planet), exactAt: ingressAt,
            from: SIGNS[before.sign], to: SIGNS[after.sign],
            evidence: [`${formatPlanet(planet)} пересекает границу сидерических знаков ${SIGNS[before.sign]} → ${SIGNS[after.sign]}.`, 'Долгота рассчитана геоцентрически в сидерическом зодиаке Лахири.'],
          });
        }
      }
      if (previous.houses[planet] !== current.houses[planet]) {
        const signBoundary = ((before.sign + 1) % 12) * 30;
        const ingressAt = findRoot(previous.date, current.date, (date) => {
          const position = snapshot(natalChart, date).positions[planet];
          return signedDelta(position.siderealLon - signBoundary);
        });
        const id = 'house:' + planet + ':' + ingressAt.toISOString();
        if (!seen.has(id)) {
          seen.add(id);
          events.push({
            id, kind: 'house-ingress', planet: formatPlanet(planet), exactAt: ingressAt,
            from: `${previous.houses[planet]}-й дом`, to: `${current.houses[planet]}-й дом`,
            natalHouse: current.houses[planet],
            evidence: [`После перехода в знак ${SIGNS[after.sign]} планета переходит из ${previous.houses[planet]}-го в ${current.houses[planet]}-й натальный дом Whole Sign.`, 'Дома отсчитываются от натальной Лагны, а не от транзитной.'],
          });
        }
      }
    }

    for (const transitPlanet of CLASSICAL) {
      const beforeTransit = previous.positions[transitPlanet].siderealLon;
      const afterTransit = current.positions[transitPlanet].siderealLon;
      for (const natalPlanet of CLASSICAL) {
        const natalLongitude = getPosition(natalChart, natalPlanet).siderealLon;
        for (const definition of ASPECTS) {
          const beforeOrb = aspectOrb(beforeTransit, natalLongitude, definition.angle);
          const afterOrb = aspectOrb(afterTransit, natalLongitude, definition.angle);
          const orientations = targetOrientations(definition.angle);
          for (const orientation of orientations) {
            const beforeOffset = aspectOffset(beforeTransit, natalLongitude, orientation);
            const afterOffset = aspectOffset(afterTransit, natalLongitude, orientation);
            if (beforeOffset === 0 || afterOffset === 0 || Math.sign(beforeOffset) === Math.sign(afterOffset)) continue;
            const exactAt = findRoot(previous.date, current.date, (date) =>
              aspectOffset(snapshot(natalChart, date).positions[transitPlanet].siderealLon, natalLongitude, orientation));
            const eventId = `aspect:${transitPlanet}:${natalPlanet}:${definition.angle}:${orientation}:${exactAt.toISOString()}`;
            if (!seen.has(eventId)) {
              seen.add(eventId);
              const motion = calculatePlanetMotion(transitPlanet, exactAt, 12);
              events.push({
                id: eventId, kind: 'exact-aspect', planet: formatPlanet(transitPlanet),
                natalPlanet: formatPlanet(natalPlanet), aspect: definition.label, exactAt,
                orb: 0, maxOrb: definition.orb,
                phase: motion.state === 'stationary' ? 'stationary' : 'unknown',
                evidence: [`${formatPlanet(transitPlanet)} достигает точного аспекта «${definition.label}» к натальному ${formatPlanet(natalPlanet)} (угол ${definition.angle}°).`, `Расчётная скорость транзитной планеты: ${motion.dailyMotion.toFixed(3)}°/сутки (${motion.state}).`],
              });
            }
            // A window is emitted once per exact crossing; its edges are the first/last
            // sampled moments inside the configured orb and are explicitly approximate.
            if (beforeOrb > definition.orb && afterOrb <= definition.orb) {
              const startAt = findRoot(previous.date, current.date, (date) =>
                aspectOrb(snapshot(natalChart, date).positions[transitPlanet].siderealLon, natalLongitude, definition.angle) - definition.orb);
              const endAt = (() => {
                const horizon = new Date(Math.min(endDate.getTime(), exactAt.getTime() + 180 * 86400000));
                return horizon;
              })();
              const windowId = `window:${transitPlanet}:${natalPlanet}:${definition.angle}:${exactAt.toISOString()}`;
              if (!aspectWindows.some((item) => item.id === windowId)) aspectWindows.push({
                id: windowId, transitPlanet: formatPlanet(transitPlanet), natalPlanet: formatPlanet(natalPlanet),
                aspect: definition.label, startsAt: startAt, exactAt, endsAt: endAt,
                maxOrb: definition.orb,
                evidence: [`Период включён при орбисе не более ${definition.orb}°; точный момент уточнён бисекцией.`, 'Окончание окна ограничено горизонтом поиска, если выход из орбиса не попал в выбранный интервал.'],
              });
            }
          }
        }
      }
    }
  }

  const sortedEvents = events.sort((a, b) => a.exactAt.getTime() - b.exactAt.getTime());
  const dashaActivations = buildDashaActivations(natalChart, startDate, endDate, aspectWindows);
  return {
    startDate: new Date(startDate), endDate: new Date(endDate), generatedAt: new Date(),
    events: sortedEvents, aspectWindows: aspectWindows.sort((a, b) => a.exactAt.getTime() - b.exactAt.getTime()),
    dashaActivations,
    methodology: [
      'Транзитные положения рассчитываются тем же геоцентрическим движком Astronomy Engine и айанамшей Лахири, что и натальная карта.',
      'Знак меняется при пересечении границы сидерического знака; дом меняется одновременно с переходом знака в Whole Sign от натальной Лагны.',
      'Точные градусные аспекты рассчитываются для Солнца, Луны, Марса, Меркурия, Юпитера, Венеры и Сатурна к семи натальным классическим планетам.',
      'Момент точного аспекта и момент входа уточняются методом бисекции до интервала около одной минуты при условии, что выбранный шаг не пропустил несколько пересечений.',
      'Окна орбиса показывают период действия выбранного допуска; границы окна могут быть ограничены горизонтом поиска.',
      'Календарь Даши использует доступные в текущей Махадаше Антардаши и в текущей Антардаше Пратьянтардаши; другие Махадаши за пределами доступного дерева не синтезируются.',
    ],
    warnings: [
      'Календарь является символической астрологической моделью, а не научно подтверждённым прогнозом событий.',
      'Аспекты Раху/Кету исключены из-за различий астрологических школ; узлы участвуют только в переходах по знакам и домам.',
      'Для Луны шаг 24 часа может пропустить быстрый вход/выход из узкого орбиса; используйте шаг 6–12 часов для подробного календаря.',
      'Окно аспекта не означает гарантированное событие и не является оценкой благоприятности.',
      'Даты и интервалы отображаются в локальном часовом поясе устройства.',
    ],
  };
}
