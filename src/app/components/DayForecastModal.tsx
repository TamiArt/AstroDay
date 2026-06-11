// [КОМПОНЕНТ] Модальное окно с детальным прогнозом для выбранного дня
import { X, AlertCircle, Check, Clock, Sparkles } from 'lucide-react';
import { DayForecast } from '../utils/indexedDB';
import { UserProfile } from '../utils/storage';

interface DayForecastModalProps {
  date: Date;
  forecast: DayForecast | null;
  profile: UserProfile;
  onClose: () => void;
}

export function DayForecastModal({ date, forecast, profile, onClose }: DayForecastModalProps) {
  if (!forecast) return null;

  const isToday = date.toDateString() === new Date().toDateString();
  const isPast = date < new Date();

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
