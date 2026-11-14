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
  whyToday: string[];
  scoreBreakdown: {
    dasha?: number;
    transits?: number;
    panchang: number;
  };
}

interface AreaState {
  dashaScore?: number;
  transitScore?: number;
  panchangScore?: number;
  natalPotential?: string;
  todayInfluence?: string;
  dashaInfluence?: string;
  whyToday: string[];
}

const AREA_META: Record<LifeAreaId, Omit<LifeArea, 'score' | 'recommendations'>> = {
  career: { id: 'career', name: 'Карьера и достижения', color: '#6b4ce6', icon: '💼', description: 'Профессиональный рост, успех в делах, достижение целей' },
  relationships: { id: 'relationships', name: 'Отношения и любовь', color: '#ec4899', icon: '💕', description: 'Романтические отношения, социальные связи, партнёрство' },
  health: { id: 'health', name: 'Самочувствие и режим', color: '#10b981', icon: '💪', description: 'Режим, восстановление и повседневная забота о себе' },
  finances: { id: 'finances', name: 'Финансы и ресурсы', color: '#f59e0b', icon: '💰', description: 'Деньги, инвестиции, материальное благополучие' },
  learning: { id: 'learning', name: 'Обучение и знания', color: '#3b82f6', icon: '📚', description: 'Образование, интеллект, новые навыки' },
  creativity: { id: 'creativity', name: 'Творчество и самовыражение', color: '#a78bfa', icon: '🎨', description: 'Искусство, креативность, самовыражение' },
  spirituality: { id: 'spirituality', name: 'Духовность и медитация', color: '#8b5cf6', icon: '🧘', description: 'Духовные практики, медитация, внутренний рост' },
  family: { id: 'family', name: 'Семья и дом', color: '#14b8a6', icon: '🏡', description: 'Семейные отношения, дом, уют' },
};

const RECOMMENDATIONS: Record<LifeAreaId, string[]> = {
  career: ['Выберите одну рабочую задачу и определите ближайший шаг', 'Уточните приоритеты и сроки', 'Зафиксируйте важные договорённости письменно'],
  relationships: ['Обсудите важный вопрос спокойно и конкретно', 'Уточните ожидания друг друга', 'Выделите время на общение без отвлечений'],
  health: ['Ориентируйтесь на самочувствие и привычный режим', 'Не заменяйте медицинские рекомендации астрологическими оценками', 'Запланируйте отдых с учётом реальной нагрузки'],
  finances: ['Проверьте бюджет и обязательные расходы', 'Сравните условия перед финансовым решением', 'Не принимайте инвестиционные решения по астрологическому баллу'],
  learning: ['Выберите одну тему для изучения', 'Разбейте обучение на небольшие шаги', 'Повторите материал и проверьте, что уже понятно'],
  creativity: ['Выделите время на творческую задачу', 'Попробуйте один новый подход или материал', 'Сохраните результат и отметьте, что хотите улучшить'],
  spirituality: ['Выберите спокойную практику, которая вам подходит', 'Оставьте время для размышлений или отдыха', 'Не воспринимайте календарные показатели как обязательные предписания'],
  family: ['Обсудите бытовые задачи и распределение обязанностей', 'Запланируйте время для близких', 'Уточните, какая помощь или поддержка сейчас нужна'],
};

function getRecommendations(areaId: LifeAreaId): string[] {
  return RECOMMENDATIONS[areaId];
}


export function calculateDailyAreas(
  panchang: PanchangData,
  natalChart: NatalChart,
  currentChart: NatalChart,
  aspects: Aspect[],
  dasha?: DashaPeriod | null
): LifeArea[] {
  const areas = Object.fromEntries(LIFE_AREA_IDS.map((id) => [id, { whyToday: [] }])) as Record<LifeAreaId, AreaState>;

  if (dasha) {
    const influenceMap = getDashaPlanetInfluence(dasha.planet);
    for (const areaId of LIFE_AREA_IDS) {
      const influence = influenceMap[areaId] ?? 0;
      areas[areaId].dashaScore = influence * 5;
      if (influence > 0) {
        areas[areaId].dashaInfluence = `Сейчас идёт большой период ${getPlanetName(dasha.planet)}. В правилах этой модели он связан с темой «${AREA_META[areaId].name}». Это общий фон периода, а не обещание события.`;
        areas[areaId].whyToday.push(areas[areaId].dashaInfluence);
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
        areas[areaId].natalPotential = `В натальной карте эта сфера связана с домами ${relevantHouses.join(', ')}. Ими управляют планеты: ${houseLords.map(getPlanetName).join(', ')}.`;
        areas[areaId].whyToday.push(`${areas[areaId].natalPotential} Это постоянная особенность карты, а не прогноз на сегодня.`);
      }

      if (transitingPlanets.length > 0) {
        const aspectInfo = aspects.filter((aspect) =>
          (aspect.context === 'transit' || aspect.isTransit || aspect.context === undefined)
          && (houseLords.includes(aspect.planet1) || houseLords.includes(aspect.planet2))
        ).length;
        const planetNames = Array.from(new Set(transitingPlanets)).map(getPlanetName).join(', ');
        areas[areaId].todayInfluence = `Сегодня ${planetNames} находятся в домах ${relevantHouses.join(', ')}, которые модель связывает с этой сферой.${aspectInfo > 0 ? ` Также расчёт учитывает ${aspectInfo} аспектных связей с планетами-управителями.` : ''}`;
        areas[areaId].whyToday.push(`${areas[areaId].todayInfluence} Это астрологические положения, а не указание на то, что событие обязательно произойдёт.`);
      } else {
        areas[areaId].todayInfluence = `Сегодня модель не обнаружила планет, проходящих по домам ${relevantHouses.join(', ')}.`;
        areas[areaId].whyToday.push(`${areas[areaId].todayInfluence} Это не означает, что в этой сфере ничего не произойдёт: просто данный признак не добавил баллы.`);
      }
    }
  }

  for (const areaId of LIFE_AREA_IDS) {
    areas[areaId].panchangScore = getPanchangInfluence(areaId, panchang);
    areas[areaId].whyToday.push(
      `В дневной части расчёта учтены лунный день «${panchang.tithi.name}» (${panchang.tithi.meaning}), день недели «${panchang.vara.name}» (${panchang.vara.quality}) и йога «${panchang.yoga.name}» (${panchang.yoga.meaning}).`
    );
  }

  return LIFE_AREA_IDS.map((areaId) => {
    const state = areas[areaId];
    const score = calculateDailyAreaScore(state);
    return {
      ...AREA_META[areaId],
      score,
      recommendations: getRecommendations(areaId),
      natalPotential: state.natalPotential,
      todayInfluence: state.todayInfluence,
      dashaInfluence: state.dashaInfluence,
      whyToday: state.whyToday,
      scoreBreakdown: {
        dasha: state.dashaScore,
        transits: state.transitScore,
        panchang: state.dashaScore === undefined && state.transitScore === undefined
          ? (state.panchangScore ?? 0) * 10
          : state.panchangScore ?? 0,
      },
    };
  }).sort((a, b) => b.score - a.score);
}
