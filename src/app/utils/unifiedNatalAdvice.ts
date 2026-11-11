import type { NatalHousePersonalizedAnalysis } from './natalHousePersonalizedAnalysis';
import type { NatalPlanetPersonalizedAnalysis } from './natalPlanetPersonalizedAnalysis';
import type { NatalChartSynthesis } from './natalChartSynthesis';

export type AdviceDataStatus = 'complete' | 'partial' | 'unavailable';

export interface UnifiedAdvice {
  connection: string;
  combinedMeaning: string;
  tension: string;
  practicalStep: string;
  successCriteria: string;
  limitation: string;
  evidence: string[];
  dataStatus: AdviceDataStatus;
}

interface UnifiedAdviceInput {
  connection: string;
  combinedMeaning: string;
  tensions?: string[];
  practicalStep: string;
  successCriteria: string;
  limitation?: string;
  evidence?: string[];
  dataStatus?: AdviceDataStatus;
}

const HOUSE_ACTIONS: Record<number, { step: string; criteria: string }> = {
  1: { step: 'Выберите одну личную цель на ближайшие две недели и выполняйте по одному заранее определённому шагу в день.', criteria: 'В конце двух недель есть список выполненных шагов и один измеримый результат относительно исходной точки.' },
  2: { step: 'Составьте фактический список регулярных доходов, расходов и ресурсов; выберите одну статью для осознанного пересмотра.', criteria: 'Есть заполненная таблица за полный месяц и зафиксированное изменение одной выбранной статьи.' },
  3: { step: 'Выберите один навык и выполняйте короткое практическое упражнение не реже трёх раз в неделю.', criteria: 'Созданы не менее шести работ/упражнений и отмечен прогресс по заранее выбранному критерию.' },
  4: { step: 'Выберите одну домашнюю задачу или привычку, которая улучшит повседневный комфорт, и согласуйте её с участниками быта.', criteria: 'В течение двух недель отмечено выполнение договорённости и оценено изменение удобства по шкале 1–10.' },
  5: { step: 'Запланируйте один творческий эксперимент с ограниченным объёмом и доведите его до законченной версии.', criteria: 'Есть завершённая работа/публикация и короткая запись о том, что получилось и что изменить.' },
  6: { step: 'Разбейте повторяющуюся рабочую задачу на этапы и проверьте её по короткому чек-листу.', criteria: 'Чек-лист применён минимум к пяти циклам; отмечены ошибки, пропуски и среднее время выполнения.' },
  7: { step: 'Обсудите с партнёром или коллегой одну общую задачу: роли, ожидания, срок и критерий готовности.', criteria: 'Договорённость зафиксирована, а результат оценён по согласованному критерию в указанный срок.' },
  8: { step: 'Перед общим финансовым или организационным обязательством письменно проверьте условия, риски и запасной вариант.', criteria: 'Есть список ключевых условий, рисков, ответственных лиц и сценарий действий при сбое.' },
  9: { step: 'Выберите одну тему для обучения и составьте небольшой план с практической проверкой знаний.', criteria: 'Пройден один учебный блок и выполнено задание/тест с записанным результатом.' },
  10: { step: 'Выберите профессиональную задачу, завершите конкретный рабочий пример и соберите его в портфолио.', criteria: 'Есть один законченный кейс с описанием задачи, вашего решения и проверяемого результата.' },
  11: { step: 'Поделитесь одним полезным результатом с профессиональным сообществом и отслеживайте отклик.', criteria: 'Опубликован материал; через две недели зафиксированы просмотры, содержательные ответы или новые контакты.' },
  12: { step: 'В течение двух недель выделяйте постоянное время для восстановления и ограничьте один источник ненужных отвлечений.', criteria: 'Есть журнал соблюдения режима и сравнение самочувствия/концентрации с исходной неделей.' },
};

const PLANET_ACTIONS: Record<string, { step: string; criteria: string }> = {
  Sun: { step: 'Выберите задачу, где можно самостоятельно принять решение и довести работу до результата.', criteria: 'Зафиксированы принятое решение, завершённый результат и обратная связь от одного заинтересованного человека.' },
  Moon: { step: 'Ведите короткие ежедневные заметки о режиме, нагрузке и условиях, которые помогают восстановиться.', criteria: 'За 14 дней заполнено не менее десяти заметок и выделены два повторяющихся поддерживающих фактора.' },
  Mars: { step: 'Разделите одну сложную задачу на короткие действия; перед каждым определяйте цель и допустимый риск.', criteria: 'Выполнены три конкретных действия, а результат и нежелательные последствия записаны отдельно.' },
  Mercury: { step: 'Сформулируйте одну гипотезу, проверьте её на данных или практическом примере и кратко объясните вывод.', criteria: 'Есть формулировка гипотезы, источник/набор данных, результат проверки и вывод.' },
  Jupiter: { step: 'Выберите один учебный вопрос, изучите два независимых надёжных источника и примените знание на практике.', criteria: 'Подготовлено краткое сравнение источников и выполнено одно практическое задание.' },
  Venus: { step: 'Доведите одну эстетическую или совместную идею до готового результата и запросите конкретную обратную связь.', criteria: 'Есть законченная работа и минимум три ответа по заранее заданным вопросам.' },
  Saturn: { step: 'Выберите долгосрочную задачу, определите минимальный недельный объём и фиксируйте выполнение.', criteria: 'План соблюдался минимум три недели; видны выполненные этапы и причины отклонений.' },
  Rahu: { step: 'Проверьте новое направление ограниченным экспериментом с заранее установленным бюджетом времени и ресурсов.', criteria: 'Эксперимент завершён в заданных пределах; решение продолжать или остановиться опирается на записанные результаты.' },
  Ketu: { step: 'Выберите узкую тему для самостоятельного исследования и регулярно фиксируйте промежуточные выводы.', criteria: 'Подготовлена заметка/прототип с источниками, выводами и вопросами для дальнейшей проверки.' },
};

const PLANET_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const DEFAULT_LIMITATION = 'Вывод относится к символической астрологической модели и не является научно подтверждённым прогнозом или гарантией события.';

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map(normalize).filter((value) => {
    const key = value.toLocaleLowerCase('ru-RU');
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackStep(evidence: string[]): { step: string; criteria: string } {
  const anchor = evidence[0] ?? 'выбранный показатель карты';
  return {
    step: `Выберите один наблюдаемый аспект, связанный с основанием «${anchor}», и проверьте его небольшим действием в реальной ситуации.`,
    criteria: 'Запишите исходное состояние, действие, срок и наблюдаемый результат; после завершения сравните результат с исходной точкой.',
  };
}

/** The only constructor for the public advice contract; every section is normalized here. */
export function buildUnifiedAdvice(input: UnifiedAdviceInput): UnifiedAdvice {
  const evidence = unique(input.evidence !== undefined ? input.evidence : [input.connection]);
  const connection = normalize(input.connection) || (evidence.length
    ? evidence.join(' ')
    : 'Подтверждённые связи для этого вывода отсутствуют.');
  const tensions = unique(input.tensions ?? []);
  const dataStatus = input.dataStatus ?? (evidence.length ? 'complete' : input.evidence !== undefined ? 'unavailable' : 'partial');
  const tension = tensions.length
    ? tensions.join(' ')
    : 'В доступных показателях для этого вывода отдельное противоречие не отмечено; непроверенные факторы перечислены в ограничениях.';
  return {
    connection,
    combinedMeaning: normalize(input.combinedMeaning) || 'Совместная трактовка не сформирована: недостаточно подтверждённых показателей.',
    tension,
    practicalStep: normalize(input.practicalStep) || 'Сначала уточните исходные данные; не делайте персональный вывод по отсутствующим показателям.',
    successCriteria: normalize(input.successCriteria) || 'Результат нельзя проверить, пока не определены исходные данные и конкретная цель действия.',
    limitation: unique([input.limitation ?? '', DEFAULT_LIMITATION]).join(' '),
    evidence,
    dataStatus,
  };
}

export function buildNarrativeUnifiedAdvice(input: UnifiedAdviceInput): UnifiedAdvice {
  return buildUnifiedAdvice(input);
}

export function buildLifeAreaUnifiedAdvice(title: string, connections: string[]): UnifiedAdvice {
  const evidence = unique(connections);
  const fallback = fallbackStep(evidence);
  const normalizedTitle = normalize(title);
  const action = /карьер|професс/i.test(normalizedTitle) ? HOUSE_ACTIONS[10]
    : /отнош/i.test(normalizedTitle) ? HOUSE_ACTIONS[7]
      : /деньг|финанс/i.test(normalizedTitle) ? HOUSE_ACTIONS[2]
        : /обуч|творч|талант/i.test(normalizedTitle) ? HOUSE_ACTIONS[5]
          : fallback;
  return buildUnifiedAdvice({
    connection: evidence.length ? `Сфера «${normalizedTitle}»: подтверждено оснований — ${evidence.length}.` : `Для сферы «${normalizedTitle}» пока нет подтверждённых связей.`,
    evidence,
    combinedMeaning: evidence.length
      ? `В теме «${normalizedTitle}» совместно рассматриваются только перечисленные связи; они задают символический контекст, но не предопределяют события.`
      : `Персональная трактовка сферы «${normalizedTitle}» ограничена: исходные связи не переданы.`,
    practicalStep: evidence.length ? action.step : 'Уточните исходные положения и связи, относящиеся к этой сфере, прежде чем делать персональные выводы.',
    successCriteria: evidence.length ? action.criteria : 'Критерий проверки появится после получения хотя бы одного подтверждённого показателя.',
    dataStatus: evidence.length ? 'complete' : 'unavailable',
    limitation: evidence.length ? undefined : 'Для этой сферы не переданы проверяемые основания; общая рекомендация не должна восприниматься как персональный вывод.',
  });
}

export function buildLifeAreaBridgeUnifiedAdvice(input: {
  connection: string;
  areas: string[];
  explanation: string;
  evidence: string[];
}): UnifiedAdvice {
  const evidence = unique([input.connection, ...input.evidence, ...input.areas.map((area) => `Подтверждённая сфера: ${area}.`)]);
  const fallback = fallbackStep(evidence);
  return buildUnifiedAdvice({
    connection: `Межсферная связь: ${unique(input.areas).join(', ') || 'сферы не определены'}; отдельных оснований — ${input.evidence.length}.`,
    evidence,
    combinedMeaning: input.explanation,
    practicalStep: fallback.step,
    successCriteria: fallback.criteria,
    dataStatus: input.evidence.length ? 'complete' : 'partial',
    limitation: input.evidence.length ? undefined : 'Связь между сферами заявлена, но отдельные доказательства по сферам не переданы.',
  });
}

export function buildHouseUnifiedAdvice(house: NatalHousePersonalizedAnalysis): UnifiedAdvice {
  const evidence = unique([...house.evidence, ...house.supportingFactors, ...house.attentionFactors]);
  if (!house.available) {
    return buildUnifiedAdvice({
      connection: `Данные ${house.house}-го дома отсутствуют; знак, управитель, аспекты и связи не подтверждены.`,
      evidence,
      combinedMeaning: 'Персональная трактовка этой сферы не формируется, чтобы не заменять неизвестные показатели предположениями.',
      tensions: house.limitations,
      practicalStep: 'Восстановите исходные данные рождения и пересчитайте карту; до этого не используйте персональные выводы по этому дому.',
      successCriteria: 'После пересчёта доступны знак дома, управитель и его положение; статус анализа меняется с «недостаточно данных» на проверяемый.',
      limitation: house.limitations.join(' '),
      dataStatus: 'unavailable',
    });
  }
  const placement = house.lordName
    ? `Управитель ${house.house}-го дома — ${house.lordName}${house.lordHouse === null ? ', его положение по дому не определено' : `; он находится в ${house.lordHouse}-м доме`}.`
    : `Управитель ${house.house}-го дома не определён.`;
  const links = [
    house.occupants.length ? `В доме находятся: ${house.occupants.join(', ')}.` : 'Планет в доме нет по используемой модели.',
    house.aspects.length ? `На дом направлены аспекты ${house.aspects.join(', ')}.` : 'Прямые аспекты на дом по принятой схеме не выявлены.',
    house.connectedHouses.length ? `Положение управителя связывает тему с домами ${house.connectedHouses.join(', ')}.` : '',
    house.ruledHouses.length > 1 ? `Тот же управитель отвечает также за дома ${house.ruledHouses.filter((item) => item !== house.house).join(', ')}.` : '',
  ].filter(Boolean);
  const tension = unique([
    ...house.attentionFactors,
    ...(house.synthesis === 'mixed' ? ['В этой конфигурации одновременно присутствуют поддерживающие и требующие внимания факторы.'] : []),
    ...(house.synthesis === 'incomplete' ? ['Часть данных управителя или его положения отсутствует; оценка остаётся предварительной.'] : []),
  ]);
  const action = HOUSE_ACTIONS[house.house] ?? fallbackStep(evidence);
  const dataStatus = house.synthesis === 'incomplete' || !house.lordName || house.lordHouse === null ? 'partial' : 'complete';
  return buildUnifiedAdvice({
    connection: `Дом ${house.house}: ${house.sign ?? 'знак не определён'}; ${placement} Планет в доме — ${house.occupants.length}, входящих аспектов — ${house.aspects.length}, связанных домов — ${house.connectedHouses.length}.`,
    evidence,
    combinedMeaning: `Тема «${house.theme}» рассматривается через знак дома, его управителя и доступные связи. ${house.supportingFactors.length ? 'Есть конкретные поддерживающие признаки; они не гарантируют результат.' : 'Поддерживающий перевес по выбранным критериям не установлен.'}`,
    tensions: tension,
    practicalStep: action.step,
    successCriteria: action.criteria,
    limitation: house.limitations.join(' '),
    dataStatus,
  });
}

export function buildPlanetUnifiedAdvice(planet: NatalPlanetPersonalizedAnalysis): UnifiedAdvice {
  const evidence = unique([...planet.evidence, ...planet.supportingFactors, ...planet.attentionFactors]);
  if (!planet.available || !planet.sign) {
    return buildUnifiedAdvice({
      connection: `${planet.name} отсутствует в исходных данных карты.`,
      evidence,
      combinedMeaning: 'Нельзя надёжно описать знак, дом, достоинство, аспекты и диспозитор этой планеты.',
      tensions: planet.limitations,
      practicalStep: 'Восстановите исходное положение планеты и пересчитайте карту; не подменяйте отсутствующие данные общей характеристикой.',
      successCriteria: 'Положение планеты присутствует в исходных данных, а её знак и доступные связи отражены в анализе.',
      limitation: planet.limitations.join(' '),
      dataStatus: 'unavailable',
    });
  }
  const connections = [
    `${planet.name} находится в знаке ${planet.sign}.`,
    planet.house === null ? 'Дом расположения не определён.' : `Планета находится в ${planet.house}-м доме.`,
    planet.ruledHouses.length ? `Она управляет домами ${planet.ruledHouses.join(', ')}.` : '',
    planet.conjunctions.length ? `Соединена по знаку с ${planet.conjunctions.map((key) => PLANET_NAMES[key]).join(', ')}.` : '',
    planet.aspectsToPlanets.length ? `Её аспекты направлены к ${planet.aspectsToPlanets.map((key) => PLANET_NAMES[key]).join(', ')}.` : '',
    planet.receivesAspectsFrom.length ? `Она получает аспекты от ${planet.receivesAspectsFrom.map((key) => PLANET_NAMES[key]).join(', ')}.` : '',
    planet.aspectsToHouses.length ? `Также затрагиваются дома ${planet.aspectsToHouses.join(', ')}.` : '',
    planet.dispositor ? `Диспозитор — ${PLANET_NAMES[planet.dispositor]}${planet.dispositorHouse === null ? ', его дом не определён' : `, расположенный в ${planet.dispositorHouse}-м доме`}.` : 'Диспозитор не определён.',
  ].filter(Boolean);
  const action = PLANET_ACTIONS[planet.planet] ?? fallbackStep(evidence);
  const tension = unique([
    ...planet.attentionFactors,
    ...(planet.synthesis === 'mixed' ? ['У планеты одновременно отмечены поддерживающие и требующие внимания показатели.'] : []),
    ...(planet.synthesis === 'incomplete' ? ['Для полной оценки не хватает части положения, достоинства или цепочки диспозиторов.'] : []),
  ]);
  const dataStatus = planet.synthesis === 'incomplete' || planet.house === null || !planet.dispositor ? 'partial' : 'complete';
  return buildUnifiedAdvice({
    connection: `${planet.name} в знаке ${planet.sign}; дом — ${planet.house ?? 'не определён'}; управляемые дома — ${planet.ruledHouses.length}; соединения — ${planet.conjunctions.length}; межпланетные аспекты — ${planet.aspectsToPlanets.length + planet.receivesAspectsFrom.length}.`,
    evidence,
    combinedMeaning: `${planet.name} рассматривается через функцию «${planet.function}», знак, дом, управление и доступные связи как единая конфигурация.`,
    tensions: tension,
    practicalStep: action.step,
    successCriteria: action.criteria,
    limitation: planet.limitations.join(' '),
    dataStatus,
  });
}

export function buildConclusionUnifiedAdvice(
  conclusion: NatalChartSynthesis['conclusions'][number],
  tensions: string[],
): UnifiedAdvice {
  const relatedHouses = conclusion.relatedHouses;
  const directlyRelatedTensions = unique(conclusion.relatedTensions ?? []);
  const globalContext = unique(tensions);
  const relevantTensions = directlyRelatedTensions.length
    ? directlyRelatedTensions
    : globalContext.length
      ? [`Общий контекст карты: ${globalContext.join(' ')} Эти факторы не привязаны к данному выводу напрямую.`]
      : [];
  const evidence = unique(conclusion.evidence);
  const action = relatedHouses.length ? HOUSE_ACTIONS[relatedHouses[0]] : fallbackStep(evidence);
  return buildUnifiedAdvice({
    connection: `Вывод «${conclusion.title}» связан с домами ${relatedHouses.length ? relatedHouses.join(', ') : 'без определённого дома'} и планетами ${conclusion.relatedPlanets.length ? conclusion.relatedPlanets.map((key) => PLANET_NAMES[key]).join(', ') : 'без отдельной планетной привязки'}.`,
    evidence,
    combinedMeaning: conclusion.statement,
    tensions: relevantTensions,
    practicalStep: action.step,
    successCriteria: action.criteria,
    dataStatus: evidence.length ? 'complete' : 'partial',
    limitation: evidence.length ? undefined : 'У вывода нет перечисленных доказательств; персональная рекомендация ограничена.',
  });
}

export function buildSynthesisUnifiedAdvice(synthesis: NatalChartSynthesis): UnifiedAdvice {
  const strongestTheme = synthesis.dominantThemes[0];
  const bridges = synthesis.bridges.slice(0, 3).map((item) => item.evidence);
  const networks = synthesis.planetNetworks.slice(0, 3).map((item) => item.evidence);
  const evidence = unique([
    ...(strongestTheme?.evidence ?? []),
    ...bridges,
    ...networks,
  ]);
  const action = strongestTheme ? HOUSE_ACTIONS[strongestTheme.house] : fallbackStep(evidence);
  const incomplete = synthesis.dataQuality.completeness < 100
    || synthesis.dataQuality.missingHouses.length > 0
    || synthesis.dataQuality.missingPlanets.length > 0;
  return buildUnifiedAdvice({
    connection: evidence.length ? `Синтез опирается на ${evidence.length} уникальных подтверждённых оснований${strongestTheme ? `; ведущий акцент — ${strongestTheme.house}-й дом` : ''}.` : 'Достаточно подтверждённых межпланетных и междомовых связей для выделения ведущего акцента пока нет.',
    evidence,
    combinedMeaning: synthesis.overview,
    tensions: synthesis.tensions,
    practicalStep: incomplete && !strongestTheme
      ? 'Сначала уточните недостающие исходные данные карты; затем пересчитайте синтез.'
      : action.step,
    successCriteria: incomplete && !strongestTheme
      ? 'В синтезе указаны отсутствующие планеты/дома, а показатель полноты повышен после повторного расчёта.'
      : action.criteria,
    limitation: synthesis.dataQuality.caveats.join(' '),
    dataStatus: incomplete ? 'partial' : evidence.length ? 'complete' : 'partial',
  });
}
