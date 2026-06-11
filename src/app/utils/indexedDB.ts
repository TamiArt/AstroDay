// [УТИЛИТА] IndexedDB для хранения астрологических прогнозов
const DB_NAME = 'AstrologyForecastDB';
const DB_VERSION = 1;
const STORE_NAME = 'forecasts';

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
  microUpaya?: string;
  precisionNotes?: string[];
  warning?: string;
  favorableHours: string[];
  color: string;
  icon: string;
  label: string;
  timestamp: number; // Когда был рассчитан
}

let dbInstance: IDBDatabase | null = null;

/**
 * Инициализация IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Создаём хранилище прогнозов с индексом по дате
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Сохранить прогноз в IndexedDB
 */
export async function saveForecast(forecast: DayForecast): Promise<void> {
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
 * Получить прогноз по дате
 */
export async function getForecast(date: string): Promise<DayForecast | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(date);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Получить все прогнозы в диапазоне дат
 */
export async function getForecastsInRange(startDate: string, endDate: string): Promise<DayForecast[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allForecasts = request.result || [];
      const filtered = allForecasts.filter(
        f => f.date >= startDate && f.date <= endDate
      );
      resolve(filtered);
    };
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
    const index = store.index('timestamp');
    const request = index.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.timestamp < cutoffTimestamp) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Проверка онлайн/оффлайн статуса
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
