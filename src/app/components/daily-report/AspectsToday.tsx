// [КОМПОНЕНТ] Понятное описание символической связи дня
import { Info, ChevronRight } from 'lucide-react';
import { Aspect } from '../../utils/astrology';
import { getPlanetName } from '../../utils/planetUtils';
import { GlassCard } from '../common/GlassCard';

interface AspectsTodayProps {
  topAspect: Aspect | null;
  onDeepDive: () => void;
}

export function AspectsToday({ topAspect, onDeepDive }: AspectsTodayProps) {
  if (!topAspect) return null;

  return (
    <GlassCard>
      <h3 className="mb-3">На что ещё обратить внимание</h3>
      <div className="rounded-2xl bg-secondary p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-primary/15 px-3 py-2">{getPlanetName(topAspect.planet1)}</span>
          <ChevronRight className="opacity-50" />
          <span className="rounded-xl bg-primary/15 px-3 py-2">{getPlanetName(topAspect.planet2)}</span>
        </div>
        <p className="text-sm font-medium mb-1">Символическая подсказка</p>
        <p className="leading-relaxed text-sm">{topAspect.description}</p>
        <p className="mt-2 text-xs opacity-60">Это астрологическая трактовка, а не указание на обязательное событие.</p>
        <details className="mt-3 border-t border-border pt-3 text-xs opacity-70">
          <summary className="cursor-pointer">Технические подробности</summary>
          <p className="mt-2">Тип связи: {topAspect.type}. Условная сила аспекта по модели: {topAspect.strength.toFixed(1)}/10.</p>
        </details>
      </div>

      <button
        onClick={onDeepDive}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 transition-colors hover:bg-secondary"
      >
        <Info className="h-4 w-4" />
        Посмотреть все связи
      </button>
    </GlassCard>
  );
}
