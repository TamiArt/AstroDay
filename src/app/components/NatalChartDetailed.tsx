import { useState } from 'react';
import { AlertCircle, BarChart3, BookOpen, Clock, Eye, Layers, Orbit, Sparkles, Star, Users, Zap } from 'lucide-react';
import { NatalChart as NatalChartType } from '../utils/astrology';
import type { UserProfile } from '../utils/storage';
import { CopyNatalChartData } from './natal-chart/CopyNatalChartData';
import { AspectsTableEnhanced } from './AspectsTableEnhanced';
import { GlassCard } from './common/GlassCard';
import { DivisionalChartsTab } from './natal-chart/DivisionalChartsTab';
import { NatalAnalysisTab } from './natal-chart/NatalAnalysisTab';
import { NatalDashaTab } from './natal-chart/NatalDashaTab';
import { NatalTransitsTab } from './natal-chart/NatalTransitsTab';
import { NatalForecastTab } from './natal-chart/NatalForecastTab';
import { NatalHousesTab } from './natal-chart/NatalHousesClearTab';
import { NatalOverviewTab } from './natal-chart/NatalOverviewTab';
import { LifePathAnalysisTab } from './natal-chart/LifePathAnalysisTab';
import { PartnerCompatibility } from './PartnerCompatibility';

interface NatalChartDetailedProps {
  natalChart: NatalChartType;
  profile: UserProfile;
}

type TabType = 'overview' | 'analysis' | 'life' | 'compatibility' | 'aspects' | 'houses' | 'dasha' | 'transits' | 'forecast' | 'divisional';

const TAB_GROUPS = [
  {
    label: 'Знакомство с картой',
    description: 'Сначала разберитесь в основных положениях и общем портрете.',
    tabs: [
      { id: 'overview', label: 'Обзор', icon: Eye },
      { id: 'analysis', label: 'Анализ', icon: BookOpen },
    ],
  },
  {
    label: 'Жизненные сферы',
    description: 'Отдельные темы и связи между показателями карты.',
    tabs: [
      { id: 'life', label: 'Деньги и отношения', icon: Star },
      { id: 'compatibility', label: 'Совместимость', icon: Users },
      { id: 'houses', label: 'Дома', icon: Layers },
      { id: 'aspects', label: 'Аспекты', icon: Zap },
    ],
  },
  {
    label: 'Время и прогнозы',
    description: 'Планетарные периоды, текущие положения и их сочетание.',
    tabs: [
      { id: 'dasha', label: 'Даши', icon: Clock },
      { id: 'transits', label: 'Транзиты', icon: Orbit },
      { id: 'forecast', label: 'Единый прогноз', icon: Sparkles },
    ],
  },
  {
    label: 'Углублённый анализ',
    description: 'Дополнительные карты для изучения отдельных направлений.',
    tabs: [
      { id: 'divisional', label: 'Дробные карты', icon: BarChart3 },
    ],
  },
] as const;

function NatalChartTimeRequired() {
  return (
    <div className="space-y-6 p-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-yellow-500/20">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Требуется точное время рождения</h2>
            <p className="text-gray-700 mb-4">
              Для построения натальной карты нужно указать точное время рождения в настройках.
              Без него невозможно надежно рассчитать Лагну и дома.
            </p>
            <p className="text-sm text-gray-600">
              Время рождения обычно есть в свидетельстве о рождении или медицинской карте роддома.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export function NatalChartDetailed({ natalChart, profile }: NatalChartDetailedProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');

  if (!natalChart.houses || natalChart.houses.length === 0) {
    return <NatalChartTimeRequired />;
  }

  const renderSelectedTab = () => {
    switch (selectedTab) {
      case 'overview':
        return <NatalOverviewTab natalChart={natalChart} />;
      case 'analysis':
        return <NatalAnalysisTab natalChart={natalChart} />;
      case 'life':
        return <LifePathAnalysisTab natalChart={natalChart} />;
      case 'compatibility':
        return <PartnerCompatibility natalChart={natalChart} />;
      case 'aspects':
        return <AspectsTableEnhanced natalChart={natalChart} />;
      case 'houses':
        return <NatalHousesTab natalChart={natalChart} />;
      case 'dasha':
        return <NatalDashaTab natalChart={natalChart} />;
      case 'transits':
        return <NatalTransitsTab natalChart={natalChart} />;
      case 'forecast':
        return <NatalForecastTab natalChart={natalChart} />;
      case 'divisional':
        return <DivisionalChartsTab natalChart={natalChart} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 border-b border-purple-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Star className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Натальная карта
            </h1>
            <p className="text-sm text-gray-600">
              {new Date(natalChart.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <CopyNatalChartData profile={profile} natalChart={natalChart} />
      </div>

      <div className="rounded-xl border border-purple-100 bg-white/80 p-4">
        <p className="text-sm font-semibold text-gray-900">Как пользоваться разделом</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          Начните с обзора. В каждой вкладке сначала читайте краткий персональный вывод;
          расчёты и расширенные объяснения открывайте только тогда, когда они нужны.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Дата и время карты: {new Date(natalChart.date).toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}. Время рождения влияет на Асцендент и распределение домов.
        </p>
      </div>

      <nav aria-label="Разделы натальной карты" className="space-y-4">
        {TAB_GROUPS.map((group) => (
          <section key={group.label} className="space-y-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
              <p className="text-xs text-gray-500">{group.description}</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                      isSelected
                        ? 'border-purple-700 bg-purple-700 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="min-h-[500px]">{renderSelectedTab()}</div>
    </div>
  );
}
