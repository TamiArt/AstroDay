import { calculateDasha, getCurrentAntardasha, getPlanetHouse, type NatalChart } from './astrology';
import { calculateDivisionalChart } from './divisionalCharts';

export interface PlanetEvidence {
  name: string;
  sign: string;
  house: number;
  nakshatra: string;
  pada: number;
}

export interface PersonalizedHouseInsight {
  house: number;
  sign: string;
  lord: string;
  lordHouse: number | null;
  lordSign: string | null;
  lordNakshatra: string | null;
  occupants: PlanetEvidence[];
  interpretation: string;
  practicalActions: string[];
  watchouts: string[];
  evidence: string[];
}

export interface LifeTopicInsight {
  id: 'talents' | 'money' | 'career' | 'children' | 'relationships';
  title: string;
  houses: number[];
  interpretation: string;
  directions: string[];
  actions: string[];
  evidence: string[];
  timingNote: string;
}

const PLANET_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const SIGN_RU: Record<string, string> = {
  Aries: 'Овен', Taurus: 'Телец', Gemini: 'Близнецы', Cancer: 'Рак',
  Leo: 'Лев', Virgo: 'Дева', Libra: 'Весы', Scorpio: 'Скорпион',
  Sagittarius: 'Стрелец', Capricorn: 'Козерог', Aquarius: 'Водолей', Pisces: 'Рыбы',
};

const PLANET_THEMES: Record<string, string> = {
  Sun: 'самостоятельность, лидерство, ответственность и видимый результат',
  Moon: 'забота, адаптация, память, питание и понимание потребностей людей',
  Mars: 'техническое действие, инженерный подход, конкуренция и решение сложных задач',
  Mercury: 'аналитика, языки, данные, обучение, коммуникация и цифровые инструменты',
  Jupiter: 'обучение, наставничество, широкая экспертиза и консультирование',
  Venus: 'эстетика, дизайн, музыка, искусство, комфорт и гармония',
  Saturn: 'системность, дисциплина, контроль качества, процессы и долгосрочное мастерство',
  Rahu: 'технологии, цифровая среда, эксперименты и нестандартные профессиональные траектории',
  Ketu: 'исследование, концентрация, специализация и самостоятельная глубокая работа',
};

const HOUSE_ACTIONS: Record<number, string[]> = {
  1: ['Выберите одну личную цель на ближайшие 90 дней и фиксируйте прогресс раз в неделю.', 'Проверяйте новые роли через небольшой практический проект, а не через абстрактное самоопределение.'],
  2: ['Составьте список навыков, за которые уже платят на рынке, и отметьте те, которые вы можете подтвердить примерами.', 'Раз в месяц пересматривайте бюджет, накопления и стоимость своего труда.'],
  3: ['Развивайте навык регулярно объяснять сложные вещи простым языком.', 'Запустите небольшой самостоятельный проект: заметки, блог, учебный материал или технический эксперимент.'],
  4: ['Создайте дома устойчивое рабочее место и ритуал восстановления.', 'Поддерживайте базу знаний и семейные договорённости, которые дают ощущение опоры.'],
  5: ['Выберите одно творческое занятие на 6 недель: музыка, рисунок, письмо, дизайн или кулинарный эксперимент.', 'Проверяйте творческие способности регулярной практикой и собственными работами, а не ожиданием вдохновения.'],
  6: ['Выстройте повторяемый рабочий процесс и чек-листы качества.', 'Разбейте большую задачу на короткие ежедневные шаги и отслеживайте результат.'],
  7: ['Обсуждайте ожидания и распределение ответственности до того, как возникнет конфликт.', 'Ищите проекты и сотрудничество, где роли и критерии результата определены заранее.'],
  8: ['Развивайте навыки исследования, проверки рисков и работы с конфиденциальной информацией.', 'Создайте финансовый резерв и заранее обсуждайте общие обязательства.'],
  9: ['Выберите одну область знаний для углублённого обучения и доведите курс или программу до результата.', 'Проверяйте идеи на практике и сравнивайте разные школы и источники.'],
  10: ['Соберите портфолио из 2–3 измеримых результатов и регулярно обновляйте его.', 'Выберите профессиональное направление и составьте план роста компетенций на квартал.'],
  11: ['Развивайте профессиональные связи через полезные публикации, сообщества и совместные проекты.', 'Отслеживайте, какие контакты и каналы реально приводят к возможностям, а не только к активности.'],
  12: ['Защищайте время на отдых, уединённую работу и восстановление.', 'Используйте дневник, планирование и ограничение информационного шума, чтобы не терять фокус.'],
};

const HOUSE_MEANING: Record<number, string> = {
  1: 'личная стратегия, самоощущение и способ начинать новое',
  2: 'личные ресурсы, деньги, накопления, речь и навыки',
  3: 'обучение через практику, коммуникация, инициативы и самостоятельные проекты',
  4: 'дом, эмоциональная опора, образование и личное пространство',
  5: 'творчество, интеллект, увлечения, романтика и тема детей',
  6: 'повседневная работа, служение, навыки, дисциплина и решение проблем',
  7: 'партнёрство, договорённости, клиенты и сотрудничество',
  8: 'совместные ресурсы, перемены, исследование и управление рисками',
  9: 'высшее обучение, мировоззрение, наставники и дальние горизонты',
  10: 'профессия, ответственность, статус и общественная реализация',
  11: 'доходы от деятельности, аудитория, профессиональные сети и долгосрочные цели',
  12: 'уединение, восстановление, закулисная работа и завершение циклов',
};

const TOPIC_CONFIG: Array<{
  id: LifeTopicInsight['id'];
  title: string;
  houses: number[];
  directions: Record<string, string>;
  actions: string[];
}> = [
  {
    id: 'talents',
    title: 'Таланты, обучение и творчество',
    houses: [3, 5, 9],
    directions: {
      Mercury: 'аналитика, IT, тестирование, программирование, работа с данными и обучение',
      Venus: 'музыка, рисунок, визуальный дизайн, эстетика и творческие ремёсла',
      Moon: 'кулинария, забота, работа с комфортом и пониманием человеческих потребностей',
      Saturn: 'системное обучение, методики, документация, контроль качества и длительные проекты',
      Mars: 'технические эксперименты, инженерные задачи и практическое создание',
      Jupiter: 'преподавание, наставничество, исследование и передача знаний',
      Rahu: 'цифровые технологии, новые инструменты и экспериментальные форматы',
      Ketu: 'узкая специализация, исследовательская работа и глубокое погружение',
      Sun: 'публичное самовыражение, организация и лидерство в творческих проектах',
    },
    actions: ['Проведите 6-недельный эксперимент в двух разных направлениях и сравните интерес, качество результата и желание продолжать.', 'Сохраните результаты в небольшом портфолио, чтобы опираться не только на символическую трактовку карты.'],
  },
  {
    id: 'money',
    title: 'Деньги и источники дохода',
    houses: [2, 10, 11],
    directions: {
      Mercury: 'интеллектуальные услуги, IT, аналитика, тестирование, документация и работа с данными',
      Venus: 'дизайн, визуальные продукты, красота, искусство и сервис',
      Saturn: 'долгосрочные проекты, качество, процессы, администрирование и системная экспертиза',
      Mars: 'техническая реализация, инженерные и операционные задачи',
      Jupiter: 'обучение, консультации, экспертные услуги и управление знаниями',
      Moon: 'сервис, питание, забота, клиентский опыт и сферы повседневных потребностей',
      Rahu: 'цифровые продукты, технологические ниши и нестандартные каналы',
      Ketu: 'специализированные экспертные задачи и исследовательская работа',
      Sun: 'управление, личный бренд и роли с высокой ответственностью',
    },
    actions: ['Сопоставьте карту навыков с вакансиями и реальными ставками рынка.', 'Выберите один навык с понятным спросом, создайте доказательство компетенции и проверьте его на рынке.', 'Не принимайте инвестиционные или карьерные решения только по астрологической трактовке.'],
  },
  {
    id: 'career',
    title: 'Профессия и карьера',
    houses: [6, 10, 11],
    directions: {
      Mercury: 'QA, аналитика, разработка, системный анализ и коммуникация между командами',
      Saturn: 'процессы, надёжность, тестирование, управление качеством и сложные долгие проекты',
      Mars: 'инженерия, техническое решение проблем и активная реализация',
      Venus: 'дизайн, продуктовый опыт, визуальная коммуникация и работа с клиентами',
      Jupiter: 'экспертность, обучение, консультации и руководство',
      Rahu: 'технологические продукты, автоматизация и новые цифровые направления',
      Moon: 'пользовательские сервисы, поддержка, исследование потребностей и клиентский опыт',
      Sun: 'руководство, ответственность и публичная профессиональная роль',
      Ketu: 'специализированная экспертная работа и диагностика сложных проблем',
    },
    actions: ['Проверьте выбранную специализацию на реальных задачах и обратной связи.', 'Соберите портфолио, измеримые результаты и план развития на 90 дней.'],
  },
  {
    id: 'children',
    title: 'Дети и родительство',
    houses: [5],
    directions: {
      Jupiter: 'традиционно рассматривается как один из сигнификаторов детей, заботы, наставничества и передачи знаний',
      Moon: 'символически связан с заботой, эмоциональной включённостью и повседневным уходом',
      Venus: 'может добавлять тему близости, мягкости, творчества и удовольствия от совместных занятий',
      Saturn: 'в традиционной трактовке акцентирует ответственность, терпение и необходимость реалистичного планирования',
      Mars: 'может символизировать активность, решительность и потребность в конструктивном распределении энергии',
      Mercury: 'связывает тему детей с обучением, общением, любознательностью и развитием навыков',
      Sun: 'подчёркивает тему ответственности, примера и передачи ценностей',
      Rahu: 'может указывать на нестандартные переживания или подходы; это не прогноз медицинских событий',
      Ketu: 'предлагает осторожную, нефаталистичную трактовку темы и личных ожиданий',
    },
    actions: ['Обсудите с партнёром практическую готовность, поддержку и распределение ответственности.', 'Медицинские вопросы фертильности, сроков зачатия и беременности решайте с врачом; карта не определяет число детей или дату беременности.'],
  },
  {
    id: 'relationships',
    title: 'Отношения и партнёрство',
    houses: [7],
    directions: {
      Venus: 'близость, гармония, эстетика и способы проявления привязанности',
      Jupiter: 'общие ценности, поддержка, обучение друг у друга и долгосрочные ориентиры',
      Saturn: 'надёжность, обязательства, границы и ответственность',
      Mars: 'инициатива, прямота, страсть и управление конфликтами',
      Mercury: 'диалог, ясность договорённостей и интеллектуальная совместимость',
      Moon: 'эмоциональная безопасность и повседневная забота',
      Sun: 'уважение индивидуальности и баланс лидерства',
      Rahu: 'необычные сценарии знакомства и необходимость ясных договорённостей',
      Ketu: 'личное пространство и осознанность в ожиданиях',
    },
  },
];

function getPlanetHouse(chart: NatalChart, planetName: string): number | null {
  const planet = chart.planets[planetName as keyof NatalChart['planets']];
  if (!planet || !chart.houses) return null;
  return getPlanetHouse(planet.sign, chart.houses);
}

function toEvidence(name: string, chart: NatalChart): PlanetEvidence {
  const planet = chart.planets[name as keyof NatalChart['planets']];
  return {
    name: PLANET_RU[name] ?? name,
    sign: SIGN_RU[planet.signName] ?? planet.signName,
    house: getPlanetHouse(chart, name) ?? 0,
    nakshatra: planet.nakshatraName,
    pada: planet.pada,
  };
}

function formatPlanetEvidence(item: PlanetEvidence): string {
  return `${item.name} в ${item.sign}, ${item.house}-м доме; накшатра ${item.nakshatra}, пада ${item.pada}`;
}

function getLordHouseMeaning(house: number): string {
  return HOUSE_MEANING[house] ?? 'сфера дома';
}

export function analyzePersonalizedHouses(chart: NatalChart): PersonalizedHouseInsight[] {
  if (!chart.houses?.length) return [];

  return chart.houses.map((house) => {
    const lord = chart.planets[house.lord as keyof NatalChart['planets']];
    const lordHouse = lord ? getPlanetHouse(chart, house.lord) : null;
    const occupants = Object.keys(chart.planets)
      .filter((name) => getPlanetHouse(chart, name) === house.house)
      .map((name) => toEvidence(name, chart));
    const lordEvidence = lord ? toEvidence(house.lord, chart) : null;
    const sign = SIGN_RU[house.signName] ?? house.signName;
    const interpretation = lordHouse
      ? `В традиционной Джйотиш этот дом связан с темой: ${HOUSE_MEANING[house.house]}. В твоей карте он начинается в знаке ${sign}. Управитель — ${PLANET_RU[house.lord] ?? house.lord}; он расположен в ${lordHouse}-м доме (${getLordHouseMeaning(lordHouse)}). Поэтому темы этих двух домов стоит рассматривать вместе: решения и опыт в сфере «${getLordHouseMeaning(lordHouse)}» символически связываются с темой этого дома.`
      : `Дом в знаке ${sign}; положение его управителя в доступных данных определить не удалось. Общая тема: ${HOUSE_MEANING[house.house]}.`;

    const evidence = [
      `Знак дома: ${sign}`,
      `Управитель: ${PLANET_RU[house.lord] ?? house.lord}${lordEvidence ? ` — ${formatPlanetEvidence(lordEvidence)}` : ''}`,
      occupants.length ? `Планеты в доме: ${occupants.map((item) => formatPlanetEvidence(item)).join('; ')}` : 'В доме нет планет; интерпретация опирается прежде всего на знак и управителя.',
    ];

    const planetThemes = [house.lord, ...occupants.map((item) => Object.keys(PLANET_RU).find((key) => PLANET_RU[key] === item.name) ?? '')]
      .filter(Boolean)
      .map((name) => `${PLANET_RU[name] ?? name}: ${PLANET_THEMES[name]}`);

    return {
      house: house.house,
      sign,
      lord: PLANET_RU[house.lord] ?? house.lord,
      lordHouse,
      lordSign: lord ? SIGN_RU[lord.signName] ?? lord.signName : null,
      lordNakshatra: lord?.nakshatraName ?? null,
      occupants,
      interpretation: `${interpretation} Символические качества управителя: ${planetThemes.join('; ')}.`,
      practicalActions: HOUSE_ACTIONS[house.house] ?? [],
      watchouts: house.house === 5
        ? ['Не воспринимайте символические показатели как прогноз фертильности или гарантированное число детей.']
        : house.house === 2 || house.house === 10 || house.house === 11
          ? ['Не принимайте финансовые решения и не оценивайте доходность только по карте; проверяйте спрос, бюджет и риски.']
          : ['Не превращайте астрологическую трактовку в жёсткий сценарий: проверяйте её собственным опытом.'],
      evidence,
    };
  });
}

function getTopicPlanetNames(chart: NatalChart, houses: number[]): string[] {
  const names = new Set<string>();
  for (const houseNumber of houses) {
    const house = chart.houses?.find((item) => item.house === houseNumber);
    if (house) names.add(house.lord);
    for (const name of Object.keys(chart.planets)) {
      if (getPlanetHouse(chart, name) === houseNumber) names.add(name);
    }
  }
  return [...names];
}

function getTopicEvidence(chart: NatalChart, houses: number[]): string[] {
  return houses.map((houseNumber) => {
    const house = chart.houses?.find((item) => item.house === houseNumber);
    if (!house) return `${houseNumber}-й дом: данные недоступны`;
    const occupants = Object.keys(chart.planets).filter((name) => getPlanetHouse(chart, name) === houseNumber);
    const lordHouse = getPlanetHouse(chart, house.lord);
    return `${houseNumber}-й дом (${SIGN_RU[house.signName] ?? house.signName}): управитель ${PLANET_RU[house.lord] ?? house.lord}${lordHouse ? ` расположен в ${lordHouse}-м доме` : ''}; планеты в доме: ${occupants.length ? occupants.map((name) => PLANET_RU[name] ?? name).join(', ') : 'нет'}.`;
  });
}

export function analyzeLifeTopics(chart: NatalChart, currentDate: Date = new Date()): LifeTopicInsight[] {
  const moonNakshatra = chart.planets.Moon.nakshatra;
  const dasha = calculateDasha(chart.date, moonNakshatra, currentDate, chart.planets.Moon.siderealLon);
  const antar = getCurrentAntardasha(dasha, currentDate);
  const periodLabel = `Текущая Вимшоттари Даша по расчёту приложения: ${PLANET_RU[dasha.planet] ?? dasha.planet}${antar ? ` / Антардаша: ${PLANET_RU[antar.planet] ?? antar.planet}` : ''}.`;

  return TOPIC_CONFIG.map((topic) => {
    const planets = getTopicPlanetNames(chart, topic.houses);
    const directions = [...new Set(planets.map((name) => topic.directions[name]).filter((value): value is string => Boolean(value)))];
    const evidence = getTopicEvidence(chart, topic.houses);
    const focus = planets.map((name) => `${PLANET_RU[name] ?? name}: ${PLANET_THEMES[name]}`).join('; ');
    const timingNote = topic.id === 'children'
      ? `${periodLabel} В традиционной астрологии период рассматривают как символический контекст, но он не позволяет установить дату зачатия, количество детей или медицинский прогноз. Для планирования беременности ориентируйтесь на медицинские рекомендации.`
      : `${periodLabel} Это символический астрологический фон, а не гарантия события или лучший день для финансовой операции.`;

    return {
      id: topic.id,
      title: topic.title,
      houses: topic.houses,
      interpretation: `В анализ включены дома ${topic.houses.join(', ')}. В их управителях и планетах встречаются темы: ${focus || 'недостаточно планетных указаний для конкретизации'}. Рассматривай перечисленные направления как гипотезы для практической проверки, а не как предопределённый выбор.`,
      directions,
      actions: topic.actions,
      evidence,
      timingNote,
    };
  });
}

export function getVargaEvidence(chart: NatalChart, division: 7 | 10): string[] {
  const varga = calculateDivisionalChart(
    Object.fromEntries(Object.entries(chart.planets).map(([name, position]) => [name, position.siderealLon])),
    chart.ascendant.siderealLon,
    division,
    division === 7 ? 'D7 — Саптамша' : 'D10 — Дашамша',
    division === 7 ? 'Saptamsha' : 'Dashamsha',
    division === 7 ? 'Дети и творчество' : 'Профессия',
  );
  const relevant = division === 7 ? ['Jupiter', 'Moon', 'Venus', '5th'] : ['Sun', 'Mercury', 'Saturn', 'Mars'];
  return relevant
    .filter((name) => Boolean(varga.planets[name]))
    .map((name) => {
      const planet = varga.planets[name];
      return `${PLANET_RU[name] ?? name} в D${division}: ${SIGN_RU[planet.signName] ?? planet.signName}, ${planet.house}-й дом.`;
    });
}
