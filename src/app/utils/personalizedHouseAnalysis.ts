import { calculateDasha, getCurrentAntardasha, getPlanetHouse as resolvePlanetHouse, type NatalChart } from './astrology';
import { calculateDivisionalChart } from './divisionalCharts';
import { describeHouseDrishti, describePeriodConnection, evaluatePlanetCondition, getGrahaDrishti } from './natalStrengthAnalysis';

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
  id: 'talents' | 'money' | 'career' | 'children' | 'relationships' | 'home_family' | 'wellbeing' | 'inner_growth';
  title: string;
  houses: number[];
  interpretation: string;
  directions: string[];
  actions: string[];
  evidence: string[];
  timingNote: string;
  keyFactors: string[];
  developmentPoints: string[];
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
    id: 'home_family',
    title: 'Дом, семья и личная опора',
    houses: [4, 2],
    directions: {
      Moon: 'эмоциональная атмосфера дома, забота, семейные ритмы и чувство безопасности',
      Venus: 'создание комфортной среды, эстетика пространства и согласование бытовых потребностей',
      Saturn: 'ответственность за дом, долгосрочные обязательства, структура и устойчивые семейные правила',
      Mars: 'инициатива в решении бытовых вопросов, ремонт, защита границ и распределение нагрузки',
      Mercury: 'семейные договорённости, обучение, общение и организация повседневных дел',
      Jupiter: 'семейные ценности, поддержка, обучение и передача знаний между поколениями',
      Sun: 'роль и ответственность внутри семьи, самостоятельность и личные границы',
      Rahu: 'нестандартный формат дома или семейного уклада, адаптация к переменам',
      Ketu: 'потребность в личном пространстве и осознанное отношение к семейным ожиданиям',
    },
    actions: ['Обсуждайте бытовую нагрузку и ожидания заранее, распределяя ответственность конкретно.', 'Отслеживайте, какие условия дома действительно помогают восстанавливаться и чувствовать опору.'],
  },
  {
    id: 'wellbeing',
    title: 'Повседневный ритм, нагрузка и восстановление',
    houses: [1, 6, 8, 12],
    directions: {
      Moon: 'режим отдыха, эмоциональная регуляция и внимательность к повседневным потребностям',
      Mars: 'физическая активность, управление нагрузкой и конструктивное расходование энергии',
      Mercury: 'информационная гигиена, планирование, переключение задач и умственная нагрузка',
      Jupiter: 'обучение полезным привычкам, наставничество и расширение способов заботы о себе',
      Venus: 'удовольствие, баланс нагрузки и восстановления, комфортная среда',
      Saturn: 'регулярность, дисциплина, долгосрочные привычки и устойчивый распорядок',
      Sun: 'осознанное распределение энергии, самостоятельность и ответственность за режим',
      Rahu: 'нестандартные режимы и цифровые привычки, требующие осознанного контроля',
      Ketu: 'уединение, снижение лишних стимулов и периоды глубокой концентрации',
    },
    actions: ['Сопоставляйте нагрузку и восстановление по фактическому самочувствию, а не по символическим трактовкам.', 'При симптомах или медицинских вопросах ориентируйтесь на врача: натальная карта не диагностирует заболевания и не оценивает прогноз здоровья.'],
  },
  {
    id: 'inner_growth',
    title: 'Мировоззрение, смысл и внутреннее развитие',
    houses: [9, 12, 5],
    directions: {
      Jupiter: 'философия, обучение, наставничество и формирование системы ценностей',
      Ketu: 'созерцание, исследование, углублённая специализация и пересмотр привязанностей',
      Rahu: 'знакомство с новыми культурами, нетипичными знаниями и альтернативными подходами',
      Mercury: 'чтение, анализ идей, языки и систематизация знаний',
      Moon: 'личные смыслы, эмоциональная связь с традициями и потребность в тишине',
      Sun: 'самостоятельная позиция, личные принципы и осознанный выбор направления',
      Saturn: 'последовательная практика, дисциплина и проверка убеждений временем',
      Venus: 'искусство, эстетический опыт, отношения и ценности как источник смысла',
      Mars: 'практическое воплощение убеждений, смелость менять подход и отстаивать принципы',
    },
    actions: ['Выберите одну область знаний или практику и оценивайте её по тому, как она меняет реальные решения и поведение.', 'Сравнивайте разные источники и традиции, не принимая одну трактовку за единственно возможную.'],
  },
  {
    id: 'relationships',
    title: 'Отношения и партнёрство',
    houses: [7],
    actions: ['Обсуждайте ожидания, личные границы и распределение ответственности до возникновения конфликта.', 'Регулярно сверяйте общие цели и способы поддержки друг друга.'],
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

function getPlanetHouseForChart(chart: NatalChart, planetName: string): number | null {
  const planet = chart.planets[planetName as keyof NatalChart['planets']];
  if (!planet || !chart.houses) return null;
  return resolvePlanetHouse(planet.sign, chart.houses);
}

function toEvidence(name: string, chart: NatalChart): PlanetEvidence {
  const planet = chart.planets[name as keyof NatalChart['planets']];
  return {
    name: PLANET_RU[name] ?? name,
    sign: SIGN_RU[planet.signName] ?? planet.signName,
    house: getPlanetHouseForChart(chart, name) ?? 0,
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
    const lordHouse = lord ? getPlanetHouseForChart(chart, house.lord) : null;
    const occupants = Object.keys(chart.planets)
      .filter((name) => getPlanetHouseForChart(chart, name) === house.house)
      .map((name) => toEvidence(name, chart));
    const lordEvidence = lord ? toEvidence(house.lord, chart) : null;
    const lordCondition = evaluatePlanetCondition(chart, house.lord);
    const houseAspects = describeHouseDrishti(chart, house.house);
    const lordHouseAspects = lordHouse ? describeHouseDrishti(chart, lordHouse) : [];
    const sign = SIGN_RU[house.signName] ?? house.signName;
    const interpretation = lordHouse
      ? `В традиционной Джйотиш этот дом связан с темой: ${HOUSE_MEANING[house.house]}. В твоей карте он начинается в знаке ${sign}. Управитель — ${PLANET_RU[house.lord] ?? house.lord}; он расположен в ${lordHouse}-м доме (${getLordHouseMeaning(lordHouse)}). Поэтому темы этих двух домов стоит рассматривать вместе: решения и опыт в сфере «${getLordHouseMeaning(lordHouse)}» символически связываются с темой этого дома.`
      : `Дом в знаке ${sign}; положение его управителя в доступных данных определить не удалось. Общая тема: ${HOUSE_MEANING[house.house]}.`;

    const evidence = [
      `Знак дома: ${sign}`,
      `Управитель: ${PLANET_RU[house.lord] ?? house.lord}${lordEvidence ? ` — ${formatPlanetEvidence(lordEvidence)}` : ''}`,
      lordCondition ? `Достоинство управителя: ${lordCondition.label}; качественная шкала ${lordCondition.score}/100. Это не Shadbala.` : 'Достоинство управителя: нет данных.',
      ...houseAspects,
      ...lordHouseAspects.map((item) => `Аспект на положение управителя: ${item}`),
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
      interpretation: `${interpretation} Символические качества управителя: ${planetThemes.join('; ')}. Состояние управителя: ${lordCondition ? `${lordCondition.label} в знаке ${lordCondition.sign} (качественная оценка ${lordCondition.score}/100): ${lordCondition.explanation}` : 'не удалось определить'}. ${houseAspects.length ? `Влияние на сам дом: ${houseAspects.join(' ')}` : 'Прямых граха-дришти на этот дом по используемой схеме не найдено.'} ${lordHouseAspects.length ? `Дополнительные аспекты на дом, где расположен управитель: ${lordHouseAspects.join(' ')}` : ''}`,
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
      if (getPlanetHouseForChart(chart, name) === houseNumber) names.add(name);
    }
  }
  for (const aspect of getGrahaDrishti(chart).filter((item) => houses.includes(item.targetHouse))) {
    const sourceKey = Object.keys(PLANET_RU).find((name) => PLANET_RU[name] === aspect.source);
    if (sourceKey) names.add(sourceKey);
  }
  return [...names];
}


function getTopicEvidence(chart: NatalChart, houses: number[]): string[] {
  return houses.map((houseNumber) => {
    const house = chart.houses?.find((item) => item.house === houseNumber);
    if (!house) return String(houseNumber) + '-й дом: данные недоступны';
    const occupants = Object.keys(chart.planets).filter((name) => getPlanetHouseForChart(chart, name) === houseNumber);
    const lordHouse = getPlanetHouseForChart(chart, house.lord);
    const lord = chart.planets[house.lord as keyof NatalChart['planets']];
    const condition = evaluatePlanetCondition(chart, house.lord);
    const aspects = describeHouseDrishti(chart, houseNumber);
    const lordAspects = lordHouse ? describeHouseDrishti(chart, lordHouse) : [];
    const dispositor = lord ? chart.houses?.find((item) => item.sign === lord.sign)?.lord : undefined;
    const dispositorHouse = dispositor ? getPlanetHouseForChart(chart, dispositor) : null;
    const dispositorCondition = dispositor ? evaluatePlanetCondition(chart, dispositor) : null;
    const sign = SIGN_RU[house.signName] ?? house.signName;
    const parts = [
      String(houseNumber) + '-й дом в знаке ' + sign + ' управляется ' + (PLANET_RU[house.lord] ?? house.lord),
      lordHouse ? 'управитель находится в ' + lordHouse + '-м доме (' + getLordHouseMeaning(lordHouse) + ')' : 'положение управителя не определено',
      condition ? 'достоинство управителя: ' + condition.label : '',
      occupants.length ? 'в доме расположены ' + occupants.map((name) => PLANET_RU[name] ?? name).join(', ') : 'планет в доме нет',
      aspects.length ? 'дом получает влияния: ' + aspects.join(' ') : 'прямые граха-дришти на дом не обнаружены',
      lordAspects.length ? 'положение управителя дополнительно аспектируют: ' + lordAspects.join(' ') : '',
      dispositor ? 'диспозитор управителя — ' + (PLANET_RU[dispositor] ?? dispositor) +
        (dispositorHouse ? ', расположен в ' + dispositorHouse + '-м доме' : '') +
        (dispositorCondition ? ', достоинство: ' + dispositorCondition.label : '') : '',
    ];
    return parts.filter(Boolean).join('; ') + '.';
  });
}

function getTopicHouseNarrative(chart: NatalChart, houseNumber: number): { narrative: string; factor: string; development: string } | null {
  const house = chart.houses?.find((item) => item.house === houseNumber);
  if (!house) return null;
  const lord = chart.planets[house.lord as keyof NatalChart['planets']];
  if (!lord) return null;

  const lordHouse = getPlanetHouseForChart(chart, house.lord);
  const condition = evaluatePlanetCondition(chart, house.lord);
  const occupants = Object.keys(chart.planets).filter((name) => getPlanetHouseForChart(chart, name) === houseNumber);
  const sign = SIGN_RU[house.signName] ?? house.signName;
  const lordName = PLANET_RU[house.lord] ?? house.lord;
  const occupiedNames = occupants.map((name) => PLANET_RU[name] ?? name);
  const houseAspects = describeHouseDrishti(chart, houseNumber);
  const lordAspects = lordHouse ? describeHouseDrishti(chart, lordHouse) : [];
  const dispositorName = chart.houses?.find((item) => item.sign === lord.sign)?.lord;
  const dispositor = dispositorName ? chart.planets[dispositorName as keyof NatalChart['planets']] : undefined;
  const dispositorHouse = dispositorName ? getPlanetHouseForChart(chart, dispositorName) : null;

  const destination = lordHouse
    ? 'Управитель ' + lordName + ' находится в ' + lordHouse + '-м доме — ' + getLordHouseMeaning(lordHouse) +
      '. Поэтому темы рассматриваемой сферы символически переплетаются с этой областью жизни.'
    : 'Положение управителя ' + lordName + ' по дому не удалось определить, поэтому вывод о связи сфер ограничен.';
  const conditionText = condition?.dignity === 'exalted'
    ? 'В традиционной системе экзальтация считается поддерживающим достоинством: ' + lordName + ' может проявлять свои функции более заметно и уверенно.'
    : condition?.dignity === 'own'
      ? 'Собственный знак традиционно связывают с большей самостоятельностью и устойчивостью функций ' + lordName + '.'
      : condition?.dignity === 'debilitated'
        ? 'Положение в знаке падения традиционно трактуют как требующее большей осознанности и настройки в темах, за которые отвечает ' + lordName + '; это не означает отсутствие результата.'
        : condition?.dignity === 'other'
          ? 'Управитель находится не в собственном, экзальтационном или знаке падения; одной этой характеристики недостаточно, чтобы объявить его сильным или слабым.'
          : 'Достоинство управителя по используемой схеме не оценивается.';
  const occupancyText = occupiedNames.length
    ? 'В самом доме находятся ' + occupiedNames.join(', ') + '; их символические темы непосредственно включаются в трактовку этой сферы.'
    : 'В доме нет планет, поэтому основной акцент анализа приходится на знак, управителя и его связи, а не на планет, расположенных в доме.';
  const aspectText = houseAspects.length
    ? 'Дом получает следующие граха-дришти: ' + houseAspects.join(' ')
    : 'По используемой классической схеме прямые граха-дришти на этот дом не обнаружены.';
  const dispositorText = dispositorName
    ? 'Знак управителя занят диспозитором ' + (PLANET_RU[dispositorName] ?? dispositorName) +
      (dispositorHouse ? ', который расположен в ' + dispositorHouse + '-м доме (' + getLordHouseMeaning(dispositorHouse) + ')' : '') +
      '; это дополнительное звено в цепочке интерпретации.'
    : '';
  const lordAspectText = lordAspects.length
    ? ' Сам дом, где расположен управитель, получает аспекты: ' + lordAspects.join(' ')
    : '';
  const factor = String(houseNumber) + '-й дом: ' + sign + '; управитель ' + lordName +
    (lordHouse ? ' в ' + lordHouse + '-м доме' : '') +
    (condition ? '; ' + condition.label : '') +
    (occupiedNames.length ? '; планеты: ' + occupiedNames.join(', ') : '; без планет') + '.';
  const development = condition?.dignity === 'debilitated'
    ? 'Не делайте выводов по одному показателю: отдельно оценивайте положение диспозитора, аспекты и реальные обстоятельства этой сферы.'
    : lordHouse
      ? 'Наблюдайте, как решения в области «' + getLordHouseMeaning(lordHouse) + '» отражаются на теме ' + HOUSE_MEANING[houseNumber] + '.'
      : 'Для более точной интерпретации нужны надёжные данные о положении управителя.';
  return {
    narrative: destination + ' ' + conditionText + ' ' + occupancyText + ' ' + aspectText + lordAspectText + ' ' + dispositorText,
    factor,
    development,
  };
}

export function analyzeLifeTopics(chart: NatalChart, currentDate: Date = new Date()): LifeTopicInsight[] {
  if (!chart.houses?.length) return [];
  const moonNakshatra = chart.planets.Moon.nakshatra;
  const dasha = calculateDasha(chart.date, moonNakshatra, currentDate, chart.planets.Moon.siderealLon);
  const antar = getCurrentAntardasha(dasha, currentDate);
  const formatDate = (date: Date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const periodLabel = 'Махадаша ' + (PLANET_RU[dasha.planet] ?? dasha.planet) + ' действует с ' +
    formatDate(dasha.startDate) + ' по ' + formatDate(dasha.endDate) +
    (antar ? '; Антардаша ' + (PLANET_RU[antar.planet] ?? antar.planet) + ' — с ' +
      formatDate(antar.startDate) + ' по ' + formatDate(antar.endDate) : '') + '.';

  return TOPIC_CONFIG.map((topic) => {
    const planets = getTopicPlanetNames(chart, topic.houses);
    const directions = [...new Set(planets.map((name) => topic.directions[name]).filter((value): value is string => Boolean(value)))];
    const evidence = getTopicEvidence(chart, topic.houses);
    const houseReadings = topic.houses
      .map((houseNumber) => getTopicHouseNarrative(chart, houseNumber))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const keyFactors = houseReadings.map((item) => item.factor);
    const developmentPoints = houseReadings.map((item) => item.development);
    const houseInterpretations = houseReadings.map((item) => item.narrative);
    const mahaConnection = describePeriodConnection(chart, dasha.planet, topic.houses, planets);
    const antarConnection = antar ? describePeriodConnection(chart, antar.planet, topic.houses, planets) : 'Текущая Антардаша не определена в доступных данных.';
    const periodMeaning = 'Связь Махадаши с этой сферой: ' + mahaConnection + ' Связь Антардаши: ' + antarConnection;
    const directionText = directions.length
      ? 'Планетные сигнификаторы и управители указывают на направления для практического исследования: ' + directions.join('; ') + '.'
      : 'В этой карте не найдено достаточно прямых планетных указаний, чтобы уверенно перечислять конкретные направления.';
    const interpretation = [
      'Сфера рассматривается через дома ' + topic.houses.join(', ') + '. Важно не только значение самих домов, но и то, куда попадают их управители.',
      ...houseInterpretations,
      directionText,
      'Эти связи описывают символические акценты карты, а не гарантированные события, способности или ограничения.',
    ].join(' ');

    const timingNote = topic.id === 'children'
      ? periodLabel + ' ' + periodMeaning + ' Это символическая трактовка периода, а не прогноз фертильности, даты зачатия или количества детей. Медицинское планирование беременности следует обсуждать с врачом.'
      : periodLabel + ' ' + periodMeaning + ' Период показывает символический акцент, а не гарантирует событие и не определяет лучший день для финансовой операции.';

    return {
      id: topic.id,
      title: topic.title,
      houses: topic.houses,
      interpretation,
      directions,
      actions: topic.actions,
      evidence,
      timingNote,
      keyFactors,
      developmentPoints,
    };
  });
}
export function getVargaEvidence(chart: NatalChart, division: 2 | 7 | 9 | 10 | 24): string[] {
  const definitions = {
    2: { name: 'D2 — Хора', sanskrit: 'Hora', area: 'Ресурсы и материальная устойчивость', relevant: ['Sun', 'Jupiter', 'Venus'] },
    7: { name: 'D7 — Саптамша', sanskrit: 'Saptamsha', area: 'Дети и продолжение рода', relevant: ['Jupiter', 'Moon', 'Venus'] },
    9: { name: 'D9 — Навамша', sanskrit: 'Navamsha', area: 'Партнёрство, ценности и дхарма', relevant: ['Venus', 'Jupiter', 'Saturn', 'Moon'] },
    10: { name: 'D10 — Дашамша', sanskrit: 'Dashamsha', area: 'Профессия и реализация', relevant: ['Sun', 'Mercury', 'Saturn', 'Mars'] },
    24: { name: 'D24 — Сиддхамша', sanskrit: 'Siddhamsha', area: 'Обучение и знания', relevant: ['Mercury', 'Jupiter', 'Sun'] },
  } as const;
  const definition = definitions[division];
  const varga = calculateDivisionalChart(
    Object.fromEntries(Object.entries(chart.planets).map(([name, position]) => [name, position.siderealLon])),
    chart.ascendant.siderealLon,
    division,
    definition.name,
    definition.sanskrit,
    definition.area,
  );
  return definition.relevant
    .filter((name) => Boolean(varga.planets[name]))
    .map((name) => {
      const planet = varga.planets[name];
      return `${PLANET_RU[name] ?? name} в D${division}: ${SIGN_RU[planet.signName] ?? planet.signName}, ${planet.house}-й дом.`;
    });
}
