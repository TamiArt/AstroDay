import { useState } from 'react';
import { AlertCircle, BarChart3, BookOpen, Clock, Eye, Layers, Star, Zap } from 'lucide-react';
import { NatalChart as NatalChartType } from '../utils/astrology';
import { AspectsTableEnhanced } from './AspectsTableEnhanced';
import { GlassCard } from './common/GlassCard';
import { DivisionalChartsTab } from './natal-chart/DivisionalChartsTab';
import { NatalAnalysisTab } from './natal-chart/NatalAnalysisTab';
import { NatalDashaTab } from './natal-chart/NatalDashaTab';
import { NatalHousesTab } from './natal-chart/NatalHousesTab';
import { NatalOverviewTab } from './natal-chart/NatalOverviewTab';

interface NatalChartDetailedProps {
  natalChart: NatalChartType;
}

type TabType = 'overview' | 'analysis' | 'aspects' | 'houses' | 'dasha' | 'divisional';

const TABS = [
  { id: 'overview', label: 'Обзор', icon: Eye },
  { id: 'analysis', label: 'Анализ', icon: BookOpen },
  { id: 'aspects', label: 'Аспекты', icon: Zap },
  { id: 'houses', label: 'Дома', icon: Layers },
  { id: 'dasha', label: 'Даша', icon: Clock },
  { id: 'divisional', label: 'Дробные карты', icon: BarChart3 },
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

export function NatalChartDetailed({ natalChart }: NatalChartDetailedProps) {
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
      case 'aspects':
        return <AspectsTableEnhanced natalChart={natalChart} />;
      case 'houses':
        return <NatalHousesTab natalChart={natalChart} />;
      case 'dasha':
        return <NatalDashaTab natalChart={natalChart} />;
      case 'divisional':
        return <DivisionalChartsTab natalChart={natalChart} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 pb-4 border-b border-purple-200">
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

      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Добро пожаловать в вашу натальную карту</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Это персональный снимок неба на момент рождения. Начните с обзора, затем переходите к анализу,
              домам, аспектам и периодам Даша.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[500px]">{renderSelectedTab()}</div>
    </div>
  );
}
