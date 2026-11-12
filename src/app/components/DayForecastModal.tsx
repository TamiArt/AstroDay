// [КОМПОНЕНТ] Модальное окно с детальным прогнозом для выбранного дня
import { X, AlertCircle, Check, Clock, Sparkles } from 'lucide-react';
import { DayForecast } from '../utils/indexedDB';
import { buildSmartDayPlan, compareSmartPeriods } from '../utils/smartCalendar';
import { UserProfile } from '../utils/storage';

interface DayForecastModalProps {
  date: Date;
  forecast: DayForecast | null;
  profile: UserProfile;
  comparisonForecast?: DayForecast | null;
  onClose: () => void;
}

export function DayForecastModal({ date, forecast, profile, comparisonForecast, onClose }: DayForecastModalProps) {
  if (!forecast) return null;

  const isToday = date.toDateString() === new Date().toDateString();
  const isPast = date < new Date();
  const smartPlan = buildSmartDayPlan(forecast);
  const comparison = comparisonForecast ? compareSmartPeriods(comparisonForecast, forecast) : null;
  const factorLabels: Record<string, string> = { natal: 'Натальная карта', dasha: 'Даша', transit: 'Транзиты', panchang: 'Панчанга', energy: 'Ресурс дня', timing: 'Планетарный час', 'data-quality': 'Качество данных' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-8"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{forecast.icon}</span>
              <div>
                <h2 className="mb-1">
                  {date.toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h2>
                {isToday && (
                  <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--primary)', color: 'white' }}>
                    Сегодня
                  </span>
                )}
                {isPast && !isToday && (
                  <span className="opacity-60 text-sm">Прошедший день</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Энергия дня */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            background: `linear-gradient(135deg, ${forecast.color}20, ${forecast.color}10)`,
            border: `1px solid ${forecast.color}40`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2 opacity-70">Энергия дня</p>
              <p className="text-xl">{forecast.label}</p>
            </div>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: forecast.color,
                boxShadow: `0 4px 16px ${forecast.color}60`
              }}
            >
              <span className="text-white text-2xl font-bold">{forecast.energyLevel}</span>
            </div>
          </div>
        </div>

        {/* Топ рекомендация */}
        <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/30 mb-6">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--neon-green)' }} />
            <div>
              <p className="mb-1 font-medium">Главная рекомендация</p>
              <p className="opacity-80">{forecast.topRecommendation}</p>
              {forecast.avoidRecommendation && (
                <p className="opacity-70 mt-3">
                  <strong>Избегайте:</strong> {forecast.avoidRecommendation}
                </p>
              )}
            </div>
          </div>
        </div>

        {forecast.reasoning && forecast.reasoning.length > 0 && (
          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 mb-6">
            <p className="mb-3 font-medium">Почему именно так</p>
            <ul className="space-y-2 opacity-80">
              {forecast.reasoning.slice(0, 5).map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}

        {forecast.bestAreas && forecast.bestAreas.length > 0 && (
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
            <p className="mb-3 font-medium">Лучшие сферы дня</p>
            <div className="flex flex-wrap gap-2">
              {forecast.bestAreas.map((area) => (
                <span key={area} className="px-3 py-1 rounded-full bg-background/60 border border-border">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {forecast.precisionNotes && forecast.precisionNotes.length > 0 && (
          <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
            <p className="mb-3 font-medium">Точность расчёта</p>
            <ul className="space-y-2 opacity-80">
              {forecast.precisionNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-border p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between gap-2"><p className="font-semibold">Почему эта рекомендация персональная</p><span className="text-xs rounded-full bg-secondary px-2 py-1">Уверенность данных: {smartPlan.confidence === 'high' ? 'выше' : smartPlan.confidence === 'medium' ? 'средняя' : 'ограниченная'}</span></div>
          <p className="text-xs opacity-60">Каждый фактор показывает, из какого расчётного слоя взято основание. Это символические показатели, а не гарантия события.</p>
          <div className="space-y-2">{smartPlan.factors.map((factor, index) => <details key={factor.source + ':' + index} className="rounded-xl bg-secondary/60 p-3"><summary className="cursor-pointer text-sm font-medium">{factor.title}<span className="ml-2 text-xs opacity-50">· {factorLabels[factor.source]}</span></summary><p className="mt-2 text-sm opacity-75">{factor.explanation}</p></details>)}</div>
          {smartPlan.factors.length === 0 && <p className="text-sm opacity-60">Подробные основания для этого дня не сохранены в кэше.</p>}
        </div>

        {smartPlan.conflicts.length > 0 && <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-5 mb-6 space-y-3">
          <p className="font-semibold">Проверка противоречий</p>
          {smartPlan.conflicts.map((conflict, index) => <div key={conflict.title + index}><p className="text-sm font-medium">{conflict.title}</p><p className="mt-1 text-sm opacity-80">{conflict.explanation}</p><p className="mt-2 text-sm"><strong>Как согласовать:</strong> {conflict.resolution}</p></div>)}
        </div>}

        {comparison && <div className="rounded-2xl border border-border p-5 mb-6 space-y-3">
          <div><p className="font-semibold">Сравнение с текущим днём</p><p className="text-xs opacity-60">Сегодня · {comparison.currentDate} → выбранная дата · {comparison.targetDate}</p></div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">Сегодня</p><p className="text-2xl font-semibold">{comparison.currentEnergy}/100</p></div><div className="rounded-xl bg-secondary p-3"><p className="text-xs opacity-60">Выбранная дата</p><p className="text-2xl font-semibold">{comparison.targetEnergy}/100</p><p className="text-xs">{comparison.energyDelta > 0 ? '+' : ''}{comparison.energyDelta} пунктов</p></div></div>
          <ul className="list-disc pl-4 space-y-1">{comparison.changes.map((item) => <li key={item} className="text-sm opacity-80">{item}</li>)}</ul>
          <p className="text-xs opacity-50">{comparison.caveat}</p>
        </div>}

        {/* Предупреждение */}
        {forecast.warning && (
          <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
              <div>
                <p className="mb-1 font-medium text-yellow-600">Внимание</p>
                <p className="opacity-80">{forecast.warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Астрологические данные */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-sm opacity-70 mb-1">Луна в знаке</p>
            <p>{forecast.moonSign}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-sm opacity-70 mb-1">Титхи</p>
            <p>{forecast.tithi}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-sm opacity-70 mb-1">Йога</p>
            <p>{forecast.yoga}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-sm opacity-70 mb-1">Планетарный час</p>
            <p>{forecast.planetaryHour}</p>
          </div>
        </div>

        {/* Благоприятные часы */}
        <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--neon-purple)' }} />
            <div className="flex-1">
              <p className="mb-3 font-medium">Благоприятные окна времени</p>
              <div className="space-y-2">
                {forecast.favorableHours.map((hour, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-purple)' }} />
                    <span className="opacity-80">{hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Футер */}
        <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
            <p className="text-sm opacity-70">
              Прогноз рассчитан для {profile.currentLocation?.place || profile.birthPlace}.
              Время местное. Используйте как ориентир, а не как жёсткое правило.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
