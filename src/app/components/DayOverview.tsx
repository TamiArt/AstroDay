// Обзор дня: простые рекомендации и понятные основания расчёта.
import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Info, Sparkles } from 'lucide-react';
import { NatalChart, Aspect, calculateDasha, getCurrentAntardasha } from '../utils/astrology';
import { PanchangData } from '../utils/panchang';
import { calculateDailyAreas, LifeArea } from '../utils/dailyAreasAnalysis';
import { GlassCard } from './common/GlassCard';

interface DayOverviewProps {
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
}

function getScoreExplanation(score: number): string {
  if (score >= 70) {
    return 'По правилам модели у этой темы сегодня набралось много расчётных баллов. Это повод обратить на неё внимание, а не обещание успеха.';
  }
  if (score >= 40) {
    return 'По правилам модели у этой темы есть несколько заметных расчётных показателей. Можно спокойно заниматься обычными делами.';
  }
  return 'Сегодня модель набрала для этой темы немного баллов. Это не плохой знак и не запрет на действия — только результат выбранных правил расчёта.';
}

function ScoreBreakdown({ area }: { area: LifeArea }) {
  const parts = [
    { label: 'Большой период Даша', value: area.scoreBreakdown.dasha },
    { label: 'Положения планет сегодня', value: area.scoreBreakdown.transits },
    { label: 'Лунный день и календарь', value: area.scoreBreakdown.panchang },
  ].filter((part): part is { label: string; value: number } => part.value !== undefined);

  return (
    <div className="rounded-xl border border-border p-3">
      <h4 className="text-sm font-semibold mb-2">Из чего сложился балл</h4>
      <ul className="space-y-2">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="opacity-80">{part.label}</span>
            <strong className="tabular-nums">{part.value} баллов</strong>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs opacity-60">
        Это внутренние баллы модели, а не проценты и не вероятность события.
      </p>
    </div>
  );
}

function LifeAreaDetails({ area }: { area: LifeArea }) {
  return (
    <div className="mt-2 rounded-2xl border border-border bg-background/60 p-4 space-y-4">
      <section>
        <h4 className="font-semibold mb-1">Что это значит сегодня</h4>
        <p className="text-sm leading-relaxed opacity-80">{getScoreExplanation(area.score)}</p>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4" style={{ color: area.color }} />
          <h4 className="font-semibold">Что можно сделать</h4>
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
          {area.recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ol>
        <p className="mt-2 text-xs opacity-60">
          Это обычные практические идеи. Выбирайте только то, что подходит вашей реальной ситуации.
        </p>
      </section>

      <section>
        <h4 className="font-semibold mb-2">Почему модель выделила эту сферу</h4>
        {area.whyToday.length > 0 ? (
          <ul className="space-y-2">
            {area.whyToday.map((reason, index) => (
              <li key={index} className="rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed">
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-70">
            Для этой сферы не найдено дополнительных персональных оснований. Поэтому не будем придумывать объяснение.
          </p>
        )}
      </section>

      <ScoreBreakdown area={area} />
    </div>
  );
}

export function DayOverview({
  natalChart,
  currentChart,
  aspects,
  panchang
}: DayOverviewProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  let currentDasha: ReturnType<typeof calculateDasha> | null = null;
  let currentAntar: ReturnType<typeof getCurrentAntardasha> | null = null;

  if (natalChart.houses && natalChart.planets.Moon) {
    const moonNakshatra = Math.floor(natalChart.planets.Moon.siderealLon / (360 / 27));
    currentDasha = calculateDasha(
      natalChart.date,
      moonNakshatra,
      new Date(),
      natalChart.planets.Moon.siderealLon
    );
    if (currentDasha) currentAntar = getCurrentAntardasha(currentDasha);
  }

  const areas = calculateDailyAreas(panchang, natalChart, currentChart, aspects, currentDasha);
  const topAreas = areas.slice(0, 3);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div
            className="rounded-2xl p-3"
            style={{
              background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))',
              boxShadow: '0 4px 16px rgba(107, 76, 230, 0.3)'
            }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mb-2">Обзор дня по сферам жизни</h2>
            <p className="text-sm leading-relaxed opacity-75">
              Здесь собраны подсказки для работы, денег, отношений, дома, здоровья и других тем.
              Сначала посмотрите, что можно сделать, а затем — почему модель предлагает обратить
              внимание именно на эту сферу.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-5 w-5 shrink-0 opacity-70" />
            <div className="text-sm leading-relaxed">
              <strong>Как понимать баллы:</strong> 0–100 — условный индекс внутренних правил
              приложения. Он помогает сравнить сферы между собой. Высокий балл не гарантирует
              успех, низкий не означает неудачу и не запрещает действовать. Это не вероятность
              событий и не оценка вашей реальной жизни.
            </div>
          </div>
        </div>

        {currentDasha && (
          <div className="mt-5 rounded-2xl border border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold">Какой период Даша сейчас идёт</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-background/60 p-3">
                <p className="mb-1 text-xs opacity-70">Большой период</p>
                <p className="font-semibold text-purple-600">{currentDasha.planet}</p>
                <p className="mt-1 text-xs opacity-60">
                  {currentDasha.startDate.toLocaleDateString('ru')} — {currentDasha.endDate.toLocaleDateString('ru')}
                </p>
              </div>
              {currentAntar && (
                <div className="rounded-xl bg-background/60 p-3">
                  <p className="mb-1 text-xs opacity-70">Подпериод</p>
                  <p className="font-semibold text-pink-600">{currentAntar.planet}</p>
                  <p className="mt-1 text-xs opacity-60">
                    {currentAntar.startDate.toLocaleDateString('ru')} — {currentAntar.endDate.toLocaleDateString('ru')}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed opacity-70">
              В традиции Джйотиш большой период и подпериод используют как общий символический
              фон. Они не означают, что определённое событие обязательно произойдёт.
            </p>
          </div>
        )}

        <section className="mt-6 space-y-3">
          <div>
            <h3 className="font-semibold">На какие темы модель обращает больше внимания</h3>
            <p className="mt-1 text-xs opacity-65">
              Это три наибольших расчётных балла, а не рейтинг «лучших» сфер дня.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topAreas.map((area) => (
              <div
                key={area.id}
                className="rounded-2xl border p-3"
                style={{ background: `${area.color}12`, borderColor: `${area.color}45` }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">{area.icon}</span>
                  <span className="text-sm font-semibold">{area.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${area.score}%`, background: area.color }}
                    />
                  </div>
                  <strong className="text-sm tabular-nums" style={{ color: area.color }}>
                    {area.score}/100
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </GlassCard>

      <GlassCard>
        <div className="mb-4">
          <h3 className="font-semibold">Все сферы жизни</h3>
          <p className="mt-1 text-sm opacity-70">
            Нажмите на сферу, чтобы увидеть конкретные действия и объяснение расчёта.
          </p>
        </div>
        <div className="space-y-3">
          {areas.map((area) => {
            const expanded = selectedAreaId === area.id;
            return (
              <div key={area.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setSelectedAreaId(expanded ? null : area.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-secondary/70"
                  style={{ background: expanded ? `${area.color}12` : 'var(--secondary)' }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
                    style={{ background: `${area.color}20` }}
                  >
                    {area.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{area.name}</span>
                    <span className="mt-1 block text-xs opacity-65">{area.description}</span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${area.score}%`, background: area.color }}
                        />
                      </span>
                      <strong className="text-sm tabular-nums" style={{ color: area.color }}>
                        {area.score}/100
                      </strong>
                    </span>
                  </span>
                  {expanded
                    ? <ChevronUp className="h-5 w-5 shrink-0 opacity-60" />
                    : <ChevronDown className="h-5 w-5 shrink-0 opacity-60" />}
                </button>
                {expanded && <LifeAreaDetails area={area} />}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
