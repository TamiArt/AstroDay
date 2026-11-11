// [ИСПРАВЛЕНО] Добавлен ErrorBoundary и LoadingSpinner
import { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { loadUserProfile, saveUserProfile, deleteAllData, UserProfile } from './utils/storage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const saved = loadUserProfile();
      setProfile(saved);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setStorageError(error instanceof Error ? error.message : 'Не удалось прочитать локальные данные.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOnboardingComplete = (data: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string;
    timeUncertainty: number;
    timezoneAccuracy: 'matched-region' | 'estimated-longitude' | 'manual';
  }) => {
    const newProfile: UserProfile = {
      ...data
    };
    try {
      saveUserProfile(newProfile);
      setProfile(newProfile);
    } catch (storageError) {
      const message = storageError instanceof Error ? storageError.message : 'Не удалось сохранить профиль.';
      alert(message);
    }
  };

  const handleReset = async () => {
    try {
      await deleteAllData();
      setProfile(null);
    } catch (storageError) {
      const message = storageError instanceof Error ? storageError.message : 'Не удалось удалить все данные.';
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <LoadingSpinner text="Загрузка..." size="lg" />
      </div>
    );
  }

  if (storageError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div role="alert" className="max-w-xl rounded-2xl border border-destructive/30 bg-destructive/10 p-6 space-y-4">
          <h1 className="text-xl font-semibold">Не удалось загрузить сохранённые данные</h1>
          <p>{storageError}</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary px-4 py-2 text-primary-foreground">
            Повторить загрузку
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!profile ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard
          profile={profile}
          onReset={handleReset}
          onProfileUpdate={(updatedProfile) => setProfile(updatedProfile)}
        />
      )}
    </ErrorBoundary>
  );
}
