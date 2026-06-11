// [КОМПОНЕНТ] Предупреждение о фолбэке на место рождения
import { AlertTriangle, MapPin } from 'lucide-react';
import { GlassCard } from './common/GlassCard';

interface LocationFallbackWarningProps {
  birthPlace: string;
  onSetLocation: () => void;
}

export function LocationFallbackWarning({ birthPlace, onSetLocation }: LocationFallbackWarningProps) {
  return (
    <GlassCard variant="accent" className="mb-6">
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{ background: 'var(--neon-yellow)', color: 'white' }}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h3 className="mb-2">📍 Используется место рождения</h3>
          <p className="opacity-80 leading-relaxed mb-4">
            Текущее местоположение не установлено. Расчёты выполняются для <strong>{birthPlace}</strong>.
            Для точных рекомендаций о планетарных часах, панчанге и благоприятных окнах времени
            укажите ваш текущий город.
          </p>

          <div className="p-3 rounded-xl bg-background/50 mb-4">
            <p className="text-sm opacity-70 mb-2">Что зависит от местоположения:</p>
            <ul className="text-sm space-y-1 opacity-80">
              <li>✅ Транзиты планет (текущее небо над вами)</li>
              <li>✅ Планетарные часы (хора) по местному времени</li>
              <li>✅ Панчанг (титхи, накшатра) для вашего часового пояса</li>
              <li>✅ Благоприятные окна времени</li>
              <li>❌ Натальная карта (всегда по месту рождения)</li>
            </ul>
          </div>

          <button
            onClick={onSetLocation}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
          >
            <MapPin className="w-4 h-4" />
            Указать текущий город
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
