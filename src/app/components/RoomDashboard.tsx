import { GlassCard } from './common/GlassCard';
import { HomePersonalizedResult } from '../utils/homeRecommendations';
import { HomeRoomRect } from '../utils/storage';
import { PanchangData } from '../utils/panchang';

interface RoomDashboardProps {
  room: HomeRoomRect | null;
  recommendations: HomePersonalizedResult;
  planetaryHour: string;
  panchang: PanchangData;
}

export function RoomDashboard({ room, recommendations, planetaryHour, panchang }: RoomDashboardProps) {
  if (!room) {
    return (
      <GlassCard>
        <h2 className="text-xl font-semibold">Я в комнате</h2>
        <p className="opacity-70">Нажмите на комнату на плане, чтобы получить полный анализ зоны и рекомендации.</p>
      </GlassCard>
    );
  }

  const analysis = recommendations.zoneAnalysis[room.vastuZone] || recommendations.zoneAnalysis[room.baguaZone];

  return (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{room.name}</h2>
          <p className="opacity-70">Сектор: {room.baguaZone} / {room.vastuZone}</p>
        </div>
        <div className="rounded-3xl p-4 bg-secondary border border-border">
          <p className="text-sm opacity-70">Ведический управляющий</p>
          <p className="mt-2 font-semibold">{analysis?.owner ?? 'Проверяем...'}</p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-3xl p-4 bg-secondary border border-border">
            <p className="text-sm opacity-70">Что стоит сделать</p>
            <p className="mt-2">{analysis?.advice ?? 'Выберите зону на плане.'}</p>
          </div>
          <div className="rounded-3xl p-4 bg-secondary border border-border">
            <p className="text-sm opacity-70">Чего избегать</p>
            <p className="mt-2">{analysis?.avoid ?? 'Пока нет данных.'}</p>
          </div>
          <div className="rounded-3xl p-4 bg-secondary border border-border">
            <p className="text-sm opacity-70">Цвета и элементы</p>
            <p className="mt-2">{analysis ? analysis.colors.join(', ') : 'Пока нет данных.'}</p>
          </div>
          <div className="rounded-3xl p-4 bg-secondary border border-border">
            <p className="text-sm opacity-70">Упая</p>
            <p className="mt-2">{analysis?.practice ?? 'Пока нет данных.'}</p>
          </div>
        </div>
        <div className="rounded-3xl p-4 border border-border bg-secondary">
          <p className="text-sm opacity-70">Сейчас</p>
          <p className="mt-2">{planetaryHour} — подходящее время для мягкой работы в этой зоне.</p>
          <p className="text-sm opacity-70 mt-3">{panchang.tithi.name === 'Пурнима' ? 'Сегодня благоприятно активировать зону богатства.' : 'Следите за энергетикой дня и регулируйте обстановку.'}</p>
        </div>
      </div>
    </GlassCard>
  );
}
