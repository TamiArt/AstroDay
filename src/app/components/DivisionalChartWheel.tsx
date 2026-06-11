// Компонент круговой визуализации дробной карты
import { DivisionalChart } from '../utils/divisionalCharts';

interface DivisionalChartWheelProps {
  chart: DivisionalChart;
  size?: number;
}

const SIGN_NAMES_SHORT: Record<string, string> = {
  'Aries': 'Ари',
  'Taurus': 'Тел',
  'Gemini': 'Близ',
  'Cancer': 'Рак',
  'Leo': 'Лев',
  'Virgo': 'Дев',
  'Libra': 'Вес',
  'Scorpio': 'Скор',
  'Sagittarius': 'Стр',
  'Capricorn': 'Коз',
  'Aquarius': 'Вод',
  'Pisces': 'Рыб'
};

const PLANET_SYMBOLS: Record<string, string> = {
  'Sun': '☉',
  'Moon': '☽',
  'Mars': '♂',
  'Mercury': '☿',
  'Jupiter': '♃',
  'Venus': '♀',
  'Saturn': '♄',
  'Rahu': '☊',
  'Ketu': '☋'
};

const PLANET_COLORS: Record<string, string> = {
  'Sun': '#FF6B35',
  'Moon': '#4ECDC4',
  'Mars': '#E63946',
  'Mercury': '#06FFA5',
  'Jupiter': '#FFD23F',
  'Venus': '#EE6C4D',
  'Saturn': '#293241',
  'Rahu': '#6A4C93',
  'Ketu': '#8D5B4C'
};

export function DivisionalChartWheel({ chart, size = 280 }: DivisionalChartWheelProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.65;
  const midRadius = (outerRadius + innerRadius) / 2;
  const planetRadius = innerRadius * 0.75;

  // Функция для преобразования полярных координат в декартовы
  const polarToCartesian = (angle: number, radius: number) => {
    const radian = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian)
    };
  };

  // Группируем планеты по домам для избежания наложения
  const planetsByHouse: Record<number, string[]> = {};
  Object.entries(chart.planets).forEach(([name, data]) => {
    if (!planetsByHouse[data.house]) {
      planetsByHouse[data.house] = [];
    }
    planetsByHouse[data.house].push(name);
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {/* Круг фона */}
        <circle cx={centerX} cy={centerY} r={outerRadius} fill="white" stroke="#e5e7eb" strokeWidth="2" />

        {/* 12 знаков зодиака (внешнее кольцо) */}
        {Array.from({ length: 12 }, (_, i) => {
          const signAngle = i * 30;
          const signName = SIGN_NAMES_SHORT[
            ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
             'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i]
          ];

          const textPos = polarToCartesian(signAngle + 15, midRadius);

          return (
            <g key={`sign-${i}`}>
              {/* Линии разделения знаков */}
              <line
                x1={polarToCartesian(signAngle, innerRadius).x}
                y1={polarToCartesian(signAngle, innerRadius).y}
                x2={polarToCartesian(signAngle, outerRadius).x}
                y2={polarToCartesian(signAngle, outerRadius).y}
                stroke="#d1d5db"
                strokeWidth="1"
              />

              {/* Название знака */}
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-500 font-medium"
              >
                {signName}
              </text>
            </g>
          );
        })}

        {/* 12 домов (внутреннее кольцо) */}
        {Array.from({ length: 12 }, (_, i) => {
          const houseNumber = i + 1;
          const houseAngle = (chart.ascendant.longitude + i * 30) % 360;
          const numPos = polarToCartesian(houseAngle + 15, innerRadius * 0.4);

          return (
            <g key={`house-${i}`}>
              {/* Линии домов */}
              <line
                x1={centerX}
                y1={centerY}
                x2={polarToCartesian(houseAngle, innerRadius).x}
                y2={polarToCartesian(houseAngle, innerRadius).y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* Номер дома */}
              <text
                x={numPos.x}
                y={numPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] fill-purple-600 font-bold"
              >
                {houseNumber}
              </text>
            </g>
          );
        })}

        {/* Планеты */}
        {Object.entries(chart.planets).map(([name, data]) => {
          const planetAngle = data.longitude;
          const planetsInSameHouse = planetsByHouse[data.house] || [];
          const indexInHouse = planetsInSameHouse.indexOf(name);
          const offsetAngle = indexInHouse * 8 - ((planetsInSameHouse.length - 1) * 4);

          const planetPos = polarToCartesian(planetAngle + offsetAngle, planetRadius);
          const symbol = PLANET_SYMBOLS[name] || name[0];
          const color = PLANET_COLORS[name] || '#666';

          return (
            <g key={`planet-${name}`}>
              <circle
                cx={planetPos.x}
                cy={planetPos.y}
                r="10"
                fill={color}
                opacity="0.9"
              />
              <text
                x={planetPos.x}
                y={planetPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] fill-white font-bold"
              >
                {symbol}
              </text>
            </g>
          );
        })}

        {/* Маркер Асцендента */}
        <g>
          <line
            x1={centerX}
            y1={centerY}
            x2={polarToCartesian(chart.ascendant.longitude, outerRadius + 5).x}
            y2={polarToCartesian(chart.ascendant.longitude, outerRadius + 5).y}
            stroke="#9333ea"
            strokeWidth="3"
          />
          <text
            x={polarToCartesian(chart.ascendant.longitude, outerRadius + 15).x}
            y={polarToCartesian(chart.ascendant.longitude, outerRadius + 15).y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-purple-700 font-bold"
          >
            AC
          </text>
        </g>
      </svg>

      {/* Название карты */}
      <div className="mt-2 text-center">
        <p className="text-sm font-bold text-gray-900">{chart.name}</p>
        <p className="text-xs text-gray-600">{chart.area}</p>
      </div>
    </div>
  );
}
