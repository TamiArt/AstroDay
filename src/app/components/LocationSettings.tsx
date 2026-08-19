import { useState } from 'react';
import { Check, Info, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { useGeocoding } from '../hooks/useGeocoding';
import { getTimezoneInfoFromCoordinates, reverseGeocode, type GeocodingResult } from '../utils/geocoding';
import { isValidCoordinates, isValidIanaTimezone } from '../utils/locationValidation';
import { saveUserProfile, type UserProfile } from '../utils/storage';

interface LocationSettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

interface LocationDraft {
  place: string;
  latitude: string;
  longitude: string;
  timezone: string;
  selectedFromSearch: boolean;
}

const EMPTY_DRAFT: LocationDraft = {
  place: '',
  latitude: '',
  longitude: '',
  timezone: '',
  selectedFromSearch: false,
};

export function LocationSettings({ profile, onUpdate }: LocationSettingsProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [draft, setDraft] = useState<LocationDraft>(EMPTY_DRAFT);
  const [error, setError] = useState('');

  const {
    search,
    selectResult,
    reset: resetGeocoding,
    isSearching,
    searchResults,
    error: searchError,
    setError: setSearchError,
  } = useGeocoding();

  const currentLocation = profile.currentLocation;
  const usingBirthLocation = !currentLocation;
  const timezoneAccuracy = currentLocation?.timezoneAccuracy ?? profile.timezoneAccuracy;
  const timezoneAccuracyLabel = timezoneAccuracy === 'manual'
    ? '(выбран вручную)'
    : timezoneAccuracy === 'estimated-longitude'
      ? '(приблизительно по долготе)'
      : '(по региону)';
  const visibleError = error || searchError;

  const clearDraft = () => {
    setDraft(EMPTY_DRAFT);
    resetGeocoding();
    setError('');
  };

  const handleAutoDetect = () => {
    setError('');
    setSearchError('');
    setIsDetecting(true);

    if (!navigator.geolocation) {
      setError('Ваш браузер не поддерживает геолокацию');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (!isValidCoordinates(latitude, longitude)) {
          setError('Браузер вернул некорректные координаты');
          setIsDetecting(false);
          return;
        }

        const timezoneInfo = getTimezoneInfoFromCoordinates(latitude, longitude);
        let placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          placeName = await reverseGeocode(latitude, longitude);
        } catch (reverseError) {
          console.warn('Reverse geocoding failed:', reverseError);
        }

        const updatedProfile: UserProfile = {
          ...profile,
          currentLocation: {
            place: placeName,
            latitude,
            longitude,
            timezone: timezoneInfo.timezone,
            timezoneAccuracy: timezoneInfo.accuracy,
            lastUpdated: new Date().toISOString(),
          },
        };

        saveUserProfile(updatedProfile);
        onUpdate(updatedProfile);
        setIsDetecting(false);
      },
      (geolocationError) => {
        let errorMessage = 'Не удалось определить местоположение.';
        if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
          errorMessage = 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.';
        } else if (geolocationError.code === geolocationError.POSITION_UNAVAILABLE) {
          errorMessage = 'Местоположение недоступно. Проверьте подключение и настройки геолокации.';
        } else if (geolocationError.code === geolocationError.TIMEOUT) {
          errorMessage = 'Превышено время ожидания геолокации. Попробуйте ещё раз.';
        }
        setError(errorMessage);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 300_000,
      },
    );
  };

  const handleSearch = async () => {
    if (!draft.place.trim()) {
      setSearchError('Введите название места');
      return;
    }

    setError('');
    setDraft((current) => ({
      ...current,
      latitude: '',
      longitude: '',
      timezone: '',
      selectedFromSearch: false,
    }));
    await search(draft.place);
  };

  const handleSelectResult = (result: GeocodingResult) => {
    setDraft({
      place: result.displayName,
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString(),
      timezone: result.timezone,
      selectedFromSearch: true,
    });
    setError('');
    selectResult(result);
  };

  const handleManualSave = () => {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);

    if (!draft.selectedFromSearch || !draft.place.trim()) {
      setError('Сначала найдите и выберите нужное место из результатов поиска');
      return;
    }

    if (!isValidCoordinates(latitude, longitude)) {
      setError('Координаты вне допустимого диапазона: широта -90..90, долгота -180..180');
      return;
    }

    const timezoneInfo = getTimezoneInfoFromCoordinates(latitude, longitude);
    const selectedTimezone = draft.timezone.trim() || timezoneInfo.timezone;

    if (!isValidIanaTimezone(selectedTimezone)) {
      setError('Введите корректный IANA timezone, например Europe/Moscow или Asia/Vladivostok');
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      currentLocation: {
        place: draft.place.trim(),
        latitude,
        longitude,
        timezone: selectedTimezone,
        timezoneAccuracy: selectedTimezone === timezoneInfo.timezone ? timezoneInfo.accuracy : 'manual',
        lastUpdated: new Date().toISOString(),
      },
    };

    saveUserProfile(updatedProfile);
    onUpdate(updatedProfile);
    setIsManual(false);
    clearDraft();
  };

  const handleReset = () => {
    const updatedProfile: UserProfile = {
      ...profile,
      currentLocation: undefined,
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
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)',
      }}
    >
      <div className="mb-6">
        <h3 className="mb-2">Текущее местоположение</h3>
        <p className="opacity-70 leading-relaxed">
          Для точных расчётов транзитов, планетарных часов и панчанга укажите текущее местоположение.
          Если оно не указано, используется место рождения.
        </p>
      </div>

      <div
        className="p-5 rounded-2xl mb-6"
        style={{
          background: usingBirthLocation ? 'var(--secondary)' : 'var(--accent)/20',
          border: usingBirthLocation ? '1px solid var(--border)' : '1px solid var(--accent)/30',
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
              Часовой пояс: {usingBirthLocation ? profile.timezone : currentLocation.timezone} {timezoneAccuracyLabel}
            </p>
            {currentLocation && (
              <p className="opacity-60 mt-2">
                Обновлено: {new Date(currentLocation.lastUpdated).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
          {currentLocation && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Сбросить и использовать место рождения"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {visibleError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6">
          <p className="text-destructive">{visibleError}</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
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

        {!isManual ? (
          <button
            type="button"
            onClick={() => {
              setIsManual(true);
              setError('');
              setSearchError('');
            }}
            className="w-full py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            Или выбрать место вручную
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
                  value={draft.place}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      place: event.target.value,
                      latitude: '',
                      longitude: '',
                      timezone: '',
                      selectedFromSearch: false,
                    }));
                    setError('');
                    setSearchError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleSearch();
                    }
                  }}
                  placeholder="Москва, Россия"
                  className="flex-1 px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  disabled={isSearching || !draft.place.trim()}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="opacity-70">Выберите точное место:</p>
                {searchResults.map((result, index) => (
                  <button
                    type="button"
                    key={`${result.displayName}-${index}`}
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

            {draft.selectedFromSearch && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm opacity-80">Выбрано:</p>
                    <p className="text-sm opacity-70">
                      {Number(draft.latitude).toFixed(4)}, {Number(draft.longitude).toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block mb-2">Timezone (IANA)</label>
              <input
                type="text"
                value={draft.timezone}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, timezone: event.target.value }));
                  setError('');
                }}
                disabled={!draft.selectedFromSearch}
                placeholder="Europe/Moscow"
                className="w-full px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
              <p className="mt-2 text-sm opacity-60">
                После выбора места проверьте IANA timezone. Если он исправлен вручную, это будет сохранено в профиле.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsManual(false);
                  clearDraft();
                }}
                className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary/70 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleManualSave}
                disabled={!draft.selectedFromSearch || !draft.timezone.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Check className="w-4 h-4" />
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
        <p className="opacity-70 leading-relaxed">
          💡 <strong>Зачем это нужно:</strong> транзиты, планетарные часы и панчанг рассчитываются
          относительно текущего местоположения. Натальная карта всегда остаётся привязана к месту рождения.
        </p>
      </div>
    </div>
  );
}
