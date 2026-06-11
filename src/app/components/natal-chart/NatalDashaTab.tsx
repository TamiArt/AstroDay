import { AlertCircle, CheckCircle, Clock, Target, Zap } from 'lucide-react';
import { calculateDasha, getCurrentAntardasha, NatalChart as NatalChartType } from '../../utils/astrology';
import { DASHA_SYSTEM_EXPLANATION, PLANET_DASHA_DESCRIPTIONS } from '../../utils/dashaDescriptions';
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface NatalDashaTabProps {
  natalChart: NatalChartType;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU');
}

export function NatalDashaTab({ natalChart }: NatalDashaTabProps) {
  const moonNakshatra = Math.floor(natalChart.planets.Moon.siderealLon / (360 / 27));
  const currentDasha = calculateDasha(natalChart.date, moonNakshatra, new Date(), natalChart.planets.Moon.siderealLon);
  const currentAntar = getCurrentAntardasha(currentDasha);
  const dashaDesc = PLANET_DASHA_DESCRIPTIONS[currentDasha.planet];
  const antarDesc = currentAntar ? PLANET_DASHA_DESCRIPTIONS[currentAntar.planet] : null;
  const startDate = new Date(currentDasha.startDate);
  const endDate = new Date(currentDasha.endDate);
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = Date.now() - startDate.getTime();
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-orange-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600 to-red-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Система Вимшоттари Даша
                <TermTooltip term="dasha" />
              </h3>
              <p className="text-sm text-gray-600">Планетарные периоды вашей жизни</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-orange-600">
            <h4 className="font-semibold text-gray-900 mb-2">Что это такое?</h4>
            <p className="text-sm text-gray-800 leading-relaxed mb-3">{DASHA_SYSTEM_EXPLANATION.whatItIs}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{DASHA_SYSTEM_EXPLANATION.howItWorks}</p>
          </div>
        </div>
      </GlassCard>

      {dashaDesc && (
        <GlassCard>
          <div className="space-y-6">
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-600">
              <p className="text-sm text-gray-600 mb-1">Сейчас действует период</p>
              <h4 className="text-2xl font-bold text-purple-900">
                {dashaDesc.planet} Махадаша
                <span className="text-lg text-gray-600"> (главный период)</span>
              </h4>

              {currentAntar && antarDesc && (
                <div className="pt-3 mt-3 border-t border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Антардаша (под-период)</p>
                  <h5 className="text-xl font-bold text-pink-900">{antarDesc.planet}</h5>
                </div>
              )}

              <div className="pt-3 mt-3 border-t border-purple-200 text-sm space-y-1">
                <p className="text-gray-700">
                  <strong>Махадаша:</strong> {formatDate(startDate)} - {formatDate(endDate)}
                </p>
                {currentAntar && (
                  <p className="text-gray-700">
                    <strong>Антардаша:</strong> {formatDate(currentAntar.startDate)} - {formatDate(currentAntar.endDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Прогресс периода</span>
                <span className="text-sm font-medium text-purple-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Основная тема
                </h5>
                <div className="flex flex-wrap gap-2 mb-3">
                  {dashaDesc.themes.slice(0, 4).map((theme) => (
                    <span key={theme} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      {theme}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{dashaDesc.whatHappens}</p>
              </div>

              {currentAntar && antarDesc && (
                <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                  <h5 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Оттенок под-периода
                  </h5>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {antarDesc.themes.slice(0, 3).map((theme) => (
                      <span key={theme} className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium">
                        {theme}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{antarDesc.whatHappens}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-600">
                <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Что делать
                </h5>
                <ul className="space-y-2.5">
                  {(dashaDesc.practicalActions?.length ? dashaDesc.practicalActions : dashaDesc.positive).slice(0, 5).map((item) => (
                    <li key={item} className="text-sm text-gray-800 flex items-start gap-2 leading-relaxed">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="text-sm text-gray-800 flex items-start gap-2 leading-relaxed">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span>{dashaDesc.advice}</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-l-4 border-orange-600">
                <h5 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Чего избегать
                </h5>
                <ul className="space-y-2.5">
                  {dashaDesc.challenges.slice(0, 5).map((challenge) => (
                    <li key={challenge} className="text-sm text-gray-800 flex items-start gap-2 leading-relaxed">
                      <span className="text-orange-600 font-bold mt-0.5">!</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {dashaDesc.weeklyChallenge && (
              <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-dashed border-pink-400">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-pink-600" />
                  Фокус периода
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{dashaDesc.weeklyChallenge}</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Все планетарные периоды</h3>
        <div className="space-y-3">
          {Object.values(PLANET_DASHA_DESCRIPTIONS).map((desc) => (
            <div key={desc.planet} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-sm">
                  {desc.planet[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{desc.planet}</h4>
                  <p className="text-xs text-gray-600">{desc.duration} лет</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{desc.whatHappens}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
