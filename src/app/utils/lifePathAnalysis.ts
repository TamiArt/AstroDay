import type { NatalChart, PlanetPosition } from './astrology';

export type LifeAreaId = 'money' | 'career' | 'development' | 'wellbeing' | 'relationships';

export interface LifeAreaInsight {
  id: LifeAreaId;
  title: string;
  houses: number[];
  houseNotes: string[];
  planetNotes: string[];
  practicalFocus: string[];
}

const AREA_CONFIG: Array<{
  id: LifeAreaId;
  title: string;
  houses: number[];
  practicalFocus: string[];
}> = [
  { id: 'money', title: 'Деньги и ресурсы', houses: [2, 5, 11], practicalFocus: ['Навыки монетизации и переговоров о вознаграждении', 'Система бюджета, накоплений и финансовой подушки', 'Проверка источников дохода и реалистичности финансовых целей'] },
  { id: 'career', title: 'Карьера и профессиональная реализация', houses: [6, 10, 11], practicalFocus: ['Какие задачи и роли дают устойчивый профессиональный рост', 'Какие навыки стоит подтвердить портфолио или практикой', 'Как расширять профессиональные связи и видимость результатов'] },
  { id: 'development', title: 'Путь развития и призвание', houses: [1, 5, 9], practicalFocus: ['Обучение и области, в которых стоит углублять экспертизу', 'Личные инициативы и проекты для проверки интереса', 'Переход от вдохновения к регулярной практике'] },
  { id: 'wellbeing', title: 'Благополучие и устойчивость', houses: [1, 4, 6, 12], practicalFocus: ['Режим восстановления, сна и разумные границы нагрузки', 'Поддерживающая домашняя среда и повседневные привычки', 'При вопросах здоровья опираться на медицинских специалистов, а не карту'] },
  { id: 'relationships', title: 'Отношения и партнёрство', houses: [2, 5, 7, 8], practicalFocus: ['Открыто обсуждать ожидания, границы и распределение ответственности', 'Согласовывать финансовые решения и общие цели', 'Замечать способы проявления заботы и конструктивного разрешения конфликтов'] },
];

function getHouseForPlanet(planet: PlanetPosition, ascendantLon: number): number {
  return Math.floor(((planet.siderealLon - ascendantLon + 360) % 360) / 30) + 1;
}

export function analyzeLifeAreas(chart: NatalChart): LifeAreaInsight[] {
  return AREA_CONFIG.map((area) => {
    const houseNotes = area.houses.map((houseNumber) => {
      const house = chart.houses?.find((item) => item.house === houseNumber);
      const occupants = Object.entries(chart.planets)
        .filter(([, position]) => getHouseForPlanet(position, chart.ascendant.siderealLon) === houseNumber)
        .map(([name]) => name);
      return `${houseNumber}-й дом${house?.signName ? ` (${house.signName})` : ''}: ${occupants.length ? `планеты — ${occupants.join(', ')}` : 'планет в доме нет'}${house?.lord ? `; управитель — ${house.lord}` : ''}.`;
    });
    const planetNotes = Object.entries(chart.planets)
      .filter(([, position]) => area.houses.includes(getHouseForPlanet(position, chart.ascendant.siderealLon)))
      .map(([name, position]) => `${name}: ${position.signName}, ${getHouseForPlanet(position, chart.ascendant.siderealLon)}-й дом`);

    return { id: area.id, title: area.title, houses: area.houses, houseNotes, planetNotes, practicalFocus: area.practicalFocus };
  });
}

export function angularDistance(first: number, second: number): number {
  const difference = Math.abs(first - second) % 360;
  return Math.min(difference, 360 - difference);
}

export function getSynastryAspects(first: NatalChart, second: NatalChart): Array<{
  firstPlanet: string;
  secondPlanet: string;
  aspect: string;
  distance: number;
  orb: number;
}> {
  const targets = [
    { name: 'соединение', angle: 0, orb: 6 },
    { name: 'секстиль', angle: 60, orb: 4 },
    { name: 'квадрат', angle: 90, orb: 5 },
    { name: 'трин', angle: 120, orb: 5 },
    { name: 'оппозиция', angle: 180, orb: 6 },
  ];
  const result = [];
  const firstPlanets = Object.entries(first.planets).filter(([name]) => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(name));
  const secondPlanets = Object.entries(second.planets).filter(([name]) => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(name));

  for (const [firstPlanet, firstPosition] of firstPlanets) {
    for (const [secondPlanet, secondPosition] of secondPlanets) {
      const distance = angularDistance(firstPosition.siderealLon, secondPosition.siderealLon);
      const match = targets.find((target) => Math.abs(distance - target.angle) <= target.orb);
      if (match) result.push({ firstPlanet, secondPlanet, aspect: match.name, distance, orb: Math.abs(distance - match.angle) });
    }
  }
  return result.sort((a, b) => a.orb - b.orb).slice(0, 12);
}
