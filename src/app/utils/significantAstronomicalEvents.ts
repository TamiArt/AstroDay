import type { NatalChart } from './astrology';
import { analyzeTransits } from './transitAnalysis';

export interface SignificantAstronomicalEvent {
  id: string;
  date: string;
  referenceTime: string;
  referenceTimeNote: string;
  momentUtc: string;
  title: string;
  category: 'planetary-alignment';
  planets: string[];
  visibilityWindow: string;
  description: string;
  observationTip: string;
  sourceUrl: string;
  sourceLabel: string;
}

export interface PersonalizedAstronomicalEvent {
  event: SignificantAstronomicalEvent;
  transitMoment: Date;
  planetaryPositions: Array<{ name: string; sign: string; degree: number; natalHouse: number }>;
  personalSummary: string;
  personalMeaning: string;
  caveat: string;
}

/**
 * Curated astronomical event data. The reference time is the user's requested
 * Moscow time for the calendar marker; it is not represented as the instant
 * when the apparent alignment becomes exact.
 */
export const SIGNIFICANT_ASTRONOMICAL_EVENTS: SignificantAstronomicalEvent[] = [
  {
    id: 'four-planet-alignment-2026-11',
    date: '2026-11-14',
    referenceTime: '05:25 МСК',
    referenceTimeNote: 'Это выбранное время персонального астрологического расчёта, а не точный момент выравнивания и не рекомендуемое время наблюдения.',
    momentUtc: '2026-11-14T02:25:00.000Z',
    title: 'Парад четырёх планет',
    category: 'planetary-alignment',
    planets: ['Меркурий', 'Венера', 'Марс', 'Юпитер'],
    visibilityWindow: '13–22 ноября 2026 года, перед восходом Солнца',
    description: 'Меркурий, Венера, Марс и Юпитер видны в одной области утреннего неба. Это видимое с Земли сближение по направлению, а не физическое выстраивание планет в одну линию.',
    observationTip: 'Ищите планеты низко над восточно-юго-восточным горизонтом до рассвета. Меркурий будет сложнее всего заметить; точное окно зависит от места и погоды.',
    sourceUrl: 'https://starwalk.space/ru/news/astronomy-calendar-2026',
    sourceLabel: 'Star Walk — календарь астрономических событий 2026',
  },
];

const HOUSE_TOPICS: Record<number, string> = {
  1: 'личность, самоощущение и личные инициативы',
  2: 'личные деньги, накопления и семейные ценности',
  3: 'общение, навыки и собственные проекты',
  4: 'дом, семья и внутренняя опора',
  5: 'творчество, увлечения и дети',
  6: 'работа, обязанности и повседневный режим',
  7: 'партнёрство, отношения и договорённости',
  8: 'общие финансы и глубокие перемены',
  9: 'образование, мировоззрение и дальние планы',
  10: 'карьера, профессия и репутация',
  11: 'доходы, профессиональные связи, сообщества и долгосрочные цели',
  12: 'расходы, отдых, уединение и завершение дел',
};

export function getPersonalizedAstronomicalEvent(
  event: SignificantAstronomicalEvent,
  natalChart: NatalChart,
): PersonalizedAstronomicalEvent {
  const transitMoment = new Date(event.momentUtc);
  const report = analyzeTransits(natalChart, transitMoment);
  const relevant = report.positions.filter((position) => ['Mars', 'Jupiter'].includes(position.planet));
  const alignmentPositions = report.positions.filter((position) => ['Mercury', 'Venus', 'Mars', 'Jupiter'].includes(position.planet));
  const sameHouse = relevant.length === 2 && relevant[0].natalHouse === relevant[1].natalHouse;
  const house = sameHouse ? relevant[0].natalHouse : null;
  const topic = house ? HOUSE_TOPICS[house] : null;

  const personalSummary = house
    ? `В момент календарной отметки Марс и Юпитер проходят по ${house}-му дому вашей натальной карты.`
    : 'Приложение сопоставило положения Марса и Юпитера с домами вашей натальной карты на указанное время.';

  const personalMeaning = house
    ? `В Джйотиш ${house}-й дом связывают с темами: ${topic}. Поэтому в символической трактовке именно эти вопросы становятся главным персональным акцентом этого события.`
    : relevant.map((position) => `${position.planetName} находится в ${position.natalHouse}-м доме (${HOUSE_TOPICS[position.natalHouse] ?? 'тема дома'}).`).join(' ');
  const additionalPositions = alignmentPositions.filter((position) => position.planet !== 'Mars' && position.planet !== 'Jupiter');
  const extendedMeaning = additionalPositions.length
    ? personalMeaning + ' Дополнительно: ' + additionalPositions.map((position) => `${position.planetName} затрагивает ${position.natalHouse}-й дом — ${HOUSE_TOPICS[position.natalHouse] ?? 'эту жизненную сферу'}.`).join(' ')
    : personalMeaning;

  return {
    event,
    transitMoment,
    planetaryPositions: alignmentPositions.map((position) => ({
      name: position.planetName,
      sign: position.sign,
      degree: position.degree,
      natalHouse: position.natalHouse,
    })),
    personalSummary,
    personalMeaning: extendedMeaning,
    caveat: 'Парад — астрономическое явление, а связь с жизненными темами — традиционная астрологическая интерпретация. Она не предсказывает и не гарантирует конкретных событий.',
  };
}
