/**
 * Panchang (Vedic Calendar) Calculations
 */

import * as Astronomy from 'astronomy-engine';
import { NAKSHATRAS, tropicalToSidereal } from './astrology';
import { getWeekdayIndex } from './dateUtils';

// Tithi (Lunar day) - 30 tithis in a lunar month
export const TITHIS = [
  { name: 'Шукла Пратипада', meaning: 'Начало растущего лунного цикла, новые возможности' },
  { name: 'Шукла Двития', meaning: 'Накопление энергии' },
  { name: 'Шукла Тритья', meaning: 'Действие и движение' },
  { name: 'Шукла Чатуртхи', meaning: 'Устойчивость' },
  { name: 'Шукла Панчами', meaning: 'Обучение и знания' },
  { name: 'Шукла Шаштхи', meaning: 'Преодоление препятствий' },
  { name: 'Шукла Саптами', meaning: 'Духовный рост' },
  { name: 'Шукла Аштами', meaning: 'Трансформация' },
  { name: 'Шукла Навами', meaning: 'Сила и энергия' },
  { name: 'Шукла Дашами', meaning: 'Достижения' },
  { name: 'Шукла Экадаши', meaning: 'Очищение и духовность' },
  { name: 'Шукла Двадаши', meaning: 'Исцеление' },
  { name: 'Шукла Трайодаши', meaning: 'Активность' },
  { name: 'Шукла Чатурдаши', meaning: 'Подготовка' },
  { name: 'Пурнима', meaning: 'Полнолуние, завершение' },
  { name: 'Кришна Пратипада', meaning: 'Начало убывающей Луны, отпускание лишнего' },
  { name: 'Кришна Двития', meaning: 'Спокойное закрепление результата' },
  { name: 'Кришна Тритья', meaning: 'Практичные действия и завершение задач' },
  { name: 'Кришна Чатуртхи', meaning: 'Работа с препятствиями' },
  { name: 'Кришна Панчами', meaning: 'Переосмысление и обучение' },
  { name: 'Кришна Шаштхи', meaning: 'Дисциплина и очищение' },
  { name: 'Кришна Саптами', meaning: 'Восстановление сил' },
  { name: 'Кришна Аштами', meaning: 'Глубокая внутренняя трансформация' },
  { name: 'Кришна Навами', meaning: 'Собранность и защита энергии' },
  { name: 'Кришна Дашами', meaning: 'Завершение дел' },
  { name: 'Кришна Экадаши', meaning: 'Духовные практики и воздержание' },
  { name: 'Кришна Двадаши', meaning: 'Мягкое восстановление' },
  { name: 'Кришна Трайодаши', meaning: 'Подведение итогов' },
  { name: 'Кришна Чатурдаши', meaning: 'Глубокое очищение перед новым циклом' },
  { name: 'Амавасья', meaning: 'Новолуние, тишина и новые намерения' }
];

// Karana (Half of tithi) - 11 karanas
export const KARANAS = [
  { name: 'Бава', quality: 'Благоприятна для начинаний' },
  { name: 'Балава', quality: 'Сила и мощь' },
  { name: 'Каулава', quality: 'Семейные дела' },
  { name: 'Тайтила', quality: 'Коммуникация' },
  { name: 'Гара', quality: 'Практичность' },
  { name: 'Ванидж', quality: 'Торговля и переговоры' },
  { name: 'Вишти', quality: 'Осторожность' },
  { name: 'Шакуни', quality: 'Стратегия и наблюдение' },
  { name: 'Чатушпада', quality: 'Забота о теле и базовых делах' },
  { name: 'Нага', quality: 'Глубина, тайны и осторожность' },
  { name: 'Кимстугхна', quality: 'Завершение старого цикла' }
];

// Yoga (Astronomical combinations) - 27 yogas
export const YOGAS = [
  { name: 'Вишкамбха', meaning: 'Поддержка' },
  { name: 'Прити', meaning: 'Любовь и радость' },
  { name: 'Аюшман', meaning: 'Долголетие' },
  { name: 'Саубхагья', meaning: 'Удача' },
  { name: 'Шобхана', meaning: 'Великолепие' },
  { name: 'Атиганда', meaning: 'Препятствия' },
  { name: 'Сукарма', meaning: 'Благие дела' },
  { name: 'Дхрити', meaning: 'Стойкость' },
  { name: 'Шула', meaning: 'Острота' },
  { name: 'Ганда', meaning: 'Трудности' },
  { name: 'Вриддхи', meaning: 'Рост' },
  { name: 'Дхрува', meaning: 'Постоянство' },
  { name: 'Вьягхата', meaning: 'Бдительность' },
  { name: 'Харшана', meaning: 'Радость' },
  { name: 'Ваджра', meaning: 'Алмазная твёрдость' },
  { name: 'Сиддхи', meaning: 'Совершенство' },
  { name: 'Вьятипата', meaning: 'Осторожность' },
  { name: 'Варияна', meaning: 'Покровительство' },
  { name: 'Паригха', meaning: 'Защита' },
  { name: 'Шива', meaning: 'Благополучие' },
  { name: 'Сиддха', meaning: 'Успех' },
  { name: 'Садхья', meaning: 'Достижимость' },
  { name: 'Шубха', meaning: 'Благоприятность' },
  { name: 'Шукла', meaning: 'Чистота' },
  { name: 'Брахма', meaning: 'Творение' },
  { name: 'Индра', meaning: 'Власть' },
  { name: 'Вайдхрити', meaning: 'Терпение' }
];

export interface PanchangData {
  tithi: { index: number; name: string; meaning: string };
  nakshatra: { index: number; name: string };
  yoga: { index: number; name: string; meaning: string };
  karana: { index: number; name: string; quality: string };
  vara: { index: number; name: string; planet: string; quality: string };
}

export interface PanchangContext {
  timezone?: string;
}

export function calculatePanchang(date: Date, context: PanchangContext = {}): PanchangData {
  // [ИСПРАВЛЕНО] Добавлена специальная обработка для Солнца и Луны
  // Солнце требует SunPosition(), Луна - EclipticGeoMoon()
  try {
    // Для Солнца используем SunPosition (геоцентрическая позиция)
    const sunPos = Astronomy.SunPosition(date);
    const sunLon = tropicalToSidereal(sunPos.elon, date);

    // Для Луны используем EclipticGeoMoon (геоцентрическая эклиптическая позиция)
    const moonPos = Astronomy.EclipticGeoMoon(date);
    const moonLon = tropicalToSidereal(moonPos.lon, date);

    // Tithi calculation
    let tithiAngle = moonLon - sunLon;
    if (tithiAngle < 0) tithiAngle += 360;
    const tithiIndex = Math.floor(tithiAngle / 12) % 30;

    // Nakshatra
    const nakshatraIndex = Math.floor(moonLon / 13.333333) % 27;

    // Yoga
    const yogaAngle = (moonLon + sunLon) % 360;
    const yogaIndex = Math.floor(yogaAngle / 13.333333) % 27;

    // Karana. The first seven are repeating chara karanas; the final four
    // fixed karanas occur near the end/start of the lunar month.
    const halfTithiIndex = Math.floor(tithiAngle / 6) % 60;
    let karanaIndex: number;
    if (halfTithiIndex === 0) karanaIndex = 10; // Kimstughna
    else if (halfTithiIndex === 57) karanaIndex = 7; // Shakuni
    else if (halfTithiIndex === 58) karanaIndex = 8; // Chatushpada
    else if (halfTithiIndex === 59) karanaIndex = 9; // Naga
    else karanaIndex = (halfTithiIndex - 1) % 7;

    // Vara (day of week) in the target timezone.
    const dayOfWeek = getWeekdayIndex(date, context.timezone);
    const varas = [
      { index: 0, name: 'Воскресенье', planet: 'Солнце', quality: 'Лидерство и воля' },
      { index: 1, name: 'Понедельник', planet: 'Луна', quality: 'Эмоции и интуиция' },
      { index: 2, name: 'Вторник', planet: 'Марс', quality: 'Действие и энергия' },
      { index: 3, name: 'Среда', planet: 'Меркурий', quality: 'Общение и обучение' },
      { index: 4, name: 'Четверг', planet: 'Юпитер', quality: 'Расширение и мудрость' },
      { index: 5, name: 'Пятница', planet: 'Венера', quality: 'Любовь и красота' },
      { index: 6, name: 'Суббота', planet: 'Сатурн', quality: 'Дисциплина и структура' }
    ];

    return {
      tithi: {
        index: tithiIndex,
        name: TITHIS[tithiIndex]?.name || '',
        meaning: TITHIS[tithiIndex]?.meaning || ''
      },
      nakshatra: {
        index: nakshatraIndex,
        name: NAKSHATRAS[nakshatraIndex]?.name || ''
      },
      yoga: {
        index: yogaIndex,
        name: YOGAS[yogaIndex]?.name || '',
        meaning: YOGAS[yogaIndex]?.meaning || ''
      },
      karana: {
        index: karanaIndex,
        name: KARANAS[karanaIndex]?.name || '',
        quality: KARANAS[karanaIndex]?.quality || ''
      },
      vara: varas[dayOfWeek]
    };
  } catch (error) {
    console.error('calculatePanchang error:', error);
    throw new Error(`Ошибка расчёта панчанга: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get next important dates
export interface ImportantDate {
  date: Date;
  type: 'Purnima' | 'Amavasya' | 'Ekadashi' | 'Eclipse' | 'Sankranti';
  name: string;
  description: string;
}

export function getImportantDates(startDate: Date, days: number = 30, context: PanchangContext = {}): ImportantDate[] {
  const dates: ImportantDate[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const panchang = calculatePanchang(currentDate, context);

    // Purnima (Full Moon)
    if (panchang.tithi.index === 14) {
      dates.push({
        date: new Date(currentDate),
        type: 'Purnima',
        name: 'Полнолуние',
        description: 'Время завершения и благодарности'
      });
    }

    // Amavasya (New Moon)
  if (panchang.tithi.index === 29) {
      dates.push({
        date: new Date(currentDate),
        type: 'Amavasya',
        name: 'Новолуние',
        description: 'Время новых начинаний'
      });
    }

    // Ekadashi (11th lunar day in waxing and waning halves)
    if (panchang.tithi.index === 10 || panchang.tithi.index === 25) {
      dates.push({
        date: new Date(currentDate),
        type: 'Ekadashi',
        name: 'Экадаши',
        description: 'Благоприятен для духовных практик'
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
