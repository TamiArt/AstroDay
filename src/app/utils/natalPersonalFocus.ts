import type { NatalChart } from './astrology';
import { describeHouseDrishti, evaluatePlanetCondition, getPlanetHouse, getPlanetToPlanetAspects } from './natalStrengthAnalysis';

const SIGN_NAMES = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const PLANET_THEMES: Record<string, string> = { Sun: 'самостоятельность, авторство, воля и ответственность', Moon: 'эмоциональные потребности, привычки, забота и безопасность', Mars: 'инициатива, действие, конкуренция и защита границ', Mercury: 'анализ, обучение, коммуникация, данные и систематизация', Jupiter: 'обучение, наставничество и расширение знаний', Venus: 'отношения, эстетика, творчество и согласование интересов', Saturn: 'структура, дисциплина, качество и долгосрочная работа', Rahu: 'эксперименты, технологии и нестандартные задачи', Ketu: 'специализация, исследование и углублённое изучение' };
const HOUSE_THEMES: Record<number, string> = { 1: 'личность, самостоятельность и инициативы', 2: 'личные ресурсы, накопления, речь и семейные ценности', 3: 'коммуникация, навыки, обучение и собственные усилия', 4: 'дом, семья, недвижимость и внутренняя опора', 5: 'творчество, обучение, дети и интеллектуальные проекты', 6: 'повседневная работа, сервис, обязанности и решение проблем', 7: 'партнёрство, клиенты и договорённости', 8: 'общие ресурсы, трансформации и исследования', 9: 'высшее образование, мировоззрение и дальние поездки', 10: 'профессия, ответственность и общественная реализация', 11: 'доходы, профессиональные связи и долгосрочные цели', 12: 'уединение, удалённая и международная среда, восстановление' };
const PLANET_RU: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };

function conditionText(chart: NatalChart, name: string): string {
  const condition = evaluatePlanetCondition(chart, name);
  return condition ? 'Достоинство: ' + condition.label + '. ' + condition.explanation : 'Достоинство планеты не удалось определить по доступным данным.';
}
function aspectText(chart: NatalChart, house: number): string {
  const aspects = describeHouseDrishti(chart, house);
  return aspects.length ? 'Аспекты на эту сферу: ' + aspects.join(' ') : 'По используемой схеме классической граха-дришти прямые аспекты на этот дом не найдены.';
}
function placementText(chart: NatalChart, name: string, role: string): string {
  const planet = chart.planets[name as keyof NatalChart['planets']];
  if (!planet) return role + ': данные планеты отсутствуют.';
  const house = getPlanetHouse(chart, name);
  const sign = SIGN_NAMES[planet.sign] ?? planet.signName;
  const nakshatra = planet.nakshatraName ? '; накшатра ' + planet.nakshatraName + ', пада ' + planet.pada : '';
  const houseText = house ? house + '-й дом (' + HOUSE_THEMES[house] + ')' : 'дом не определён';
  return role + ' — ' + (PLANET_RU[name] ?? name) + ' в знаке ' + sign + ', ' + houseText + nakshatra + '. Функция планеты: ' + (PLANET_THEMES[name] ?? 'символические качества планеты') + '. ' + conditionText(chart, name) + ' ' + (house ? aspectText(chart, house) : '');
}

export function getAscendantLordFocus(chart: NatalChart): string {
  const firstHouse = chart.houses?.find((house) => house.house === 1);
  if (!firstHouse) return 'Данные первого дома недоступны; интерпретацию управителя Лагны построить нельзя.';
  const lord = firstHouse.lord;
  const placement = chart.planets[lord as keyof NatalChart['planets']];
  if (!placement) return 'Управитель Лагны — ' + (PLANET_RU[lord] ?? lord) + ', но его положение в карте не найдено.';
  const house = getPlanetHouse(chart, lord);
  const sign = SIGN_NAMES[firstHouse.sign] ?? firstHouse.signName;
  const houseMeaning = house ? HOUSE_THEMES[house] : 'сфера положения управителя';
  const nakshatra = placement.nakshatraName ? ', накшатра ' + placement.nakshatraName + ', пада ' + placement.pada : '';
  return 'Лагна в знаке ' + sign + '. Её управитель — ' + (PLANET_RU[lord] ?? lord) + ': ' + (PLANET_THEMES[lord] ?? 'качества планеты') + '. Он расположен в ' + (house ? house + '-м доме — ' + houseMeaning : 'доме, который не удалось определить') + nakshatra + '. Поэтому темы личности и самостоятельных решений символически связываются с ' + houseMeaning + '. ' + conditionText(chart, lord) + ' ' + aspectText(chart, house ?? 1);
}

export function getMoonHouseFocus(chart: NatalChart, house: number): string {
  const moon = chart.planets.Moon;
  if (!moon) return 'Положение Луны в карте не найдено.';
  const houseMeaning = HOUSE_THEMES[house] ?? 'сферу соответствующего дома';
  const sign = SIGN_NAMES[moon.sign] ?? moon.signName;
  const nakshatra = moon.nakshatraName ? ' Накшатра ' + moon.nakshatraName + ', пада ' + moon.pada + ', добавляет традиционный символический оттенок, но не является психологическим диагнозом.' : '';
  return 'Луна в ' + sign + ', ' + house + '-м доме: эмоциональный комфорт и привычные способы восстановления особенно связаны с темами «' + houseMeaning + '». ' + PLANET_THEMES.Moon + '. ' + conditionText(chart, 'Moon') + nakshatra + ' ' + aspectText(chart, house);
}

function coreIndicatorRole(planet: string, ascendantLord: string): string {
  const roles = [
    ...(planet === ascendantLord ? ['управитель Лагны — базовый способ действовать'] : []),
    ...(planet === 'Sun' ? ['Солнце — воля и самореализация'] : []),
    ...(planet === 'Moon' ? ['Луна — эмоциональные потребности и адаптация'] : []),
  ];
  return roles.join(' и ') || (PLANET_RU[planet] ?? planet);
}

function describeCoreInteraction(
  source: string,
  target: string,
  ascendantLord: string,
  kind: 'conjunction' | 'graha-drishti',
): string {
  const sourceRole = coreIndicatorRole(source, ascendantLord);
  const targetRole = coreIndicatorRole(target, ascendantLord);
  const sourceTheme = PLANET_THEMES[source] ?? 'функции планеты';
  const targetTheme = PLANET_THEMES[target] ?? 'функции планеты';
  if (kind === 'conjunction') {
    return sourceRole + ' и ' + targetRole + ' соединены по знаку: темы «' + sourceTheme + '» и «' + targetTheme + '» в традиционной трактовке действуют совместно. Практический вопрос для самоанализа: где эти две потребности поддерживают друг друга, а где требуют баланса?';
  }
  return sourceRole + ' аспектирует ' + targetRole + ': темы «' + sourceTheme + '» символически влияют на проявление «' + targetTheme + '». Для практического анализа стоит проверить, помогает ли этот канал направлять намерения в конкретные действия или создаёт внутреннее напряжение.';
}

/** Synthesizes the three Jyotish reference points without treating them as interchangeable. */
export function getCoreChartSynthesis(chart: NatalChart): string {
  const firstHouse = chart.houses?.find((house) => house.house === 1);
  if (!firstHouse) return 'Недостаточно данных первого дома для объединённой интерпретации.';
  const ascendantLord = firstHouse.lord;
  const ascendantLordHouse = getPlanetHouse(chart, ascendantLord);
  const sunHouse = getPlanetHouse(chart, 'Sun');
  const moonHouse = getPlanetHouse(chart, 'Moon');
  const lines = [
    placementText(chart, ascendantLord, 'Базовый способ действовать (управитель Лагны)'),
    placementText(chart, 'Sun', 'Вектор воли и самореализации'),
    placementText(chart, 'Moon', 'Эмоциональные потребности и привычный способ адаптации'),
  ];
  const available = [
    { label: 'управитель Лагны', house: ascendantLordHouse },
    { label: 'Солнце', house: sunHouse },
    { label: 'Луна', house: moonHouse },
  ].filter((item): item is { label: string; house: number } => item.house !== null);
  const grouped = new Map<number, string[]>();
  for (const item of available) grouped.set(item.house, [...(grouped.get(item.house) ?? []), item.label]);
  const shared = [...grouped.entries()].filter(([, labels]) => labels.length > 1);
  const synthesis = shared.length
    ? 'Общая точка акцента: ' + shared.map(([house, labels]) => labels.join(' и ') + ' связаны с ' + house + '-м домом (' + HOUSE_THEMES[house] + '). В традиционной символике эта сфера объединяет несколько ключевых показателей карты.').join(' ')
    : 'Ключевые показатели распределены по разным домам. Это не противоречие: управитель Лагны описывает базовый способ действовать, Солнце — волю и самореализацию, Луна — эмоциональные потребности. Их темы раскрываются в разных жизненных областях.';
  const keyPlanets = [...new Set([ascendantLord, 'Sun', 'Moon'])];
  const directAspects = getPlanetToPlanetAspects(chart, keyPlanets);
  const relationshipText = directAspects.length
    ? 'Прямые связи между ключевыми показателями: ' + directAspects.map((aspect) =>
      (aspect.kind === 'conjunction'
        ? aspect.source + ' и ' + aspect.target + ' находятся в одном знаке (' + aspect.sourceHouse + '-й дом). Это соединение по знаку; точная сила соединения по градусному орбису здесь не оценивается. '
        : aspect.source + ' из ' + aspect.sourceHouse + '-го дома аспектирует ' + aspect.target + ' в ' + aspect.targetHouse + '-м доме (' + aspect.offset + '-й аспект). ')
      + describeCoreInteraction(aspect.sourceKey, aspect.targetKey, ascendantLord, aspect.kind)
    ).join(' ') + ' В этой схеме узлы не используют для прямых аспектов.'
    : 'Между управителем Лагны, Солнцем и Луной прямые соединения по знаку или классические взаимные аспекты по используемой схеме не обнаружены.';
  return lines.join('\n\n') + '\n\n' + synthesis + '\n\n' + relationshipText + '\n\nЭто обобщение традиционной астрологической символики, а не научная оценка личности или прогноз событий.';
}