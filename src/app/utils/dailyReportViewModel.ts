import type { Aspect, NatalChart } from './astrology';
import type { PanchangData } from './panchang';

export interface DailyReportViewModel {
  userName: string;
  dateLabel: string;
  natal: {
    ascendant: string;
    moonSign: string;
    moonNakshatra: string;
  };
  panchang: {
    tithi: string;
    tithiMeaning: string;
    yoga: string;
    yogaMeaning: string;
    karana: string;
    karanaQuality: string;
    vara: string;
    varaQuality: string;
  };
  transits: Array<{ planet: string; sign: string; degree: number }>;
  keyAspects: Array<{ description: string; strength: number }>;
}

export function buildDailyReportViewModel(
  userName: string,
  date: Date,
  natalChart: NatalChart,
  currentChart: NatalChart,
  aspects: Aspect[],
  panchang: PanchangData,
): DailyReportViewModel {
  return {
    userName,
    dateLabel: date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    natal: {
      ascendant: natalChart.ascendant.signName,
      moonSign: natalChart.planets.Moon.signName,
      moonNakshatra: natalChart.planets.Moon.nakshatraName,
    },
    panchang: {
      tithi: panchang.tithi.name,
      tithiMeaning: panchang.tithi.meaning,
      yoga: panchang.yoga.name,
      yogaMeaning: panchang.yoga.meaning,
      karana: panchang.karana.name,
      karanaQuality: panchang.karana.quality,
      vara: `${panchang.vara.name} (${panchang.vara.planet})`,
      varaQuality: panchang.vara.quality,
    },
    transits: Object.entries(currentChart.planets).map(([planet, position]) => ({
      planet,
      sign: position.signName,
      degree: position.degree,
    })),
    keyAspects: aspects.slice(0, 5).map((aspect) => ({
      description: aspect.description,
      strength: aspect.strength,
    })),
  };
}
