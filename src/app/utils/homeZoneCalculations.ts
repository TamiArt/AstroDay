import { HomeRoomRect } from './storage';
import { NatalChart } from './astrology';
import { getPlanetName } from './planetUtils';

export interface BaguaGridCell {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface ZoneAssignment {
  baguaZone: string;
  vastuZone: string;
  element: string;
}

// Вычисляет 3x3 сетку Багуа на основе северного смещения
export function generateBaguaGrid(
  canvasWidth: number,
  canvasHeight: number,
  northOffset: number
): BaguaGridCell[] {
  const cellWidth = canvasWidth / 3;
  const cellHeight = canvasHeight / 3;

  const zonePositions = [
    { id: 'knowledge', label: 'Знания', row: 0, col: 0 },
    { id: 'career', label: 'Карьера', row: 0, col: 1 },
    { id: 'helpful', label: 'Помощь', row: 0, col: 2 },
    { id: 'family', label: 'Семья', row: 1, col: 0 },
    { id: 'health', label: 'Здоровье', row: 1, col: 1 },
    { id: 'children', label: 'Дети', row: 1, col: 2 },
    { id: 'wealth', label: 'Богатство', row: 2, col: 0 },
    { id: 'fame', label: 'Слава', row: 2, col: 1 },
    { id: 'love', label: 'Любовь', row: 2, col: 2 },
  ];

  return zonePositions.map((zone) => ({
    id: zone.id,
    label: zone.label,
    x: zone.col * cellWidth,
    y: zone.row * cellHeight,
    width: cellWidth,
    height: cellHeight,
    angle: northOffset, // Угол поворота для ориентации по северу
  }));
}

// Определяет зону Багуа для комнаты на основе её центра
export function assignBaguaZone(room: HomeRoomRect, grid: BaguaGridCell[]): string {
  const roomCenterX = room.x + room.width / 2;
  const roomCenterY = room.y + room.height / 2;

  for (const cell of grid) {
    if (
      roomCenterX >= cell.x &&
      roomCenterX < cell.x + cell.width &&
      roomCenterY >= cell.y &&
      roomCenterY < cell.y + cell.height
    ) {
      return cell.id;
    }
  }

  return 'health'; // По умолчанию центр
}

// Вычисляет позицию комнаты в 3x3 сетке (для Васту)
export function getVastuZone(room: HomeRoomRect, canvasWidth: number, canvasHeight: number): string {
  const roomCenterX = room.x + room.width / 2;
  const roomCenterY = room.y + room.height / 2;

  const cellWidth = canvasWidth / 3;
  const cellHeight = canvasHeight / 3;

  const colIndex = Math.floor(roomCenterX / cellWidth);
  const rowIndex = Math.floor(roomCenterY / cellHeight);

  const vastuPositions: Record<string, string> = {
    '0_0': 'northeast',
    '1_0': 'north',
    '2_0': 'northwest',
    '0_1': 'east',
    '1_1': 'center',
    '2_1': 'west',
    '0_2': 'southeast',
    '1_2': 'south',
    '2_2': 'southwest',
  };

  return vastuPositions[`${colIndex}_${rowIndex}`] || 'center';
}

// Определяет элемент на основе зоны
export function getZoneElement(zoneId: string): string {
  const elements: Record<string, string> = {
    wealth: 'Дерево',
    fame: 'Огонь',
    love: 'Земля',
    family: 'Дерево',
    health: 'Земля',
    children: 'Металл',
    knowledge: 'Вода',
    career: 'Вода',
    helpful: 'Металл',
    northeast: 'Земля',
    north: 'Вода',
    northwest: 'Металл',
    east: 'Дерево',
    center: 'Земля',
    west: 'Металл',
    southeast: 'Огонь',
    south: 'Огонь',
    southwest: 'Земля',
  };
  return elements[zoneId] || 'Земля';
}

// Анализирует натальную карту для персонализации
export function analyzeNatalChartForHome(natalChart: NatalChart) {
  const weakPlanets: string[] = [];
  const strongPlanets: string[] = [];

  // Анализируем силу каждой планеты (через знаки и накшатры)
  const planets = [
    { name: 'Sun', pos: natalChart.planets.Sun },
    { name: 'Moon', pos: natalChart.planets.Moon },
    { name: 'Mars', pos: natalChart.planets.Mars },
    { name: 'Mercury', pos: natalChart.planets.Mercury },
    { name: 'Jupiter', pos: natalChart.planets.Jupiter },
    { name: 'Venus', pos: natalChart.planets.Venus },
    { name: 'Saturn', pos: natalChart.planets.Saturn },
  ];

  // Определяем слабые позиции (в определенных знаках - упачаях)
  // Weak signs: 6th, 8th, 12th zodiac signs are typically weak
  planets.forEach(({ name, pos }) => {
    const sign = pos.sign;
    // Signs 6 (Virgo), 8 (Scorpio), 12 (Pisces) are weak
    if (sign === 6 || sign === 8 || sign === 12) {
      weakPlanets.push(name);
    }
    // Signs 1 (Aries), 10 (Capricorn) are strong
    if (sign === 1 || sign === 10) {
      strongPlanets.push(name);
    }
  });

  return { weakPlanets, strongPlanets };
}

// Рекомендации на основе слабых планет
export function getPersonalizedZoneAdvice(weakPlanets: string[], zoneId: string): string {
  const adviceMap: Record<string, Record<string, string>> = {
    Moon: {
      love: 'Луна ослаблена — создайте уютное, мягкое пространство. Используйте белые и серебристые тона.',
      family: 'Усильте семейные связи — семейные фото, памятные предметы.',
      health: 'Занимайтесь медитацией и отдыхом — это восстановит энергию Луны.',
    },
    Sun: {
      fame: 'Солнце ослаблено — активируйте зону славы золотыми и красными предметами.',
      south: 'Добавьте яркое освещение и огненные элементы на юг дома.',
      health: 'Солнце питает центр — разместите лампу в центре дома.',
    },
    Venus: {
      love: 'Венера ослаблена — парные розовые предметы, свежие цветы.',
      wealth: 'Венера управляет красотой и деньгами — красивые кристаллы в зоне богатства.',
      children: 'Творчество Венеры — яркие, вдохновляющие элементы в западной зоне.',
    },
    Mars: {
      south: 'Марс ослаблен — активируйте динамику: красные предметы, огонь, движение.',
      family: 'Марс дает защиту — боевые искусства, стратегические предметы.',
      career: 'Марс питает карьеру — хижный взгляд на цели, красные тона.',
    },
    Saturn: {
      north: 'Сатурн ослаблен — чёрные и синие предметы, спокойствие, медленные перемены.',
      career: 'Сатурн управляет карьерой — рабочее место на севере, чёткие границы.',
      health: 'Структура и дисциплина — организованное, минималистичное пространство.',
    },
  };

  for (const planet of weakPlanets) {
    if (adviceMap[planet]?.[zoneId]) {
      return adviceMap[planet][zoneId];
    }
  }

  return '';
}
