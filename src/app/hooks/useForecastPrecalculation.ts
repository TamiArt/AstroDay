import { useEffect, useRef, useState } from 'react';
import { precalculateForecasts } from '../utils/forecastCalculations';
import { cleanupOldForecasts, initDB } from '../utils/indexedDB';
import type { UserProfile } from '../utils/storage';

export interface ForecastPrecalculationProgress {
  current: number;
  total: number;
}

export interface ForecastPrecalculationState {
  isPrecalculating: boolean;
  progress: ForecastPrecalculationProgress;
  error: string | null;
}

export function useForecastPrecalculation(
  profile: UserProfile,
  daysBack = 30,
  daysForward = 30,
): ForecastPrecalculationState {
  const [isPrecalculating, setIsPrecalculating] = useState(false);
  const [progress, setProgress] = useState<ForecastPrecalculationProgress>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;
    let mounted = true;

    const run = async () => {
      setIsPrecalculating(true);
      setError(null);
      setProgress({ current: 0, total: daysBack + daysForward + 1 });

      try {
        await initDB();
        if (!mounted || generation !== generationRef.current) return;

        await cleanupOldForecasts();
        if (!mounted || generation !== generationRef.current) return;

        await precalculateForecasts(
          profile,
          daysBack,
          daysForward,
          (current, total) => {
            if (mounted && generation === generationRef.current) {
              setProgress({ current, total });
            }
          },
          () => !mounted || generation !== generationRef.current,
        );
      } catch (cause) {
        if (mounted && generation === generationRef.current) {
          const message = cause instanceof Error ? cause.message : 'Не удалось подготовить календарные прогнозы';
          setError(message);
          console.error('Ошибка инициализации прогнозов:', cause);
        }
      } finally {
        if (mounted && generation === generationRef.current) {
          setIsPrecalculating(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [profile, daysBack, daysForward]);

  return { isPrecalculating, progress, error };
}
