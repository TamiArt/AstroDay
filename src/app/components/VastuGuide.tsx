import { useState } from 'react';
import { GlassCard } from './common/GlassCard';
import { getVastuMoneyFocus, VASTU_ACTION_PLANS, VASTU_DIRECTIONS, VASTU_GOALS, VASTU_GRID_ORDER, VASTU_MONEY_FOCUS, VASTU_REMEDIES, type VastuGoal, type VastuRemedyType } from '../utils/vastuGuide';
import { loadVastuChecklist, saveVastuChecklist, type VastuChecklistItem } from '../utils/storage';

const VASTU_GRID_DIRECTIONS = VASTU_GRID_ORDER.map((id) => VASTU_DIRECTIONS.find((zone) => zone.id === id))
  .filter((zone) => zone !== undefined);

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
  const [moneyGoal, setMoneyGoal] = useState<typeof VASTU_MONEY_FOCUS[number]['id']>('stable-income');
  const [remedyType, setRemedyType] = useState<VastuRemedyType>('spatial');
  const [storageError, setStorageError] = useState('');
  const [checklist, setChecklist] = useState<VastuChecklistItem[]>(() => {
    const saved = loadVastuChecklist();
    return VASTU_ACTION_PLANS.map((action) => ({
      ...action,
      done: saved.find((item) => item.id === action.id)?.done ?? false,
    }));
  });

  const activeGoalInfo = VASTU_GOALS.find((goal) => goal.id === activeGoal);
  const activeActions = checklist.filter((action) => action.goal === activeGoal);
  const completedActions = activeActions.filter((action) => action.done).length;

  const persistChecklist = (next: VastuChecklistItem[]) => {
    setChecklist(next);
    try {
      saveVastuChecklist(next);
      setStorageError('');
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Не удалось сохранить чек-лист.');
    }
  };

  const toggleAction = (id: string) => {
    persistChecklist(checklist.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  };

  const retrySave = () => persistChecklist(checklist);
  const selectedZone = VASTU_DIRECTIONS.find((zone) => zone.id === selectedZoneId) ?? VASTU_DIRECTIONS[0];

  const selectGoal = (goal: VastuGoal) => {
    setActiveGoal(goal);
    const firstRelevantZone = VASTU_DIRECTIONS.find((zone) => zone.goals.includes(goal));
    if (firstRelevantZone) setSelectedZoneId(firstRelevantZone.id);
  };

  return (
    <div className="space-y-6">
      {storageError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive space-y-2"><p>{storageError}</p><button type="button" onClick={retrySave} className="underline font-semibold">Повторить сохранение</button></div>}
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
              недорогих изменений, которые действительно делают дом удобнее. Не нужно покупать специальные
              предметы, ставить фонтаны или менять планировку ради «активации» сектора.
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

          <div className="rounded-3xl border border-border bg-secondary/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">План действий</h3>
                <p className="text-sm opacity-70 mt-1">Небольшие шаги для выбранной сферы — без дорогих ритуалов и обязательных покупок.</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{completedActions} из {activeActions.length}</span>
            </div>
            <div
              className="h-2 rounded-full bg-background overflow-hidden"
              role="progressbar"
              aria-label="Прогресс плана Васту"
              aria-valuemin={0}
              aria-valuemax={activeActions.length}
              aria-valuenow={completedActions}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${activeActions.length ? completedActions / activeActions.length * 100 : 0}%` }}
              />
            </div>
            <div className="space-y-2">
              {activeActions.map((action) => (
                <label key={action.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={action.done}
                    onChange={() => toggleAction(action.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className={action.done ? 'text-sm opacity-60 line-through' : 'text-sm'}>{action.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs opacity-60">Отметки сохраняются локально в этом браузере и не влияют на астрологические расчёты.</p>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
              <h3 className="font-semibold">Девять направлений дома</h3>
              <p className="text-xs opacity-60">Выберите сектор для практических рекомендаций</p>
            </div>
            <div className="grid grid-cols-3 gap-2" aria-label="Карта направлений Васту, север сверху">
              {VASTU_GRID_DIRECTIONS.map((zone) => {
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

          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">Денежная карта дома</p>
              <h3 className="text-xl font-semibold mt-1">Как выбрать направление-фокус</h3>
              <p className="text-sm opacity-75 mt-2">
                В разных школах Васту трактовки могут различаться. Здесь направление выбирается не как
                магически «самое сильное», а как символический фокус под вашу текущую финансовую задачу.
                Для точного сопоставления с квартирой сначала подтвердите север на плане.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {VASTU_MONEY_FOCUS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setMoneyGoal(item.id); setSelectedZoneId(item.direction); }}
                  aria-pressed={moneyGoal === item.id}
                  className={`rounded-2xl border p-3 text-left transition-colors ${moneyGoal === item.id ? 'border-primary bg-background' : 'border-border bg-secondary'}`}
                >
                  <span className="block font-semibold text-sm">{item.label}</span>
                  <span className="block text-xs opacity-70 mt-1">{item.directionLabel}</span>
                </button>
              ))}
            </div>
            {(() => {
              const focus = getVastuMoneyFocus(moneyGoal);
              return (
                <div className="rounded-2xl bg-background/80 p-4 space-y-2">
                  <p className="font-semibold">{focus.directionLabel} — выбранное направление-фокус</p>
                  <p className="text-sm opacity-75">{focus.reason}</p>
                  <p className="text-sm"><span className="font-semibold">Что проверить:</span> {focus.action}</p>
                </div>
              );
            })()}
            <div className="grid grid-cols-3 gap-2" aria-label="Денежная карта девяти секторов, север сверху">
              {VASTU_GRID_DIRECTIONS.map((zone) => (
                <div key={zone.id} className={`rounded-xl border p-3 min-h-16 ${zone.id === getVastuMoneyFocus(moneyGoal).direction ? 'border-primary bg-primary/10' : 'border-border bg-secondary/70'}`}>
                  <p className="text-xs font-semibold">{zone.direction}</p>
                  <p className="text-[11px] opacity-65 mt-1">{zone.id === 'north' ? 'Ресурсы' : zone.id === 'northeast' ? 'Ясность' : zone.id === 'northwest' ? 'Связи' : zone.id === 'center' ? 'Свободный поток' : zone.focus.split('.')[0]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">Четыре типа remedies</p>
              <h3 className="text-xl font-semibold mt-1">Какой способ коррекции выбрать</h3>
              <p className="text-sm opacity-75 mt-2">Начинайте с простого и безопасного. Символические практики необязательны и не заменяют реальные финансовые действия.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {VASTU_REMEDIES.map((remedy) => (
                <button
                  key={remedy.id}
                  type="button"
                  onClick={() => setRemedyType(remedy.id)}
                  aria-pressed={remedyType === remedy.id}
                  className={`rounded-xl border p-3 text-left text-sm font-semibold ${remedyType === remedy.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary'}`}
                >
                  {remedy.title}
                </button>
              ))}
            </div>
            {(() => {
              const remedy = VASTU_REMEDIES.find((item) => item.id === remedyType) ?? VASTU_REMEDIES[0];
              return (
                <div className="rounded-2xl bg-secondary p-4">
                  <h4 className="font-semibold">{remedy.title}</h4>
                  <p className="text-sm opacity-75 mt-1">{remedy.description}</p>
                  <ul className="list-disc pl-5 mt-3 space-y-1">
                    {remedy.examples.map((example) => <li key={example} className="text-sm">{example}</li>)}
                  </ul>
                </div>
              );
            })()}
          </div>

          <div className="rounded-3xl border border-border p-5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">Васту и недвижимость</p>
            <h3 className="text-xl font-semibold">Используйте принципы пространства и в работе с объектами</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-4">
                <h4 className="font-semibold">Аренда и продажа</h4>
                <p className="text-sm opacity-75 mt-2">Подготовка объекта к показу: свободный вход, свет, чистота, устранение запахов и мелких неисправностей, понятные сценарии использования комнат.</p>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <h4 className="font-semibold">Работа с недвижимостью как доходом</h4>
                <p className="text-sm opacity-75 mt-2">Планируйте загрузку, расходы, ремонт, юридическую проверку и доходность объекта. Васту может быть дополнительным языком описания пространства, но не заменяет оценку рынка и финансовый расчёт.</p>
              </div>
            </div>
            <p className="text-xs opacity-60">Ни одно направление или remedy не гарантирует арендаторов, рост цены или прибыль от недвижимости.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
