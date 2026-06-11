import { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Home, Sparkles, Target } from 'lucide-react';
import { NatalChart as NatalChartType } from '../../utils/astrology';
import { HOUSES_DETAILED } from '../../utils/housesDescriptions';
import { GlassCard } from '../common/GlassCard';

interface NatalHousesTabProps {
  natalChart: NatalChartType;
}

export function NatalHousesTab({ natalChart }: NatalHousesTabProps) {
  const [expandedHouse, setExpandedHouse] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
          <div className="flex items-start gap-3">
            <Home className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Что такое дома в астрологии?</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Дома показывают, в каких сферах жизни проявляются планеты: тело, финансы, учеба,
                семья, творчество, работа, партнерство, трансформация, путь, карьера, круг людей и духовная практика.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {natalChart.houses?.map((house) => {
        const details = HOUSES_DETAILED[house.house];
        const isExpanded = expandedHouse === house.house;
        const planetsInHouse = Object.entries(natalChart.planets).filter(([, position]) => {
          const houseDegree = (position.siderealLon - natalChart.ascendant.siderealLon + 360) % 360;
          return Math.floor(houseDegree / 30) + 1 === house.house;
        });

        if (!details) return null;

        return (
          <GlassCard key={house.house}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpandedHouse(isExpanded ? null : house.house)}
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {house.house}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{details.russianName}</h3>
                    <p className="text-sm text-gray-600">{details.sanskritName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {planetsInHouse.slice(0, 4).map(([name]) => (
                    <span key={name} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {name}
                    </span>
                  ))}
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {!isExpanded && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-700">{details.whatItIs}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <strong>Знак:</strong> {house.signName} • <strong>Управитель:</strong> {house.lord}
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="px-4 pb-4 space-y-6 border-t border-purple-100 pt-6">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
                  <h4 className="font-semibold text-gray-900 mb-2">Смысл дома</h4>
                  <p className="text-sm text-gray-800 leading-relaxed">{details.detailedExplanation}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Сферы жизни
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {details.areas.map((area) => (
                      <span key={area} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-700 uppercase mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Ресурс
                    </h4>
                    <ul className="space-y-1.5">
                      {details.positiveManifestations.map((item) => (
                        <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="text-sm font-semibold text-orange-700 uppercase mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Вызовы
                    </h4>
                    <ul className="space-y-1.5">
                      {details.challenges.map((item) => (
                        <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">!</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    Астрологический совет
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{details.advice}</p>
                </div>

                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                  <strong>Технические данные:</strong> {house.signName}, управитель {house.lord};
                  планеты: {planetsInHouse.length > 0 ? planetsInHouse.map(([name]) => name).join(', ') : 'нет'}
                </div>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
