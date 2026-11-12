// [КОМПОНЕНТ] Календарь астрологических прогнозов в стиле "прогноз погоды"
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, WifiOff, Calendar as CalendarIcon } from 'lucide-react';
import { UserProfile } from '../utils/storage';
import { DayForecast, getForecastsInRange, isOnline } from '../utils/indexedDB';
import { FORECAST_CALC_VERSION, getForecastProfileKey, getOrCalculateForecast } from '../utils/forecastCalculations';
import { formatDateKey } from '../utils/dateUtils';
import { GlassCard } from './common/GlassCard';
import { DayForecastModal } from './DayForecastModal';
import { SMART_CALENDAR_AREAS, compareSmartForecastPeriods, getForecastAreaIds, summarizeSmartMonth, type SmartCalendarAreaId } from '../utils/smartCalendar';

interface ForecastCalendarProps {
  profile: UserProfile;
}

export function ForecastCalendar({ profile }: ForecastCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [forecasts, setForecasts] = useState<Map<string, DayForecast>>(new Map());
  const [currentPeriodForecasts, setCurrentPeriodForecasts] = useState<DayForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [areaFilter, setAreaFilter] = useState<SmartCalendarAreaId | 'all'>('all');
  const [comparisonForecast, setComparisonForecast] = useState<DayForecast | null>(null);

  // Мониторинг онлайн/оффлайн статуса
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Загрузка прогнозов для текущего месяца
  useEffect(() => {
    loadMonthForecasts();
  }, [currentMonth, profile]);

  const loadMonthForecasts = async () => {
    setIsLoading(true);
    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Загружаем прогнозы из IndexedDB
      const startDate = formatDateKey(firstDay);
      const endDate = formatDateKey(lastDay);
      const monthForecasts = await getForecastsInRange(startDate, endDate);
      const profileKey = getForecastProfileKey(profile);

      const forecastMap = new Map<string, DayForecast>();
      monthForecasts
        .filter(f => f.profileKey === profileKey && f.calcVersion === FORECAST_CALC_VERSION)
        .forEach(f => forecastMap.set(f.date, f));

      setForecasts(forecastMap);

      const now = new Date();
      const sameAsCurrentMonth = now.getFullYear() === currentMonth.getFullYear() && now.getMonth() === currentMonth.getMonth();
      if (sameAsCurrentMonth) {
        setCurrentPeriodForecasts([...forecastMap.values()]);
      } else {
        const currentStart = formatDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
        const currentEnd = formatDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        const currentForecasts = await getForecastsInRange(currentStart, currentEnd);
        setCurrentPeriodForecasts(currentForecasts.filter((item) => item.profileKey === profileKey && item.calcVersion === FORECAST_CALC_VERSION));
      }
    } catch (error) {
      console.error('Ошибка загрузки прогнозов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const monthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthForecastList = useMemo(() => [...forecasts.values()], [forecasts]);
  const selectedMonthLabel = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const currentMonthLabel = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const filteredTargetForecasts = areaFilter === 'all' ? monthForecastList : monthForecastList.filter((item) => getForecastAreaIds(item).includes(areaFilter));
  const filteredCurrentForecasts = areaFilter === 'all' ? currentPeriodForecasts : currentPeriodForecasts.filter((item) => getForecastAreaIds(item).includes(areaFilter));
  const periodComparison = useMemo(() => {
    if (currentMonthLabel === selectedMonthLabel) return null;
    return compareSmartForecastPeriods(filteredCurrentForecasts, filteredTargetForecasts, currentMonthLabel, selectedMonthLabel);
  }, [filteredCurrentForecasts, filteredTargetForecasts, currentMonthLabel, selectedMonthLabel]);
  const monthSummary = useMemo(() => summarizeSmartMonth(
    areaFilter === 'all' ? monthForecastList : monthForecastList.filter((item) => getForecastAreaIds(item).includes(areaFilter)),
    monthDays,
  ), [monthForecastList, areaFilter, monthDays]);

  const openDay = async (date: Date) => {
    setSelectedDate(date);
    setComparisonForecast(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    if (target.getTime() === today.getTime()) return;
    try {
      const current = await getOrCalculateForecast(today, profile);
      setComparisonForecast(current);
    } catch {
      // Comparison is optional; the selected day's forecast remains available.
    }
  };

  const handleDayClick = async (date: Date) => {
    const dateStr = formatDateKey(date);
    const forecast = forecasts.get(dateStr);

    if (forecast) {
      // Прогноз есть в кэше — показываем сразу
      await openDay(date);
    } else {
      // Прогноза нет — нужно рассчитать
      if (!online) {
        alert('Для расчёта новой даты требуется подключение к интернету');
        return;
      }

      setIsCalculating(true);
      try {
        const newForecast = await getOrCalculateForecast(date, profile);
        setForecasts(prev => new Map(prev).set(dateStr, newForecast));
        await openDay(date);
      } catch (error) {
        console.error('Ошибка расчёта прогноза:', error);
        alert('Не удалось рассчитать прогноз для этой даты');
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const renderCalendar = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Пустые ячейки до первого дня месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = formatDateKey(date);
      const forecast = forecasts.get(dateStr);
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const hiddenByFilter = Boolean(forecast && areaFilter !== 'all' && !getForecastAreaIds(forecast).includes(areaFilter));

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(date)}
          disabled={isCalculating || hiddenByFilter}
          title={forecast?.reasoning?.[0] || forecast?.topRecommendation || 'Рассчитать прогноз'}
          className={`aspect-square rounded-2xl p-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
            isToday ? 'ring-2 ring-primary' : ''
          } ${isPast ? 'opacity-60' : ''} ${hiddenByFilter ? 'opacity-15' : ''}`}
          style={{
            background: forecast ? `${forecast.color}20` : 'var(--secondary)',
            border: forecast ? `1px solid ${forecast.color}40` : '1px solid var(--border)'
          }}
        >
          <span className="text-xs opacity-70">{day}</span>
          {forecast ? (
            <>
              <span className="text-2xl">{forecast.icon}</span>
              <span className="text-xs opacity-80 text-center leading-tight">
                {forecast.energyLevel}
              </span>
              {forecast.bestAreas?.[0] && (
                <span className="text-[10px] opacity-70 text-center leading-tight max-w-full truncate">
                  {forecast.bestAreas[0]}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs opacity-40">?</span>
          )}
        </button>
      );
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <>
      <GlassCard>
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6" style={{ color: 'var(--neon-purple)' }} />
            <div>
              <h2 className="mb-1">Календарь прогнозов</h2>
              <p className="opacity-70">
                {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!online && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <WifiOff className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">Оффлайн</span>
              </div>
            )}

            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              Сегодня
            </button>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium opacity-70">Показывать сферу:</span>
          <button type="button" onClick={() => setAreaFilter('all')} className={`rounded-full px-3 py-1.5 text-xs border ${areaFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>Все сферы</button>
          {SMART_CALENDAR_AREAS.map((area) => (
            <button key={area.id} type="button" onClick={() => setAreaFilter(area.id)} aria-pressed={areaFilter === area.id} className={`rounded-full px-3 py-1.5 text-xs border ${areaFilter === area.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>{area.label}</button>
          ))}
        </div>
        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="text-center text-sm opacity-60 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Календарная сетка */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--neon-purple)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
        )}

        {isCalculating && (
          <div className="mt-4 flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/30">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--neon-purple)' }} />
            <span>Готовим прогноз...</span>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Факторы месяца</h3>
            <span className="text-xs opacity-60">Данные: {monthSummary.daysWithData} из {monthSummary.totalDays} дней</span>
          </div>
          {monthSummary.averageEnergy !== null ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">Средняя энергия</p><p className="text-2xl font-semibold">{monthSummary.averageEnergy}/100</p></div>
                <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">Больше ресурсов</p><p className="text-sm font-semibold">{monthSummary.bestEnergyDates.join(', ') || '—'}</p></div>
                <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">Более спокойный темп</p><p className="text-sm font-semibold">{monthSummary.lowEnergyDates.join(', ') || '—'}</p></div>
              </div>
              <div><p className="text-xs font-semibold opacity-70 mb-2">Часто выделяемые сферы</p><div className="flex flex-wrap gap-2">{monthSummary.areaCounts.slice(0, 5).map((area) => <span key={area.id} className="rounded-full bg-secondary px-3 py-1 text-xs">{area.label}: {area.days} дн.</span>)}</div></div>
              {monthSummary.recurringFactors.length > 0 && <div><p className="text-xs font-semibold opacity-70 mb-1">Повторяющиеся основания</p><ul className="list-disc pl-4 space-y-1">{monthSummary.recurringFactors.map((factor) => <li key={factor} className="text-xs opacity-75">{factor}</li>)}</ul></div>}
            </>
          ) : <p className="text-sm opacity-60">Для выбранного фильтра пока нет рассчитанных дней. Выберите дату, чтобы построить персональный прогноз.</p>}
          <p className="text-xs opacity-50">Сводка строится по уже рассчитанным дням месяца; пропуски не интерпретируются как отсутствие влияния.</p>
        </div>

        {periodComparison && <div className="mt-4 rounded-2xl border border-border p-4 space-y-3">
          <div><h3 className="font-semibold">Сравнение периодов</h3><p className="text-xs opacity-60">{periodComparison.currentLabel} → {periodComparison.targetLabel}{areaFilter !== 'all' ? ` · ${SMART_CALENDAR_AREAS.find((item) => item.id === areaFilter)?.label}` : ''}</p></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">{periodComparison.currentLabel} · {periodComparison.currentDays} дней с данными</p><p className="text-xl font-semibold">{periodComparison.currentAverageEnergy === null ? '—' : `${periodComparison.currentAverageEnergy}/100`}</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">{periodComparison.targetLabel} · {periodComparison.targetDays} дней с данными</p><p className="text-xl font-semibold">{periodComparison.targetAverageEnergy === null ? '—' : `${periodComparison.targetAverageEnergy}/100`}</p>{periodComparison.energyDelta !== null && <p className="text-xs">{periodComparison.energyDelta > 0 ? '+' : ''}{periodComparison.energyDelta} пунктов к текущему периоду</p>}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold opacity-70">Чаще выделены сейчас</p><p className="mt-1 text-sm">{periodComparison.currentTopAreas.join(', ') || 'Недостаточно данных'}</p></div><div><p className="text-xs font-semibold opacity-70">Чаще выделены в выбранном месяце</p><p className="mt-1 text-sm">{periodComparison.targetTopAreas.join(', ') || 'Недостаточно данных'}</p></div></div>
          <p className="text-xs opacity-50">{periodComparison.caveat}</p>
        </div>}

        {/* Легенда */}
        <div className="mt-6 p-4 rounded-2xl bg-secondary">
          <p className="text-sm mb-3 opacity-70">Легенда:</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: '#10b98120', border: '1px solid #10b98140' }}
              >
                🔥
              </div>
              <span className="opacity-80">Высокая энергия</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: '#fbbf2420', border: '1px solid #fbbf2440' }}
              >
                ✨
              </div>
              <span className="opacity-80">Умеренная</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: '#ef444420', border: '1px solid #ef444440' }}
              >
                🌙
              </div>
              <span className="opacity-80">Время отдыха</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: '#10b98120', border: '1px solid #10b98140' }}
              >
                🌕
              </div>
              <span className="opacity-80">Полнолуние</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: '#ef444420', border: '1px solid #ef444440' }}
              >
                🌑
              </div>
              <span className="opacity-80">Новолуние</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: '#a78bfa20', border: '1px solid #a78bfa40' }}
              >
                🙏
              </div>
              <span className="opacity-80">Экадаши</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Модальное окно с детальным прогнозом */}
      {selectedDate && (
        <DayForecastModal
          date={selectedDate}
          forecast={forecasts.get(formatDateKey(selectedDate)) || null}
          profile={profile}
          comparisonForecast={comparisonForecast}
          onClose={() => { setSelectedDate(null); setComparisonForecast(null); }}
        />
      )}
    </>
  );
}
