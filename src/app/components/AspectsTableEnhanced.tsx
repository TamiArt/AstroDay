// Улучшенная таблица аспектов с подробными объяснениями для новичков
import { Aspect, NatalChart } from '../utils/astrology';
import { Info, Zap, Heart, Square, Triangle, Circle, ChevronDown, ChevronUp, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { getDetailedAspectInterpretation } from '../utils/aspectInterpretations';
import { calculateNatalAspects } from '../utils/aspectCalculations';
import { getAspectVisual, type DisplayAspectType } from '../utils/visualScales';

interface AspectsTableEnhancedProps {
  natalChart: NatalChart;
}

const PLANET_NAMES_RU: Record<string, string> = {
  Sun: 'Солнце',
  Moon: 'Луна',
  Mercury: 'Меркурий',
  Venus: 'Венера',
  Mars: 'Марс',
  Jupiter: 'Юпитер',
  Saturn: 'Сатурн',
  Rahu: 'Раху',
  Ketu: 'Кету',
};

const ASPECT_INFO: Record<DisplayAspectType, {
  name: string;
  symbol: string;
  color: string;
  nature: 'harmonious' | 'tense' | 'neutral';
  description: string;
  icon: LucideIcon;
  emoji: string;
}> = {
  conjunction: {
    name: getAspectVisual('conjunction').name,
    symbol: getAspectVisual('conjunction').symbol,
    color: getAspectVisual('conjunction').colorClass,
    nature: getAspectVisual('conjunction').nature,
    description: getAspectVisual('conjunction').description,
    icon: Circle,
    emoji: getAspectVisual('conjunction').marker
  },
  sextile: {
    name: getAspectVisual('sextile').name,
    symbol: getAspectVisual('sextile').symbol,
    color: getAspectVisual('sextile').colorClass,
    nature: getAspectVisual('sextile').nature,
    description: getAspectVisual('sextile').description,
    icon: Heart,
    emoji: getAspectVisual('sextile').marker
  },
  square: {
    name: getAspectVisual('square').name,
    symbol: getAspectVisual('square').symbol,
    color: getAspectVisual('square').colorClass,
    nature: getAspectVisual('square').nature,
    description: getAspectVisual('square').description,
    icon: Square,
    emoji: getAspectVisual('square').marker
  },
  trine: {
    name: getAspectVisual('trine').name,
    symbol: getAspectVisual('trine').symbol,
    color: getAspectVisual('trine').colorClass,
    nature: getAspectVisual('trine').nature,
    description: getAspectVisual('trine').description,
    icon: Triangle,
    emoji: getAspectVisual('trine').marker
  },
  opposition: {
    name: getAspectVisual('opposition').name,
    symbol: getAspectVisual('opposition').symbol,
    color: getAspectVisual('opposition').colorClass,
    nature: getAspectVisual('opposition').nature,
    description: getAspectVisual('opposition').description,
    icon: Zap,
    emoji: getAspectVisual('opposition').marker
  },
};

export function AspectsTableEnhanced({ natalChart }: AspectsTableEnhancedProps) {
  const [expandedAspect, setExpandedAspect] = useState<number | null>(null);

  const aspects = calculateNatalAspects(natalChart).filter((aspect): aspect is Aspect & { type: DisplayAspectType } =>
    aspect.type !== 'special'
  );

  // Подсчет по категориям
  const harmonious = aspects.filter(a => ASPECT_INFO[a.type].nature === 'harmonious');
  const tense = aspects.filter(a => ASPECT_INFO[a.type].nature === 'tense');
  const neutral = aspects.filter(a => ASPECT_INFO[a.type].nature === 'neutral');

  // Самый сильный аспект (наименьший орб)
  const strongestAspect = aspects[0];

  const getNatalSummary = () => {
    if (tense.length > harmonious.length + neutral.length) {
      return 'В карте заметен акцент на напряжённых аспектах: это не «плохо», а показатель зон роста, где важны зрелость, дисциплина и осознанный выбор.';
    } else if (harmonious.length > tense.length) {
      return 'Гармоничные аспекты сильнее выражены: в карте есть естественные таланты и сферы, где энергия раскрывается легче.';
    } else {
      return 'Аспекты в карте распределены достаточно ровно: потенциал раскрывается через баланс между инициативой и внимательностью к ограничениям.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Информационный блок */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Что такое аспекты?</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              Аспекты — это угловые взаимодействия между планетами. Они показывают, как энергии планет влияют друг на друга и на вашу жизнь.
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✅ Гармоничные (трин, секстиль)</span> → дают возможности, легкость, удачные события.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-600 font-bold">⚠️ Напряжённые (квадрат, оппозиция)</span> → создают вызовы, конфликты, требуют усилий.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-600 font-bold">⚪ Нейтральные</span> → зависят от планет, которые они соединяют.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Общее состояние планет */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Аспектный рисунок карты
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="text-3xl font-bold text-green-700">{harmonious.length}</div>
            <div className="text-sm text-gray-700 mt-1">✅ Гармоничные</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
            <div className="text-3xl font-bold text-orange-700">{tense.length}</div>
            <div className="text-sm text-gray-700 mt-1">⚠️ Напряжённые</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-3xl font-bold text-gray-700">{neutral.length}</div>
            <div className="text-sm text-gray-700 mt-1">⚪ Нейтральные</div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
          <p className="text-sm text-gray-800 leading-relaxed italic">
            {getNatalSummary()}
          </p>
        </div>
      </div>

      {/* Ключевой натальный аспект */}
      {strongestAspect && (() => {
        const info = ASPECT_INFO[strongestAspect.type];
        const Icon = info.icon;
        const exactness = strongestAspect.strength;
        const interpretation = getDetailedAspectInterpretation(
          strongestAspect.planet1,
          strongestAspect.planet2,
          strongestAspect.type
        );

        return (
          <div className={`p-6 rounded-xl border-2 ${info.color.replace('text-', 'border-').replace('50', '300')}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon className="w-6 h-6 text-purple-600" />
                Ключевой натальный аспект (сила {exactness}/100)
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${info.color}`}>
                {info.emoji} {info.name}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/50 rounded-lg">
                <h4 className="font-bold text-gray-900 text-xl mb-2">
                  {PLANET_NAMES_RU[strongestAspect.planet1]} {info.symbol} {PLANET_NAMES_RU[strongestAspect.planet2]}
                </h4>
                <p className="text-sm text-gray-600">
                  {info.description}
                </p>
              </div>

              {interpretation && (
                <>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Что это значит:
                    </h5>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {interpretation.meaning}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2">Сферы жизни:</h5>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.spheres.map((sphere, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {sphere}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Практическая рекомендация:
                    </h5>
                    <ul className="space-y-2">
                      {interpretation.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {interpretation.benefits && interpretation.benefits.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                      <h5 className="font-semibold text-emerald-900 mb-2">Что использовать в свою пользу:</h5>
                      <ul className="space-y-1.5">
                        {interpretation.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interpretation.challenges && interpretation.challenges.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Чего избегать:
                      </h5>
                      <ul className="space-y-1.5">
                        {interpretation.challenges.map((challenge, idx) => (
                          <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                            <span className="text-orange-600 font-bold mt-0.5">⚠</span>
                            <span>{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Все аспекты */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Все аспекты в вашей карте</h3>

        <div className="space-y-3">
          {aspects.map((aspect, idx) => {
            const info = ASPECT_INFO[aspect.type];
            const Icon = info.icon;
            const isExpanded = expandedAspect === idx;
            const exactness = aspect.strength;
            const interpretation = getDetailedAspectInterpretation(
              aspect.planet1,
              aspect.planet2,
              aspect.type
            );

            return (
              <div key={idx} className={`rounded-lg border-2 overflow-hidden ${info.color.replace('text-', 'border-')}`}>
                <button
                  onClick={() => setExpandedAspect(isExpanded ? null : idx)}
                  className={`w-full p-4 ${info.color} hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-bold text-gray-900">
                          {PLANET_NAMES_RU[aspect.planet1]} {info.symbol} {PLANET_NAMES_RU[aspect.planet2]}
                        </div>
                        <div className="text-sm text-gray-600">
                          {info.name} • Сила: {exactness}/100
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${info.color.replace('50', '100')}`}>
                        {info.emoji}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && interpretation && (
                  <div className="p-4 bg-white space-y-4 border-t">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        <strong>Значение:</strong> {interpretation.meaning}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2 text-sm">Сферы влияния:</h5>
                      <div className="flex flex-wrap gap-2">
                        {interpretation.spheres.map((sphere, sidx) => (
                          <span key={sidx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {sphere}
                          </span>
                        ))}
                      </div>
                    </div>

                    {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-2 text-sm">Рекомендации:</h5>
                        <ul className="space-y-1.5">
                          {interpretation.recommendations.map((rec, ridx) => (
                            <li key={ridx} className="text-xs text-gray-800 flex items-start gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Итог для новичка */}
      <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-l-4 border-yellow-600">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Итог для новичка
        </h3>
        <p className="text-sm text-gray-800 leading-relaxed">
          Аспекты в вашей натальной карте показывают, как энергии планет взаимодействуют друг с другом.
          Гармоничные аспекты ({harmonious.length}) указывают на ваши природные таланты и легкие сферы жизни.
          Напряжённые аспекты ({tense.length}) создают вызовы, но именно они мотивируют вас расти и развиваться.
          {neutral.length > 0 && ` Нейтральные аспекты (${neutral.length}) усиливают энергии планет, делая их более заметными.`}
        </p>
      </div>
    </div>
  );
}
