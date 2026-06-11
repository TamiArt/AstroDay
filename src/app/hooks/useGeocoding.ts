// [ХУК] Переиспользуемая логика геокодирования
import { useState } from 'react';
import { geocodePlace, getHistoricalTimezone, type GeocodingResult } from '../utils/geocoding';

export function useGeocoding(birthDate?: Date) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [error, setError] = useState<string>('');

  const search = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setError('Введите название места');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const results = await geocodePlace(query);
      setSearchResults(results);

      // Если передана дата рождения и есть результаты - определяем исторический часовой пояс
      if (birthDate && results.length > 0) {
        results.forEach((result) => {
          result.timezone = getHistoricalTimezone(
            result.latitude,
            result.longitude,
            birthDate
          );
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось найти место');
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (_result: GeocodingResult): void => {
    setSearchResults([]);
    setError('');
  };

  const reset = (): void => {
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
