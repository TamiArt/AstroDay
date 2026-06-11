import { NatalChart } from '../utils/astrology';
import { calculateNatalAspects } from '../utils/aspectCalculations';

interface NatalChartWheelProps {
  natalChart: NatalChart;
  showAspects?: boolean;
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
};

const ASPECT_COLORS: Record<number, string> = {
  0: '#FF0000',    // Conjunction (0°)
  60: '#00FF00',   // Sextile (60°)
  90: '#FF0000',   // Square (90°)
  120: '#0000FF',  // Trine (120°)
  180: '#FF0000',  // Opposition (180°)
};

export function NatalChartWheel({ natalChart, showAspects = false }: NatalChartWheelProps) {
  const centerX = 300;
  const centerY = 300;
  const outerRadius = 280;
  const innerRadius = 200;
  const planetRadius = 230;

  // Функция для расчета координат на окружности
  const polarToCartesian = (angle: number, radius: number) => {
    const radian = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian),
    };
  };

  // Получаем все планеты с их позициями
  const planets = Object.entries(natalChart.planets).map(([name, position]) => ({
    name,
    position,
    angle: position.siderealLon,
  }));

  // Добавляем Ascendant
  planets.push({
    name: 'Asc',
    position: natalChart.ascendant,
    angle: natalChart.ascendant.siderealLon,
  });

  const aspects = showAspects ? calculateNatalAspects(natalChart) : [];

  return (
    <div className="relative w-full max-w-[600px] mx-auto">
      <svg viewBox="0 0 600 600" className="w-full h-auto">
        {/* Фон */}
        <circle cx={centerX} cy={centerY} r={outerRadius} fill="white" stroke="#333" strokeWidth="2" />

        {/* 12 знаков зодиака */}
        {Array.from({ length: 12 }, (_, i) => {
          const startAngle = i * 30;
          const midAngle = startAngle + 15;
          const textPos = polarToCartesian(midAngle, outerRadius - 20);

          return (
            <g key={`sign-${i}`}>
              {/* Линии между знаками */}
              <line
                x1={centerX}
                y1={centerY}
                {...polarToCartesian(startAngle, outerRadius)}
                stroke="#ccc"
                strokeWidth="1"
              />

              {/* Название знака */}
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#666"
                fontWeight="600"
              >
                {natalChart.ascendant.signName && ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i]}
              </text>
            </g>
          );
        })}

        {/* 12 домов */}
        {natalChart.houses?.map((house, i) => {
          const startAngle = house.cusp;
          const nextHouse = natalChart.houses?.[i + 1] || natalChart.houses?.[0];
          const endAngle = nextHouse ? nextHouse.cusp : startAngle + 30;

          let houseSizeDeg = endAngle - startAngle;
          if (houseSizeDeg < 0) houseSizeDeg += 360;

          const midAngle = startAngle + houseSizeDeg / 2;
          const textPos = polarToCartesian(midAngle, innerRadius - 30);

          return (
            <g key={`house-${i}`}>
              {/* Линия куспида дома */}
              <line
                x1={centerX}
                y1={centerY}
                {...polarToCartesian(startAngle, innerRadius)}
                stroke="#333"
                strokeWidth="2"
              />

              {/* Номер дома */}
              <text
                x={textPos.x}
                y={textPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="700"
                fill="#333"
              >
                {house.house}
              </text>

              {/* Знак на куспиде */}
              <text
                x={textPos.x}
                y={textPos.y + 15}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#666"
              >
                {house.signName}
              </text>
            </g>
          );
        })}

        {/* Внутренний круг */}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="none" stroke="#333" strokeWidth="2" />

        {/* Аспекты (если включены) */}
        {showAspects && aspects.map((aspect, idx) => {
          const fromPlanet = planets.find(p => p.name === aspect.planet1);
          const toPlanet = planets.find(p => p.name === aspect.planet2);

          if (!fromPlanet || !toPlanet) return null;

          const from = polarToCartesian(fromPlanet.angle, planetRadius - 30);
          const to = polarToCartesian(toPlanet.angle, planetRadius - 30);
          const color = ASPECT_COLORS[aspect.angle] || '#999';

          return (
            <line
              key={`aspect-${idx}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth="1"
              opacity="0.4"
              strokeDasharray={aspect.angle === 60 ? "3,3" : undefined}
            />
          );
        })}

        {/* Планеты */}
        {planets.map((planet, idx) => {
          const pos = polarToCartesian(planet.angle, planetRadius);
          const symbol = PLANET_SYMBOLS[planet.name] || planet.name.substring(0, 2);
          const isPlanet = planet.name !== 'Asc';

          return (
            <g key={`planet-${idx}`}>
              {/* Кружок планеты */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isPlanet ? 16 : 12}
                fill={isPlanet ? '#fff' : '#ffd700'}
                stroke={isPlanet ? '#333' : '#ff8800'}
                strokeWidth="2"
              />

              {/* Символ планеты */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isPlanet ? "14" : "10"}
                fontWeight="700"
                fill="#333"
              >
                {symbol}
              </text>

              {/* Градусы */}
              <text
                x={pos.x}
                y={pos.y + 25}
                textAnchor="middle"
                fontSize="8"
                fill="#666"
              >
                {Math.floor(planet.angle)}°
              </text>
            </g>
          );
        })}

        {/* Центральная точка */}
        <circle cx={centerX} cy={centerY} r="3" fill="#333" />
      </svg>

      {/* Легенда аспектов */}
      {showAspects && aspects.length > 0 && (
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-purple-200">
          <div className="text-sm font-semibold mb-2 text-gray-700">Аспекты:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span>Соединение (0°), Квадрат (90°), Оппозиция (180°)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>Трин (120°)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500 border-dashed"></div>
              <span>Секстиль (60°)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
