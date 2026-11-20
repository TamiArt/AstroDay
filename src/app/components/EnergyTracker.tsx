import { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { getEnergyColor } from '../utils/energyUtils';
import { getOrCalculateForecast } from '../utils/forecastCalculations';
import { formatDateKey } from '../utils/dateUtils';
import { UserProfile } from '../utils/storage';

interface EnergyTrackerProps {
  profile: UserProfile;
  days?: number;
}

interface EnergyPoint {
  dateKey: string;
  energy: number;
  label: string;
  recommendation: string;
  avoidRecommendation: string;
  microUpaya: string;
}

function buildDateRange(days: number): Date[] {
  const today = new Date();
  const dates: Date[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    dates.push(date);
  }

  return dates;
}

function getEnergyBand(level: number): string {
  if (level >= 70) return 'Выше среднего';
  if (level >= 40) return 'Умеренный';
  return 'Спокойный режим';
}

function getDayInterpretation(level: number): string {
  if (level >= 70) {
    return 'По символической модели это более активный день. Можно выделить одну-две приоритетные задачи, не забывая учитывать реальные обстоятельства и своё самочувствие.';
  }
  if (level >= 40) {
    return 'По модели день проходит в умеренном ритме. Подойдут обычные задачи, последовательная работа и разумное чередование нагрузки с перерывами.';
  }
  return 'По модели это более спокойный период. Можно сосредоточиться на необходимом, оставить запас времени и не перегружать расписание только из-за планов.';
}

export function EnergyTracker({ profile, days = 7 }: EnergyTrackerProps) {
  const dates = useMemo(() => buildDateRange(days), [days]);
  const [energyData, setEnergyData] = useState<EnergyPoint[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPersonalForecasts = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const forecasts = await Promise.all(
          dates.map(async (date) => {
            const forecast = await getOrCalculateForecast(date, profile);
            return {
              dateKey: forecast.date,
              energy: forecast.energyLevel,
              label: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
              recommendation: forecast.topRecommendation,
              avoidRecommendation: forecast.avoidRecommendation ?? 'Не принимайте важные решения без проверки фактов и условий.',
              microUpaya: forecast.microUpaya ?? 'Выберите одно небольшое полезное действие и выполните его без спешки.',
            };
          })
        );

        if (!cancelled) {
          setEnergyData(forecasts);
          if (!forecasts.some((point) => point.dateKey === selectedDateKey)) {
            setSelectedDateKey(forecasts[forecasts.length - 1]?.dateKey ?? '');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Не удалось рассчитать показатели за неделю.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPersonalForecasts();
    return () => {
      cancelled = true;
    };
  }, [dates, profile]);

  const todayKey = formatDateKey(new Date());
  const today = energyData.find((point) => point.dateKey === todayKey) ?? energyData[energyData.length - 1];
  const selectedDay = energyData.find((point) => point.dateKey === selectedDateKey) ?? today;
  const average = energyData.length
    ? Math.round(energyData.reduce((sum, point) => sum + point.energy, 0) / energyData.length)
    : 0;
  const firstDay = energyData[0];
  const weeklyChange = today && firstDay ? today.energy - firstDay.energy : 0;
  const highestDay = energyData.reduce<EnergyPoint | null>(
    (highest, point) => (!highest || point.energy > highest.energy ? point : highest),
    null
  );

  return (
    <section
      className="rounded-3xl p-6 sm:p-8"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
      }}
      aria-labelledby="energy-tracker-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 id="energy-tracker-title" className="text-xl font-semibold mb-1">Трекер энергии</h2>
          <p className="text-sm opacity-70">Условный астрологический ориентир · последние {days} дней</p>
        </div>
        {!isLoading && !loadError && (
          <div className="rounded-xl bg-secondary px-4 py-3">
            <p className="text-xs opacity-65">Средний показатель за неделю</p>
            <p className="text-2xl font-semibold tabular-nums">{average}<span className="text-sm font-normal opacity-65"> / 100</span></p>
            <p className="text-xs opacity-70">{getEnergyBand(average)}</p>
          </div>
        )}
      </div>

      {isLoading && <p className="py-10 text-center text-sm opacity-70">Рассчитываем персональные показатели за неделю…</p>}
      {loadError && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && energyData.length > 0 && (
        <>
          <div className="mb-5">
            <div className="flex items-end justify-between gap-2 h-44 sm:h-52" role="group" aria-label="Показатель модели по дням. Выберите день для подробностей.">
              {energyData.map((point) => {
                const isSelected = point.dateKey === selectedDay?.dateKey;
                const color = getEnergyColor(point.energy);
                return (
                  <button
                    key={point.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(point.dateKey)}
                    aria-pressed={isSelected}
                    aria-label={`${point.label}: ${point.energy} из 100, ${getEnergyBand(point.energy)}`}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-xl px-1 pt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className={`text-xs font-semibold tabular-nums transition-opacity ${isSelected ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'}`}>{point.energy}</span>
                    <span className="flex w-full flex-1 items-end justify-center">
                      <span
                        className={`block w-full max-w-12 rounded-t-lg transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-80 group-hover:opacity-100'}`}
                        style={{
                          height: `${Math.max(point.energy, 3)}%`,
                          background: color,
                          minHeight: '4px'
                        }}
                      />
                    </span>
                    <span className={`text-[11px] capitalize ${isSelected ? 'font-semibold opacity-100' : 'opacity-65'}`}>{point.label}</span>
                    <span className="text-[10px] opacity-65">{getEnergyBand(point.energy)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mb-5">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs opacity-65">Самый высокий показатель</p>
              <p className="mt-1 font-semibold">{highestDay?.label ?? '—'} · {highestDay?.energy ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs opacity-65">Сегодня</p>
              <p className="mt-1 font-semibold">{today ? `${today.energy}/100 · ${getEnergyBand(today.energy)}` : '—'}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs opacity-65">Изменение с первого дня</p>
              <p className="mt-1 flex items-center gap-2 font-semibold tabular-nums">
                <TrendingUp className="h-4 w-4 opacity-60" />
                {weeklyChange === 0 ? 'Без изменений' : weeklyChange > 0 ? `На ${weeklyChange} пунктов выше, чем в первый день` : `На ${Math.abs(weeklyChange)} пунктов ниже, чем в первый день`}
              </p>
            </div>
          </div>

          {selectedDay && (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Выбранный день</p>
                  <h3 className="mt-1 text-lg font-semibold capitalize">
                    {new Date(`${selectedDay.dateKey}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums">{selectedDay.energy}/100</p>
                  <p className="text-sm opacity-70">{getEnergyBand(selectedDay.energy)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{getDayInterpretation(selectedDay.energy)}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold opacity-70">Что можно сделать</p>
                  <p className="mt-1 text-sm">{selectedDay.recommendation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold opacity-70">С чем не спешить</p>
                  <p className="mt-1 text-sm">{selectedDay.avoidRecommendation}</p>
                </div>
              </div>
              <p className="mt-3 text-xs opacity-70">Небольшая практика: {selectedDay.microUpaya}</p>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold mb-3">Как читать шкалу</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <p className="text-sm"><strong>70–100 · Выше среднего</strong><span className="mt-1 block opacity-70">Более активный период по символике модели.</span></p>
              <p className="text-sm"><strong>40–69 · Умеренный</strong><span className="mt-1 block opacity-70">Ровный фон без особого акцента на активность.</span></p>
              <p className="text-sm"><strong>0–39 · Спокойный режим</strong><span className="mt-1 block opacity-70">Более спокойный показатель модели.</span></p>
            </div>
          </div>
        </>
      )}

      <p className="mt-5 text-xs leading-relaxed opacity-65">
        Показатели рассчитаны персонально по данным натальной карты и транзитам на 12:00 местного времени. Это условная оценка астрологической модели, а не измерение физической энергии, здоровья или реальной работоспособности. Цвет всегда дублируется числом и подписью; ориентируйтесь на самочувствие и реальные обстоятельства.
      </p>
    </section>
  );
}
