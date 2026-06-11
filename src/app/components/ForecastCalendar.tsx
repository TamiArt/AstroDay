// [КОМПОНЕНТ] Календарь астрологических прогнозов в стиле "прогноз погоды"
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, WifiOff, Calendar as CalendarIcon } from 'lucide-react';
import { UserProfile } from '../utils/storage';
import { DayForecast, getForecastsInRange, isOnline } from '../utils/indexedDB';
import { FORECAST_CALC_VERSION, getForecastProfileKey, getOrCalculateForecast } from '../utils/forecastCalculations';
import { formatDateKey } from '../utils/dateUtils';
import { GlassCard } from './common/GlassCard';
import { DayForecastModal } from './DayForecastModal';

interface ForecastCalendarProps {
  profile: UserProfile;
}

export function ForecastCalendar({ profile }: ForecastCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [forecasts, setForecasts] = useState<Map<string, DayForecast>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [online, setOnline] = useState(isOnline());

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
    } catch (error) {
      console.error('Ошибка загрузки прогнозов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayClick = async (date: Date) => {
    const dateStr = formatDateKey(date);
    const forecast = forecasts.get(dateStr);

    if (forecast) {
      // Прогноз есть в кэше — показываем сразу
      setSelectedDate(date);
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
        setSelectedDate(date);
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

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(date)}
          disabled={isCalculating}
          title={forecast?.reasoning?.[0] || forecast?.topRecommendation || 'Рассчитать прогноз'}
          className={`aspect-square rounded-2xl p-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
            isToday ? 'ring-2 ring-primary' : ''
          } ${isPast ? 'opacity-60' : ''}`}
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
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
