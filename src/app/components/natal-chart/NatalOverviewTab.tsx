import { useMemo, useState } from 'react';
import { NatalChart as NatalChartType } from '../../utils/astrology';
import { buildNatalChartFacts } from '../../utils/natalChartFacts';
import { analyzeAllNatalPlanets } from '../../utils/natalPlanetPersonalizedAnalysis';
import { GlassCard } from '../common/GlassCard';
import { NatalChartWheel } from '../NatalChartWheel';
import { PlanetsPositionTable } from '../PlanetsPositionTable';
import { NatalPlanetStory } from './NatalPlanetStory';

interface NatalOverviewTabProps {
  natalChart: NatalChartType;
}

export function NatalOverviewTab({ natalChart }: NatalOverviewTabProps) {
  const [showAspects, setShowAspects] = useState(false);
  const planets = useMemo(
    () => analyzeAllNatalPlanets(buildNatalChartFacts(natalChart)),
    [natalChart],
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Натальная карта</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAspects}
              onChange={(event) => setShowAspects(event.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Показать аспекты</span>
          </label>
        </div>
        <NatalChartWheel natalChart={natalChart} showAspects={showAspects} />
      </GlassCard>

      <GlassCard>
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h3 className="text-lg font-bold text-gray-900">Что показывает ваша карта</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Здесь собраны персональные объяснения положений планет: за что отвечает каждая планета,
            в каком доме и знаке она находится, какие темы карты связывает и как эта символика может
            проявляться в повседневных занятиях. Выберите интересующую планету, чтобы раскрыть подробный разбор.
          </p>
        </div>
        <div className="space-y-3">
          {planets.map((planet) => {
            const isBhadra = planet.planet === 'Mercury'
              && planet.sign === 'Дева'
              && [1, 4, 7, 10].includes(planet.house ?? 0);
            return (
              <details
                key={planet.planet}
                open={isBhadra}
                className="rounded-xl border border-gray-200 bg-white/80 p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{planet.name}</h4>
                      <p className="mt-1 text-xs text-gray-600">
                        {planet.available
                          ? `${planet.sign}; ${planet.house ? `${planet.house}-й дом` : 'дом не определён'}`
                          : 'Положение не рассчитано'}
                        {planet.dignity?.label ? ` · ${planet.dignity.label}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isBhadra && <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">Бхадра-махапуруша-йога</span>}
                      <span className="text-xs text-indigo-700">Открыть объяснение ↓</span>
                    </div>
                  </div>
                </summary>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <NatalPlanetStory planet={planet} />
                </div>
              </details>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Позиции планет</h3>
        <PlanetsPositionTable natalChart={natalChart} />
      </GlassCard>
    </div>
  );
}
