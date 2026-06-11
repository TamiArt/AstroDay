import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, X, Check, Search, Info } from 'lucide-react';
import { UserProfile, saveUserProfile } from '../utils/storage';
import { getTimezoneInfoFromCoordinates, reverseGeocode } from '../utils/geocoding';
import { useGeocoding } from '../hooks/useGeocoding';

interface LocationSettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export function LocationSettings({ profile, onUpdate }: LocationSettingsProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [manualPlace, setManualPlace] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualTimezone, setManualTimezone] = useState('');
  const [error, setError] = useState('');

  // [РЕФАКТОРИНГ] Используем хук useGeocoding вместо дублирования логики
  const {
    search,
    selectResult: selectGeocodingResult,
    reset: resetGeocoding,
    isSearching,
    searchResults,
    error: searchError,
    setError: setSearchError
  } = useGeocoding();

  const currentLocation = profile.currentLocation;
  const usingBirthLocation = !currentLocation;
  const timezoneAccuracy = currentLocation ? currentLocation.timezoneAccuracy : profile.timezoneAccuracy;
  const timezoneAccuracyLabel = timezoneAccuracy === 'manual'
    ? '(выбран вручную)'
    : timezoneAccuracy === 'estimated-longitude'
      ? '(приблизительно по долготе)'
      : '(по региону)';

  // Auto-select first result when search completes
  useEffect(() => {
    if (searchResults.length > 0) {
      const result = searchResults[0];
      setManualLat(result.latitude.toString());
      setManualLon(result.longitude.toString());
      setManualPlace(result.displayName);
      setManualTimezone(result.timezone);
    }
  }, [searchResults]);

  // Sync search error with local error state
  useEffect(() => {
    if (searchError) {
      setError(searchError);
    }
  }, [searchError]);

  const handleAutoDetect = () => {
    setError('');
    setIsDetecting(true);

    if (!navigator.geolocation) {
      setError('Ваш браузер не поддерживает геолокацию');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const timezoneInfo = getTimezoneInfoFromCoordinates(latitude, longitude);

        // Try to get place name via reverse geocoding
        let placeName = 'Текущее местоположение (автоопределено)';
        try {
          placeName = await reverseGeocode(latitude, longitude);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          // If reverse geocoding fails, show coordinates
          placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        const updatedProfile: UserProfile = {
          ...profile,
          currentLocation: {
            place: placeName,
            latitude,
            longitude,
            timezone: timezoneInfo.timezone,
            timezoneAccuracy: timezoneInfo.accuracy,
            lastUpdated: new Date().toISOString()
          }
        };

        saveUserProfile(updatedProfile);
        onUpdate(updatedProfile);
        setIsDetecting(false);
      },
      (err) => {
        // [УЛУЧШЕНО] Специфичные сообщения об ошибках геолокации
        let errorMessage = 'Не удалось определить местоположение.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Местоположение недоступно. Проверьте подключение к интернету.';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Превышено время ожидания. Попробуйте ещё раз.';
        }
        setError(errorMessage);
        setIsDetecting(false);
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true, // Use GPS for WGS84 accuracy
        timeout: 15000, // Увеличен таймаут до 15 секунд
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSearch = async () => {
    if (!manualPlace.trim()) {
      setSearchError('Введите название места');
      return;
    }

    setError('');
    await search(manualPlace);
  };

  const handleSelectResult = (result: {
    latitude: number;
    longitude: number;
    displayName: string;
    timezone: string;
    timezoneAccuracy: 'matched-region' | 'estimated-longitude';
  }) => {
    setManualLat(result.latitude.toString());
    setManualLon(result.longitude.toString());
    setManualPlace(result.displayName);
    setManualTimezone(result.timezone);
    selectGeocodingResult(result);
  };

  const isValidTimezone = (timezone: string) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  };

  const handleManualSave = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (!manualPlace.trim() || isNaN(lat) || isNaN(lon)) {
      setError('Заполните все поля корректно');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Координаты вне допустимого диапазона: широта -90..90, долгота -180..180');
      return;
    }

    const timezoneInfo = getTimezoneInfoFromCoordinates(lat, lon);
    const selectedTimezone = manualTimezone.trim() || timezoneInfo.timezone;

    if (!isValidTimezone(selectedTimezone)) {
      setError('Введите корректный IANA timezone, например Europe/Moscow или Asia/Vladivostok');
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      currentLocation: {
        place: manualPlace,
        latitude: lat,
        longitude: lon,
        timezone: selectedTimezone,
        timezoneAccuracy: selectedTimezone === timezoneInfo.timezone ? timezoneInfo.accuracy : 'manual',
        lastUpdated: new Date().toISOString()
      }
    };

    saveUserProfile(updatedProfile);
    onUpdate(updatedProfile);
    setIsManual(false);
    setManualPlace('');
    setManualLat('');
    setManualLon('');
    setManualTimezone('');
    resetGeocoding();
    setError('');
  };

  const handleReset = () => {
    const updatedProfile: UserProfile = {
      ...profile,
      currentLocation: undefined
    };

    saveUserProfile(updatedProfile);
    onUpdate(updatedProfile);
  };

  return (
    <div
      className="rounded-3xl p-8"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
      }}
    >
      <div className="mb-6">
        <h3 className="mb-2">Текущее местоположение</h3>
        <p className="opacity-70 leading-relaxed">
          Для точных расчётов транзитов, планетарных часов и панчанга укажите ваше текущее местоположение.
          Если не указано — используется место рождения.
        </p>
      </div>

      {/* Current Status */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{
          background: usingBirthLocation ? 'var(--secondary)' : 'var(--accent)/20',
          border: usingBirthLocation ? '1px solid var(--border)' : '1px solid var(--accent)/30'
        }}
      >
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="mb-1">
              {usingBirthLocation ? 'Используется место рождения' : 'Текущее местоположение установлено'}
            </p>
            <p className="opacity-70">
              {usingBirthLocation
                ? `${profile.birthPlace} (${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)})`
                : `${currentLocation.place} (${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)})`}
            </p>
            <p className="opacity-60 mt-1">
              Часовой пояс: {usingBirthLocation ? profile.timezone : currentLocation.timezone}
              {' '}
              {timezoneAccuracyLabel}
            </p>
            {currentLocation && (
              <p className="opacity-60 mt-2">
                Обновлено: {new Date(currentLocation.lastUpdated).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
          {currentLocation && (
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Сбросить и использовать место рождения"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Auto-detect */}
      <div className="space-y-4">
        <button
          onClick={handleAutoDetect}
          disabled={isDetecting}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Определение...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              Определить автоматически
            </>
          )}
        </button>

        {/* Manual Input Toggle */}
        {!isManual ? (
          <button
            onClick={() => setIsManual(true)}
            className="w-full py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            Или ввести вручную
          </button>
        ) : (
          <div
            className="p-6 rounded-2xl space-y-4 animate-in fade-in duration-300"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <div>
              <label className="block mb-2">Город или место</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualPlace}
                  onChange={(e) => {
                    setManualPlace(e.target.value);
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="Москва, Россия"
                  className="flex-1 px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !manualPlace.trim()}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {searchResults.length > 1 && (
              <div className="space-y-2">
                <p className="opacity-70">Найдено несколько мест. Выберите нужное:</p>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-input-background transition-all text-left"
                  >
                    <p className="mb-1">{result.displayName}</p>
                    <p className="opacity-60 text-sm">
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {(searchResults.length === 1 || (searchResults.length === 0 && manualLat && manualLon)) && manualLat && manualLon && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm opacity-80">Координаты определены:</p>
                    <p className="text-sm opacity-70">
                      {parseFloat(manualLat).toFixed(4)}, {parseFloat(manualLon).toFixed(4)}
                    </p>
                    {manualTimezone && (
                      <p className="text-sm opacity-70">
                        Timezone: {manualTimezone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block mb-2">Timezone (IANA)</label>
              <input
                type="text"
                value={manualTimezone}
                onChange={(e) => {
                  setManualTimezone(e.target.value);
                  setError('');
                }}
                placeholder="Europe/Moscow"
                className="w-full px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-2 text-sm opacity-60">
                Если автоматически выбран неверный часовой пояс, укажите его вручную. Тогда точность будет отмечена как manual.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsManual(false);
                  setManualPlace('');
                  setManualLat('');
                  setManualLon('');
                  setManualTimezone('');
                  resetGeocoding();
                  setError('');
                }}
                className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary/70 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleManualSave}
                disabled={!manualPlace.trim() || !manualLat || !manualLon}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Check className="w-4 h-4" />
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
        <p className="opacity-70 leading-relaxed">
          💡 <strong>Зачем это нужно:</strong> Транзиты, планетарные часы и панчанг рассчитываются
          относительно вашего текущего местоположения. Если вы путешествуете или переехали,
          обновите местоположение для точных рекомендаций. Натальная карта всегда рассчитывается
          по месту рождения.
        </p>
      </div>
    </div>
  );
}
