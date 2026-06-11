import { useState } from 'react';
import { NatalChart as NatalChartType } from '../../utils/astrology';
import { GlassCard } from '../common/GlassCard';
import { NatalChartWheel } from '../NatalChartWheel';
import { PlanetsPositionTable } from '../PlanetsPositionTable';

interface NatalOverviewTabProps {
  natalChart: NatalChartType;
}

export function NatalOverviewTab({ natalChart }: NatalOverviewTabProps) {
  const [showAspects, setShowAspects] = useState(false);

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Позиции планет</h3>
        <PlanetsPositionTable natalChart={natalChart} />
      </GlassCard>
    </div>
  );
}
