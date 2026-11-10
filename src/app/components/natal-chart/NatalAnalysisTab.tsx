import { buildNatalChartFacts } from '../../utils/natalChartFacts';
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Heart,
  Home as HomeIcon,
  Layers,
  Moon,
  Sparkles,
  Star,
  Sun,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { SIGNS_RU } from '../../utils/astrology';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import { analyzePersonalizedHouses } from '../../utils/personalizedHouseAnalysis';
import { analyzeAllNatalHouses } from '../../utils/natalHousePersonalizedAnalysis';
import { getPlanetHouse } from '../../utils/natalStrengthAnalysis';
import { getSunHouseFocus } from '../../utils/natalAnalysisGuidance';
import { formatCoreLifeAreaEvidence, getAscendantChartFocus, getCoreChartSynthesis, getCoreInteractionsByLifeArea, getCoreLifeAreaBridges, getMoonHouseFocus, getPlanetChartFocus } from '../../utils/natalPersonalFocus';
import { getAscendantDescription, getMoonDescription, getSunDescription } from '../../utils/natalChartDescriptions';
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface NatalAnalysisTabProps {
  natalChart: NatalChartType;
}

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: string;
  children: ReactNode;
}

const LIFE_AREA_STYLES = {
  purple: {
    card: 'bg-purple-50 border-purple-200',
    icon: 'text-purple-600',
    meta: 'text-purple-700',
  },
  blue: {
    card: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    meta: 'text-blue-700',
  },
  pink: {
    card: 'bg-pink-50 border-pink-200',
    icon: 'text-pink-600',
    meta: 'text-pink-700',
  },
  green: {
    card: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    meta: 'text-green-700',
  },
} as const;


function BulletList({ items, tone }: { items: string[]; tone: 'green' | 'orange' | 'blue' | 'yellow' }) {
  const toneClass = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
  }[tone];

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={item} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
          <span className={`${toneClass} font-bold mt-0.5`}>{tone === 'orange' ? '!' : index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InsightCard({ icon: Icon, title, subtitle, accent, children }: InsightCardProps) {
  return (
    <GlassCard>
      <div className="space-y-4">
        <div className={`flex items-center gap-3 pb-3 border-b ${accent}`}>
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </GlassCard>
  );
}

export function NatalAnalysisTab({ natalChart }: NatalAnalysisTabProps) {
  const sunHouse = getPlanetHouse(natalChart, 'Sun');
  const moonHouse = getPlanetHouse(natalChart, 'Moon');
  const personalizedHouses = analyzePersonalizedHouses(natalChart);
  const sunFocus = getSunHouseFocus(natalChart, sunHouse);
  const chartFacts = buildNatalChartFacts(natalChart);
  const allHouseAnalyses = analyzeAllNatalHouses(chartFacts);
  const ascendantChartFocus = getAscendantChartFocus(natalChart, chartFacts);
  const sunChartFocus = getPlanetChartFocus(natalChart, 'Sun', chartFacts);
  const moonChartFocus = getPlanetChartFocus(natalChart, 'Moon', chartFacts);
  const moonHouseFocus = getMoonHouseFocus(natalChart, moonHouse);
  const coreChartSynthesis = getCoreChartSynthesis(natalChart);
  const coreLifeAreaInteractions = getCoreInteractionsByLifeArea(natalChart);
  const coreLifeAreaBridges = getCoreLifeAreaBridges(natalChart);
  const ascDesc = getAscendantDescription(natalChart.ascendant.signName);
  const sunSignRu = SIGNS_RU[natalChart.planets.Sun.sign] ?? natalChart.planets.Sun.signName;
  const moonSignRu = SIGNS_RU[natalChart.planets.Moon.sign] ?? natalChart.planets.Moon.signName;
  const sunDesc = getSunDescription(sunSignRu, sunHouse);
  const moonDesc = getMoonDescription(moonSignRu, moonHouse);

  return (
    <div className="space-y-6">
      <InsightCard
        icon={Star}
        title={ascDesc.title}
        subtitle="Основа характера, тело и первый способ реагировать на жизнь"
        accent="border-purple-200"
      >
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            Общая символика знака Лагны
            <TermTooltip term="ascendant" />
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed mb-3">{ascDesc.whatItIs}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.meaning}</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-700 uppercase mb-2">Управитель Лагны — куда направлена энергия личности</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascendantChartFocus}</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-700 uppercase mb-2">Типичные проявления знака (общая символика)</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.howManifests}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-700 uppercase mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Типичные сильные стороны знака
            </h4>
            <BulletList items={ascDesc.strengths} tone="green" />
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-700 uppercase mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Типичные зоны роста знака
            </h4>
            <BulletList items={ascDesc.challenges} tone="orange" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Общие практики для самонаблюдения
          </h4>
          <BulletList items={ascDesc.practicalAdvice} tone="blue" />
        </div>

        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-dashed border-pink-400">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-600" />
            Общая идея для самонаблюдения
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.dailyChallenge}</p>
        </div>
      </InsightCard>

      <InsightCard
        icon={Sun}
        title={sunDesc.title}
        subtitle={`Солнце в ${sunSignRu}, ${sunHouse ? `${sunHouse}-й дом` : 'дом не определён'}`}
        accent="border-yellow-200"
      >
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-2">Общая символика Солнца</h4>
          <p className="text-sm text-gray-800 leading-relaxed mb-3">{sunDesc.essence}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{sunDesc.lifePurpose}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-yellow-200">
            <h4 className="text-sm font-semibold text-yellow-700 uppercase mb-2">Как проявляться</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{sunDesc.inSign}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-700 uppercase mb-2">Где светить</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{sunFocus}</p>
            <p className="text-xs text-gray-700 leading-relaxed mt-3 border-t border-orange-100 pt-3">Фактические показатели вашей карты: {sunChartFocus}</p>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-600" />
            Возможные действия по теме дома
          </h4>
          <BulletList items={sunDesc.practicalSteps} tone="yellow" />
        </div>
      </InsightCard>

      <InsightCard
        icon={Moon}
        title={moonDesc.title}
        subtitle={`Луна в ${moonSignRu}, ${moonHouse ? `${moonHouse}-й дом` : 'дом не определён'}`}
        accent="border-blue-200"
      >
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
          <h4 className="font-semibold text-gray-900 mb-2">Общая символика Луны</h4>
          <p className="text-sm text-gray-800 leading-relaxed">{moonDesc.essence}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-700 uppercase mb-2">Конкретная жизненная сфера Луны</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{moonHouseFocus}</p>
          <p className="text-xs text-gray-700 leading-relaxed mt-3 border-t border-blue-100 pt-3">Фактические показатели вашей карты: {moonChartFocus}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-700 uppercase mb-2">Эмоциональные потребности</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{moonDesc.emotionalNeeds}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-700 uppercase mb-2">Где искать комфорт</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{moonDesc.inHouse}</p>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
          <h4 className="text-sm font-semibold text-purple-800 uppercase mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Что делает вас счастливее
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{moonDesc.comfort}</p>
        </div>
      </InsightCard>

      {coreLifeAreaInteractions.length > 0 ? (
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Где взаимодействия показателей затрагивают жизненные сферы</h3>
                <p className="text-sm text-gray-600">Только связи, подтверждённые положением планет или управлением домами</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coreLifeAreaInteractions.map((area) => (
                <section key={area.id} className="rounded-lg border border-cyan-100 bg-cyan-50/60 p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900">{area.title}</h4>
                  <ul className="space-y-2">
                    {area.connections.map((connection) => (
                      <li key={connection} className="text-sm leading-relaxed text-gray-700">{connection}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {coreLifeAreaBridges.length > 0 ? (
              <section className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
                <h4 className="font-semibold text-gray-900">Как несколько жизненных сфер связаны между собой</h4>
                {coreLifeAreaBridges.map((bridge) => (
                  <div key={bridge.id} className="space-y-1">
                    <p className="text-sm font-medium text-gray-800">{bridge.connection}</p>
                    <p className="text-sm text-gray-700">Подтверждённые сферы: {bridge.areas.join(', ')}.</p>
                    <ul className="space-y-2 pl-3 border-l border-indigo-200">
                      {bridge.evidenceByArea.map((item) => (
                        <li key={item.areaId} className="text-xs leading-relaxed text-gray-600">
                          <span className="font-semibold">{item.areaTitle}:</span> {item.evidence.map(formatCoreLifeAreaEvidence).join('; ')}.
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs leading-relaxed text-gray-600">{bridge.explanation}</p>
                  </div>
                ))}
              </section>
            ) : null}
            <p className="text-xs leading-relaxed text-gray-500">Если связь планет не имеет опоры в домах конкретной сферы, она здесь не показывается. Это традиционная символическая интерпретация, а не прогноз событий.</p>
          </div>
        </GlassCard>
      ) : null}

      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Как три главных показателя складываются вместе</h3>
              <p className="text-sm text-gray-600">Лагна, Солнце и Луна: общий акцент и разные функции</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{coreChartSynthesis}</p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Подробный персональный анализ всех 12 домов</h3>
              <p className="text-sm text-gray-600">Знак, управитель, его положение и диспозиторная цепочка, планеты в доме, аспекты и связанные сферы</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {allHouseAnalyses.map((house) => (
              <section key={house.house} className="rounded-xl border border-gray-200 bg-white/80 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{house.house}-й дом — {house.theme}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {house.available
                        ? `Знак: ${house.sign}; управитель: ${house.lordName ?? 'не определён'}; положение: ${house.lordHouse ? `${house.lordHouse}-й дом` : 'не определено'}`
                        : 'Исходные данные дома отсутствуют'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    house.synthesis === 'supportive' ? 'bg-green-100 text-green-700'
                      : house.synthesis === 'challenging' ? 'bg-amber-100 text-amber-800'
                        : house.synthesis === 'mixed' ? 'bg-blue-100 text-blue-700'
                          : house.synthesis === 'incomplete' ? 'bg-gray-100 text-gray-600'
                            : 'bg-slate-100 text-slate-700'
                  }`}>
                    {house.synthesis === 'supportive' ? 'Есть поддержка'
                      : house.synthesis === 'challenging' ? 'Требует внимания'
                        : house.synthesis === 'mixed' ? 'Смешанные факторы'
                          : house.synthesis === 'incomplete' ? 'Недостаточно данных' : 'Нейтрально'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{house.interpretation}</p>
                {house.dispositorChain.length ? (
                  <div className="rounded-lg bg-indigo-50 p-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-indigo-800 mb-1">Цепочка диспозиторов</h5>
                    <p className="text-sm text-indigo-900">
                      {house.dispositorChain.map((item) => `${item.planet} — ${item.sign}${item.house === null ? '' : `, ${item.house}-й дом`}`).join(' → ')}
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Планеты в доме</h5>
                    <p className="text-sm text-gray-700">{house.occupants.length ? house.occupants.join(', ') : 'Нет планет'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Аспекты на дом</h5>
                    <p className="text-sm text-gray-700">{house.aspects.length ? house.aspects.join(', ') : 'Не обнаружены по выбранной схеме'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Управляемые дома</h5>
                    <p className="text-sm text-gray-700">{house.ruledHouses.length ? house.ruledHouses.join(', ') : 'Не определены'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Связанные дома</h5>
                    <p className="text-sm text-gray-700">{house.connectedHouses.length ? house.connectedHouses.join(', ') : 'Нет отдельной связи по положению управителя'}</p>
                  </div>
                </div>
                {house.supportingFactors.length ? (
                  <div className="rounded-lg bg-green-50 p-3 space-y-1">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-green-800">Поддерживающие показатели</h5>
                    {house.supportingFactors.map((item) => <p key={item} className="text-sm text-green-900">{item}</p>)}
                  </div>
                ) : null}
                {house.attentionFactors.length ? (
                  <div className="rounded-lg bg-amber-50 p-3 space-y-1">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-amber-800">Факторы, требующие внимания</h5>
                    {house.attentionFactors.map((item) => <p key={item} className="text-sm text-amber-900">{item}</p>)}
                  </div>
                ) : null}
                <details className="rounded-lg border border-gray-100 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">Показать доказательства и ограничения</summary>
                  <ul className="mt-2 space-y-1 list-disc pl-5">
                    {house.evidence.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">{item}</li>)}
                  </ul>
                  <ul className="mt-2 space-y-1 list-disc pl-5">
                    {house.limitations.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-500">{item}</li>)}
                  </ul>
                </details>
              </section>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ключевые сферы карты</h3>
              <p className="text-sm text-gray-600">Быстрый ориентир для практической работы с картой</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Users, title: 'Личность', house: 1, text: 'Как вы входите в жизнь и принимаете решения.', tone: 'purple' },
              { icon: Briefcase, title: 'Карьера', house: 10, text: 'Как строится реализация, статус и профессиональный рост.', tone: 'blue' },
              { icon: Heart, title: 'Отношения', house: 7, text: 'Партнерство, близость и баланс в обмене с другими.', tone: 'pink' },
              { icon: HomeIcon, title: 'Дом и семья', house: 4, text: 'Внутренняя опора, род, пространство и чувство безопасности.', tone: 'green' },
            ].map((area) => {
              const Icon = area.icon;
              const house = natalChart.houses?.find((item) => item.house === area.house);
              const personal = personalizedHouses.find((item) => item.house === area.house);
              const styles = LIFE_AREA_STYLES[area.tone as keyof typeof LIFE_AREA_STYLES];

              return (
                <div key={area.house} className={`p-4 rounded-lg border ${styles.card}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${styles.icon}`} />
                    <h4 className="font-semibold text-gray-900">{area.title} ({area.house}-й дом)</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">{area.text}</p>
                  <p className={`text-xs ${styles.meta} font-medium mb-2`}>
                    {personal ? `${personal.sign}, управитель ${personal.lord}` : house ? 'Знак и управитель дома определены, подробности недоступны' : 'Данные дома недоступны'}
                  </p>
                  {personal ? (
                    <div className="space-y-2 border-t border-white/70 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Что это означает именно в вашей карте</p>
                      <p className="text-sm leading-relaxed text-gray-800">
                        {personal.interpretation}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Как читать это без перегруза
          </h4>
          <BulletList
            tone="yellow"
            items={[
              'Начните с Лагны: она показывает природный стиль жизни и базовую стратегию.',
              'Солнце используйте как ориентир цели, а Луну как индикатор эмоционального ресурса.',
              'Переходите к домам и аспектам только после этого: так карта не превращается в набор разрозненных фактов.',
            ]}
          />
        </div>
      </GlassCard>
    </div>
  );
}
