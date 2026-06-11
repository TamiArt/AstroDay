import { BarChart3, Sparkles } from 'lucide-react';
import { NatalChart as NatalChartType } from '../../utils/astrology';
import { calculateAllDivisionalCharts } from '../../utils/divisionalCharts';
import { GlassCard } from '../common/GlassCard';
import { DivisionalChartWheel } from '../DivisionalChartWheel';
import { TermTooltip } from '../common/TermTooltip';

interface DivisionalChartsTabProps {
  natalChart: NatalChartType;
}

const KEY_CHARTS = [
  {
    name: 'D9 - Навамша',
    division: 'Деление на 9',
    area: 'Брак и духовность',
    description:
      'Навамша помогает проверить зрелость планет и глубже понять партнерство, внутренний путь и качество реализации обещаний основной карты.',
    importance: 'Обязательна для анализа брака, зрелости личности и духовного роста.',
  },
  {
    name: 'D10 - Дашамша',
    division: 'Деление на 10',
    area: 'Карьера',
    description:
      'Дашамша показывает профессиональную траекторию, статус, управленческие качества и сферы, где легче накапливать признание.',
    importance: 'Ключевая карта для работы, бизнеса и общественной реализации.',
  },
  {
    name: 'D7 - Саптамша',
    division: 'Деление на 7',
    area: 'Дети',
    description:
      'Саптамша уточняет темы детей, творчества, продолжения рода и того, что человек передает дальше.',
    importance: 'Используется для вопросов о детях и созидательной энергии.',
  },
  {
    name: 'D60 - Шаштьямша',
    division: 'Деление на 60',
    area: 'Повторяющиеся сценарии',
    description:
      'Шаштьямша помогает смотреть на тонкие повторяющиеся сценарии и привычки, но требует особенно точного времени рождения.',
    importance: 'Полезна только при надежном времени рождения и аккуратной интерпретации.',
  },
];

export function DivisionalChartsTab({ natalChart }: DivisionalChartsTabProps) {
  const divisionalCharts = calculateAllDivisionalCharts(natalChart.planets, natalChart.ascendant.siderealLon);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-indigo-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Дробные карты (Варги)
                <TermTooltip term="varga" />
              </h3>
              <p className="text-sm text-gray-600">Детальный взгляд на разные сферы жизни</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-l-4 border-indigo-600">
            <h4 className="font-semibold text-gray-900 mb-2">Как использовать</h4>
            <p className="text-sm text-gray-800 leading-relaxed">
              Основная карта D1 показывает фундамент. Дробные карты уточняют конкретные темы: отношения,
              профессию, детей, духовность и тонкие повторяющиеся сценарии. Их лучше читать как уточнение,
              а не как замену натальной карты.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Все дробные карты</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {divisionalCharts.map((chart) => (
            <div key={chart.division} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors shadow-sm">
              <DivisionalChartWheel chart={chart} size={220} />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ключевые карты</h3>
        <div className="space-y-4">
          {KEY_CHARTS.map((chart) => (
            <div key={chart.name} className="p-4 bg-white rounded-lg border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
              <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{chart.name}</h4>
                  <p className="text-sm text-indigo-600 font-medium">{chart.division}</p>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold w-fit">
                  {chart.area}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{chart.description}</p>
              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs text-purple-800">
                  <strong>Важность:</strong> {chart.importance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Правило опытного разбора
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            Сначала смотрите силу темы в D1, затем подтверждение в соответствующей варге. Если карта рождения
            без точного времени, дробные карты нужно трактовать осторожно.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
