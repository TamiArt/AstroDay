import { useMemo, useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { UserProfile, HomeRoomRect } from '../utils/storage';
import { NatalChart } from '../utils/astrology';
import { PanchangData } from '../utils/panchang';
import { HomeCalibration } from './HomeCalibration';
import { FloorPlanEditor } from './FloorPlanEditor';
import { RoomDashboard } from './RoomDashboard';
import { HomeProgressTracker } from './HomeProgressTracker';
import { HomeARView } from './HomeARView';
import { getHomePersonalizedRecommendations, HOME_LEARNING_CARDS } from '../utils/homeRecommendations';
import { getDataPrecision } from '../utils/personalRecommendations';
import { loadHomeCalibration } from '../utils/storage';

interface HomeAssistantProps {
  profile: UserProfile;
  natalChart: NatalChart;
  currentChart: NatalChart;
  panchang: PanchangData;
  planetaryHour: string;
}

export function HomeAssistant({ profile, natalChart, currentChart, panchang, planetaryHour }: HomeAssistantProps) {
  const [selectedRoom, setSelectedRoom] = useState<HomeRoomRect | null>(null);

  const recommendations = useMemo(
    () => getHomePersonalizedRecommendations(natalChart, new Date(), panchang, planetaryHour),
    [natalChart, panchang, planetaryHour]
  );

  const precision = getDataPrecision(profile);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Дом</h2>
          <p className="opacity-70">
            Интеллектуальный помощник по гармонизации пространства на основе Фэн-шуй, Васту и ведической астрологии.
          </p>
          <p className="text-sm opacity-70">
            Мы используем только локальные данные и бесплатные библиотеки. Все рекомендации сохраняются в браузере.
          </p>
          {precision.level !== 'high' && (
            <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm text-yellow-900">
              Рекомендации приблизительные из-за неточного времени рождения или нестабильного timezone.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl p-4 bg-secondary border border-border">
              <p className="text-sm opacity-70">Даша</p>
              <p className="font-semibold mt-2">{recommendations.primaryNote}</p>
            </div>
            <div className="rounded-2xl p-4 bg-secondary border border-border">
              <p className="text-sm opacity-70">Панчанг</p>
              <p className="font-semibold mt-2">{recommendations.panchangNote}</p>
            </div>
            <div className="rounded-2xl p-4 bg-secondary border border-border">
              <p className="text-sm opacity-70">Планетарный час</p>
              <p className="font-semibold mt-2">{recommendations.planetaryHourNote}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <HomeCalibration />
          <FloorPlanEditor onRoomSelect={setSelectedRoom} />
          <HomeARView northOffset={0} canvasWidth={800} canvasHeight={600} />
        </div>

        <div className="space-y-6">
          <RoomDashboard
            room={selectedRoom}
            recommendations={recommendations}
            planetaryHour={planetaryHour}
            panchang={panchang}
          />
          <HomeProgressTracker />
        </div>
      </div>

      <GlassCard>
        <h3 className="mb-4 text-xl font-semibold">Обучающие карточки</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {HOME_LEARNING_CARDS.map((card) => (
            <div key={card.title} className="rounded-3xl p-5 bg-secondary border border-border">
              <h4 className="mb-2 font-semibold">{card.title}</h4>
              <p className="opacity-80 text-sm">{card.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
