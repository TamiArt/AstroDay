// [РЕФАКТОРИНГ] Использован хук useAstroCalculations и переиспользуемые компоненты
import { lazy, Suspense, useEffect, useState, type ChangeEvent } from 'react';
import { Heart, Info, Download, Trash2, Sparkles, Upload } from 'lucide-react';
import { UserProfile, importUserProfile, saveDailyFeedback, saveUserProfile } from '../utils/storage';
import { useAstroCalculations } from '../hooks/useAstroCalculations';
import { ErrorDisplay } from './common/ErrorDisplay';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GlassCard } from './common/GlassCard';
import { LocationBadge } from './LocationBadge';
import { LocationFallbackWarning } from './LocationFallbackWarning';
import { initDB, cleanupOldForecasts } from '../utils/indexedDB';
import { precalculateForecasts } from '../utils/forecastCalculations';
import { formatDateKey } from '../utils/dateUtils';

const AspectsDetailModal = lazy(() => import('./AspectsDetailModal').then(module => ({ default: module.AspectsDetailModal })));
const CurrentMoment = lazy(() => import('./CurrentMoment').then(module => ({ default: module.CurrentMoment })));
const DailyReport = lazy(() => import('./DailyReport').then(module => ({ default: module.DailyReport })));
const DayOverview = lazy(() => import('./DayOverview').then(module => ({ default: module.DayOverview })));
const EnergyTracker = lazy(() => import('./EnergyTracker').then(module => ({ default: module.EnergyTracker })));
const ForecastCalendar = lazy(() => import('./ForecastCalendar').then(module => ({ default: module.ForecastCalendar })));
const LocationSettings = lazy(() => import('./LocationSettings').then(module => ({ default: module.LocationSettings })));
const NatalChartDetailed = lazy(() => import('./NatalChartDetailed').then(module => ({ default: module.NatalChartDetailed })));
const PanchangWidget = lazy(() => import('./PanchangWidget').then(module => ({ default: module.PanchangWidget })));
const RemediesLibrary = lazy(() => import('./RemediesLibrary').then(module => ({ default: module.RemediesLibrary })));

interface DashboardProps {
  profile: UserProfile;
  onReset: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

type DashboardView = 'dayoverview' | 'overview' | 'panchang' | 'natalchart' | 'remedies' | 'calendar' | 'now' | 'settings';

const NAV_ITEMS: Array<{ id: DashboardView; label: string }> = [
  { id: 'dayoverview', label: 'Обзор дня' },
  { id: 'overview', label: 'Сегодня' },
  { id: 'panchang', label: 'Панчанг' },
  { id: 'natalchart', label: 'Натальная карта' },
  { id: 'remedies', label: 'Упайи' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'now', label: 'Сейчас' },
  { id: 'settings', label: 'Настройки' },
];

function ViewFallback() {
  return (
    <div className="min-h-[240px] flex items-center justify-center">
      <LoadingSpinner text="Загрузка раздела..." />
    </div>
  );
}

export function Dashboard({ profile, onReset, onProfileUpdate }: DashboardProps) {
  const [selectedView, setSelectedView] = useState<DashboardView>('dayoverview');
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [dailyMood, setDailyMood] = useState<number | null>(null);
  const [isPrecalculating, setIsPrecalculating] = useState(false);
  const [precalculateProgress, setPrecalculateProgress] = useState({ current: 0, total: 0 });

  const currentDate = new Date();

  // [ДОБАВЛЕНО] Инициализация IndexedDB и предвычисление прогнозов при старте
  useEffect(() => {
    const initializeForecasts = async () => {
      try {
        // Инициализируем базу данных
        await initDB();

        // Очищаем старые прогнозы
        await cleanupOldForecasts();

        // Предвычисляем прогнозы для ±30 дней
        setIsPrecalculating(true);
        await precalculateForecasts(
          profile,
          30,
          30,
          (current, total) => setPrecalculateProgress({ current, total })
        );
      } catch (error) {
        console.error('Ошибка инициализации прогнозов:', error);
      } finally {
        setIsPrecalculating(false);
      }
    };

    initializeForecasts();
  }, [profile]);

  // [ДОБАВЛЕНО] Используем хук для централизованных расчётов с обработкой ошибок
  const {
    natalChart,
    currentChart,
    aspects,
    panchang,
    planetaryHour,
    planetaryHourInfo,
    favorableWindows,
    isLoading,
    error,
    retry
  } = useAstroCalculations(profile);

  const handleMoodSelect = (mood: number) => {
    setDailyMood(mood);
    saveDailyFeedback({
      date: formatDateKey(currentDate),
      mood
    });
  };

  const handleProfileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onProfileUpdate) return;

    try {
      const json = await file.text();
      const importedProfile = importUserProfile(json);
      saveUserProfile(importedProfile);
      onProfileUpdate(importedProfile);
      alert('Профиль импортирован. Прогнозы будут пересчитаны под новые данные.');
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : 'Не удалось импортировать профиль.';
      alert(message);
    }
  };

  // [ДОБАВЛЕНО] Показываем состояние загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingSpinner text="Расчёт астрологических данных..." size="lg" />
      </div>
    );
  }

  // [ДОБАВЛЕНО] Показываем ошибку с возможностью повтора
  if (error || !natalChart || !currentChart || !panchang) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="max-w-md">
          <h2 className="mb-4">Ошибка расчёта данных</h2>
          <ErrorDisplay
            error={error || 'Не удалось рассчитать астрологические данные'}
            onRetry={retry}
            className="mb-6"
          />
          <button
            onClick={onReset}
            className="w-full px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            Вернуться к настройкам
          </button>
        </GlassCard>
      </div>
    );
  }

  const currentLat = profile.currentLocation?.latitude ?? profile.latitude;
  const currentLon = profile.currentLocation?.longitude ?? profile.longitude;
  const currentTimezone = profile.currentLocation?.timezone ?? profile.timezone;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div
        className="sticky top-0 z-10 p-6 mb-6"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)'
        }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex-1">
            <h1 className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" style={{ color: 'var(--neon-purple)' }} />
              Привет, {profile.name}!
            </h1>
            <p className="opacity-70 mt-1">
              {currentDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* [ДОБАВЛЕНО] Индикатор текущего местоположения */}
          <LocationBadge
            profile={profile}
            onClick={() => setSelectedView('settings')}
          />

          <button
            onClick={onReset}
            className="p-3 rounded-xl hover:bg-secondary transition-colors"
            title="Настройки"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div
          className="inline-flex rounded-2xl p-1 gap-1"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)'
          }}
        >
          {NAV_ITEMS.map((view) => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`px-6 py-3 rounded-xl transition-all ${
                selectedView === view.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-secondary/50'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* [ДОБАВЛЕНО] Обзор дня с диаграммой сфер */}
        {selectedView === 'dayoverview' && (
          <Suspense fallback={<ViewFallback />}>
            <DayOverview
              natalChart={natalChart}
              currentChart={currentChart}
              aspects={aspects}
              panchang={panchang}
            />
          </Suspense>
        )}

        {/* [ДОБАВЛЕНО] Предупреждение о фолбэке на место рождения */}
        {selectedView === 'overview' && !profile.currentLocation && (
          <LocationFallbackWarning
            birthPlace={profile.birthPlace}
            onSetLocation={() => setSelectedView('settings')}
          />
        )}

        {selectedView === 'overview' && (
          <Suspense fallback={<ViewFallback />}>
            <DailyReport
              profile={profile}
              natalChart={natalChart}
              currentChart={currentChart}
              aspects={aspects}
              panchang={panchang}
              planetaryHour={planetaryHour}
              planetaryHourInfo={planetaryHourInfo}
              favorableWindows={favorableWindows}
              onDeepDive={() => setShowDeepDive(true)}
              isAwayFromBirthPlace={!!profile.currentLocation}
              currentLocation={profile.currentLocation?.place}
            />
            <EnergyTracker profile={profile} days={7} />
          </Suspense>
        )}

        {selectedView === 'panchang' && (
          <Suspense fallback={<ViewFallback />}>
            <PanchangWidget panchang={panchang} />
          </Suspense>
        )}

        {selectedView === 'natalchart' && (
          <Suspense fallback={<ViewFallback />}>
            <NatalChartDetailed natalChart={natalChart} />
          </Suspense>
        )}

        {selectedView === 'remedies' && (
          <Suspense fallback={<ViewFallback />}>
            <RemediesLibrary />
          </Suspense>
        )}

        {selectedView === 'calendar' && (
          <>
            {isPrecalculating && (
              <div className="mb-6 p-5 rounded-2xl bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-3 mb-3">
                  <LoadingSpinner size="sm" />
                  <div>
                    <p className="mb-1">Предвычисляем прогнозы...</p>
                    <p className="text-sm opacity-70">
                      {precalculateProgress.current} из {precalculateProgress.total}
                    </p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${precalculateProgress.total > 0 ? (precalculateProgress.current / precalculateProgress.total) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, var(--neon-purple), var(--neon-pink))'
                    }}
                  />
                </div>
              </div>
            )}
            <Suspense fallback={<ViewFallback />}>
              <ForecastCalendar profile={profile} />
            </Suspense>
          </>
        )}

        {selectedView === 'now' && (
          <Suspense fallback={<ViewFallback />}>
            <CurrentMoment
              profile={profile}
              natalChart={natalChart}
              currentChart={currentChart}
              aspects={aspects}
              latitude={currentLat}
              longitude={currentLon}
              timezone={currentTimezone}
            />
          </Suspense>
        )}

        {selectedView === 'settings' && (
          <Suspense fallback={<ViewFallback />}>
          <div className="space-y-6">
            {/* Location Settings */}
            {onProfileUpdate && (
              <LocationSettings
                profile={profile}
                onUpdate={(updatedProfile) => {
                  onProfileUpdate(updatedProfile);
                }}
              />
            )}

            {/* Profile and Data */}
            <div
              className="rounded-3xl p-8"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
              }}
            >
              <h2 className="mb-6">Настройки и данные</h2>

              <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="mb-2">Ваш профиль</h3>
                <div className="space-y-2 opacity-80">
                  <p>Дата рождения: {profile.birthDate}</p>
                  <p>Время рождения: {profile.birthTime}</p>
                  <p>Место: {profile.birthPlace}</p>
                  <p>Координаты: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-accent/30 bg-accent/10">
                <div className="flex gap-3 mb-3">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h3 className="mb-1">Приватность</h3>
                    <p className="opacity-80">
                      Все ваши данные хранятся только в этом браузере. Мы не отправляем их никуда.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const { exportDailyReportToPDF } = await import('../utils/pdfExport');
                    exportDailyReportToPDF(
                      profile.name,
                      currentDate,
                      natalChart,
                      currentChart,
                      aspects,
                      panchang
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  style={{ boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)' }}
                >
                  <Download className="w-4 h-4" />
                  Экспортировать отчёт в PDF
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const data = JSON.stringify(profile, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'astrology-profile.json';
                      a.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-border hover:bg-secondary transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Скачать данные
                  </button>

                  <label
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-border hover:bg-secondary transition-colors cursor-pointer ${
                      onProfileUpdate ? '' : 'opacity-50 pointer-events-none'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Импорт JSON
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleProfileImport}
                      disabled={!onProfileUpdate}
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (confirm('Вы уверены? Все данные будут удалены.')) {
                        onReset();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить профиль
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
          </Suspense>
        )}

        {/* Mood Feedback */}
        {selectedView === 'overview' && !dailyMood && (
          <div
            className="rounded-3xl p-6"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <h3 className="mb-4">Как ваше настроение сегодня?</h3>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className="p-4 rounded-xl hover:bg-secondary transition-all hover:scale-110"
                  title={['Плохо', 'Не очень', 'Нормально', 'Хорошо', 'Отлично'][mood - 1]}
                >
                  <Heart
                    className="w-8 h-8"
                    fill={mood <= 2 ? 'none' : 'currentColor'}
                    style={{
                      color: mood === 5 ? 'var(--neon-pink)' : mood >= 4 ? 'var(--neon-purple)' : 'var(--foreground)'
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* [ДОБАВЛЕНО] Модальное окно с детальными аспектами */}
      {showDeepDive && natalChart && currentChart && (
        <Suspense fallback={null}>
          <AspectsDetailModal
            aspects={aspects}
            onClose={() => setShowDeepDive(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
