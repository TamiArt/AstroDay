// [УТИЛИТА] Анализ благоприятности сфер жизни на день
import { PanchangData } from './panchang';
import { NatalChart, Aspect, getPlanetHouse, getLifeAreaHouses, DashaPeriod } from './astrology';
import { getPlanetName } from './planetUtils';

export interface LifeArea {
  id: string;
  name: string;
  score: number; // 0-100
  color: string;
  icon: string;
  description: string;
  recommendations: string[];
  natalPotential?: string; // Описание натального потенциала (если есть дома)
  todayInfluence?: string; // Описание влияния транзитов (если есть дома)
  dashaInfluence?: string; // Описание влияния Даши (если есть)
}

/**
 * Определить, какие сферы жизни усиливает данная планета Даши
 */
function getDashaPlanetInfluence(planet: string): Record<string, number> {
  const influences: Record<string, Record<string, number>> = {
    'Sun': { career: 10, creativity: 8, health: 6, spirituality: 5 },
    'Moon': { relationships: 10, family: 10, health: 6, spirituality: 5 },
    'Mars': { health: 10, career: 8, spirituality: 3 },
    'Mercury': { learning: 10, finances: 8, creativity: 6, career: 5 },
    'Jupiter': { finances: 10, learning: 10, spirituality: 10, career: 6 },
    'Venus': { relationships: 10, creativity: 10, family: 8, finances: 6 },
    'Saturn': { career: 10, spirituality: 8, health: 5 },
    'Rahu': { career: 8, finances: 6, learning: 5 },
    'Ketu': { spirituality: 10, health: 5, learning: 3 }
  };

  return influences[planet] || {};
}

/**
 * Рассчитать благоприятность каждой сферы жизни на основе астрологических данных
 * Веса: Даша 50% + Транзиты 40% + Панчанг 10%
 */
export function calculateDailyAreas(
  panchang: PanchangData,
  natalChart: NatalChart,
  currentChart: NatalChart,
  aspects: Aspect[],
  dasha?: DashaPeriod | null
): LifeArea[] {
  // Базовые баллы для каждой сферы
  const areas: Record<string, {
    base: number;
    dashaScore?: number;
    transitScore?: number;
    panchangScore?: number;
    natalPotential?: string;
    todayInfluence?: string;
    dashaInfluence?: string;
  }> = {
    career: { base: 0 },
    relationships: { base: 0 },
    health: { base: 0 },
    finances: { base: 0 },
    learning: { base: 0 },
    creativity: { base: 0 },
    spirituality: { base: 0 },
    family: { base: 0 }
  };

  // ========== ДАША ВЛИЯНИЕ (50% веса) ==========
  if (dasha) {
    const mahadashaInfluence = getDashaPlanetInfluence(dasha.planet);

    Object.keys(areas).forEach(areaId => {
      const influence = mahadashaInfluence[areaId] || 0;
      areas[areaId].dashaScore = influence * 5; // Максимум 50 (10 * 5)

      if (influence > 0) {
        areas[areaId].dashaInfluence = `Махадаша ${getPlanetName(dasha.planet)}: ${influence > 7 ? 'сильное' : influence > 4 ? 'умеренное' : 'слабое'} влияние на эту сферу (${areas[areaId].dashaScore}/50)`;
      }
    });
  }

  // ========== ТРАНЗИТЫ (40% веса) ==========
  if (natalChart.houses && natalChart.houses.length === 12) {
    const lifeAreaHouses = getLifeAreaHouses();

    Object.keys(areas).forEach(areaId => {
      const relevantHouses = lifeAreaHouses[areaId] || [];
      let transitInfluence = 0;
      const transitingPlanets: string[] = [];
      const houseLords: string[] = [];

      // Находим управителей релевантных домов
      relevantHouses.forEach(houseNum => {
        const house = natalChart.houses![houseNum - 1];
        const lord = house.lord;
        houseLords.push(lord);
      });

      // Анализ транзитов планет через дома
      relevantHouses.forEach(houseNum => {
        Object.entries(currentChart.planets).forEach(([planetName, planetPos]) => {
          const planetHouse = getPlanetHouse(planetPos.sign, natalChart.houses!);
          if (planetHouse === houseNum) {
            transitingPlanets.push(planetName);

            // Благоприятные транзиты
            if (planetName === 'Jupiter') transitInfluence += 10;
            else if (planetName === 'Venus') transitInfluence += 8;
            else if (planetName === 'Mercury') transitInfluence += 6;
            else if (planetName === 'Moon') transitInfluence += 5;
            else if (planetName === 'Sun') transitInfluence += 4;
            // Сложные транзиты
            else if (planetName === 'Saturn') transitInfluence -= 5;
            else if (planetName === 'Mars') transitInfluence += 3;
          }
        });
      });

      // Анализ аспектов транзитных планет к управителям домов
      aspects.forEach(aspect => {
        const isTransitAspect = aspect.context === 'transit' || aspect.isTransit || aspect.context === undefined;
        if (isTransitAspect && (houseLords.includes(aspect.planet1) || houseLords.includes(aspect.planet2))) {
          if (aspect.strength >= 70) {
            if (aspect.type === 'trine') transitInfluence += 8; // Трин - гармония
            else if (aspect.type === 'sextile') transitInfluence += 5; // Секстиль - мягкая поддержка
            else if (aspect.type === 'conjunction') transitInfluence += 6; // Соединение
            else if (aspect.type === 'opposition') transitInfluence -= 4; // Оппозиция - напряжение
            else if (aspect.type === 'square') transitInfluence -= 3; // Квадрат - вызов
          }
        }
      });

      // Учет накшатр управителей
      houseLords.forEach(lord => {
        const lordPosition = natalChart.planets[lord as keyof typeof natalChart.planets];
        if (lordPosition) {
          const favorableNakshatras = ['Rohini', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Pushya', 'Anuradha'];
          if (favorableNakshatras.includes(lordPosition.nakshatraName)) {
            transitInfluence += 3;
          }
        }
      });

      areas[areaId].transitScore = Math.min(40, Math.max(0, transitInfluence)); // 0-40 баллов

      // Описания для UI
      if (houseLords.length > 0) {
        areas[areaId].natalPotential = `Дома ${relevantHouses.join(', ')} управляются ${houseLords.join(', ')}`;
      }

      if (transitingPlanets.length > 0) {
        const aspectInfo = aspects.filter(a =>
          (a.context === 'transit' || a.isTransit || a.context === undefined) &&
          (houseLords.includes(a.planet1) || houseLords.includes(a.planet2))
        ).length;
        const planetNames = Array.from(new Set(transitingPlanets)).map(getPlanetName).join(', ');
        areas[areaId].todayInfluence = `Транзиты: ${planetNames} в домах ${relevantHouses.join(', ')}${aspectInfo > 0 ? `, ${aspectInfo} транзитных аспект(ов) к управителям` : ''}. Влияние: ${areas[areaId].transitScore}/40`;
      } else {
        areas[areaId].todayInfluence = `Нет значимых транзитов через дома ${relevantHouses.join(', ')} сегодня`;
      }
    });
  }

  // ========== ПАНЧАНГ (10% веса) ==========
  Object.keys(areas).forEach(areaId => {
    let panchangInfluence = 0;

    // Влияние Титхи (максимум ~4 балла)
    const tithiIndex = panchang.tithi.index;
    if (tithiIndex === 0) { // Шукла Пратипада - новые начинания
      if (areaId === 'career' || areaId === 'learning') panchangInfluence += 2;
      if (areaId === 'creativity') panchangInfluence += 1;
    } else if (tithiIndex === 1) { // Двития - накопление
      if (areaId === 'finances') panchangInfluence += 2;
      if (areaId === 'learning') panchangInfluence += 1;
    } else if (tithiIndex === 2) { // Тритья - движение
      if (areaId === 'career') panchangInfluence += 2;
      if (areaId === 'relationships' || areaId === 'health') panchangInfluence += 1;
    } else if (tithiIndex === 4) { // Панчами - знания
      if (areaId === 'learning') panchangInfluence += 3;
      if (areaId === 'creativity') panchangInfluence += 2;
      if (areaId === 'career') panchangInfluence += 1;
    } else if (tithiIndex === 6) { // Саптами - духовность
      if (areaId === 'spirituality') panchangInfluence += 3;
      if (areaId === 'health' || areaId === 'learning') panchangInfluence += 1;
    } else if (tithiIndex === 8) { // Навами - сила
      if (areaId === 'health') panchangInfluence += 3;
      if (areaId === 'career') panchangInfluence += 2;
      if (areaId === 'creativity') panchangInfluence += 1;
    } else if (tithiIndex === 10 || tithiIndex === 25) { // Экадаши - духовность
      if (areaId === 'spirituality') panchangInfluence += 4;
      if (areaId === 'health') panchangInfluence += 2;
      if (areaId === 'learning') panchangInfluence += 1;
    } else if (tithiIndex === 11) { // Двадаши - здоровье
      if (areaId === 'health') panchangInfluence += 3;
      if (areaId === 'family') panchangInfluence += 2;
      if (areaId === 'relationships') panchangInfluence += 1;
    } else if (tithiIndex === 14) { // Пурнима - завершение
      if (areaId === 'relationships' || areaId === 'spirituality' || areaId === 'family') panchangInfluence += 2;
    } else if (tithiIndex === 29) { // Амавасья - новые намерения и очищение
      if (areaId === 'spirituality') panchangInfluence += 3;
      if (areaId === 'health') panchangInfluence += 1;
    }

    // Влияние Вары (максимум ~4 балла)
    const vara = panchang.vara.planet;
    if (vara === 'Солнце') {
      if (areaId === 'career') panchangInfluence += 2;
      if (areaId === 'creativity') panchangInfluence += 1;
    } else if (vara === 'Луна') {
      if (areaId === 'relationships' || areaId === 'family') panchangInfluence += 2;
      if (areaId === 'spirituality') panchangInfluence += 1;
    } else if (vara === 'Марс') {
      if (areaId === 'health') panchangInfluence += 2;
      if (areaId === 'career') panchangInfluence += 1;
    } else if (vara === 'Меркурий') {
      if (areaId === 'learning') panchangInfluence += 3;
      if (areaId === 'finances' || areaId === 'creativity') panchangInfluence += 1;
    } else if (vara === 'Юпитер') {
      if (areaId === 'finances' || areaId === 'learning' || areaId === 'spirituality') panchangInfluence += 2;
    } else if (vara === 'Венера') {
      if (areaId === 'relationships') panchangInfluence += 3;
      if (areaId === 'creativity') panchangInfluence += 2;
      if (areaId === 'family') panchangInfluence += 1;
    } else if (vara === 'Сатурн') {
      if (areaId === 'career' || areaId === 'health' || areaId === 'spirituality') panchangInfluence += 1;
    }

    // Влияние Йоги (максимум ~2 балла)
    const yoga = panchang.yoga.name;
    if (['Прити', 'Саубхагья', 'Шобхана', 'Шубха'].includes(yoga)) {
      panchangInfluence += 1; // Благоприятные йоги усиливают все сферы
    } else if (['Аюшман', 'Сиддхи', 'Сиддха'].includes(yoga)) {
      if (areaId === 'health' || areaId === 'career') panchangInfluence += 2;
    } else if (['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата'].includes(yoga)) {
      panchangInfluence -= 2; // Неблагоприятные йоги снижают баллы
    }

    areas[areaId].panchangScore = Math.min(10, Math.max(0, panchangInfluence)); // 0-10 баллов
  });

  // Рассчитываем финальные баллы
  // Формула: Даша (50%) + Транзиты (40%) + Панчанг (10%) = 0-100 баллов
  const calculateScore = (area: {
    dashaScore?: number;
    transitScore?: number;
    panchangScore?: number;
  }) => {
    const dashaPoints = area.dashaScore || 0; // 0-50
    const transitPoints = area.transitScore || 0; // 0-40
    const panchangPoints = area.panchangScore || 0; // 0-10

    // Если нет персонализации (нет домов/Даши), используем только Панчанг
    // В этом случае масштабируем Панчанг до 100 баллов
    if (area.transitScore === undefined && area.dashaScore === undefined) {
      return Math.min(100, panchangPoints * 10); // 0-10 → 0-100
    }

    const total = dashaPoints + transitPoints + panchangPoints;
    return Math.max(0, Math.min(100, Math.round(total)));
  };

  // Генерируем рекомендации на основе баллов
  const getRecommendations = (
    areaId: string,
    score: number,
    area: {
      dashaInfluence?: string;
      todayInfluence?: string;
      natalPotential?: string;
    }
  ): string[] => {
    const recs: Record<string, { high: string[]; low: string[] }> = {
      career: {
        high: ['Начинайте новые проекты', 'Проявляйте инициативу', 'Общайтесь с руководством'],
        low: ['Работайте над текущими задачами', 'Избегайте важных решений', 'Планируйте будущее']
      },
      relationships: {
        high: ['Проводите время с близкими', 'Признавайтесь в чувствах', 'Разрешайте конфликты'],
        low: ['Дайте себе время наедине', 'Не принимайте важных решений', 'Будьте терпеливы']
      },
      health: {
        high: ['Занимайтесь спортом', 'Начинайте оздоровление', 'Активно двигайтесь'],
        low: ['Больше отдыхайте', 'Избегайте перегрузок', 'Восстанавливайтесь']
      },
      finances: {
        high: ['Инвестируйте', 'Планируйте крупные покупки', 'Ведите переговоры'],
        low: ['Экономьте', 'Отложите покупки', 'Планируйте бюджет']
      },
      learning: {
        high: ['Учитесь новому', 'Читайте книги', 'Проходите курсы'],
        low: ['Повторяйте пройденное', 'Планируйте обучение', 'Отдохните от учёбы']
      },
      creativity: {
        high: ['Творите', 'Начинайте новые проекты', 'Экспериментируйте'],
        low: ['Отдохните от творчества', 'Ищите вдохновение', 'Планируйте проекты']
      },
      spirituality: {
        high: ['Медитируйте', 'Практикуйте йогу', 'Изучайте философию'],
        low: ['Делайте простые практики', 'Отдохните', 'Планируйте ретрит']
      },
      family: {
        high: ['Проводите время с семьёй', 'Укрепляйте связи', 'Решайте семейные вопросы'],
        low: ['Дайте себе личное время', 'Будьте терпеливы', 'Планируйте встречи']
      }
    };

    const base = score >= 65 ? recs[areaId].high : recs[areaId].low;
    const reasons = [area.dashaInfluence, area.todayInfluence, area.natalPotential].filter((value): value is string => Boolean(value));

    if (reasons.length === 0) return base;

    const tone = score >= 65
      ? 'Сфера поддержана, можно действовать увереннее'
      : score >= 45
        ? 'Сфера рабочая, но лучше двигаться постепенно'
        : 'Сфера требует мягкого режима и меньшего давления';

    return [
      `${tone}: ${reasons[0]}`,
      reasons[1] ? `Дополнительный фактор: ${reasons[1]}` : base[0],
      base[1],
    ].filter(Boolean);
  };

  // Формируем результат
  const result: LifeArea[] = [
    {
      id: 'career',
      name: 'Карьера и достижения',
      score: calculateScore(areas.career),
      color: '#6b4ce6',
      icon: '💼',
      description: 'Профессиональный рост, успех в делах, достижение целей',
      recommendations: getRecommendations('career', calculateScore(areas.career), areas.career),
      natalPotential: areas.career.natalPotential,
      todayInfluence: areas.career.todayInfluence,
      dashaInfluence: areas.career.dashaInfluence
    },
    {
      id: 'relationships',
      name: 'Отношения и любовь',
      score: calculateScore(areas.relationships),
      color: '#ec4899',
      icon: '💕',
      description: 'Романтические отношения, социальные связи, партнёрство',
      recommendations: getRecommendations('relationships', calculateScore(areas.relationships), areas.relationships),
      natalPotential: areas.relationships.natalPotential,
      todayInfluence: areas.relationships.todayInfluence,
      dashaInfluence: areas.relationships.dashaInfluence
    },
    {
      id: 'health',
      name: 'Здоровье и энергия',
      score: calculateScore(areas.health),
      color: '#10b981',
      icon: '💪',
      description: 'Физическое здоровье, энергия, жизненная сила',
      recommendations: getRecommendations('health', calculateScore(areas.health), areas.health),
      natalPotential: areas.health.natalPotential,
      todayInfluence: areas.health.todayInfluence,
      dashaInfluence: areas.health.dashaInfluence
    },
    {
      id: 'finances',
      name: 'Финансы и ресурсы',
      score: calculateScore(areas.finances),
      color: '#f59e0b',
      icon: '💰',
      description: 'Деньги, инвестиции, материальное благополучие',
      recommendations: getRecommendations('finances', calculateScore(areas.finances), areas.finances),
      natalPotential: areas.finances.natalPotential,
      todayInfluence: areas.finances.todayInfluence,
      dashaInfluence: areas.finances.dashaInfluence
    },
    {
      id: 'learning',
      name: 'Обучение и знания',
      score: calculateScore(areas.learning),
      color: '#3b82f6',
      icon: '📚',
      description: 'Образование, интеллект, новые навыки',
      recommendations: getRecommendations('learning', calculateScore(areas.learning), areas.learning),
      natalPotential: areas.learning.natalPotential,
      todayInfluence: areas.learning.todayInfluence,
      dashaInfluence: areas.learning.dashaInfluence
    },
    {
      id: 'creativity',
      name: 'Творчество и самовыражение',
      score: calculateScore(areas.creativity),
      color: '#a78bfa',
      icon: '🎨',
      description: 'Искусство, креативность, самовыражение',
      recommendations: getRecommendations('creativity', calculateScore(areas.creativity), areas.creativity),
      natalPotential: areas.creativity.natalPotential,
      todayInfluence: areas.creativity.todayInfluence,
      dashaInfluence: areas.creativity.dashaInfluence
    },
    {
      id: 'spirituality',
      name: 'Духовность и медитация',
      score: calculateScore(areas.spirituality),
      color: '#8b5cf6',
      icon: '🧘',
      description: 'Духовные практики, медитация, внутренний рост',
      recommendations: getRecommendations('spirituality', calculateScore(areas.spirituality), areas.spirituality),
      natalPotential: areas.spirituality.natalPotential,
      todayInfluence: areas.spirituality.todayInfluence,
      dashaInfluence: areas.spirituality.dashaInfluence
    },
    {
      id: 'family',
      name: 'Семья и дом',
      score: calculateScore(areas.family),
      color: '#14b8a6',
      icon: '🏡',
      description: 'Семейные отношения, дом, уют',
      recommendations: getRecommendations('family', calculateScore(areas.family), areas.family),
      natalPotential: areas.family.natalPotential,
      todayInfluence: areas.family.todayInfluence,
      dashaInfluence: areas.family.dashaInfluence
    }
  ];

  // Сортируем по баллам (от высокого к низкому)
  return result.sort((a, b) => b.score - a.score);
}
