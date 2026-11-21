import { useMemo } from 'react';
// Ежедневный обзор: сначала понятные ориентиры, затем астрологические подробности
import { ChevronRight, Clock3, Info, MoonStar } from 'lucide-react';
import type { NatalChart, Aspect } from '../utils/astrology';
import type { PanchangData } from '../utils/panchang';
import { calculatePlanetaryHoursForDay } from '../utils/planetaryHours';
import type { PlanetaryHourInfo } from '../utils/planetaryHours';
import { formatTime } from '../utils/dateUtils';
import { getPlanetName } from '../utils/planetUtils';
import { generatePersonalRecommendations } from '../utils/personalRecommendations';
import type { UserProfile } from '../utils/storage';
import { GlassCard } from './common/GlassCard';
import { TopRecommendations } from './daily-report/TopRecommendations';
import { LocationContext } from './daily-report/LocationContext';

interface DailyReportProps {
  profile: UserProfile;
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
  planetaryHour: string;
  planetaryHourInfo: PlanetaryHourInfo | null;
  favorableWindows: string[];
  onDeepDive: () => void;
  isAwayFromBirthPlace?: boolean;
  currentLocation?: string;
}

const SIGN_NAMES_RU: Record<string, string> = {
  Aries: 'Овен', Taurus: 'Телец', Gemini: 'Близнецы', Cancer: 'Рак',
  Leo: 'Лев', Virgo: 'Дева', Libra: 'Весы', Scorpio: 'Скорпион',
  Sagittarius: 'Стрелец', Capricorn: 'Козерог', Aquarius: 'Водолей', Pisces: 'Рыбы',
};

const SIGN_THEMES: Record<string, string> = {
  Aries: 'инициативой и смелыми шагами', Taurus: 'практичными делами и устойчивостью',
  Gemini: 'общением, обучением и обменом идеями', Cancer: 'домом, заботой и близкими',
  Leo: 'творчеством и самовыражением', Virgo: 'порядком, вниманием к деталям и повседневными задачами',
  Libra: 'партнёрством, переговорами и гармонией', Scorpio: 'глубиной, концентрацией и внутренними переменами',
  Sagittarius: 'обучением и расширением горизонтов', Capricorn: 'ответственностью и долгосрочными целями',
  Aquarius: 'новыми идеями, командами и технологиями', Pisces: 'чувствами, воображением и творчеством',
};

const NAKSHATRA_NAMES_RU: Record<string, string> = {
  Ashwini: 'Ашвини', Bharani: 'Бхарани', Krittika: 'Криттика', Rohini: 'Рохини', Mrigashira: 'Мригашира',
  Ardra: 'Ардра', Punarvasu: 'Пунарвасу', Pushya: 'Пушья', Ashlesha: 'Ашлеша', Magha: 'Магха',
  'Purva Phalguni': 'Пурва-Пхалгуни', 'Uttara Phalguni': 'Уттара-Пхалгуни', Hasta: 'Хаста', Chitra: 'Читра',
  Swati: 'Свати', Vishakha: 'Вишакха', Anuradha: 'Анурадха', Jyeshtha: 'Джйештха', Mula: 'Мула',
  'Purva Ashadha': 'Пурва-Ашадха', 'Uttara Ashadha': 'Уттара-Ашадха', Shravana: 'Шравана', Dhanishta: 'Дхаништха',
  Shatabhisha: 'Шатабхиша', 'Purva Bhadrapada': 'Пурва-Бхадрапада', 'Uttara Bhadrapada': 'Уттара-Бхадрапада', Revati: 'Ревати',
};

const PLANET_THEMES: Record<string, string> = {
  Sun: 'инициатива, ясность и самовыражение',
  Moon: 'чувства, забота и повседневный комфорт',
  Mars: 'действие, решительность и управление импульсами',
  Mercury: 'общение, обучение и работа с информацией',
  Jupiter: 'обучение, развитие и поиск смысла',
  Venus: 'отношения, красота и согласование интересов',
  Saturn: 'ответственность, терпение и последовательная работа',
};

export function DailyReport({
  profile,
  natalChart,
  currentChart,
  aspects,
  panchang,
  planetaryHour,
  planetaryHourInfo,
  onDeepDive,
  isAwayFromBirthPlace,
  currentLocation
}: DailyReportProps) {
  const currentDate = new Date();
  const moonSign = currentChart.planets.Moon.signName;
  const moonSignRu = SIGN_NAMES_RU[moonSign] ?? moonSign;
  const effectiveHourInfo = planetaryHourInfo || {
    planet: planetaryHour,
    start: currentDate,
    end: currentDate,
    isDaytime: true,
    hourNumber: 1,
    sunrise: currentDate,
    sunset: currentDate,
    nextSunrise: currentDate,
    isFallback: true,
  };
  const tithiNumber = panchang.tithi.index < 15 ? panchang.tithi.index + 1 : panchang.tithi.index - 14;
  const tithiPhase = panchang.tithi.index < 15 ? 'растущей' : 'убывающей';
  const tithiLabel = `${tithiNumber}-й лунный день ${tithiPhase} Луны (${panchang.tithi.name})`;
  const nakshatraName = NAKSHATRA_NAMES_RU[panchang.nakshatra.name] ?? panchang.nakshatra.name;
  const personalRecommendation = generatePersonalRecommendations({
    profile,
    date: currentDate,
    natalChart,
    currentChart,
    aspects,
    panchang,
    planetaryHour: effectiveHourInfo,
  });

  const location = profile.currentLocation;
  const latitude = location?.latitude ?? profile.latitude;
  const longitude = location?.longitude ?? profile.longitude;
  const timezone = location?.timezone ?? profile.timezone;
  const planetaryHours = useMemo(() => {
    try {
      return calculatePlanetaryHoursForDay(currentDate, latitude, longitude, timezone);
    } catch {
      return [];
    }
  }, [latitude, longitude, timezone, currentDate.toDateString()]);

  const visibleAspects = aspects.slice(0, 3);
  const currentPlanetaryHour = planetaryHours.find((hour: PlanetaryHourInfo) => currentDate >= hour.start && currentDate < hour.end);

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3"><MoonStar className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-semibold">Сегодняшний день</h2>
            <p className="mt-2 text-sm leading-relaxed">
              В календарной символике сегодня {tithiLabel.toLowerCase()} — {panchang.tithi.meaning.toLowerCase()}.
              Луна находится в знаке {moonSignRu}; в традиции этот знак связывают с темами {SIGN_THEMES[moonSign] ?? 'внутреннего состояния и повседневных дел'}.
            </p>
            <p className="mt-2 text-xs opacity-65">Это общий символический фон дня. Персональные подсказки ниже дополнительно учитывают вашу натальную карту.</p>
          </div>
        </div>
      </GlassCard>

      <TopRecommendations
        tithi={panchang.tithi}
        yoga={panchang.yoga}
        planetaryHour={planetaryHour}
        topAspect={visibleAspects[0] ?? null}
        personalRecommendation={personalRecommendation}
      />

      <GlassCard>
        <h3 className="font-semibold">Астрологическая картина дня</h3>
        <p className="mt-1 text-sm opacity-65">Сначала — общий календарный фон, затем — связи с вашей натальной картой.</p>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Общий календарный фон</p>
            <p className="mt-2 text-sm"><strong>Лунный день:</strong> {tithiLabel} — {panchang.tithi.meaning}. Это часть лунного месяца: она показывает, насколько Луна ушла вперёд относительно Солнца.</p>
            <p className="mt-2 text-sm"><strong>Положение Луны:</strong> {moonSignRu}. В символике Джйотиш знак описывает общий стиль переживания и выражения тем дня. Для знака {moonSignRu} традиционно выделяют темы {SIGN_THEMES[moonSign] ?? 'внутреннего состояния и повседневных дел'}.</p>
            <p className="mt-2 text-sm"><strong>Накшатра:</strong> {nakshatraName}. Это один из 27 участков пути Луны; показатель добавляет более тонкий символический оттенок к её положению.</p>
            <p className="mt-2 text-sm"><strong>Йога:</strong> {panchang.yoga.name} — {panchang.yoga.meaning}. Это сочетание долгот Солнца и Луны, которому традиция приписывает общий характер дня.</p>
            <p className="mt-2 text-sm"><strong>Карана:</strong> {panchang.karana.name} — {panchang.karana.quality}. Это половина лунного дня; её трактуют как дополнительную подсказку о стиле повседневных действий.</p>
            <p className="mt-2 text-sm"><strong>День недели:</strong> {panchang.vara.name} — {panchang.vara.quality.toLowerCase()}. В традиции каждый день связан с определённой планетой и её символическими темами.</p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Связи с вашей натальной картой</p>
            {visibleAspects.length ? (
              <div className="mt-3 space-y-3">
                {visibleAspects.map((aspect, index) => (
                  <div key={`${aspect.planet1}-${aspect.planet2}-${index}`}>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span className="rounded-lg bg-secondary px-2 py-1">{getPlanetName(aspect.planet1)}</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                      <span className="rounded-lg bg-secondary px-2 py-1">{getPlanetName(aspect.planet2)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed opacity-85">{aspect.description}</p>
                    <details className="mt-1 text-xs opacity-65">
                      <summary className="cursor-pointer">Техническое название и параметры</summary>
                      <p className="mt-1">Тип связи: {aspect.type}; орбис: {aspect.orb.toFixed(2)}°; условная сила аспекта: {aspect.strength.toFixed(1)}/10.</p>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm opacity-70">В используемом наборе расчётов нет аспектов, которые можно выделить для краткого обзора. Это не означает отсутствия важных тем в вашей жизни.</p>
            )}
            <button type="button" onClick={onDeepDive} className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary">
              Посмотреть все астрологические связи
            </button>
          </div>
        </div>
      </GlassCard>

      <details className="rounded-3xl border border-border p-5">
        <summary className="flex cursor-pointer list-none items-center gap-3">
          <Clock3 className="h-5 w-5 opacity-70" />
          <span className="flex-1">
            <span className="block font-semibold">Планетарные часы</span>
            <span className="mt-0.5 block text-sm opacity-65">Традиционные временные ориентиры на сегодня</span>
          </span>
          <span className="text-xs opacity-60">{currentPlanetaryHour ? `Сейчас · ${getPlanetName(currentPlanetaryHour.planet)}` : 'Подробнее'}</span>
        </summary>
        <div className="mt-4 space-y-2">
          {planetaryHours.length ? planetaryHours.map((hour: PlanetaryHourInfo) => (
            <div key={hour.hourNumber} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/50 p-3">
              <span className="text-sm tabular-nums">{formatTime(hour.start, timezone)}–{formatTime(hour.end, timezone)}</span>
              <span className="text-sm font-medium">{getPlanetName(hour.planet)}</span>
              <span className="w-full text-xs opacity-65 sm:w-auto sm:flex-1 sm:text-right">{PLANET_THEMES[hour.planet] ?? 'символическая тема планеты'}</span>
            </div>
          )) : (
            <p className="text-sm opacity-70">Не удалось рассчитать интервалы планетарных часов для выбранного местоположения.</p>
          )}
          {planetaryHours[0]?.isFallback && (
            <p className="text-xs opacity-65">Для этого местоположения не удалось определить точные восход и закат; использован резервный расчёт с условными интервалами.</p>
          )}
          <p className="pt-2 text-xs leading-relaxed opacity-65">Время и значения планетарных часов относятся к традиционной символической системе. Это не доказанный способ определить лучшее время для действий и не причина откладывать важные дела.</p>
        </div>
      </details>

      <details className="rounded-3xl border border-border p-5">
        <summary className="cursor-pointer font-semibold">Точность исходных данных и персонализация</summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed opacity-80">
          <p><strong>Данные рождения:</strong> {profile.birthDate}, {profile.birthTime}; место — {profile.birthPlace}.</p>
          <p><strong>Место для расчёта текущих транзитов и календаря:</strong> {profile.currentLocation?.place ?? profile.birthPlace}{profile.currentLocation ? ' (текущий город)' : ' (пока используется место рождения; укажите город проживания в настройках)'}.</p>
          <p><strong>Погрешность времени рождения:</strong> {typeof profile.timeUncertainty === 'number' ? `около ${profile.timeUncertainty} минут` : 'не указана'}.</p>
          <p><strong>Часовой пояс рождения:</strong> {profile.timezoneAccuracy === 'matched-region' ? 'сопоставлен с регионом' : profile.timezoneAccuracy === 'estimated-longitude' ? 'оценён по долготе' : 'указан вручную или не уточнён'}.</p>
          {personalRecommendation.precision.notes.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs opacity-75">
              {personalRecommendation.precision.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}
          <p className="text-xs opacity-65">Положение Луны, лунный день и планетарные часы — общие факторы календаря. Персональные подсказки учитывают натальную карту и указанные данные рождения; их точность зависит от качества исходных данных.</p>
        </div>
      </details>

      {isAwayFromBirthPlace && currentLocation && <LocationContext currentLocation={currentLocation} />}

      <div className="flex items-start gap-2 rounded-xl border border-border p-4 text-xs leading-relaxed opacity-70">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Астрологические трактовки — символические ориентиры, а не измерение состояния человека и не предсказание обязательных событий. Они не заменяют медицинские, финансовые, юридические или иные профессиональные решения.</p>
      </div>
    </div>
  );
}
