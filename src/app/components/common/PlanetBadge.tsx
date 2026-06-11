// [КОМПОНЕНТ] Переиспользуемый badge для планет
import { getPlanetIcon, getPlanetName, getPlanetColor } from '../../utils/planetUtils';

interface PlanetBadgeProps {
  planet: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlanetBadge({
  planet,
  showName = true,
  size = 'md',
  className = ''
}: PlanetBadgeProps) {
  const icon = getPlanetIcon(planet);
  const name = getPlanetName(planet);
  const color = getPlanetColor(planet);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl ${sizeClasses[size]} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        color: 'white',
        boxShadow: `0 2px 8px ${color}40`
      }}
    >
      <span>{icon}</span>
      {showName && <span>{name}</span>}
    </div>
  );
}
