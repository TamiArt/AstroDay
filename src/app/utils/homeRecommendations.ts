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
    element: 'Вода и пространство',
    focus: 'Ясность, обучение, созерцание и духовные практики',
    colors: ['белый', 'светло-голубой'],
    place: 'Северо-восток',
    avoid: 'загромождение и тяжёлое хранение',
    practice: 'дневной свет, чистая поверхность, место для чтения или тихой практики',
  },
  {
    zoneId: 'east',
    label: 'Восток',
    element: 'Свет и воздух',
    focus: 'Жизненная сила, обновление и ежедневный ритм',
    colors: ['светло-зелёный', 'натуральные оттенки'],
    place: 'Восток',
    avoid: 'закрытые окна и засохшие растения',
    practice: 'естественный свет, проветривание, здоровые растения',
  },
  {
    zoneId: 'southeast',
    label: 'Юго-восток',
    element: 'Огонь',
    focus: 'Агни, кухня, приготовление пищи и бытовая энергия',
    colors: ['тёплые нейтральные', 'терракотовый'],
    place: 'Юго-восток',
    avoid: 'неисправная проводка, плохая вентиляция и беспорядок на кухне',
    practice: 'безопасная плита, чистая рабочая поверхность, исправная вытяжка',
  },
  {
    zoneId: 'south',
    label: 'Юг',
    element: 'Огонь и земля',
    focus: 'Дисциплина, границы и устойчивость',
    colors: ['песочный', 'приглушённый красный'],
    place: 'Юг',
    avoid: 'загромождённые проходы и неисправные двери',
    practice: 'понятная организация хранения, исправные двери и комфортное освещение',
  },
  {
    zoneId: 'southwest',
    label: 'Юго-запад',
    element: 'Земля',
    focus: 'Опора, стабильность, отдых и партнёрство',
    colors: ['песочный', 'бежевый', 'приглушённо-розовый'],
    place: 'Юго-запад',
    avoid: 'превращение спальни в склад или постоянный офис',
    practice: 'спокойная спальня, приватность, парные предметы только если они приятны жильцам',
  },
  {
    zoneId: 'west',
    label: 'Запад',
    element: 'Земля и пространство',
    focus: 'Завершение дел, результаты и творчество',
    colors: ['белый', 'нейтральные оттенки'],
    place: 'Запад',
    avoid: 'накопление сломанных вещей и незавершённых проектов',
    practice: 'организованное место для творчества и завершения задач',
  },
  {
    zoneId: 'northwest',
    label: 'Северо-запад',
    element: 'Воздух',
    focus: 'Движение, коммуникация, гости и поддержка',
    colors: ['светло-серый', 'белый'],
    place: 'Северо-запад',
    avoid: 'запертые двери и перекрытые проходы',
    practice: 'свободные маршруты, проветривание, удобная зона для общения',
  },
  {
    zoneId: 'north',
    label: 'Север',
    element: 'Вода',
    focus: 'Кубера, ресурсы, возможности, работа и достаток',
    colors: ['синий', 'зелёный', 'нейтральные оттенки'],
    place: 'Север',
    avoid: 'захламление, протечки и неисправное освещение',
    practice: 'свободный сектор, порядок в документах, удобное рабочее место',
  },
  {
    zoneId: 'center',
    label: 'Центр',
    element: 'Пространство',
    focus: 'Брахмастан, целостность и свободное движение',
    colors: ['светлые нейтральные'],
    place: 'Центр',
    avoid: 'массивные препятствия и загромождённые проходы',
    practice: 'свободное пространство, чистота и комфортное освещение',
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
