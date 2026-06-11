// [РЕФАКТОРИНГ] Разбит на переиспользуемые под-компоненты
import { Info } from 'lucide-react';
import { NatalChart, Aspect } from '../utils/astrology';
import { PanchangData } from '../utils/panchang';
import { PlanetaryHourInfo } from '../utils/planetaryHours';
import { generatePersonalRecommendations } from '../utils/personalRecommendations';
import { UserProfile } from '../utils/storage';
import { DayHeadline } from './daily-report/DayHeadline';
import { TopRecommendations } from './daily-report/TopRecommendations';
import { AspectsToday } from './daily-report/AspectsToday';
import { FavorableWindows } from './daily-report/FavorableWindows';
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

export function DailyReport({
  profile,
  natalChart,
  currentChart,
  aspects,
  panchang,
  planetaryHour,
  planetaryHourInfo,
  favorableWindows,
  onDeepDive,
  isAwayFromBirthPlace,
  currentLocation
}: DailyReportProps) {
  const topAspect = aspects[0] || null;
  const moonSign = currentChart.planets.Moon.signName;

  const currentDate = new Date();
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
  const personalRecommendation = generatePersonalRecommendations({
    profile,
    date: currentDate,
    natalChart,
    currentChart,
    aspects,
    panchang,
    planetaryHour: effectiveHourInfo,
  });
  const energyLevel = personalRecommendation.energyLevel;

  return (
    <div className="space-y-6">
      {/* Day Headline */}
      <DayHeadline
        tithi={panchang.tithi}
        moonSign={moonSign}
        energyLevel={energyLevel}
      />

      {/* Top 3 Recommendations */}
      <TopRecommendations
        tithi={panchang.tithi}
        yoga={panchang.yoga}
        planetaryHour={planetaryHour}
        topAspect={topAspect}
        personalRecommendation={personalRecommendation}
      />

      {/* Aspects Today */}
      <AspectsToday
        topAspect={topAspect}
        onDeepDive={onDeepDive}
      />

      {/* Favorable Windows */}
      <FavorableWindows planetaryHour={planetaryHour} windows={favorableWindows} />

      {/* Location Context */}
      {isAwayFromBirthPlace && currentLocation && (
        <LocationContext currentLocation={currentLocation} />
      )}

      {/* Disclaimer */}
      <div
        className="rounded-3xl p-6 border border-accent/30"
        style={{ background: 'var(--accent)/10' }}
      >
        <div className="flex gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="mb-2">
              Джйотиш показывает тенденции, но не определяет вашу жизнь. Вы сохраняете свободу воли.
            </p>
            <p className="opacity-70">
              Прогноз — это рекомендация, не приговор. Для важных решений в здоровье, финансах
              и отношениях консультируйтесь со специалистами.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
