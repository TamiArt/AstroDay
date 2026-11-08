import type { NatalChart } from './astrology';
import { describeHouseDrishti, evaluatePlanetCondition, getPlanetHouse } from './natalStrengthAnalysis';

const SIGN_NAMES = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
const PLANET_THEMES: Record<string, string> = {
  Sun: 'управление, самостоятельность, авторство и ответственность',
  Moon: 'эмоциональная восприимчивость, забота, привычки и потребность в безопасности',
  Mars: 'инициатива, техническое действие, конкуренция и защита границ',
  Mercury: 'анализ, обучение, коммуникация, данные и систематизация',
  Jupiter: 'обучение, наставничество, смысловые ориентиры и расширение знаний',
  Venus: 'отношения, эстетика, творчество, согласование интересов и ценности',
  Saturn: 'структура, дисциплина, качество, долгосрочная работа и ответственность',
  Rahu: 'эксперименты, технологии, нестандартные задачи и усиление амбиций',
  Ketu: 'специализация, исследование, дистанцирование и углублённое изучение',
};
const HOUSE_THEMES: Record<number, string> = {
  1: 'личность, самостоятельность, тело и способ начинать новое',
  2: 'личные ресурсы, накопления, речь и семейные ценности',
  3: 'коммуникация, обучение навыкам, короткие поездки и собственные усилия',
  4: 'дом, семья, недвижимость, образование и внутренняя опора',
  5: 'творчество, обучение, дети, интеллектуальные проекты и самовыражение',
  6: 'работа на каждый день, сервис, здоровье, обязанности и решение проблем',
  7: 'партнёрство, клиенты, договорённости и взаимодействие один на один',
  8: 'общие ресурсы, кризисы, трансформации, исследования и конфиденциальность',
  9: 'высшее образование, мировоззрение, наставники, право и дальние поездки',
  10: 'профессия, ответственность, статус и общественная реализация',
  11: 'доходы от деятельности, профессиональные связи, сообщества и долгосрочные цели',
  12: 'уединение, удалённая и международная среда, расходы, восстановление и закулисная работа',
};
const PLANET_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер',
  Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

function conditionText(chart: NatalChart, name: string): string {
  const condition = evaluatePlanetCondition(chart, name);
  return condition ? 'Достоинство: ' + condition.label + '. ' + condition.explanation : 'Достоинство планеты не удалось определить по доступным данным.';
}

function aspectText(chart: NatalChart, house: number): string {
  const aspects = describeHouseDrishti(chart, house);
  return aspects.length ? 'Аспекты на эту сферу: ' + aspects.join(' ') : 'По используемой схеме классической граха-дришти прямые аспекты на этот дом не найдены.';
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
  return 'Лагна в знаке ' + sign + '. Её управитель — ' + (PLANET_RU[lord] ?? lord) + ': ' + (PLANET_THEMES[lord] ?? 'качества планеты') + '. Он расположен в ' + (house ? house + '-м доме — ' + houseMeaning : 'доме, который не удалось определить') + nakshatra + '. Поэтому темы личности и самостоятельных решений в этой карте символически связываются с ' + houseMeaning + '. ' + conditionText(chart, lord) + ' ' + aspectText(chart, house ?? 1);
}

export function getMoonHouseFocus(chart: NatalChart, house: number): string {
  const moon = chart.planets.Moon;
  const houseMeaning = HOUSE_THEMES[house] ?? 'сферу соответствующего дома';
  const sign = SIGN_NAMES[moon.sign] ?? moon.signName;
  const nakshatra = moon.nakshatraName ? ' Накшатра ' + moon.nakshatraName + ', пада ' + moon.pada + ', добавляет индивидуальный символический оттенок; это не отдельный психологический диагноз.' : '';
  return 'Луна в ' + sign + ', ' + house + '-м доме: эмоциональный комфорт и привычные способы восстановления особенно связаны с темами «' + houseMeaning + '». ' + PLANET_THEMES.Moon + '. ' + conditionText(chart, 'Moon') + nakshatra + ' ' + aspectText(chart, house);
}
