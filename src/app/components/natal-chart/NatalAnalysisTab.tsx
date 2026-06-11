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
import { NatalChart as NatalChartType, PlanetPosition } from '../../utils/astrology';
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

function getHouseForPlanet(planet: PlanetPosition, ascendantLon: number): number {
  return Math.floor(((planet.siderealLon - ascendantLon + 360) % 360) / 30) + 1;
}

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
  const sunHouse = getHouseForPlanet(natalChart.planets.Sun, natalChart.ascendant.siderealLon);
  const moonHouse = getHouseForPlanet(natalChart.planets.Moon, natalChart.ascendant.siderealLon);
  const ascDesc = getAscendantDescription(natalChart.ascendant.signName);
  const sunDesc = getSunDescription(natalChart.planets.Sun.signName, sunHouse);
  const moonDesc = getMoonDescription(natalChart.planets.Moon.signName, moonHouse);

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
            Главный вектор личности
            <TermTooltip term="ascendant" />
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed mb-3">{ascDesc.whatItIs}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.meaning}</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-700 uppercase mb-2">Как это проявляется</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.howManifests}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-700 uppercase mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Сильные стороны
            </h4>
            <BulletList items={ascDesc.strengths} tone="green" />
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-700 uppercase mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Зоны роста
            </h4>
            <BulletList items={ascDesc.challenges} tone="orange" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Практика для раскрытия Лагны
          </h4>
          <BulletList items={ascDesc.practicalAdvice} tone="blue" />
        </div>

        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-dashed border-pink-400">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-600" />
            Мягкий фокус на сегодня
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.dailyChallenge}</p>
        </div>
      </InsightCard>

      <InsightCard
        icon={Sun}
        title={sunDesc.title}
        subtitle={`Солнце в ${natalChart.planets.Sun.signName}, ${sunHouse}-й дом`}
        accent="border-yellow-200"
      >
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-2">Жизненная цель</h4>
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
            <p className="text-sm text-gray-700 leading-relaxed">{sunDesc.inHouse}</p>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-600" />
            Практические шаги
          </h4>
          <BulletList items={sunDesc.practicalSteps} tone="yellow" />
        </div>
      </InsightCard>

      <InsightCard
        icon={Moon}
        title={moonDesc.title}
        subtitle={`Луна в ${natalChart.planets.Moon.signName}, ${moonHouse}-й дом`}
        accent="border-blue-200"
      >
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
          <h4 className="font-semibold text-gray-900 mb-2">Эмоциональная природа</h4>
          <p className="text-sm text-gray-800 leading-relaxed">{moonDesc.essence}</p>
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
              const styles = LIFE_AREA_STYLES[area.tone as keyof typeof LIFE_AREA_STYLES];

              return (
                <div key={area.house} className={`p-4 rounded-lg border ${styles.card}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${styles.icon}`} />
                    <h4 className="font-semibold text-gray-900">{area.title} ({area.house}-й дом)</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">{area.text}</p>
                  <p className={`text-xs ${styles.meta} font-medium`}>
                    {house ? `${house.signName}, управитель ${house.lord}` : 'Данные дома недоступны'}
                  </p>
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
