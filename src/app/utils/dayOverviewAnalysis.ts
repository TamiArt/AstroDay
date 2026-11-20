import type { NatalChart } from './astrology';
import type { TransitAnalysisReport, TransitHousePosition, TransitNatalAspect, TransitHouseLordHit } from './transitAnalysis';

export type DayLifeAreaId =
  | 'finances' | 'career' | 'creativity' | 'relationships'
  | 'family' | 'children' | 'health' | 'communication';

export interface DayLifeAreaDefinition {
  id: DayLifeAreaId;
  title: string;
  icon: string;
  houses: number[];
  description: string;
  houseMeanings: string[];
  practicalFocus: string;
  recommendations: string[];
  limitation?: string;
}

export interface NatalHouseLordDetail {
  house: number;
  sign: string;
  lord: string;
  lordName: string;
  lordSign: string;
  lordDegree: number;
  lordHouse: number | null;
}

export interface DayLifeAreaAnalysis {
  definition: DayLifeAreaDefinition;
  natalBasis: NatalHouseLordDetail[];
  transitPositions: TransitHousePosition[];
  aspects: TransitNatalAspect[];
  lordHits: TransitHouseLordHit[];
  evidenceCount: number;
  narrative: string;
  natalSummary: string;
  activationSummary: string;
}

const PLANET_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

export const DAY_LIFE_AREAS: DayLifeAreaDefinition[] = [
  {
    id: 'finances', title: 'Финансы и личный заработок', icon: '💰', houses: [1, 2, 10, 11],
    description: 'Личные деньги, накопления, профессиональная деятельность, клиенты, прибыль и результаты собственных усилий.',
    houseMeanings: [
      '1-й дом — личные способности и самостоятельная реализация',
      '2-й дом — личный заработок, накопления и финансовая устойчивость',
      '10-й дом — профессия, карьера и деятельность',
      '11-й дом — прибыль, доходы, клиенты и аудитория',
    ],
    practicalFocus: 'Сопоставляйте финансовые идеи с реальными цифрами, условиями и ресурсами. Астрологическая символика может подсказать тему для размышления, но не оценивает доходность и риски.',
    recommendations: ['Проверьте текущие расходы и обязательные платежи', 'Оцените, какие профессиональные навыки или проекты можно развивать', 'Перед покупкой, вложением или договорённостью сравните условия и риски'],
    limitation: 'Не принимайте инвестиционные и другие значимые финансовые решения на основании астрологического прогноза.',
  },
  {
    id: 'career', title: 'Работа, карьера и профессиональное развитие', icon: '💼', houses: [1, 6, 10, 11],
    description: 'Личные компетенции, ежедневная работа, обязанности, профессия, репутация и профессиональные результаты.',
    houseMeanings: [
      '1-й дом — личная компетентность и самостоятельные действия',
      '6-й дом — ежедневная работа, задачи, обязанности и решение проблем',
      '10-й дом — профессия, карьера и ответственность',
      '11-й дом — результаты усилий, профессиональные связи и доходы',
    ],
    practicalFocus: 'Посмотрите, какие задачи требуют концентрации, последовательности и проверки деталей. Полезно отделять факты от предположений и заранее определять критерии готовности.',
    recommendations: ['Выберите одну приоритетную рабочую задачу', 'Разбейте крупную задачу на конкретные шаги и критерии готовности', 'Важные договорённости и сроки зафиксируйте письменно'],
    limitation: 'Астрологические показатели не гарантируют трудоустройство, повышение или профессиональный успех.',
  },
  {
    id: 'creativity', title: 'Творчество, авторские проекты и самореализация', icon: '🎨', houses: [3, 5, 10, 11],
    description: 'Практические навыки, рисование и создание контента, авторские идеи, собственные проекты, аудитория и монетизация.',
    houseMeanings: [
      '3-й дом — практические навыки, рисование, коммуникация и создание контента',
      '5-й дом — творчество, авторство, идеи и увлечения',
      '10-й дом — превращение таланта и навыков в профессию',
      '11-й дом — аудитория, отклик, продажи и прибыль',
    ],
    practicalFocus: 'Переведите творческую идею в небольшой законченный результат. Полезно не только генерировать идеи, но и дорабатывать композицию, технику или подачу.',
    recommendations: ['Создайте или доработайте один фрагмент проекта', 'Продумайте персонажа, серию, композицию или новый творческий приём', 'Сохраните готовую работу и отметьте следующий шаг для публикации или развития'],
    limitation: 'Творческая продуктивность зависит также от времени, условий, навыков и самочувствия.',
  },
  {
    id: 'relationships', title: 'Любовь, отношения и партнёрство', icon: '💕', houses: [7, 2, 8, 11],
    description: 'Брак, близкие отношения, партнёрство, семейные ценности, доверие, общие ресурсы и совместные планы.',
    houseMeanings: [
      '7-й дом — брак, супруг, партнёрство и договорённости',
      '2-й дом — семья, общие ценности и семейный уклад',
      '8-й дом — общие ресурсы, обязательства и глубокие перемены',
      '11-й дом — совместные планы, ожидания и долгосрочные цели',
    ],
    practicalFocus: 'Проясняйте ожидания и обсуждайте совместные решения без поспешных выводов. Лучше уточнить, что именно каждый имеет в виду, чем додумывать за партнёра.',
    recommendations: ['Выделите время на спокойный разговор', 'Уточните ожидания и распределение обязанностей', 'Финансовые и бытовые договорённости обсуждайте конкретно'],
    limitation: 'Транзиты не определяют чувства другого человека и не предсказывают брак или расставание.',
  },
  {
    id: 'family', title: 'Семья, дом и личное пространство', icon: '🏡', houses: [4, 2, 5, 12],
    description: 'Дом, жильё, близкие, семейные ценности, дети, личное пространство, отдых и восстановление.',
    houseMeanings: [
      '4-й дом — дом, жильё, семья и внутренняя опора',
      '2-й дом — семейные ценности и уклад',
      '5-й дом — дети, забота и совместные радости',
      '12-й дом — уединение, отдых и личное пространство',
    ],
    practicalFocus: 'Поддерживайте устойчивость быта и распределяйте домашние задачи реалистично. Необязательно решать всё сразу — выберите то, что действительно важно.',
    recommendations: ['Выберите одну важную домашнюю задачу', 'Обсудите распределение бытовых обязанностей', 'Оставьте время на комфорт, отдых и личное пространство'],
    limitation: 'Астрологическая трактовка не заменяет юридическую, финансовую или техническую проверку вопросов жилья.',
  },
  {
    id: 'children', title: 'Дети, материнство и будущее семьи', icon: '🌱', houses: [5, 9, 2, 7],
    description: 'Дети и родительство, семейные планы, поддержка партнёров и долгосрочные ценности семьи.',
    houseMeanings: [
      '5-й дом — дети, родительство и тема продолжения семьи',
      '9-й дом — развитие, мировоззрение и поддержка',
      '2-й дом — семья и семейная преемственность',
      '7-й дом — супружеское партнёрство и совместные решения',
    ],
    practicalFocus: 'Можно уделить внимание совместным планам, семейным ценностям и тому, какая практическая поддержка нужна каждому.',
    recommendations: ['Обсудите долгосрочные семейные планы', 'Подумайте, какая поддержка нужна каждому из партнёров', 'Запишите вопросы, которые важно обсудить вместе'],
    limitation: 'Астрология не оценивает возможность зачатия, фертильность, течение беременности или необходимость лечения. Медицинские вопросы решаются с врачом.',
  },
  {
    id: 'health', title: 'Здоровье, энергия и самочувствие', icon: '🌿', houses: [1, 6, 8, 12],
    description: 'Жизненный тонус, повседневная нагрузка, режим, сон, отдых и восстановление.',
    houseMeanings: [
      '1-й дом — общий жизненный тонус и самовосприятие',
      '6-й дом — повседневная нагрузка, обязанности и режим',
      '8-й дом — глубокие изменения и восстановление',
      '12-й дом — сон, отдых и уединение',
    ],
    practicalFocus: 'Соотносите планы с реальным самочувствием и не перегружайте расписание. Астрологическая символика не может оценить медицинское состояние.',
    recommendations: ['Распределите нагрузку с учётом самочувствия', 'Сохраните привычный режим сна и отдыха', 'При необходимости перенесите необязательные дела'],
    limitation: 'Раздел не диагностирует заболевания, не предсказывает осложнения и не заменяет медицинские рекомендации.',
  },
  {
    id: 'communication', title: 'Общение, друзья и окружение', icon: '💬', houses: [3, 7, 9, 11],
    description: 'Общение, личные и деловые контакты, обучение у других, наставники, друзья и сообщества.',
    houseMeanings: [
      '3-й дом — повседневное общение, навыки и инициативы',
      '7-й дом — личные и деловые контакты, взаимодействие один на один',
      '9-й дом — наставники, обучение и обмен мировоззрением',
      '11-й дом — друзья, сообщества и полезные знакомства',
    ],
    practicalFocus: 'Поддерживайте значимые контакты и формулируйте мысли ясно. При обсуждении общих задач полезно уточнять, одинаково ли стороны поняли договорённости.',
    recommendations: ['Ответьте на важные сообщения', 'Обменяйтесь опытом с человеком из вашей сферы', 'При обсуждении задачи уточните договорённости и следующие шаги'],
    limitation: 'Наличие астрологических факторов не означает, что встреча, знакомство или конкретный разговор обязательно состоятся.',
  },
];

function planetName(key: string): string {
  return PLANET_NAMES[key] ?? key;
}

function houseOfPlanet(chart: NatalChart, planetKey: string): number | null {
  const position = chart.planets[planetKey as keyof NatalChart['planets']];
  if (!position || !chart.houses) return null;
  return chart.houses.find((house) => house.sign === position.sign)?.house ?? null;
}

function buildNatalBasis(chart: NatalChart, definition: DayLifeAreaDefinition): NatalHouseLordDetail[] {
  return definition.houses.flatMap((houseNumber) => {
    const house = chart.houses?.find((item) => item.house === houseNumber);
    if (!house) return [];
    const lordPosition = chart.planets[house.lord as keyof NatalChart['planets']];
    if (!lordPosition) return [];
    return [{
      house: houseNumber,
      sign: house.signName,
      lord: house.lord,
      lordName: planetName(house.lord),
      lordSign: lordPosition.signName,
      lordDegree: lordPosition.degree,
      lordHouse: houseOfPlanet(chart, house.lord),
    }];
  });
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function buildAreaNarrative(
  definition: DayLifeAreaDefinition,
  positions: TransitHousePosition[],
  aspects: TransitNatalAspect[],
  lordHits: TransitHouseLordHit[],
): string {
  const parts: string[] = [];
  if (positions.length) {
    const positionText = positions.map((item) =>
      `${item.planetName} в ${item.sign}, ${item.degree.toFixed(2)}° проходит по натальному ${item.natalHouse}-му дому`,
    );
    parts.push(`На выбранную дату ${positionText.join('; ')}. Эти дома связаны с темами «${definition.title.toLowerCase()}».`);
  }
  if (aspects.length) {
    const aspectText = aspects.map((item) =>
      `${planetName(item.transitPlanet)} образует аспект «${item.aspect}» к натальному ${planetName(item.natalPlanet)} (орбис ${item.orb.toFixed(2)}°)`,
    );
    parts.push(`Также обнаружены точные связи: ${aspectText.join('; ')}.`);
  }
  if (lordHits.length) {
    const hitText = unique(lordHits.map((item) => item.detail));
    parts.push(`Связь с управителями домов: ${hitText.join(' ')}`);
  }
  if (!parts.length) {
    return 'На выбранную дату по применяемым критериям не найдено отдельных транзитных активаций этих домов или их управителей. Это не означает, что в этой сфере не может происходить ничего важного.';
  }
  return parts.join(' ');
}

export function buildDayLifeAreaAnalyses(
  natalChart: NatalChart,
  report: TransitAnalysisReport,
): DayLifeAreaAnalysis[] {
  return DAY_LIFE_AREAS.map((definition) => {
    const natalBasis = buildNatalBasis(natalChart, definition);
    const lords = unique(natalBasis.map((item) => item.lord));
    const lordHouseSet = new Set(definition.houses);
    const transitPositions = report.positions.filter((item) => definition.houses.includes(item.natalHouse));
    const aspects = report.aspects.filter((item) =>
      definition.houses.includes(item.transitHouse)
      || (item.natalHouse !== null && definition.houses.includes(item.natalHouse))
      || lords.includes(item.natalPlanet),
    );
    const lordHits = report.houseLordHits.filter((item) => lordHouseSet.has(item.house));
    const evidenceCount = transitPositions.length + aspects.length + lordHits.length;
    const lordSummary = natalBasis.map((item) =>
      `${item.house}-й дом в ${item.sign}: управитель ${item.lordName}${item.lordHouse ? ` расположен в ${item.lordHouse}-м доме` : ''} (${item.lordSign}, ${item.lordDegree.toFixed(2)}°)`,
    );
    return {
      definition,
      natalBasis,
      transitPositions,
      aspects,
      lordHits,
      evidenceCount,
      narrative: buildAreaNarrative(definition, transitPositions, aspects, lordHits),
      natalSummary: lordSummary.length
        ? `Натальная основа: ${lordSummary.join('; ')}.`
        : 'Данные натальных домов или управителей для этой сферы недоступны.',
      activationSummary: evidenceCount
        ? `Найдено расчётных оснований: ${evidenceCount} (положения транзитов: ${transitPositions.length}, аспекты: ${aspects.length}, связи с управителями: ${lordHits.length}).`
        : 'Отдельные транзитные основания по выбранным критериям не найдены.',
    };
  });
}

export function countAreaEvidence(area: DayLifeAreaAnalysis): number {
  return area.evidenceCount;
}
