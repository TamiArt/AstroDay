// [КОМПОНЕНТ] Модальное окно с подробной информацией об аспектах
import { X, ChevronRight, Info, AlertCircle } from 'lucide-react';
import { Aspect } from '../utils/astrology';
import { PlanetBadge } from './common/PlanetBadge';

interface AspectsDetailModalProps {
  aspects: Aspect[];
  onClose: () => void;
}

export function AspectsDetailModal({
  aspects,
  onClose
}: AspectsDetailModalProps) {
  // Группируем аспекты по типу (гармоничные vs напряжённые)
  const harmonious = aspects.filter(a => a.type === 'trine' || a.type === 'sextile');
  const challenging = aspects.filter(a => a.type === 'square' || a.type === 'opposition');
  const neutral = aspects.filter(a => a.type === 'conjunction' || a.type === 'special');

  const getAspectColor = (type: Aspect['type']) => {
    if (type === 'trine' || type === 'sextile') return 'var(--neon-green)';
    if (type === 'square' || type === 'opposition') return 'var(--neon-pink)';
    return 'var(--neon-purple)';
  };

  const getAspectLabel = (type: Aspect['type']) => {
    const labels: Record<Aspect['type'], string> = {
      conjunction: 'Соединение (0°)',
      square: 'Квадрат (90°)',
      sextile: 'Секстиль (60°)',
      trine: 'Трин (120°)',
      opposition: 'Оппозиция (180°)',
      special: 'Особый аспект'
    };
    return labels[type];
  };

  const AspectCard = ({ aspect }: { aspect: Aspect }) => {
    const color = getAspectColor(aspect.type);
    const isHarmonious = aspect.type === 'trine' || aspect.type === 'sextile';
    const isChallenging = aspect.type === 'square' || aspect.type === 'opposition';

    return (
      <div
        className="p-5 rounded-2xl border"
        style={{
          background: `${color}10`,
          borderColor: `${color}40`
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <PlanetBadge planet={aspect.planet1} size="md" />
          <ChevronRight className="opacity-50" />
          <PlanetBadge planet={aspect.planet2} size="md" />
        </div>

        <div className="mb-3">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ background: color, color: 'white' }}
          >
            {getAspectLabel(aspect.type)}
          </span>
        </div>

        <p className="leading-relaxed mb-3">{aspect.description}</p>

        <div className="flex items-center justify-between text-sm">
          <span className="opacity-70">Сила аспекта:</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(aspect.strength / 10) * 100}%`,
                  background: color
                }}
              />
            </div>
            <span className="font-medium">{aspect.strength.toFixed(1)}/10</span>
          </div>
        </div>

        {isHarmonious && (
          <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
              <span className="opacity-80">Гармоничный аспект — благоприятен для действий</span>
            </div>
          </div>
        )}

        {isChallenging && (
          <div className="mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" />
              <span className="opacity-80">Напряжённый аспект — требует осторожности</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-8"
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
            <h2 className="mb-2">Аспекты сегодня</h2>
            <p className="opacity-70">
              Взаимодействия между натальными планетами и транзитами
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
            <p className="text-2xl font-bold mb-1" style={{ color: 'var(--neon-green)' }}>
              {harmonious.length}
            </p>
            <p className="text-sm opacity-80">Гармоничных</p>
          </div>

          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-2xl font-bold mb-1 text-yellow-600">
              {challenging.length}
            </p>
            <p className="text-sm opacity-80">Напряжённых</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
            <p className="text-2xl font-bold mb-1" style={{ color: 'var(--neon-purple)' }}>
              {neutral.length}
            </p>
            <p className="text-sm opacity-80">Нейтральных</p>
          </div>
        </div>

        {/* Гармоничные аспекты */}
        {harmonious.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--neon-green)' }}
              />
              Гармоничные аспекты ({harmonious.length})
            </h3>
            <div className="space-y-4">
              {harmonious.map((aspect, index) => (
                <AspectCard key={`harmonious-${index}`} aspect={aspect} />
              ))}
            </div>
          </div>
        )}

        {/* Напряжённые аспекты */}
        {challenging.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--neon-pink)' }}
              />
              Напряжённые аспекты ({challenging.length})
            </h3>
            <div className="space-y-4">
              {challenging.map((aspect, index) => (
                <AspectCard key={`challenging-${index}`} aspect={aspect} />
              ))}
            </div>
          </div>
        )}

        {/* Нейтральные аспекты */}
        {neutral.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--neon-purple)' }}
              />
              Соединения ({neutral.length})
            </h3>
            <div className="space-y-4">
              {neutral.map((aspect, index) => (
                <AspectCard key={`neutral-${index}`} aspect={aspect} />
              ))}
            </div>
          </div>
        )}

        {/* Если нет аспектов */}
        {aspects.length === 0 && (
          <div className="p-8 rounded-2xl bg-secondary text-center">
            <p className="opacity-70">Сегодня нет значимых аспектов</p>
          </div>
        )}

        {/* Информация */}
        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-70" />
            <div className="text-sm opacity-70 leading-relaxed">
              <p className="mb-2">
                <strong>Что такое аспекты?</strong>
              </p>
              <p className="mb-2">
                Аспекты — это угловые взаимодействия между планетами. Они показывают,
                как энергии планет влияют друг на друга.
              </p>
              <p>
                Гармоничные аспекты (трин 120°, секстиль 60°) дают возможности и лёгкость.
                Напряжённые (квадрат 90°, оппозиция 180°) создают вызовы и требуют усилий.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
