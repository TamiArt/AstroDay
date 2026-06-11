// [КОМПОНЕНТ] Badge текущего местоположения для отображения в шапке
import { MapPin, AlertCircle } from 'lucide-react';
import { UserProfile } from '../utils/storage';

interface LocationBadgeProps {
  profile: UserProfile;
  onClick?: () => void;
  className?: string;
}

export function LocationBadge({ profile, onClick, className = '' }: LocationBadgeProps) {
  const isUsingBirthLocation = !profile.currentLocation;
  const displayLocation = profile.currentLocation?.place || profile.birthPlace;

  // Извлекаем только город (без страны/региона для краткости)
  const shortLocation = displayLocation.split(',')[0];

  if (isUsingBirthLocation) {
    // Используется место рождения - показываем предупреждение
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors ${className}`}
        title="Нажмите для установки текущего местоположения"
      >
        <AlertCircle className="w-4 h-4 text-yellow-600" />
        <div className="text-left">
          <p className="text-xs opacity-70">Место рождения</p>
          <p className="font-medium">{shortLocation}</p>
        </div>
      </button>
    );
  }

  // Установлено текущее местоположение - показываем зелёный индикатор
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors ${className}`}
      title="Текущее местоположение установлено"
    >
      <MapPin className="w-4 h-4 text-green-600" />
      <div className="text-left">
        <p className="text-xs opacity-70">Сейчас</p>
        <p className="font-medium">{shortLocation}</p>
      </div>
    </button>
  );
}
