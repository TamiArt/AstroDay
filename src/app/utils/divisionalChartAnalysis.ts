import type { NatalChart } from './astrology';
import {
  calculateAllDivisionalCharts,
  type DivisionalChart,
} from './divisionalCharts';

const SIGN_NAMES_RU = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
  'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы',
] as const;

const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
] as const;

const PLANET_NAMES_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн',
  Rahu: 'Раху', Ketu: 'Кету',
};

export interface VargaRule {
  division: number;
  name: string;
  sanskritName: string;
  topic: string;
  d1Houses: number[];
  vargaHouses: number[];
  karakas: string[];
  calculationRule: string;
  interpretiveScope: string;
  limitations: string[];
}

export const VARGA_ANALYSIS_RULES: readonly VargaRule[] = [
  { division: 1, name: 'D1 — Раши', sanskritName: 'Rashi', topic: 'Основа общей натальной карты', d1Houses: [1, 5, 9, 10], vargaHouses: [1, 5, 9, 10], karakas: ['Sun', 'Moon', 'Jupiter'], calculationRule: 'Исходные сидерические положения планет и Лагны; Whole Sign.', interpretiveScope: 'Базовый контекст личности, жизненных обстоятельств и всех тематических домов. D1 задаёт исходные вопросы для проверки в дробных картах.', limitations: ['D1 не заменяется дробными картами; тематические варги только уточняют выбранные области.'] },
  { division: 2, name: 'D2 — Хора', sanskritName: 'Hora', topic: 'Финансы и ресурсы', d1Houses: [2, 11], vargaHouses: [2, 11], karakas: ['Sun', 'Moon', 'Jupiter'], calculationRule: 'Парашари Хора: нечётные знаки — первые 15° Лев, вторые 15° Рак; чётные знаки — наоборот.', interpretiveScope: 'Сопоставляет ресурсную тему D1 со 2-м и 11-м домами Хоры, их управителями и Солнцем/Луной как сигнификаторами двух Хор.', limitations: ['Используется именно двухзнаковая Парашари Хора; другие схемы D2 не смешиваются с ней.', 'Не прогнозирует сумму дохода, финансовый успех или инвестиционный результат.'] },
  { division: 3, name: 'D3 — Дреккана', sanskritName: 'Drekkana', topic: 'Инициативность, усилия и близкие', d1Houses: [3, 11], vargaHouses: [3, 11], karakas: ['Mars', 'Mercury'], calculationRule: 'Парашари Дреккана: три 10-градусных части начинаются от исходного знака, 5-го и 9-го знаков.', interpretiveScope: 'Уточняет 3-й дом усилий, инициативы, навыков и сиблингов, а 11-й — поддержки и результатов усилий.', limitations: ['Реальные отношения с братьями, сёстрами и близкими нельзя установить по карте.', 'Не подменяет фактическую оценку навыков, среды и доступных ресурсов.'] },
  { division: 4, name: 'D4 — Чатуртхамша', sanskritName: 'Chaturthamsha', topic: 'Недвижимость и устойчивость', d1Houses: [4, 11], vargaHouses: [4, 11], karakas: ['Moon', 'Mars', 'Venus'], calculationRule: 'Парашари Чатуртхамша: отсчёт частей от исходного знака для подвижных, 4-го для неподвижных и 7-го для двойственных знаков.', interpretiveScope: 'Сопоставляет 4-й дом жилья и опоры с 11-м домом приобретений; рассматривает управителей и Луну как естественный сигнификатор комфорта.', limitations: ['Не оценивает юридическую чистоту, техническое состояние, цену или доходность недвижимости.', 'Трактовка не является обещанием владения объектом или переезда.'] },
  { division: 7, name: 'D7 — Саптамша', sanskritName: 'Saptamsha', topic: 'Дети и продолжение рода', d1Houses: [5, 9], vargaHouses: [5, 9], karakas: ['Jupiter', 'Sun', 'Moon'], calculationRule: 'Парашари Саптамша: нечётные знаки отсчитывают части от себя, чётные — от 7-го знака.', interpretiveScope: 'Традиционная символическая тема 5-го дома потомства/созидания и 9-го как продолжения дхармы; Юпитер рассматривается как путра-карака в классическом подходе.', limitations: ['Не диагностирует фертильность и не прогнозирует зачатие, беременность, исход лечения или число детей.', 'Медицинские выводы делаются только на основании медицинских данных.'] },
  { division: 9, name: 'D9 — Навамша', sanskritName: 'Navamsha', topic: 'Отношения, брак и дхарма', d1Houses: [1, 7, 9], vargaHouses: [1, 7, 9], karakas: ['Venus', 'Jupiter'], calculationRule: 'Парашари Навамша: подвижные знаки начинают с себя, неподвижные — с 9-го, двойственные — с 5-го.', interpretiveScope: 'Уточняет 7-й дом союза и договорённостей, 9-й дом дхармы и достоинство/устойчивость планет в связке с D1.', limitations: ['Не выносит вердикт о разводе, верности, совместимости или гарантированном браке.', 'Гендерно-различающиеся караки и альтернативные школы не включены в эту нейтральную базовую схему.'] },
  { division: 10, name: 'D10 — Дашамша', sanskritName: 'Dashamsha', topic: 'Профессия и реализация', d1Houses: [2, 6, 10, 11], vargaHouses: [2, 6, 10, 11], karakas: ['Sun', 'Saturn', 'Mercury'], calculationRule: 'Парашари Дашамша: нечётные знаки отсчитывают части от себя, чётные — от 9-го знака.', interpretiveScope: 'Уточняет 10-й дом деятельности и статуса, 6-й повседневной работы, 2-й ресурсов и 11-й результатов; сопоставляется с управителем 10-го дома D1.', limitations: ['Не определяет гарантированную профессию, должность, заработок или карьерный срок.', 'Навыки, образование, рынок труда и личный выбор не выводятся из варги.'] },
  { division: 12, name: 'D12 — Двадашамша', sanskritName: 'Dvadashamsha', topic: 'Род и родители', d1Houses: [1, 4, 9], vargaHouses: [1, 4, 9], karakas: ['Sun', 'Moon'], calculationRule: 'Парашари Двадашамша: двенадцать 2°30′ частей отсчитываются от исходного знака.', interpretiveScope: 'Используется для символического анализа родительских и родовых тем в сопоставлении с 4-м и 9-м домами D1.', limitations: ['Не устанавливает биографию, характер, здоровье или поступки родителей и родственников.', 'Различные школы по-разному распределяют материнские и отцовские сигнификаторы.'] },
  { division: 16, name: 'D16 — Шодашамша', sanskritName: 'Shodashamsha', topic: 'Комфорт и транспорт', d1Houses: [4, 12], vargaHouses: [4, 12], karakas: ['Venus', 'Moon'], calculationRule: 'Парашари Шодашамша: части начинаются от Овна для подвижных, Льва для неподвижных и Стрельца для двойственных знаков.', interpretiveScope: 'Уточняет комфорт, удобства и средства передвижения через 4-й и 12-й дома и их управителей.', limitations: ['Не оценивает техническую исправность и безопасность транспорта.', 'Не является предсказанием аварий, владения автомобилем или конкретного уровня комфорта.'] },
  { division: 20, name: 'D20 — Вимшамша', sanskritName: 'Vimshamsha', topic: 'Духовные практики', d1Houses: [5, 9, 12], vargaHouses: [5, 9, 12], karakas: ['Jupiter', 'Ketu'], calculationRule: 'Парашари Вимшамша: части начинаются от Овна для подвижных, Стрельца для неподвижных и Льва для двойственных знаков.', interpretiveScope: 'Символический анализ практики, обучения традиции и уединения через 5-й, 9-й и 12-й дома.', limitations: ['Не измеряет духовность, нравственность, религиозность или психологическое состояние.', 'Не подтверждает принадлежность к традиции и не оценивает качество учителя.'] },
  { division: 24, name: 'D24 — Сиддхамша', sanskritName: 'Siddhamsha', topic: 'Образование и знания', d1Houses: [4, 5, 9], vargaHouses: [4, 5, 9], karakas: ['Mercury', 'Jupiter'], calculationRule: 'Парашари Сиддхамша: нечётные знаки начинают с Льва, чётные — с Рака.', interpretiveScope: 'Дополняет анализ обучения и усвоения знаний через 4-й, 5-й и 9-й дома, Меркурий и Юпитер.', limitations: ['Не заменяет реальные результаты обучения, экзамены, квалификацию или подтверждённые навыки.', 'Не предсказывает поступление или академические достижения.'] },
  { division: 27, name: 'D27 — Бхамша', sanskritName: 'Bhamsha', topic: 'Качества и устойчивость', d1Houses: [1, 3, 6, 10], vargaHouses: [1, 3, 6, 10], karakas: ['Sun', 'Mars', 'Saturn'], calculationRule: 'Парашари Бхамша: начало зависит от стихии исходного знака — Овен, Рак, Весы или Козерог для огня, земли, воздуха и воды соответственно.', interpretiveScope: 'Традиционный дополнительный слой для рассмотрения устойчивости и способности справляться с нагрузкой; сопоставляется с 1-м, 3-м, 6-м и 10-м домами D1.', limitations: ['Не является психометрическим тестом или объективной шкалой силы характера.', 'Не диагностирует физическое или психическое здоровье и не предсказывает способность переносить стресс.'] },
];

export interface VargaHouseEvidence {
  house: number;
  sign: string;
  lord: string;
  lordHouse: number | null;
  occupants: string[];
}

export interface VargaPlanetComparison {
  planet: string;
  d1Sign: string;
  d1House: number;
  vargaSign: string;
  vargaHouse: number;
  role: 'd1-house-lord' | 'karaka';
}

export interface VargaAnalysis {
  division: number;
  name: string;
  topic: string;
  calculationRule: string;
  interpretiveScope: string;
  d1Evidence: VargaHouseEvidence[];
  vargaEvidence: VargaHouseEvidence[];
  comparisons: VargaPlanetComparison[];
  boundarySensitivity: {
    segmentWidthDegrees: number;
    distanceToNearestAscendantBoundary: number;
    risk: 'high' | 'moderate' | 'lower';
  };
  limitations: string[];
  methodology: string[];
}

export interface DivisionalAnalysisReport {
  baseChart: {
    ascendantSign: string;
    ascendantDegree: number;
    evidence: VargaHouseEvidence[];
    principle: string;
  };
  analyses: VargaAnalysis[];
  warnings: string[];
}

function houseEvidence(chart: DivisionalChart, house: number): VargaHouseEvidence {
  const ascSign = Math.floor(chart.ascendant.longitude / 30);
  const signIndex = (ascSign + house - 1) % 12;
  const lord = SIGN_LORDS[signIndex];
  const lordPosition = chart.planets[lord];
  return {
    house,
    sign: SIGN_NAMES_RU[signIndex],
    lord: PLANET_NAMES_RU[lord],
    lordHouse: lordPosition?.house ?? null,
    occupants: Object.entries(chart.planets)
      .filter(([, position]) => position.house === house)
      .map(([planet]) => PLANET_NAMES_RU[planet] ?? planet),
  };
}

function unique(values: number[]): number[] {
  return [...new Set(values)];
}

function boundarySensitivity(chart: DivisionalChart, division: number): VargaAnalysis['boundarySensitivity'] {
  const segmentWidthDegrees = 30 / division;
  const degreeInSign = chart.ascendant.longitude % 30;
  const offset = degreeInSign % segmentWidthDegrees;
  const distanceToNearestAscendantBoundary = Math.min(offset, segmentWidthDegrees - offset);
  return {
    segmentWidthDegrees,
    distanceToNearestAscendantBoundary,
    risk: distanceToNearestAscendantBoundary < 0.05 ? 'high'
      : distanceToNearestAscendantBoundary < 0.2 ? 'moderate' : 'lower',
  };
}

/**
 * Builds an evidence-first Parashari varga reading. It never produces a
 * positive/negative score or a deterministic prediction: it lays out D1
 * anchors, varga houses, and the same planets' placements side by side.
 */
export function analyzeDivisionalCharts(chart: NatalChart): DivisionalAnalysisReport {
  const charts = calculateAllDivisionalCharts(chart.planets, chart.ascendant.siderealLon);
  const byDivision = new Map(charts.map((item) => [item.division, item]));
  const d1 = byDivision.get(1);
  if (!d1) throw new Error('Не удалось построить базовую карту D1');

  const d1Rule = VARGA_ANALYSIS_RULES.find((rule) => rule.division === 1)!;
  const baseChart = {
    ascendantSign: d1.ascendant.signName,
    ascendantDegree: d1.ascendant.longitude % 30,
    evidence: d1Rule.d1Houses.map((house) => houseEvidence(d1, house)),
    principle: 'D1 — исходная карта. Сначала формулируется тема по домам, управителям и планетам D1; соответствующая варга используется только как дополнительная проверка и детализация.',
  };

  const analyses = VARGA_ANALYSIS_RULES.filter((rule) => rule.division !== 1).map((rule) => {
    const varga = byDivision.get(rule.division);
    if (!varga || varga.calculationRule !== 'specific') {
      throw new Error(`Для D${rule.division} отсутствует отдельное правило расчёта`);
    }
    const d1Evidence = unique(rule.d1Houses).map((house) => houseEvidence(d1, house));
    const vargaEvidence = unique(rule.vargaHouses).map((house) => houseEvidence(varga, house));
    const comparisons = new Map<string, VargaPlanetComparison>();

    for (const item of d1Evidence) {
      const d1Lord = SIGN_LORDS[(Math.floor(d1.ascendant.longitude / 30) + item.house - 1) % 12];
      const d1Position = d1.planets[d1Lord];
      const vargaPosition = varga.planets[d1Lord];
      if (d1Position && vargaPosition) {
        comparisons.set(d1Lord, {
          planet: PLANET_NAMES_RU[d1Lord],
          d1Sign: d1Position.signName,
          d1House: d1Position.house,
          vargaSign: vargaPosition.signName,
          vargaHouse: vargaPosition.house,
          role: 'd1-house-lord',
        });
      }
    }
    for (const karaka of rule.karakas) {
      const d1Position = d1.planets[karaka];
      const vargaPosition = varga.planets[karaka];
      if (d1Position && vargaPosition) {
        comparisons.set(karaka, {
          planet: PLANET_NAMES_RU[karaka],
          d1Sign: d1Position.signName,
          d1House: d1Position.house,
          vargaSign: vargaPosition.signName,
          vargaHouse: vargaPosition.house,
          role: 'karaka',
        });
      }
    }

    const sensitivity = boundarySensitivity(varga, rule.division);
    const limitations = [...rule.limitations];
    if (sensitivity.risk !== 'lower') {
      limitations.push('Асцендент дробной карты находится близко к границе сегмента; небольшая ошибка времени рождения может изменить Лагну и дома этой варги.');
    }
    limitations.push('Приложение не хранит оценку достоверности исходного времени рождения; точность Лагны варги нельзя подтвердить автоматически.');
    return {
      division: rule.division,
      name: rule.name,
      topic: rule.topic,
      calculationRule: rule.calculationRule,
      interpretiveScope: rule.interpretiveScope,
      d1Evidence,
      vargaEvidence,
      comparisons: [...comparisons.values()],
      boundarySensitivity: sensitivity,
      limitations,
      methodology: [
        'Зодиак: сидерический, аянамша Lahiri.',
        'Дома: Whole Sign от Асцендента соответствующей карты.',
        'Сопоставление не является суммарным баллом: положения D1 и варги показываются рядом без автоматического вывода «хорошо/плохо».',
      ],
    } satisfies VargaAnalysis;
  });

  return {
    baseChart,
    analyses,
    warnings: [
      'Правила расчёта реализованы в выбранной Парашари-схеме; другие школы и варианты варг не объединяются.',
      'Все варги используют исходные сидерические долготы; ошибка времени рождения особенно сильно влияет на Асцендент и дома дробных карт.',
      'Символическая астрологическая интерпретация не является научно подтверждённым прогнозом и не заменяет медицинские, финансовые, юридические или профессиональные решения.',
    ],
  };
}
