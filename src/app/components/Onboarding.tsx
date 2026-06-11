import { useState, useMemo, useEffect } from 'react';
import { Sparkles, MapPin, Calendar, Clock, Info, Search, Loader2 } from 'lucide-react';
import { getHistoricalTimezone, getTimezoneInfo } from '../utils/geocoding';
import { useGeocoding } from '../hooks/useGeocoding';

interface OnboardingProps {
  onComplete: (data: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string;
    timeUncertainty: number;
    timezoneAccuracy: 'matched-region' | 'estimated-longitude' | 'manual';
  }) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [latitude, setLatitude] = useState(55.7558); // Moscow default
  const [longitude, setLongitude] = useState(37.6173);
  const [timezone, setTimezone] = useState('Europe/Moscow'); // Default
  const [timezoneAccuracy, setTimezoneAccuracy] = useState<'matched-region' | 'estimated-longitude' | 'manual'>('manual');
  const [timeUncertainty, setTimeUncertainty] = useState(0);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // [РЕФАКТОРИНГ] Используем хук useGeocoding вместо дублирования логики
  const birthDateTime = useMemo(
    () => (birthDate ? new Date(birthDate) : undefined),
    [birthDate]
  );
  const {
    search,
    selectResult,
    isSearching,
    searchResults,
    error: searchError,
    setError: setSearchError
  } = useGeocoding(birthDateTime);

  // Auto-select first result when search completes
  useEffect(() => {
    if (searchResults.length > 0) {
      const result = searchResults[0];
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setBirthPlace(result.displayName);
      setTimezone(result.timezone);
      setTimezoneAccuracy(result.timezoneAccuracy);
      setLocationConfirmed(true);
    }
  }, [searchResults]);

  const handleSearch = async () => {
    if (!birthPlace.trim()) {
      setSearchError('Введите название места');
      return;
    }

    if (!birthDate) {
      setSearchError('Сначала укажите дату рождения (предыдущий шаг)');
      return;
    }

    await search(birthPlace);
  };

  const handleSelectResult = (result: {
    latitude: number;
    longitude: number;
    displayName: string;
    timezone: string;
    timezoneAccuracy: 'matched-region' | 'estimated-longitude';
  }) => {
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setBirthPlace(result.displayName);
    setTimezone(result.timezone);
    setTimezoneAccuracy(result.timezoneAccuracy);
    setLocationConfirmed(true);
    selectResult(result);
  };

  const handleSubmit = () => {
    // Ensure we have timezone determined
    const finalTimezone = timezone || getHistoricalTimezone(latitude, longitude, new Date(birthDate));

    onComplete({
      name,
      birthDate,
      birthTime,
      birthPlace,
      latitude,
      longitude,
      timezone: finalTimezone,
      timeUncertainty,
      timezoneAccuracy
    });
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl rounded-3xl p-8 md:p-12"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
        }}
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="opacity-70">Шаг {step} из {totalSteps}</span>
            <Sparkles className="w-6 h-6" style={{ color: 'var(--neon-purple)' }} />
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(step / totalSteps) * 100}%`,
                background: 'linear-gradient(90deg, var(--neon-purple), var(--neon-pink))'
              }}
            />
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h1 className="mb-3">Добро пожаловать в ведическую астрологию</h1>
              <p className="opacity-80 leading-relaxed">
                Джйотиш — это древняя индийская система, которая помогает понять циклы жизни и находить гармонию
                с естественными ритмами. Она не предсказывает будущее, а показывает тенденции и возможности.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-accent/20 border border-accent/30">
              <div className="flex gap-3">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="mb-2">
                    Все ваши данные хранятся только в этом браузере и никогда не отправляются на сервер.
                  </p>
                  <p className="opacity-70">
                    Для точных расчётов понадобятся дата, время и место рождения.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2">Как вас зовут?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
            >
              Продолжить
            </button>
          </div>
        )}

        {/* Step 2: Birth Date */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="mb-3">Дата рождения</h2>
              <p className="opacity-80">
                Она определяет положение планет в момент вашего рождения.
              </p>
            </div>

            <div>
              <label className="block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Дата рождения
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 rounded-xl border border-border hover:bg-secondary transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!birthDate}
                className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Birth Time */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="mb-3">Время рождения</h2>
              <p className="opacity-80 mb-4">
                Точное время важно для расчёта асцендента (восходящего знака).
              </p>
            </div>

            <div>
              <label className="block mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Время рождения
              </label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-input-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block mb-2">
                Погрешность времени: ±{timeUncertainty} мин
              </label>
              <input
                type="range"
                min="0"
                max="15"
                value={timeUncertainty}
                onChange={(e) => setTimeUncertainty(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 opacity-60">
                Если точное время неизвестно, укажите примерную погрешность
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 rounded-xl border border-border hover:bg-secondary transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!birthTime}
                className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Birth Place */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="mb-3">Место рождения</h2>
              <p className="opacity-80">
                Введите город или место рождения. Координаты определятся автоматически.
              </p>
            </div>

            <div>
              <label className="block mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Город или место рождения
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => {
                    setBirthPlace(e.target.value);
                    setLocationConfirmed(false);
                    setSearchError('');
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
                  disabled={isSearching || !birthPlace.trim()}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                  style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <p className="text-destructive">{searchError}</p>
              </div>
            )}

            {searchResults.length > 1 && (
              <div className="space-y-2">
                <p className="opacity-70">Найдено несколько мест. Выберите нужное:</p>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary transition-all text-left"
                  >
                    <p className="mb-1">{result.displayName}</p>
                    <p className="opacity-60">
                      {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {locationConfirmed && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="mb-2">✅ Координаты и часовой пояс определены:</p>
                    <p className="opacity-70 mb-1">
                      📍 Координаты (WGS84): {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </p>
                    <p className="opacity-70">
                      🕐 Часовой пояс: {timezone ? getTimezoneInfo(timezone, new Date(birthDate)) : 'определяется...'}
                    </p>
                    <p className="opacity-60 mt-2">
                      {timezoneAccuracy === 'estimated-longitude'
                        ? 'Часовой пояс определён приблизительно по долготе. Проверьте его, если город находится рядом с границей зоны.'
                        : 'Часовой пояс учитывает исторические изменения для даты вашего рождения'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-4 rounded-xl border border-border hover:bg-secondary transition-colors"
              >
                Назад
              </button>
              <button
                onClick={handleSubmit}
                disabled={!birthPlace.trim() || !locationConfirmed || !Number.isFinite(latitude) || !Number.isFinite(longitude)}
                className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
              >
                Создать карту
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
