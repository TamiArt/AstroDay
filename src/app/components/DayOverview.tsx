// [КОМПОНЕНТ] Обзор дня с диаграммой сфер жизни
import { useState } from 'react';
import { Info, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { NatalChart, Aspect, calculateDasha, getCurrentAntardasha } from '../utils/astrology';
import { PanchangData } from '../utils/panchang';
import { calculateDailyAreas, LifeArea } from '../utils/dailyAreasAnalysis';
import { GlassCard } from './common/GlassCard';

interface DayOverviewProps {
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
}

export function DayOverview({
  natalChart,
  currentChart,
  aspects,
  panchang
}: DayOverviewProps) {
  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);

  // Расчёт Даши (если есть натальная карта с домами)
  let currentDasha: ReturnType<typeof calculateDasha> | null = null;
  let currentAntar: ReturnType<typeof getCurrentAntardasha> | null = null;

  if (natalChart.houses && natalChart.planets.Moon) {
    const moonNakshatra = Math.floor(natalChart.planets.Moon.siderealLon / (360 / 27));
    currentDasha = calculateDasha(natalChart.date, moonNakshatra, new Date(), natalChart.planets.Moon.siderealLon);
    if (currentDasha) {
      currentAntar = getCurrentAntardasha(currentDasha);
    }
  }

  // Рассчитываем благоприятность сфер (передаём Дашу)
  const areas = calculateDailyAreas(panchang, natalChart, currentChart, aspects, currentDasha);

  // Форматируем данные для RadialBarChart
  const chartData = areas.map((area, index) => ({
    id: area.id,
    name: area.name,
    value: area.score,
    fill: area.color,
    index // Unique index to ensure no duplicate keys
  }));

  // Топ-3 сферы
  const topAreas = areas.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="p-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))',
              boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)'
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="mb-2">Обзор дня по сферам жизни</h2>
            <p className="opacity-70">
              Анализ благоприятности разных сфер на основе астрологических данных
            </p>
          </div>
        </div>

        {/* Даша периоды */}
        {currentDasha && (
          <div className="mb-6 p-4 rounded-2xl border border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold">Текущие периоды Даша</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background/50">
                <p className="text-xs opacity-70 mb-1">Махадаша (главный период)</p>
                <p className="font-semibold text-purple-600">{currentDasha.planet}</p>
                <p className="text-xs opacity-60 mt-1">
                  {currentDasha.startDate.toLocaleDateString('ru')} - {currentDasha.endDate.toLocaleDateString('ru')}
                </p>
              </div>
              {currentAntar && (
                <div className="p-3 rounded-xl bg-background/50">
                  <p className="text-xs opacity-70 mb-1">Антардаша (под-период)</p>
                  <p className="font-semibold text-pink-600">{currentAntar.planet}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {currentAntar.startDate.toLocaleDateString('ru')} - {currentAntar.endDate.toLocaleDateString('ru')}
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs opacity-70 mt-3">
              💡 Период {currentDasha.planet} указывает на главную жизненную тему в настоящее время
            </p>
          </div>
        )}

        {/* Топ-3 сферы */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {topAreas.map((area, index) => (
            <div
              key={area.id}
              className="p-4 rounded-2xl border"
              style={{
                background: `${area.color}15`,
                borderColor: `${area.color}40`
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{area.icon}</span>
                <span
                  className="px-2 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: area.color }}
                >
                  #{index + 1}
                </span>
              </div>
              <p className="text-sm font-medium mb-1">{area.name}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${area.score}%`,
                      background: area.color
                    }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: area.color }}>
                  {area.score}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Круговая диаграмма */}
        <div className="mb-6">
          <h3 className="mb-4 text-center">Диаграмма благоприятности</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  label={({ name, x, y, midAngle, outerRadius, innerRadius, index }) => {
                    const RADIAN = Math.PI / 180;

                    // Текст снаружи
                    const textRadius = outerRadius + 35;
                    const textX = x + textRadius * Math.cos(-midAngle * RADIAN);
                    const textY = y + textRadius * Math.sin(-midAngle * RADIAN);

                    // Иконка внутри сегмента
                    const iconRadius = (outerRadius + innerRadius) / 2;
                    const iconX = x + iconRadius * Math.cos(-midAngle * RADIAN);
                    const iconY = y + iconRadius * Math.sin(-midAngle * RADIAN);

                    const area = areas[index];

                    return (
                      <g>
                        {/* Текст названия снаружи */}
                        <text
                          x={textX}
                          y={textY}
                          fill="currentColor"
                          textAnchor={textX > x ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs opacity-70 font-medium"
                        >
                          {name.split(' ')[0]}
                        </text>

                        {/* Иконка внутри сегмента */}
                        <text
                          x={iconX}
                          y={iconY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-2xl"
                        >
                          {area.icon}
                        </text>
                      </g>
                    );
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <p className="font-medium mb-1">{data.name}</p>
                          <p className="text-sm opacity-80">Благоприятность: {data.value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Центральный балл */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1" style={{ color: 'var(--neon-purple)' }}>
                  {Math.round(areas.reduce((sum, a) => sum + a.score, 0) / areas.length)}
                </div>
                <div className="text-sm opacity-60">/100</div>
                <div className="text-xs opacity-50 mt-1">Средний балл</div>
              </div>
            </div>
          </div>

          {/* Список сфер с процентами и деталями */}
          <div className="space-y-3 mb-6">
            {areas.map((area) => (
              <div key={area.id}>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
                  style={{
                    background: selectedArea?.id === area.id ? `${area.color}15` : 'var(--secondary)'
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${area.color}20` }}
                  >
                    {area.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1">{area.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${area.score}%`,
                            background: area.color
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold" style={{ color: area.color }}>
                        {area.score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Детали при раскрытии */}
                {selectedArea?.id === area.id && (
                  <div className="mt-2 p-4 rounded-xl bg-background/50 border border-border animate-in fade-in duration-300 space-y-3">
                    {/* Даша - глобальный фон жизни (50%) */}
                    {area.dashaInfluence && (
                      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                        <p className="text-xs font-medium text-indigo-600 mb-1">🌟 Период Даша (50%)</p>
                        <p className="text-sm opacity-80">{area.dashaInfluence}</p>
                      </div>
                    )}

                    {/* Транзиты - ежедневные триггеры (40%) */}
                    {area.todayInfluence && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-xs font-medium text-blue-600 mb-1">⚡ Транзиты сегодня (40%)</p>
                        <p className="text-sm opacity-80">{area.todayInfluence}</p>
                      </div>
                    )}

                    {/* Ваша карта - управители домов */}
                    {area.natalPotential && (
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <p className="text-xs font-medium text-purple-600 mb-1">🔮 Управители домов</p>
                        <p className="text-sm opacity-80">{area.natalPotential}</p>
                      </div>
                    )}

                    {/* Предупреждение если нет времени рождения */}
                    {!area.natalPotential && !area.todayInfluence && !area.dashaInfluence && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-600">
                          ℹ️ Укажите точное время рождения в настройках для персонализированного прогноза
                        </p>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: area.color }} />
                      <div>
                        <p className="text-sm font-medium mb-2">Рекомендации на сегодня:</p>
                        <ul className="text-sm space-y-1 opacity-80">
                          {area.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {area.score >= 70 && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm text-green-600">
                          ✨ Отличный день для этой сферы! Используйте высокую благоприятность.
                        </p>
                      </div>
                    )}

                    {area.score < 40 && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-600">
                          ⚠️ Низкая благоприятность. Лучше отложить важные дела на другой день.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Информация */}
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
          <div className="flex gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-70" />
            <p className="text-sm opacity-80 leading-relaxed">
              💡 <strong>Как читать диаграмму:</strong> Каждый сегмент круга представляет одну сферу жизни.
              Сферы с баллом 70+ особенно благоприятны для активных действий. Ниже 40 — лучше отложить на другой день.
              В центре — средний балл благоприятности дня.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
