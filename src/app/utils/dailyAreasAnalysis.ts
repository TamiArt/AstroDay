import type { Aspect, DashaPeriod, NatalChart } from './astrology';
import { getLifeAreaHouses, getPlanetHouse } from './astrology';
import {
  calculateDailyAreaScore,
  FAVORABLE_NAKSHATRAS,
  getAspectWeight,
  getDashaPlanetInfluence,
  getPanchangInfluence,
  getTransitPlanetWeight,
  LIFE_AREA_IDS,
  type LifeAreaId,
} from './dailyAreaScoring';
import type { PanchangData } from './panchang';
import { getPlanetName } from './planetUtils';

export interface LifeArea {
  id: string;
  name: string;
  score: number;
  color: string;
  icon: string;
  description: string;
  recommendations: string[];
  natalPotential?: string;
  todayInfluence?: string;
  dashaInfluence?: string;
}

interface AreaState {
  dashaScore?: number;
  transitScore?: number;
  panchangScore?: number;
  natalPotential?: string;
  todayInfluence?: string;
  dashaInfluence?: string;
}

const AREA_META: Record<LifeAreaId, Omit<LifeArea, 'score' | 'recommendations'>> = {
  career: { id: 'career', name: 'Карьера и достижения', color: '#6b4ce6', icon: '💼', description: 'Профессиональный рост, успех в делах, достижение целей' },
  relationships: { id: 'relationships', name: 'Отношения и любовь', color: '#ec4899', icon: '💕', description: 'Романтические отношения, социальные связи, партнёрство' },
  health: { id: 'health', name: 'Здоровье и энергия', color: '#10b981', icon: '💪', description: 'Физическое здоровье, энергия, жизненная сила' },
  finances: { id: 'finances', name: 'Финансы и ресурсы', color: '#f59e0b', icon: '💰', description: 'Деньги, инвестиции, материальное благополучие' },
  learning: { id: 'learning', name: 'Обучение и знания', color: '#3b82f6', icon: '📚', description: 'Образование, интеллект, новые навыки' },
  creativity: { id: 'creativity', name: 'Творчество и самовыражение', color: '#a78bfa', icon: '🎨', description: 'Искусство, креативность, самовыражение' },
  spirituality: { id: 'spirituality', name: 'Духовность и медитация', color: '#8b5cf6', icon: '🧘', description: 'Духовные практики, медитация, внутренний рост' },
  family: { id: 'family', name: 'Семья и дом', color: '#14b8a6', icon: '🏡', description: 'Семейные отношения, дом, уют' },
};

const RECOMMENDATIONS: Record<LifeAreaId, { high: string[]; low: string[] }> = {
  career: { high: ['Начинайте новые проекты', 'Проявляйте инициативу', 'Общайтесь с руководством'], low: ['Работайте над текущими задачами', 'Избегайте важных решений', 'Планируйте будущее'] },
  relationships: { high: ['Проводите время с близкими', 'Признавайтесь в чувствах', 'Разрешайте конфликты'], low: ['Дайте себе время наедине', 'Не принимайте важных решений', 'Будьте терпеливы'] },
  health: { high: ['Занимайтесь спортом', 'Начинайте оздоровление', 'Активно двигайтесь'], low: ['Больше отдыхайте', 'Избегайте перегрузок', 'Восстанавливайтесь'] },
  finances: { high: ['Инвестируйте', 'Планируйте крупные покупки', 'Ведите переговоры'], low: ['Экономьте', 'Отложите покупки', 'Планируйте бюджет'] },
  learning: { high: ['Учитесь новому', 'Читайте книги', 'Проходите курсы'], low: ['Повторяйте пройденное', 'Планируйте обучение', 'Отдохните от учёбы'] },
  creativity: { high: ['Творите', 'Начинайте новые проекты', 'Экспериментируйте'], low: ['Отдохните от творчества', 'Ищите вдохновение', 'Планируйте проекты'] },
  spirituality: { high: ['Медитируйте', 'Практикуйте йогу', 'Изучайте философию'], low: ['Делайте простые практики', 'Отдохните', 'Планируйте ретрит'] },
  family: { high: ['Проводите время с семьёй', 'Укрепляйте связи', 'Решайте семейные вопросы'], low: ['Дайте себе личное время', 'Будьте терпеливы', 'Планируйте встречи'] },
};

function getRecommendations(areaId: LifeAreaId, score: number, area: AreaState): string[] {
  const base = score >= 65 ? RECOMMENDATIONS[areaId].high : RECOMMENDATIONS[areaId].low;
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
  ];
}

export function calculateDailyAreas(
  panchang: PanchangData,
  natalChart: NatalChart,
  currentChart: NatalChart,
  aspects: Aspect[],
  dasha?: DashaPeriod | null
): LifeArea[] {
  const areas = Object.fromEntries(LIFE_AREA_IDS.map((id) => [id, {}])) as Record<LifeAreaId, AreaState>;

  if (dasha) {
    const influenceMap = getDashaPlanetInfluence(dasha.planet);
    for (const areaId of LIFE_AREA_IDS) {
      const influence = influenceMap[areaId] ?? 0;
      areas[areaId].dashaScore = influence * 5;
      if (influence > 0) {
        const strength = influence > 7 ? 'сильное' : influence > 4 ? 'умеренное' : 'слабое';
        areas[areaId].dashaInfluence = `Махадаша ${getPlanetName(dasha.planet)}: ${strength} влияние на эту сферу (${areas[areaId].dashaScore}/50)`;
      }
    }
  }

  if (natalChart.houses?.length === 12) {
    const lifeAreaHouses = getLifeAreaHouses();
    for (const areaId of LIFE_AREA_IDS) {
      const relevantHouses = lifeAreaHouses[areaId] ?? [];
      let transitInfluence = 0;
      const transitingPlanets: string[] = [];
      const houseLords = relevantHouses.map((houseNumber) => natalChart.houses![houseNumber - 1].lord);

      for (const houseNumber of relevantHouses) {
        for (const [planetName, planetPosition] of Object.entries(currentChart.planets)) {
          if (getPlanetHouse(planetPosition.sign, natalChart.houses) === houseNumber) {
            transitingPlanets.push(planetName);
            transitInfluence += getTransitPlanetWeight(planetName);
          }
        }
      }

      for (const aspect of aspects) {
        const isTransitAspect = aspect.context === 'transit' || aspect.isTransit || aspect.context === undefined;
        if (isTransitAspect && (houseLords.includes(aspect.planet1) || houseLords.includes(aspect.planet2))) {
          transitInfluence += getAspectWeight(aspect.type, aspect.strength);
        }
      }

      for (const lord of houseLords) {
        const lordPosition = natalChart.planets[lord as keyof typeof natalChart.planets];
        if (lordPosition && FAVORABLE_NAKSHATRAS.has(lordPosition.nakshatraName)) {
          transitInfluence += 3;
        }
      }

      areas[areaId].transitScore = Math.min(40, Math.max(0, transitInfluence));
      if (houseLords.length > 0) {
        areas[areaId].natalPotential = `Дома ${relevantHouses.join(', ')} управляются ${houseLords.join(', ')}`;
      }

      if (transitingPlanets.length > 0) {
        const aspectInfo = aspects.filter((aspect) =>
          (aspect.context === 'transit' || aspect.isTransit || aspect.context === undefined)
          && (houseLords.includes(aspect.planet1) || houseLords.includes(aspect.planet2))
        ).length;
        const planetNames = Array.from(new Set(transitingPlanets)).map(getPlanetName).join(', ');
        areas[areaId].todayInfluence = `Транзиты: ${planetNames} в домах ${relevantHouses.join(', ')}${aspectInfo > 0 ? `, ${aspectInfo} транзитных аспект(ов) к управителям` : ''}. Влияние: ${areas[areaId].transitScore}/40`;
      } else {
        areas[areaId].todayInfluence = `Нет значимых транзитов через дома ${relevantHouses.join(', ')} сегодня`;
      }
    }
  }

  for (const areaId of LIFE_AREA_IDS) {
    areas[areaId].panchangScore = getPanchangInfluence(areaId, panchang);
  }

  return LIFE_AREA_IDS.map((areaId) => {
    const state = areas[areaId];
    const score = calculateDailyAreaScore(state);
    return {
      ...AREA_META[areaId],
      score,
      recommendations: getRecommendations(areaId, score, state),
      natalPotential: state.natalPotential,
      todayInfluence: state.todayInfluence,
      dashaInfluence: state.dashaInfluence,
    };
  }).sort((a, b) => b.score - a.score);
}
