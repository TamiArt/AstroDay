import { calculateDasha, getCurrentAntardasha, NatalChart } from './astrology';
import { PanchangData } from './panchang';
import { getPlanetName } from './planetUtils';
import { analyzeNatalChartForHome, getPersonalizedZoneAdvice } from './homeZoneCalculations';

export interface HomeZoneRecommendation {
  zoneId: string;
  label: string;
  element: string;
  focus: string;
  colors: string[];
  place: string;
  avoid: string;
  practice: string;
}

export interface HomeZoneAnalysis {
  zoneId: string;
  label: string;
  element: string;
  owner: string;
  highlight: string;
  advice: string;
  avoid: string;
  colors: string[];
  practice: string;
  personalization: string;
}

export interface HomePersonalizedResult {
  primaryNote: string;
  planetaryHourNote: string;
  panchangNote: string;
  emphasizedZones: string[];
  zoneAnalysis: Record<string, HomeZoneAnalysis>;
}

export const BAGUA_ZONES: HomeZoneRecommendation[] = [
  {
    zoneId: 'wealth',
    label: 'Зона богатства',
    element: 'Дерево',
    focus: 'Изобилие, деньги, инвестиции',
    colors: ['зеленый', 'фиолетовый'],
    place: 'Северо-восток/Юго-восток',
    avoid: 'пустые участки и загроможденный угол',
    practice: 'растения, кристаллы, фонтан',
  },
  {
    zoneId: 'fame',
    label: 'Репутация и слава',
    element: 'Огонь',
    focus: 'Репутация, видимость, голос',
    colors: ['красный', 'оранжевый'],
    place: 'Юг',
    avoid: 'грубые металлы и затененные участки',
    practice: 'свечи, освещение, акценты огня',
  },
  {
    zoneId: 'love',
    label: 'Любовь и партнерство',
    element: 'Земля',
    focus: 'Отношения, близость, пара',
    colors: ['розовый', 'бежевый'],
    place: 'Юго-запад',
    avoid: 'одиночные предметы и холодные детали',
    practice: 'две свечи, пара предметов, мягкие ткани',
  },
  {
    zoneId: 'family',
    label: 'Семья и здоровье',
    element: 'Дерево',
    focus: 'Семья, корни, поддержка',
    colors: ['зеленый', 'коричневый'],
    place: 'Восток',
    avoid: 'мусор, беспорядок, мокрые зоны',
    practice: 'растения, семейные фото, натуральные материалы',
  },
  {
    zoneId: 'health',
    label: 'Центр и здоровье',
    element: 'Земля',
    focus: 'Баланс, здоровье, стабильность',
    colors: ['желтый', 'бежевый'],
    place: 'Центр',
    avoid: 'приподнятые предметы, темные углы',
    practice: 'медитация, кристаллы, ровные поверхности',
  },
  {
    zoneId: 'children',
    label: 'Творчество и дети',
    element: 'Металл',
    focus: 'Творчество, дети, проекты',
    colors: ['белый', 'серебристый'],
    place: 'Запад',
    avoid: 'старые вещи и нерабочие гаджеты',
    practice: 'легкие формы, искусство, вдохновляющие детали',
  },
  {
    zoneId: 'knowledge',
    label: 'Знания и мудрость',
    element: 'Земля',
    focus: 'Учеба, внутренний рост, планирование',
    colors: ['синий', 'черный'],
    place: 'Северо-восток',
    avoid: 'загроможденные места для работы',
    practice: 'книги, письменный стол, спокойные цвета',
  },
  {
    zoneId: 'career',
    label: 'Карьера и путь',
    element: 'Вода',
    focus: 'Работа, путь, поток',
    colors: ['черный', 'темно-синий'],
    place: 'Север',
    avoid: 'перекрытие входа и грязь',
    practice: 'вода, чистота, ровные дорожки',
  },
  {
    zoneId: 'helpful',
    label: 'Помощь и поддержка',
    element: 'Металл',
    focus: 'Союзники, менторы, ресурсы',
    colors: ['серебристый', 'серый'],
    place: 'Северо-запад',
    avoid: 'запертые двери, тяжелые вещи',
    practice: 'знаки благодарности, приглашающие предметы',
  },
];

export const VASTU_ZONES: HomeZoneRecommendation[] = [
  {
    zoneId: 'northeast',
    label: 'Северо-восток',
    element: 'Эфир',
    focus: 'Духовность, изучение, новые начинания',
    colors: ['светло-голубой', 'белый'],
    place: 'Северо-восток',
    avoid: 'мусор, тяжелые объекты',
    practice: 'мантры, ясные предметы, чистота',
  },
  {
    zoneId: 'east',
    label: 'Восток',
    element: 'Дерево',
    focus: 'Здоровье, семья, рост',
    colors: ['зеленый', 'светло-коричневый'],
    place: 'Восток',
    avoid: 'дряблые растения, сломанные вещи',
    practice: 'растения, природные текстуры, свет',
  },
  {
    zoneId: 'southeast',
    label: 'Юго-восток',
    element: 'Огонь',
    focus: 'Богатство, отношения, процветание',
    colors: ['оранжевый', 'золотой'],
    place: 'Юго-восток',
    avoid: 'пустые углы, бессистемность',
    practice: 'огонь, свечи, теплые материалы',
  },
  {
    zoneId: 'south',
    label: 'Юг',
    element: 'Огонь',
    focus: 'Слава, уверенность, энергия',
    colors: ['красный', 'пурпурный'],
    place: 'Юг',
    avoid: 'тусклое освещение, хаос',
    practice: 'свет, образы, динамика',
  },
  {
    zoneId: 'southwest',
    label: 'Юго-запад',
    element: 'Земля',
    focus: 'Партнёрство, стабильность, поддержка',
    colors: ['розовый', 'песочный'],
    place: 'Юго-запад',
    avoid: 'незавершенные проекты, сильные воды',
    practice: 'парные предметы, мягкие текстуры, отдых',
  },
  {
    zoneId: 'west',
    label: 'Запад',
    element: 'Металл',
    focus: 'Творчество, дети, идеи',
    colors: ['белый', 'металлик'],
    place: 'Запад',
    avoid: 'необходимость в серьезной работе',
    practice: 'творчество, свет, мотивирующие предметы',
  },
  {
    zoneId: 'northwest',
    label: 'Северо-запад',
    element: 'Металл',
    focus: 'Связи, движение, помощь',
    colors: ['серый', 'белый'],
    place: 'Северо-запад',
    avoid: 'тяжелые вещи, запертые пути',
    practice: 'активные контакты, символы поддержки',
  },
  {
    zoneId: 'north',
    label: 'Север',
    element: 'Вода',
    focus: 'Карьера, путь, поток',
    colors: ['темно-синий', 'черный'],
    place: 'Север',
    avoid: 'грязь, застой',
    practice: 'вода, чистота, открытые пространства',
  },
  {
    zoneId: 'center',
    label: 'Центр',
    element: 'Земля',
    focus: 'Баланс, здоровье, дом',
    colors: ['желтый', 'бежевый'],
    place: 'Центр',
    avoid: 'непорядок, туманность',
    practice: 'медитация, натуральные текстуры',
  },
];

const DASHAS_TO_ZONES: Record<string, string> = {
  Venus: 'southeast',
  Jupiter: 'northeast',
  Mercury: 'east',
  Sun: 'south',
  Moon: 'north',
  Mars: 'southwest',
  Saturn: 'northwest',
  Rahu: 'west',
  Ketu: 'center',
};

const PLANETARY_HOUR_ZONES: Record<string, string> = {
  Jupiter: 'northeast',
  Venus: 'southeast',
  Mercury: 'east',
  Sun: 'south',
  Moon: 'north',
  Mars: 'southwest',
  Saturn: 'northwest',
};

function findZone(zoneId: string): HomeZoneRecommendation | undefined {
  return VASTU_ZONES.find(zone => zone.zoneId === zoneId) || BAGUA_ZONES.find(zone => zone.zoneId === zoneId);
}

export function getHomePersonalizedRecommendations(
  natalChart: NatalChart,
  date: Date,
  panchang: PanchangData,
  planetaryHour: string
): HomePersonalizedResult {
  const moonNakshatra = Math.floor(natalChart.planets.Moon.siderealLon / (360 / 27));
  const dasha = calculateDasha(natalChart.date, moonNakshatra, date, natalChart.planets.Moon.siderealLon);
  const antardasha = getCurrentAntardasha(dasha, date);
  const dashaZoneId = DASHAS_TO_ZONES[dasha.planet] ?? 'center';
  const hourZoneId = PLANETARY_HOUR_ZONES[planetaryHour] ?? 'center';

  const emphasis = new Set<string>();
  emphasis.add(dashaZoneId);
  emphasis.add(hourZoneId);
  if (antardasha) {
    const antZone = DASHAS_TO_ZONES[antardasha.planet];
    if (antZone) emphasis.add(antZone);
  }

  // Анализируем натальную карту для персонализации
  const { weakPlanets, strongPlanets } = analyzeNatalChartForHome(natalChart);

  const panchangNote = panchang.tithi.index === 14
    ? 'Полнолуние усиливает работу с завершением и благодарностью, особенно в центральных и южных зонах.'
    : panchang.tithi.index === 29
      ? 'Новолуние благоприятно для очищения и намерений, особенно в северо-востоке и центре.'
      : panchang.tithi.index === 10 || panchang.tithi.index === 25
        ? 'Экадаши поддерживает духовные практики и гармонизацию пространства.'
        : `Сегодня ${panchang.tithi.name.toLowerCase()} — действуйте мягко и наблюдайте за изменениями.`;

  const planetaryHourNote = PLANETARY_HOUR_ZONES[planetaryHour]
    ? `Сейчас час ${planetaryHour}. Это хорошее время для активации зоны ${PLANETARY_HOUR_ZONES[planetaryHour]} — особенно полезны легкие изменения.`
    : `Сейчас час ${planetaryHour}. Используйте энергию дня для гармонизации дома.`;

  const primaryNote = `В настоящий момент длительная Даша ${getPlanetName(dasha.planet)}${antardasha ? ` в под-периоде ${getPlanetName(antardasha.planet)}` : ''}. Это усиливает ${findZone(dashaZoneId)?.focus || 'важные зоны'} в доме.${weakPlanets.length > 0 ? ` Слабые планеты: ${weakPlanets.join(', ')} — обратите особое внимание на их зоны.` : ''}`;

  const zoneAnalysis: Record<string, HomeZoneAnalysis> = {};
  [...BAGUA_ZONES, ...VASTU_ZONES].forEach((zone) => {
    const isEmphasized = emphasis.has(zone.zoneId);
    
    // Получаем персонализированный совет для слабых планет
    let personalizedAdvice = '';
    for (const weakPlanet of weakPlanets) {
      const advice = getPersonalizedZoneAdvice([weakPlanet], zone.zoneId);
      if (advice) {
        personalizedAdvice = advice;
        break;
      }
    }

    const personalization = isEmphasized
      ? `Этот сектор сейчас усиливается за счёт Даши ${getPlanetName(dasha.planet)} и часового правителя ${planetaryHour}.`
      : personalizedAdvice
        ? personalizedAdvice
        : `В этом секторе полезно сохранять спокойствие и порядок.`;

    zoneAnalysis[zone.zoneId] = {
      zoneId: zone.zoneId,
      label: zone.label,
      element: zone.element,
      owner: getPlanetName(dasha.planet),
      highlight: zone.focus,
      advice: `${zone.place}: используйте ${zone.colors.join(', ')} и ${zone.practice}.`, 
      avoid: zone.avoid,
      colors: zone.colors,
      practice: zone.practice,
      personalization,
    };
  });

  return {
    primaryNote,
    planetaryHourNote,
    panchangNote,
    emphasizedZones: Array.from(emphasis),
    zoneAnalysis,
  };
}

export const HOME_LEARNING_CARDS = [
  {
    title: 'Фэн-шуй зона богатства',
    text: 'Юго-восток отвечает за изобилие. Поддерживайте этот сектор чистым, добавьте растения и воду.',
  },
  {
    title: 'Васту северо-восток',
    text: 'Северо-восток отвечает за знания и духовные намерения. Здесь полезны книги, свет и легкая обстановка.',
  },
  {
    title: 'Центр дома',
    text: 'Центр — ядро здоровья. Сохраняйте его свободным от беспорядка и тяжелых предметов.',
  },
  {
    title: 'Управитель зоны любви',
    text: 'Юго-запад важен для партнерства. Добавляйте парные предметы и мягкие текстуры.',
  },
  {
    title: 'Планетарные часы',
    text: 'Часы планет добавляют ритм: час Юпитера подходит для мудрых решений, час Венеры — для красоты и отношений.',
  },
];
