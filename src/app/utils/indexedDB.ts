// [УТИЛИТА] IndexedDB для хранения астрологических прогнозов
const DB_NAME = 'AstrologyForecastDB';
const DB_VERSION = 2;
const STORE_NAME = 'forecasts';
const PROFILE_DATE_INDEX = 'profile-version-date';
const DATE_INDEX = 'date';
const TIMESTAMP_INDEX = 'timestamp';

export interface DayForecast {
  date: string; // YYYY-MM-DD
  profileKey?: string;
  calcVersion?: string;
  energyLevel: number; // 0-100
  moonSign: string;
  tithi: string;
  yoga: string;
  planetaryHour: string;
  topRecommendation: string;
  avoidRecommendation?: string;
  reasoning?: string[];
  bestAreas?: string[];
  calendarArea?: string;
  microUpaya?: string;
  precisionNotes?: string[];
  warning?: string;
  favorableHours: string[];
  color: string;
  icon: string;
  label: string;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

function createForecastStore(db: IDBDatabase): void {
  const store = db.createObjectStore(STORE_NAME, {
    keyPath: ['profileKey', 'calcVersion', 'date'],
  });
  store.createIndex(PROFILE_DATE_INDEX, ['profileKey', 'calcVersion', 'date'], { unique: true });
  store.createIndex(DATE_INDEX, 'date', { unique: false });
  store.createIndex(TIMESTAMP_INDEX, 'timestamp', { unique: false });
}

/**
 * Инициализация IndexedDB.
 * v1 использовала date как primary key, поэтому прогнозы разных профилей
 * перезаписывали друг друга. Прогнозы являются полностью восстанавливаемым
 * кэшем, поэтому при переходе на v2 безопасно пересоздаём только этот store.
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      createForecastStore(db);
    };
  });
}

/**
 * Сохранить прогноз в IndexedDB
 */
export async function saveForecast(forecast: DayForecast): Promise<void> {
  if (!forecast.profileKey || !forecast.calcVersion) {
    throw new Error('Нельзя сохранить прогноз без profileKey и calcVersion');
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(forecast);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Получить прогноз по дате. profileKey/calcVersion опциональны для обратной
 * совместимости, но production-код должен передавать их явно.
 */
export async function getForecast(
  date: string,
  profileKey?: string,
  calcVersion?: string
): Promise<DayForecast | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = profileKey && calcVersion
      ? store.index(PROFILE_DATE_INDEX).get([profileKey, calcVersion, date])
      : store.index(DATE_INDEX).get(date);

    request.onsuccess = () => resolve((request.result as DayForecast | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Получить прогнозы в диапазоне дат без полного getAll() store.
 */
export async function getForecastsInRange(
  startDate: string,
  endDate: string,
  profileKey?: string,
  calcVersion?: string
): Promise<DayForecast[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = profileKey && calcVersion
      ? store.index(PROFILE_DATE_INDEX).getAll(
          IDBKeyRange.bound(
            [profileKey, calcVersion, startDate],
            [profileKey, calcVersion, endDate]
          )
        )
      : store.index(DATE_INDEX).getAll(IDBKeyRange.bound(startDate, endDate));

    request.onsuccess = () => resolve((request.result as DayForecast[]) ?? []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Удалить старые прогнозы (старше 60 дней)
 */
export async function cleanupOldForecasts(): Promise<void> {
  const db = await initDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);
  const cutoffTimestamp = cutoffDate.getTime();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index(TIMESTAMP_INDEX);
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffTimestamp, true));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Полностью очистить восстанавливаемый кэш прогнозов.
 */
export async function clearForecastCache(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const request = transaction.objectStore(STORE_NAME).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Проверка онлайн/оффлайн статуса
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
