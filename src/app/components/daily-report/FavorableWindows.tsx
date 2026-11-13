// [КОМПОНЕНТ] Традиционные временные ориентиры
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface FavorableWindowsProps {
  planetaryHour: string;
  windows: string[];
}

export function FavorableWindows({ planetaryHour, windows }: FavorableWindowsProps) {
  const visibleWindows = windows.length > 0
    ? windows
    : [`Сейчас планетарный час ${planetaryHour}. В Джйотиш его символически связывают с темами этой планеты.`];

  return (
    <GlassCard>
      <h3 className="mb-4">Планетарные часы <TermTooltip term="planetaryHour" /> и традиционные временные ориентиры</h3>

      <div className="space-y-3">
        {visibleWindows.map((window, index) => (
          <div key={window} className="p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <p>{window}</p>
              <span
                className="px-3 py-1 rounded-full"
                style={{
                  background: index === 0 ? 'var(--neon-green)' : index === 1 ? 'var(--neon-yellow)' : 'var(--neon-purple)',
                  color: 'white'
                }}
              >
                {index === 0 ? 'Первое окно' : index === 1 ? 'Следующее окно' : 'Дополнительное окно'}
              </span>
            </div>
            <p className="opacity-70">
              Время рассчитано по местному восходу и закату. В традиции Джйотиш планетарным часам приписывают символические темы; это не гарантия результата и не причина откладывать важные дела.
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
