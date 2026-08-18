// [ХУК] Переиспользуемая логика геокодирования
import { useEffect, useRef, useState } from 'react';
import { geocodePlace, getHistoricalTimezone, type GeocodingResult } from '../utils/geocoding';

export function useGeocoding(birthDate?: Date) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [error, setError] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const search = async (query: string): Promise<void> => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError('Введите название места');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const results = await geocodePlace(trimmedQuery, controller.signal);
      if (requestId !== requestIdRef.current) return;

      const normalizedResults = birthDate
        ? results.map((result) => ({
            ...result,
            timezone: getHistoricalTimezone(result.latitude, result.longitude, birthDate)
          }))
        : results;

      setSearchResults(normalizedResults);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Не удалось найти место');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
        abortControllerRef.current = null;
      }
    }
  };

  const selectResult = (_result: GeocodingResult): void => {
    setSearchResults([]);
    setError('');
  };

  const reset = (): void => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestIdRef.current += 1;
    setSearchResults([]);
    setError('');
    setIsSearching(false);
  };

  return {
    search,
    selectResult,
    reset,
    isSearching,
    searchResults,
    error,
    setError
  };
}
