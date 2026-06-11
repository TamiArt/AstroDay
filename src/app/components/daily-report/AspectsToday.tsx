// [КОМПОНЕНТ] Влияние аспектов сегодня
import { Info, ChevronRight } from 'lucide-react';
import { Aspect } from '../../utils/astrology';
import { GlassCard } from '../common/GlassCard';

interface AspectsTodayProps {
  topAspect: Aspect | null;
  onDeepDive: () => void;
}

export function AspectsToday({ topAspect, onDeepDive }: AspectsTodayProps) {
  if (!topAspect) return null;

  return (
    <GlassCard>
      <h3 className="mb-4">Влияние аспектов сегодня</h3>
      <div className="p-5 rounded-2xl bg-secondary">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))',
              color: 'white'
            }}
          >
            {topAspect.planet1}
          </div>
          <ChevronRight className="opacity-50" />
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-green))',
              color: 'white'
            }}
          >
            {topAspect.planet2}
          </div>
        </div>
        <p className="leading-relaxed">{topAspect.description}</p>
        <p className="mt-2 opacity-70">
          Сила аспекта: {topAspect.strength.toFixed(1)}/10
        </p>
      </div>

      <button
        onClick={onDeepDive}
        className="w-full mt-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center justify-center gap-2"
      >
        <Info className="w-4 h-4" />
        Подробнее об аспектах
      </button>
    </GlassCard>
  );
}
