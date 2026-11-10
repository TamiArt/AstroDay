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
    name: 'D2 — Хора',
    division: 'Деление на 2',
    area: 'Ресурсы',
    description: 'Традиционно используется как дополнительный слой при разборе ресурсов и материальной устойчивости; читается вместе со 2-м и 11-м домами D1.',
    importance: 'Не является расчётом будущего дохода или финансовой гарантией.',
  },
  {
    name: 'D4 — Чатуртхамша',
    division: 'Деление на 4',
    area: 'Дом и недвижимость',
    description: 'Уточняет символические темы жилья, собственности, места проживания и устойчивости; сопоставляется с 4-м домом и его управителем в D1.',
    importance: 'Не заменяет юридическую, техническую или инвестиционную проверку объекта.',
  },
  {
    name: 'D7 — Саптамша',
    division: 'Деление на 7',
    area: 'Дети и созидание',
    description: 'Традиционно рассматривается в контексте детей, творчества и того, что человек передаёт дальше.',
    importance: 'Не прогнозирует фертильность, зачатие, беременность или количество детей.',
  },
  {
    name: 'D9 — Навамша',
    division: 'Деление на 9',
    area: 'Партнёрство и ценности',
    description: 'Дополнительный слой для тем партнёрства, дхармы и зрелости планет; не заменяет анализ D1 и фактическую совместимость людей.',
    importance: 'Не выносит вердикт о браке и не гарантирует исход отношений.',
  },
  {
    name: 'D10 — Дашамша',
    division: 'Деление на 10',
    area: 'Профессия',
    description: 'Используется для углубления символического разбора профессиональной реализации, статуса и ответственности.',
    importance: 'Не определяет гарантированную карьеру, должность или доход.',
  },
  {
    name: 'D12 — Двадашамша',
    division: 'Деление на 12',
    area: 'Родители и происхождение',
    description: 'Дополняет анализ семейной истории, родительских фигур и наследуемых семейных тем.',
    importance: 'Не является объективной характеристикой родственников или семейных событий.',
  },
  {
    name: 'D16 — Шодашамша',
    division: 'Деление на 16',
    area: 'Комфорт и транспорт',
    description: 'Традиционно связывается с комфортом, транспортом, удобствами и условиями повседневной жизни.',
    importance: 'Не оценивает безопасность автомобиля или недвижимости.',
  },
  {
    name: 'D20 — Вимшамша',
    division: 'Деление на 20',
    area: 'Практика и мировоззрение',
    description: 'Используется как дополнительная символическая перспектива на духовные практики и внутреннюю дисциплину.',
    importance: 'Не измеряет духовность или психологическое состояние.',
  },
  {
    name: 'D24 — Сиддхамша',
    division: 'Деление на 24',
    area: 'Обучение',
    description: 'Дополняет темы обучения, усвоения знаний, наставничества и интеллектуальной практики.',
    importance: 'Не заменяет реальные результаты обучения и подтверждённые навыки.',
  },
  {
    name: 'D27 — Бхамша',
    division: 'Деление на 27',
    area: 'Ресурсы и устойчивость',
    description: 'В некоторых традициях используется для более тонкого рассмотрения сильных сторон и уязвимых мест.',
    importance: 'Не является психологическим тестом или объективной шкалой силы.',
  },
]

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
              <p className={`mt-2 text-center text-[11px] ${chart.calculationRule === 'specific' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {chart.calculationRule === 'specific' ? 'Реализовано отдельное правило варги' : 'Общая формула · не использовать как эталонную варгу'}
              </p>
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
            Сначала смотрите тему в D1, затем сопоставляйте её с соответствующей варгой. Время рождения особенно
            критично для Лагны дробных карт: небольшая ошибка может изменить знак и дома. D60 в текущей версии
            рассчитана только общей формулой и не должна трактоваться как проверенная Шаштьямша.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
