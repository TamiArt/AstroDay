import assert from 'node:assert/strict';
import type { DayForecast } from './indexedDB';
import { buildSmartDayPlan, compareSmartForecastPeriods, compareSmartPeriods, getForecastAreaIds, summarizeSmartMonth } from './smartCalendar';

function fixture(overrides: Partial<DayForecast> = {}): DayForecast {
  return {
    date: '2026-11-12', energyLevel: 82, moonSign: 'Весы', tithi: 'Шукла Панчами',
    yoga: 'Сиддхи', planetaryHour: 'Венера: дневной час',
    topRecommendation: 'Сегодня лучше выберите активный шаг для карьеры и начните новый проект.',
    avoidRecommendation: 'Не форсируйте необратимые решения; сначала проверьте детали.',
    reasoning: [
      'Главный период: Юпитер, под-период Венера.',
      'Час Венера показывает ближайший способ действия.',
      'транзитный Юпитер касается натального Солнца: поддерживающий аспект, сила 82/100.',
      'Солнце в вашей карте связан с 10-м домом: карьера и статус.',
      'Сиддхи поддерживает созидательные шаги.',
      'D24 помогает через самостоятельное обучение и ясную цель практики.',
      'энергии достаточно для видимого шага.',
    ],
    bestAreas: ['Карьера', 'Финансы', 'Обучение'],
    favorableHours: ['10:00 — Юпитер'], color: '#10b981', icon: '🔥', label: 'Высокая',
    timestamp: 0, warning: undefined, precisionNotes: [], ...overrides,
  };
}

const today = fixture();
const plan = buildSmartDayPlan(today);
assert.ok(plan.factors.some((item) => item.source === 'dasha'));
assert.ok(plan.factors.some((item) => item.source === 'transit'));
assert.ok(plan.factors.some((item) => item.source === 'natal'));
assert.ok(plan.factors.some((item) => item.source === 'panchang'));
assert.ok(plan.factors.some((item) => item.source === 'varga'));
assert.equal(plan.confidence, 'high');
assert.ok(plan.conflicts.some((item) => item.level === 'mixed'));
assert.ok(plan.conflicts[0].resolution.includes('обратимых'));
assert.ok(getForecastAreaIds(today).includes('career'));

const quiet = fixture({
  date: '2026-11-13', energyLevel: 32,
  topRecommendation: 'Сегодня разумнее завершить небольшие задачи.',
  avoidRecommendation: 'Избегайте перегрузок.',
  bestAreas: ['Восстановление'],
  reasoning: ['энергию стоит беречь: планируйте короткие действия и паузы между ними.'],
  warning: 'Вьягхата — будьте осторожны',
});
const quietPlan = buildSmartDayPlan(quiet);
assert.equal(quietPlan.conflicts[0]?.level, 'caution');
assert.equal(buildSmartDayPlan(fixture({ precisionNotes: ['Время рождения указано с погрешностью ±15 мин.'] })).confidence, 'medium');
assert.equal(quietPlan.areas.length, 1);

const comparison = compareSmartPeriods(today, fixture({
  date: '2026-11-20', energyLevel: 55, bestAreas: ['Творчество', 'Обучение'],
}));
assert.equal(comparison.energyDelta, -27);
assert.deepEqual(comparison.newlyHighlighted, ['Творчество']);
assert.deepEqual(comparison.lessHighlighted, ['Карьера', 'Финансы']);

const periodComparison = compareSmartForecastPeriods(
  [today, quiet],
  [fixture({ date: '2026-12-01', energyLevel: 70, bestAreas: ['Творчество', 'Обучение'], topRecommendation: 'Выделите время на творчество и обучение.', reasoning: [] })],
  'ноябрь 2026', 'декабрь 2026',
);
assert.equal(periodComparison.currentDays, 2);
assert.equal(periodComparison.targetDays, 1);
assert.equal(periodComparison.energyDelta, 13);
assert.ok(periodComparison.targetTopAreas.includes('Творчество'));
assert.ok(periodComparison.newlyHighlighted.includes('Творчество'));
assert.ok(periodComparison.caveat.includes('неполное покрытие'));

const summary = summarizeSmartMonth([today, quiet], 30);
assert.equal(summary.daysWithData, 2);
assert.equal(summary.totalDays, 30);
assert.equal(summary.averageEnergy, 57);
assert.ok(summary.areaCounts.some((item) => item.id === 'career'));
assert.ok(summary.recurringFactors.length >= 0);

console.log('smartCalendar tests passed');
