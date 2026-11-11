import type { NatalHousePersonalizedAnalysis } from './natalHousePersonalizedAnalysis';
import type { NatalPlanetPersonalizedAnalysis } from './natalPlanetPersonalizedAnalysis';
import type { NatalChartSynthesis } from './natalChartSynthesis';

export interface UnifiedAdvice {
  connection: string;
  combinedMeaning: string;
  tension: string;
  practicalStep: string;
  limitation: string;
}

const HOUSE_ACTIONS: Record<number, string> = {
  1: 'Выберите одну личную цель на ближайшие 2–4 недели, определите первый проверяемый шаг и раз в неделю оценивайте прогресс.',
  2: 'Зафиксируйте текущие ресурсы и приоритеты; проверяйте финансовые решения расчётами и реальными данными, а не символической трактовкой.',
  3: 'Закрепляйте обучение практикой: регулярно создавайте небольшой результат и объясняйте его своими словами.',
  4: 'Сформируйте устойчивый режим и пространство восстановления; заранее проговаривайте домашние обязанности и границы.',
  5: 'Выберите один творческий эксперимент на шесть недель и доведите его до законченной работы или публикации.',
  6: 'Разбейте рабочую задачу на повторяемые этапы, используйте чек-лист и оставляйте время на восстановление.',
  7: 'До начала совместного дела согласуйте роли, ожидания, сроки и критерии результата.',
  8: 'Проверяйте риски, условия общих обязательств и доступность резервов до принятия важных решений.',
  9: 'Выберите одну область знаний, составьте план обучения и проверяйте идеи на практике и по независимым источникам.',
  10: 'Сформируйте портфолио из конкретных результатов и поставьте измеримую профессиональную цель на квартал.',
  11: 'Публикуйте полезные результаты и развивайте профессиональные связи; отслеживайте, какие каналы дают реальные возможности.',
  12: 'Защитите время для сна, отдыха и сосредоточенной работы; ограничьте задачи, которые постоянно дробят внимание.',
};

const PLANET_ACTIONS: Record<string, string> = {
  Sun: 'Выберите задачу, где можно проявить инициативу и взять ответственность за законченный результат.',
  Moon: 'Отслеживайте, какие ритмы, условия и формы поддержки помогают сохранять эмоциональный ресурс.',
  Mars: 'Направляйте энергию в короткие конкретные действия; перед резким решением определяйте цель и допустимый риск.',
  Mercury: 'Закрепляйте идеи через заметки, проверяемые гипотезы, обучение и ясную коммуникацию.',
  Jupiter: 'Развивайте знания через системное обучение и делитесь ими, проверяя выводы по надёжным источникам.',
  Venus: 'Превращайте эстетические идеи в завершённые работы и проверяйте отклик аудитории на практике.',
  Saturn: 'Создайте устойчивый график и критерии качества; делите долгий проект на небольшие этапы.',
  Rahu: 'Проверяйте новые направления небольшими экспериментами и заранее задавайте границы времени и ресурсов.',
  Ketu: 'Используйте способность к концентрации для углублённого исследования, но фиксируйте промежуточные результаты.',
};

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/** Converts chart-specific evidence into one consistent, non-deterministic advice structure. */
export function buildUnifiedAdvice(input: {
  connection: string;
  combinedMeaning: string;
  tensions?: string[];
  practicalStep: string;
  limitation?: string;
}): UnifiedAdvice {
  const tensions = unique(input.tensions ?? []);
  return {
    connection: input.connection.trim(),
    combinedMeaning: input.combinedMeaning.trim(),
    tension: tensions.length
      ? tensions.join(' ')
      : 'По выбранным показателям явного внутреннего противоречия не выявлено. Это не означает отсутствия сложностей вне рассмотренных факторов.',
    practicalStep: input.practicalStep.trim(),
    limitation: input.limitation?.trim()
      || 'Это символическая интерпретация выбранной астрологической модели, а не достоверный прогноз или замена профессиональной консультации.',
  };
}

export function buildHouseUnifiedAdvice(house: NatalHousePersonalizedAnalysis): UnifiedAdvice {
  if (!house.available) {
    return buildUnifiedAdvice({
      connection: `Данные ${house.house}-го дома отсутствуют, поэтому его знак, управитель, аспекты и связи нельзя надёжно сопоставить.`,
      combinedMeaning: 'Персональный вывод по этой сфере не формируется, чтобы не подменять неизвестные данные предположениями.',
      tensions: house.limitations,
      practicalStep: 'Сначала восстановите или уточните исходные данные карты; до этого используйте только общую информацию о теме дома.',
    });
  }
  const placement = house.lordName
    ? `Управитель ${house.house}-го дома — ${house.lordName}${house.lordHouse === null ? ', его дом расположения не определён' : `; он находится в ${house.lordHouse}-м доме`}.`
    : `Управитель ${house.house}-го дома не определён.`;
  const links = [
    house.occupants.length ? `В самом доме находятся: ${house.occupants.join(', ')}.` : 'В доме нет планет; основное внимание уделяется знаку и управителю.',
    house.aspects.length ? `На дом направлены аспекты ${house.aspects.join(', ')}.` : 'Прямые аспекты на дом по принятой схеме не выявлены.',
    house.connectedHouses.length ? `Положение управителя связывает тему с домами ${house.connectedHouses.join(', ')}.` : '',
    house.ruledHouses.length > 1 ? `Тот же управитель отвечает также за дома ${house.ruledHouses.filter((item) => item !== house.house).join(', ')}.` : '',
  ].filter(Boolean);
  const tension = [
    ...house.attentionFactors,
    ...(house.synthesis === 'mixed' ? ['Поддерживающие и требующие внимания показатели присутствуют одновременно; их следует рассматривать совместно.'] : []),
  ];
  return buildUnifiedAdvice({
    connection: [placement, ...links].join(' '),
    combinedMeaning: `В символической трактовке это связывает тему «${house.theme}» с функциями управителя и ${house.lordHouse === null ? 'другими подтверждёнными показателями карты' : `сферой ${house.lordHouse}-го дома`}. ${house.supportingFactors.length ? 'Есть отдельные поддерживающие признаки, но они не гарантируют результат.' : 'Вывод не строится на одном показателе: важны совокупность положения, аспектов и управления.'}`,
    tensions: tension,
    practicalStep: HOUSE_ACTIONS[house.house],
    limitation: house.limitations.join(' '),
  });
}

export function buildPlanetUnifiedAdvice(planet: NatalPlanetPersonalizedAnalysis): UnifiedAdvice {
  if (!planet.available || !planet.sign) {
    return buildUnifiedAdvice({
      connection: `${planet.name} отсутствует в исходных данных карты.`,
      combinedMeaning: 'Нельзя достоверно описать положение, дом, аспекты и связи этой планеты.',
      tensions: planet.limitations,
      practicalStep: 'Не делайте персональных выводов по этой планете, пока её исходные данные не восстановлены.',
    });
  }
  const connections = [
    planet.house === null ? 'Дом расположения не определён.' : `Планета находится в ${planet.house}-м доме.`,
    planet.ruledHouses.length ? `Она управляет домами ${planet.ruledHouses.join(', ')}.` : '',
    planet.conjunctions.length ? `Соединена по знаку с ${planet.conjunctions.join(', ')}.` : '',
    planet.aspectsToPlanets.length ? `Её аспекты направлены к ${planet.aspectsToPlanets.join(', ')}.` : '',
    planet.receivesAspectsFrom.length ? `Она получает аспекты от ${planet.receivesAspectsFrom.join(', ')}.` : '',
    planet.aspectsToHouses.length ? `Также затрагиваются дома ${planet.aspectsToHouses.join(', ')}.` : '',
    planet.dispositor ? `Диспозитор — ${planet.dispositor}${planet.dispositorHouse === null ? '' : `, расположенный в ${planet.dispositorHouse}-м доме`}.` : 'Диспозитор не определён.',
  ].filter(Boolean);
  return buildUnifiedAdvice({
    connection: connections.join(' '),
    combinedMeaning: `${planet.name} символически описывает ${planet.function}. Её знак, дом, управление, аспекты и диспозитор следует читать как единую конфигурацию, а не как независимые характеристики.`,
    tensions: [
      ...planet.attentionFactors,
      ...(planet.synthesis === 'mixed' ? ['Одновременно присутствуют поддерживающие и требующие внимания факторы; это смешанная картина, а не однозначная оценка.'] : []),
    ],
    practicalStep: PLANET_ACTIONS[planet.planet],
    limitation: planet.limitations.join(' '),
  });
}

export function buildSynthesisUnifiedAdvice(synthesis: NatalChartSynthesis): UnifiedAdvice {
  const strongestTheme = synthesis.dominantThemes[0];
  const bridges = synthesis.bridges.slice(0, 3).map((item) => item.evidence);
  const networks = synthesis.planetNetworks.slice(0, 3).map((item) => item.evidence);
  const related = [...bridges, ...networks];
  const adviceHouse = strongestTheme?.house ?? 10;
  const evidenceText = [
    strongestTheme ? `Повторяющийся акцент отмечен в ${strongestTheme.house}-м доме: ${strongestTheme.theme}.` : '',
    ...related,
  ].filter(Boolean);
  return buildUnifiedAdvice({
    connection: evidenceText.length
      ? evidenceText.join(' ')
      : 'Достаточно подтверждённых межпланетных и междомовых связей для выделения ведущего акцента пока нет.',
    combinedMeaning: synthesis.overview,
    tensions: synthesis.tensions,
    practicalStep: HOUSE_ACTIONS[adviceHouse],
    limitation: synthesis.dataQuality.caveats.join(' '),
  });
}
