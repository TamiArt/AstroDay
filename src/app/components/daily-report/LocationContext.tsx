// [КОМПОНЕНТ] Контекст текущего местоположения для отчёта
import { Info } from 'lucide-react';

interface LocationContextProps {
  currentLocation: string;
}

export function LocationContext({ currentLocation }: LocationContextProps) {
  return (
    <div
      className="rounded-3xl p-6 border border-primary/30"
      style={{ background: 'var(--primary)/10' }}
    >
      <div className="flex gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="mb-2">
            📍 Вы сейчас в: <strong>{currentLocation}</strong>
          </p>
          <p className="opacity-80 leading-relaxed">
            Транзиты и планетарные часы рассчитаны для вашего текущего местоположения.
            Натальная карта остаётся фиксированной по месту рождения, но интерпретация
            учитывает локальный контекст. Например, транзит Луны по 4-му дому проявляется
            как потребность в уюте — особенно актуально, если вы вдали от дома.
          </p>
        </div>
      </div>
    </div>
  );
}
