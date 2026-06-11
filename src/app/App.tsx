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

  useEffect(() => {
    try {
      const saved = loadUserProfile();
      setProfile(saved);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      // В случае ошибки просто начнём с онбординга
      setProfile(null);
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
    saveUserProfile(newProfile);
    setProfile(newProfile);
  };

  const handleReset = () => {
    deleteAllData();
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <LoadingSpinner text="Загрузка..." size="lg" />
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
