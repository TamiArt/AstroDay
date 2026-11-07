import { useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { VASTU_DIRECTIONS, VASTU_GOALS, type VastuGoal } from '../utils/vastuGuide';

const PRACTICAL_FRICTIONS = [
  {
    title: 'Вход и ежедневный поток',
    issue: 'Загромождённый вход, плохой свет и постоянный поиск ключей добавляют мелкие препятствия каждый день.',
    action: 'Освободите проход, организуйте место для ключей и проверьте освещение.',
  },
  {
    title: 'Работа и финансовые решения',
    issue: 'Неудобное рабочее место, хаос в документах и постоянные отвлечения затрудняют концентрацию.',
    action: 'Выделите рабочую поверхность, разберите документы и уберите лишние уведомления.',
  },
  {
    title: 'Отдых и отношения',
    issue: 'Работа в спальне, шум и отсутствие личного пространства могут мешать отдыху и спокойному общению.',
    action: 'Разделите зоны сна и работы, договоритесь о месте для личных вещей каждого.',
  },
];

export function VastuGuide() {
  const [activeGoal, setActiveGoal] = useState<VastuGoal>('abundance');
  const [selectedZoneId, setSelectedZoneId] = useState('north');

  const activeGoalInfo = VASTU_GOALS.find((goal) => goal.id === activeGoal);
  const selectedZone = VASTU_DIRECTIONS.find((zone) => zone.id === selectedZoneId) ?? VASTU_DIRECTIONS[0];

  const selectGoal = (goal: VastuGoal) => {
    setActiveGoal(goal);
    const firstRelevantZone = VASTU_DIRECTIONS.find((zone) => zone.goals.includes(goal));
    if (firstRelevantZone) setSelectedZoneId(firstRelevantZone.id);
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-4">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] text-primary font-semibold">Практика Васту</p>
            <h2 className="text-2xl sm:text-3xl font-semibold mt-2">Почему усилия не всегда дают результат</h2>
            <p className="opacity-80 mt-3">
              Дом не управляет вашей судьбой и не может сам по себе гарантировать деньги или отношения.
              Но неудобная, перегруженная или плохо организованная среда способна ежедневно отнимать внимание,
              силы и время. Васту предлагает посмотреть на пространство через направления, пять элементов и
              назначение помещений.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {PRACTICAL_FRICTIONS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-secondary p-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm opacity-75 mt-2">{item.issue}</p>
                <p className="text-sm mt-3"><span className="font-semibold">Что сделать:</span> {item.action}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold">Что такое Васту</h2>
            <p className="opacity-80 mt-2">
              Васту-шастра — традиционное индийское знание об организации пространства. В нём учитываются
              стороны света, пропорции, назначение помещений и пять первоэлементов: пространство, воздух,
              огонь, вода и земля. Разные школы и современные трактовки могут отличаться.
            </p>
            <p className="text-sm opacity-70 mt-3">
              Используйте рекомендации как культурную и интерьерную практику, а не как доказанный способ
              привлечь деньги, вылечить заболевание или исправить отношения. Начинайте с безопасных,
              недорогих изменений, которые действительно делают дом удобнее.
            </p>
            <p className="text-sm rounded-xl border border-border bg-secondary p-3 mt-3">
              Важно: чтобы точно сопоставить направления с комнатами, на плане должен быть отмечен реальный
              географический север. Пока ориентация загруженного плана не подтверждена, используйте карту
              направлений как справочник, а не как точный анализ конкретной комнаты.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Выберите сферу, которую хотите поддержать</h3>
            <div className="grid gap-2 md:grid-cols-3">
              {VASTU_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => selectGoal(goal.id)}
                  aria-pressed={activeGoal === goal.id}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    activeGoal === goal.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary hover:border-primary/50'
                  }`}
                >
                  <span className="font-semibold">{goal.label}</span>
                </button>
              ))}
            </div>
            {activeGoalInfo && (
              <p className="text-sm opacity-75 mt-3">{activeGoalInfo.description}</p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <h3 className="font-semibold">Девять направлений дома</h3>
              <p className="text-xs opacity-60">Выберите сектор для практических рекомендаций</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VASTU_DIRECTIONS.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                const isRelevant = zone.goals.includes(activeGoal);
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZoneId(zone.id)}
                    aria-pressed={isSelected}
                    className={`min-h-20 rounded-2xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : isRelevant
                          ? 'border-primary/40 bg-primary/5 hover:border-primary'
                          : 'border-border bg-secondary hover:border-primary/50'
                    }`}
                  >
                    <span className="block font-semibold text-sm">{zone.direction}</span>
                    <span className="block text-xs opacity-65 mt-1">{zone.element}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">{selectedZone.traditionalName}</p>
              <h3 className="text-xl font-semibold mt-1">{selectedZone.direction}</h3>
              <p className="text-sm opacity-75 mt-1">{selectedZone.principle}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-background/70 p-4">
                <p className="text-sm font-semibold">Традиционное значение</p>
                <p className="text-sm opacity-80 mt-2">{selectedZone.focus}</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4">
                <p className="text-sm font-semibold">Что проверить дома</p>
                <p className="text-sm opacity-80 mt-2">{selectedZone.practicalCheck}</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4">
                <p className="text-sm font-semibold">Первый безопасный шаг</p>
                <p className="text-sm opacity-80 mt-2">{selectedZone.firstStep}</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-4">
                <p className="text-sm font-semibold">Чего избегать</p>
                <p className="text-sm opacity-80 mt-2">{selectedZone.avoid}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
