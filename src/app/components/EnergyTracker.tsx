import { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { calculateEnergyLevel, getEnergyColor, getEnergyLabel } from '../utils/energyUtils';
import { FORECAST_CALC_VERSION, getForecastProfileKey } from '../utils/forecastCalculations';
import { getForecastsInRange } from '../utils/indexedDB';
import { formatDateKey } from '../utils/dateUtils';
import { UserProfile } from '../utils/storage';
import { getEnergyVisual } from '../utils/visualScales';

interface EnergyTrackerProps {
  profile: UserProfile;
  days?: number;
}

interface EnergyPoint {
  dateKey: string;
  energy: number;
  label: string;
  source: 'forecast' | 'baseline';
  recommendation?: string;
}

function buildBaselineEnergy(days: number): EnergyPoint[] {
  const data: EnergyPoint[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));

    data.push({
      dateKey: formatDateKey(date),
      energy: calculateEnergyLevel(date),
      label: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
      source: 'baseline',
    });
  }

  return data;
}

export function EnergyTracker({ profile, days = 7 }: EnergyTrackerProps) {
  const baselineData = useMemo(() => buildBaselineEnergy(days), [days]);
  const [energyData, setEnergyData] = useState<EnergyPoint[]>(baselineData);
  const [hasPersonalHistory, setHasPersonalHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadForecastHistory = async () => {
      setEnergyData(baselineData);
      setHasPersonalHistory(false);

      try {
        const startDate = baselineData[0]?.dateKey;
        const endDate = baselineData[baselineData.length - 1]?.dateKey;
        if (!startDate || !endDate) return;

        const forecasts = await getForecastsInRange(startDate, endDate);
        const profileKey = getForecastProfileKey(profile);
        const byDate = new Map(
          forecasts
            .filter(forecast => forecast.profileKey === profileKey && forecast.calcVersion === FORECAST_CALC_VERSION)
            .map(forecast => [forecast.date, forecast])
        );

        const merged = baselineData.map(point => {
          const forecast = byDate.get(point.dateKey);
          return forecast
            ? {
                ...point,
                energy: forecast.energyLevel,
                source: 'forecast' as const,
                recommendation: forecast.topRecommendation,
              }
            : point;
        });

        if (!cancelled) {
          setEnergyData(merged);
          setHasPersonalHistory(merged.some(point => point.source === 'forecast'));
        }
      } catch (error) {
        console.error('Ошибка загрузки истории энергии:', error);
      }
    };

    loadForecastHistory();

    return () => {
      cancelled = true;
    };
  }, [baselineData, profile]);

  const maxEnergy = Math.max(...energyData.map(d => d.energy), 1);
  const avgEnergy = energyData.reduce((sum, d) => sum + d.energy, 0) / Math.max(energyData.length, 1);
  const todayEnergy = energyData[energyData.length - 1] || baselineData[baselineData.length - 1];
  const previousEnergy = energyData[energyData.length - 2];
  const trendDelta = previousEnergy ? todayEnergy.energy - previousEnergy.energy : 0;
  const trendLabel = trendDelta > 3
    ? `рост +${trendDelta.toFixed(0)}`
    : trendDelta < -3
      ? `снижение ${trendDelta.toFixed(0)}`
      : 'ровный фон';
  const bestDay = energyData.reduce<EnergyPoint | null>(
    (best, point) => (!best || point.energy > best.energy ? point : best),
    null
  );

  return (
    <div
      className="rounded-3xl p-8"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-1">Трекер энергии</h3>
          <p className="opacity-70">
            {hasPersonalHistory ? 'История по персональным прогнозам' : 'Базовая оценка, пока прогнозы загружаются'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--neon-green)' }} />
          <span className="opacity-70">Средняя: {avgEnergy.toFixed(0)}%</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-end justify-between gap-2 h-48">
          {energyData.map((item) => {
            const height = (item.energy / maxEnergy) * 100;
            const color = getEnergyColor(item.energy);
            const visual = getEnergyVisual(item.energy);

            return (
              <div
                key={item.dateKey}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                title={`${visual.label}: ${visual.description}`}
              >
                <div className="w-full flex flex-col items-center justify-end flex-1 relative">
                  <div
                    className="w-full rounded-t-xl transition-all duration-300 group-hover:scale-110"
                    style={{
                      height: `${height}%`,
                      background: `linear-gradient(180deg, ${color}, ${color}88)`,
                      boxShadow: `0 -4px 16px ${color}40`,
                      minHeight: '4px'
                    }}
                  />
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap">
                    {item.energy.toFixed(0)}%
                  </div>
                  {item.recommendation && (
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-2 py-1 rounded text-xs max-w-[220px] text-center">
                      {item.recommendation}
                    </div>
                  )}
                </div>
                <span className="text-xs opacity-60">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: 'var(--neon-green)' }}
          />
          <span className="opacity-70">Высокий</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: 'var(--neon-yellow)' }}
          />
          <span className="opacity-70">Умеренный</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: 'var(--neon-pink)' }}
          />
          <span className="opacity-70">Отдых</span>
        </div>
      </div>

      <div
        className="mt-6 p-5 rounded-2xl"
        style={{
          background: 'var(--secondary)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 opacity-70">Сегодня</p>
            <p>{getEnergyLabel(todayEnergy.energy)}</p>
            <p className="mt-1 text-sm opacity-60">Динамика: {trendLabel}</p>
            {bestDay && (
              <p className="mt-1 text-sm opacity-60">
                Самый сильный день периода: {bestDay.label} ({bestDay.energy.toFixed(0)}%)
              </p>
            )}
          </div>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: getEnergyColor(todayEnergy.energy),
              boxShadow: `0 4px 16px ${getEnergyColor(todayEnergy.energy)}40`
            }}
          >
            <span className="text-white text-xl">
              {todayEnergy.energy.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
