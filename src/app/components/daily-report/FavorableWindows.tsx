// [КОМПОНЕНТ] Благоприятные окна времени
import { GlassCard } from '../common/GlassCard';

interface FavorableWindowsProps {
  planetaryHour: string;
  windows: string[];
}

export function FavorableWindows({ planetaryHour, windows }: FavorableWindowsProps) {
  const visibleWindows = windows.length > 0
    ? windows
    : [`Текущий час ${planetaryHour} — используйте для задач этой планеты`];

  return (
    <GlassCard>
      <h3 className="mb-4">Благоприятные окна времени</h3>

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
                {index === 0 ? 'Идеально' : index === 1 ? 'Хорошо' : 'Поддержка'}
              </span>
            </div>
            <p className="opacity-70">
              Рассчитано по планетарным часам для текущего местоположения.
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
