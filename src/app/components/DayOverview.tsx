import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, CalendarDays, SlidersHorizontal } from 'lucide-react';
import type { NatalChart } from '../utils/astrology';
import { getNakshatra, getNakshatraPada, NAKSHATRAS } from '../utils/astrology';
import type { Aspect } from '../utils/astrology';
import type { PanchangData } from '../utils/panchang';
import { getPlanetName } from '../utils/planetUtils';
import { analyzeTransits, type TransitAnalysisReport } from '../utils/transitAnalysis';
import { GlassCard } from './common/GlassCard';

interface DayOverviewProps {
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
}

interface LifeAreaDefinition {
  id: string;
  title: string;
  icon: string;
  houses: number[];
  description: string;
  dailyFocus: string;
  recommendations: string[];
  caution: string;
}

const LIFE_AREAS: LifeAreaDefinition[] = [
  {
    id: 'finances', title: 'Финансы и личный заработок', icon: '💰', houses: [1, 2, 10, 11],
    description: 'Личные деньги, накопления, профессиональный заработок, клиенты и результаты работы.',
    dailyFocus: 'Оценивайте финансовые идеи через реальные цифры, условия и ресурсы.',
    recommendations: ['Проверьте текущие расходы и обязательства', 'Оцените, какие навыки или проекты можно развивать', 'Перед покупкой или договорённостью сравните условия'],
    caution: 'Не принимайте инвестиционные и другие значимые финансовые решения на основании астрологического прогноза.',
  },
  {
    id: 'career', title: 'Работа, карьера и развитие', icon: '💼', houses: [1, 6, 10, 11],
    description: 'Профессиональные навыки, ежедневные задачи, карьера, ответственность и результаты.',
    dailyFocus: 'Выберите приоритет и доведите один конкретный рабочий шаг до результата.',
    recommendations: ['Разбейте крупную задачу на ближайшие действия', 'Уточните сроки и критерии готовности', 'Важные договорённости зафиксируйте письменно'],
    caution: 'Астрологические показатели не гарантируют трудоустройство, повышение или профессиональный успех.',
  },
  {
    id: 'creativity', title: 'Творчество и самореализация', icon: '🎨', houses: [3, 5, 10, 11],
    description: 'Практические навыки, авторские идеи, создание работ, аудитория и реализация проектов.',
    dailyFocus: 'Переведите идею в небольшой законченный результат.',
    recommendations: ['Создайте или доработайте один фрагмент проекта', 'Попробуйте один новый творческий приём', 'Сохраните результат и отметьте следующий шаг'],
    caution: 'Творческая продуктивность зависит также от времени, условий, навыков и вашего самочувствия.',
  },
  {
    id: 'relationships', title: 'Любовь и отношения', icon: '💕', houses: [2, 7, 8, 11],
    description: 'Брак, партнёрство, семейные ценности, доверие, общие ресурсы и совместные планы.',
    dailyFocus: 'Проясняйте ожидания и обсуждайте совместные решения без поспешных выводов.',
    recommendations: ['Выделите время на спокойный разговор', 'Уточните ожидания и распределение обязанностей', 'Обсудите общий план, если он требует согласования'],
    caution: 'Транзиты не определяют чувства другого человека и не предсказывают расставание или брак.',
  },
  {
    id: 'family', title: 'Семья и дом', icon: '🏡', houses: [4, 2, 5, 12],
    description: 'Дом, жильё, близкие, семейные ценности, личное пространство и отдых.',
    dailyFocus: 'Поддерживайте устойчивость быта и распределяйте домашние задачи реалистично.',
    recommendations: ['Выберите одну важную домашнюю задачу', 'Обсудите распределение бытовых обязанностей', 'Оставьте время на комфорт и восстановление'],
    caution: 'Астрологическая трактовка не заменяет юридическую, финансовую или техническую проверку вопросов жилья.',
  },
  {
    id: 'children', title: 'Дети, родительство и будущее семьи', icon: '🌱', houses: [5, 9, 2, 7],
    description: 'Тема детей, родительства, семейных планов, совместной поддержки и долгосрочных ценностей.',
    dailyFocus: 'Можно спокойно обсуждать семейные планы и практическую поддержку друг друга.',
    recommendations: ['Обсудите долгосрочные семейные планы', 'Подумайте, какая поддержка нужна каждому', 'Запишите вопросы, которые важно обсудить вместе'],
    caution: 'Астрология не оценивает возможность зачатия, фертильность, течение беременности или необходимость лечения. Медицинские вопросы решаются с врачом.',
  },
  {
    id: 'health', title: 'Здоровье, энергия и режим', icon: '🌿', houses: [1, 6, 8, 12],
    description: 'Повседневная нагрузка, режим, сон, отдых и восстановление.',
    dailyFocus: 'Соотносите планы с реальным самочувствием и не перегружайте расписание.',
    recommendations: ['Распределите нагрузку с учётом самочувствия', 'Сохраните привычный режим сна и отдыха', 'При необходимости перенесите необязательные дела'],
    caution: 'Этот раздел не диагностирует заболевания, не предсказывает осложнения и не заменяет медицинские рекомендации.',
  },
  {
    id: 'communication', title: 'Общение, друзья и окружение', icon: '💬', houses: [3, 7, 9, 11],
    description: 'Общение, контакты, партнёрские взаимодействия, обучение у других и сообщества.',
    dailyFocus: 'Поддерживайте полезные контакты и формулируйте мысли ясно.',
    recommendations: ['Ответьте на важные сообщения', 'Обменяйтесь опытом с человеком из вашей сферы', 'При обсуждении задачи уточните, одинаково ли вы поняли договорённости'],
    caution: 'Наличие астрологических факторов не означает, что встреча или знакомство обязательно состоится.',
  },
];

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getAreaEvidence(area: LifeAreaDefinition, report: TransitAnalysisReport): {
  positions: TransitAnalysisReport['positions'];
  aspects: TransitAnalysisReport['aspects'];
  lordHits: TransitAnalysisReport['houseLordHits'];
  dasha: string[];
} {
  const positions = report.positions.filter((position) => area.houses.includes(position.natalHouse));
  const aspects = report.aspects.filter((aspect) =>
    area.houses.includes(aspect.transitHouse)
    || (aspect.natalHouse !== null && area.houses.includes(aspect.natalHouse))
  );
  const lordHits = report.houseLordHits.filter((hit) => area.houses.includes(hit.house));
  const dasha = report.lifeAreas
    .filter((item) => item.transitEvidence.length > 0 || item.dashaEvidence.length > 0)
    .filter((item) => item.houses.some((house) => area.houses.includes(house)))
    .flatMap((item) => item.dashaEvidence);
  return { positions, aspects, lordHits, dasha: [...new Set(dasha)] };
}

function AreaStatus({ evidenceCount }: { evidenceCount: number }) {
  const label = evidenceCount >= 4 ? 'Несколько факторов' : evidenceCount > 0 ? 'Есть факторы' : 'Нет выделенных факторов';
  return <span className="rounded-full border border-border px-3 py-1 text-xs opacity-75">{label}</span>;
}

function TechnicalAreaCard({
  area, natalChart, report,
}: {
  area: LifeAreaDefinition;
  natalChart: NatalChart;
  report: TransitAnalysisReport;
}) {
  const [expanded, setExpanded] = useState(false);
  const evidence = getAreaEvidence(area, report);
  const houses = (natalChart.houses ?? []).filter((house) => area.houses.includes(house.house));
  const lords = [...new Set(houses.map((house) => house.lord))];
  const evidenceCount = evidence.positions.length + evidence.aspects.length + evidence.lordHits.length + evidence.dasha.length;
  const transitPlanets = [...new Set(evidence.positions.map((position) => position.planetName))];

  return (
    <section className="rounded-2xl border border-border overflow-hidden">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <span className="text-2xl" aria-hidden="true">{area.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{area.title}</span>
          <span className="mt-1 block text-sm opacity-65">{area.description}</span>
          <span className="mt-2 block"><AreaStatus evidenceCount={evidenceCount} /></span>
        </span>
        {expanded ? <ChevronUp className="h-5 w-5 shrink-0 opacity-60" /> : <ChevronDown className="h-5 w-5 shrink-0 opacity-60" />}
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-border bg-background/50 p-4">
          <div>
            <h4 className="mb-2 font-semibold">Натальная основа — постоянные показатели карты</h4>
            <p className="mb-2 text-sm opacity-75">В этом направлении учитываются дома: {area.houses.join(', ')}.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {houses.map((house) => {
                const lordPosition = natalChart.planets[house.lord as keyof NatalChart['planets']];
                return (
                  <div key={house.house} className="rounded-xl bg-secondary/60 p-3 text-sm">
                    <strong>{house.house}-й дом</strong> · {house.signName}
                    <p className="mt-1">Управитель: {getPlanetName(house.lord)}</p>
                    {lordPosition && <p className="mt-1 opacity-70">Натальное положение: {lordPosition.signName}, {lordPosition.degree.toFixed(2)}°, {lordPosition.nakshatraName} · пада {lordPosition.pada}; {natalChart.houses?.find((item) => item.sign === lordPosition.sign)?.house ?? 'дом не определён'}-й дом</p>}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs opacity-60">Управители задействованных домов: {lords.map(getPlanetName).join(', ') || 'данные недоступны'}. Это описание натальной карты, оно не меняется ежедневно.</p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Что активировано выбранными транзитами</h4>
            {evidenceCount > 0 ? (
              <div className="space-y-2 text-sm">
                {evidence.positions.map((position) => {
                  const nakshatraIndex = getNakshatra(position.longitude);
                  return (
                    <div key={position.planet} className="rounded-xl bg-secondary/60 p-3">
                      <strong>{position.planetName}</strong>: {position.sign}, {position.degree.toFixed(2)}° · транзит проходит по натальному {position.natalHouse}-му дому
                      <p className="mt-1 text-xs opacity-70">Накшатра {NAKSHATRAS[nakshatraIndex]?.name ?? 'не определена'}, пада {getNakshatraPada(position.longitude)}.</p>
                    </div>
                  );
                })}
                {evidence.aspects.map((aspect, index) => (
                  <div key={`${aspect.transitPlanet}-${aspect.natalPlanet}-${index}`} className="rounded-xl bg-secondary/60 p-3">
                    {aspect.evidence}
                    <p className="mt-1 text-xs opacity-65">Орбис {aspect.orb.toFixed(2)}° · сила по модели {aspect.strength.toFixed(0)}/100</p>
                  </div>
                ))}
                {evidence.lordHits.map((hit, index) => (
                  <div key={`${hit.house}-${hit.transitPlanet}-${index}`} className="rounded-xl bg-secondary/60 p-3">{hit.detail}</div>
                ))}
                {evidence.dasha.map((item, index) => (
                  <div key={index} className="rounded-xl bg-secondary/60 p-3">{item}</div>
                ))}
                {transitPlanets.length === 0 && evidence.aspects.length === 0 && evidence.lordHits.length === 0 && (
                  <p className="text-sm opacity-70">По этой сфере нет отдельных транзитных подтверждений. Отсутствие активации не означает отсутствие событий.</p>
                )}
              </div>
            ) : (
              <p className="text-sm opacity-70">На выбранную дату анализатор не обнаружил факторов по заданным критериям. Это не оценка сферы как плохой и не запрет на действия.</p>
            )}
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Как это можно понимать в повседневной жизни</h4>
            <p className="text-sm leading-relaxed opacity-80">{area.dailyFocus}</p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">Практические ориентиры</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {area.recommendations.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <p className="rounded-xl border border-border p-3 text-xs leading-relaxed opacity-75"><strong>Ограничения:</strong> {area.caution}</p>
        </div>
      )}
    </section>
  );
}

function AreaCard({ area }: { area: LifeAreaDefinition }) {
  return (
    <article className="rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{area.icon}</span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold">{area.title}</h4>
          <p className="mt-1 text-sm leading-relaxed opacity-70">{area.description}</p>
          <p className="mt-3 text-sm leading-relaxed">{area.dailyFocus}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-80">
            {area.recommendations.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </article>
  );
}

function PlanetaryInfluences({ report }: { report: TransitAnalysisReport }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <GlassCard>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span>
          <h3 className="font-semibold">Планетарные влияния дня</h3>
          <span className="text-sm opacity-65">Положения, дома, накшатры и аспекты к натальным планетам</span>
        </span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-3">
          {report.positions.map((position) => {
            const nakshatraIndex = getNakshatra(position.longitude);
            const natalPosition = report.aspects.filter((aspect) => aspect.transitPlanet === position.planet);
            return (
              <div key={position.planet} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{position.planetName}</strong>
                  <span className="text-sm opacity-70">{position.sign}, {position.degree.toFixed(2)}°</span>
                </div>
                <p className="mt-1 text-sm">Проходит по натальному {position.natalHouse}-му дому · {NAKSHATRAS[nakshatraIndex]?.name ?? 'накшатра не определена'}, пада {getNakshatraPada(position.longitude)}</p>
                <p className="mt-1 text-xs opacity-65">Ретроградность: {position.retrograde === null ? 'не рассчитывается в текущей версии' : position.retrograde ? 'ретроградная' : 'прямое движение'}</p>
                {natalPosition.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm">{natalPosition.map((aspect, index) => <li key={index}>{aspect.evidence}</li>)}</ul>}
              </div>
            );
          })}
          <div className="rounded-xl bg-secondary/50 p-3 text-sm">
            <strong>Активные периоды Вимшоттари-Даша</strong>
            <p className="mt-1">Махадаша: {report.dasha.mahadasha}; антардаша: {report.dasha.antardasha ?? 'не определена'}; пратьянтардаша: {report.dasha.pratyantardasha ?? 'не определена'}.</p>
            <p className="mt-1 text-xs opacity-65">Окончание махадаши: {report.dasha.mahadashaEnd.toLocaleDateString('ru-RU')}.</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Methodology({ report }: { report: TransitAnalysisReport }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <GlassCard>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span>
          <h3 className="font-semibold">Почему приложение сделало такой вывод</h3>
          <span className="text-sm opacity-65">Методика, расчётные основания и ограничения</span>
        </span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-3">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {report.methodology.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="rounded-xl border border-border p-3">
            <h4 className="mb-2 font-semibold text-sm">Ограничения текущего расчёта</h4>
            <ul className="list-disc space-y-1 pl-5 text-xs opacity-75">{report.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function DayOverview({ natalChart, panchang }: DayOverviewProps) {
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [showAllAspects, setShowAllAspects] = useState(false);
  const calculation = useMemo(() => {
    try {
      const moment = new Date(`${selectedDate}T12:00:00`);
      if (!Number.isFinite(moment.getTime())) throw new Error('Выберите корректную дату.');
      if (moment < natalChart.date) throw new Error('Выбранная дата не может быть раньше даты рождения.');
      return { report: analyzeTransits(natalChart, moment), error: null as string | null };
    } catch (error) {
      return { report: null, error: error instanceof Error ? error.message : 'Не удалось рассчитать транзиты.' };
    }
  }, [selectedDate, natalChart]);

  const report = calculation.report;
  const rankedAreas = report
    ? LIFE_AREAS.map((area) => ({ area, evidence: getAreaEvidence(area, report) }))
        .sort((a, b) => (b.evidence.positions.length + b.evidence.aspects.length + b.evidence.lordHits.length + b.evidence.dasha.length) - (a.evidence.positions.length + a.evidence.aspects.length + a.evidence.lordHits.length + a.evidence.dasha.length))
    : [];
  const mainArea = rankedAreas[0];
  const activeCount = rankedAreas.filter(({ evidence }) => evidence.positions.length + evidence.aspects.length + evidence.lordHits.length + evidence.dasha.length > 0).length;

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/15 p-3"><Sparkles className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Персональный прогноз</p>
              <h2 className="mt-1 text-2xl font-semibold">Обзор дня</h2>
              <p className="mt-1 text-sm opacity-70">{formatLongDate(selectedDate)}</p>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
            <CalendarDays className="h-4 w-4 opacity-60" />
            <span className="sr-only">Дата прогноза</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-w-0 bg-transparent outline-none" />
          </label>
        </div>
        <p className="mt-4 text-sm leading-relaxed opacity-75">Коротко о том, на что можно обратить внимание сегодня, и несколько простых идей на день. Выбирайте только то, что подходит вашей ситуации.</p>
      </GlassCard>

      {calculation.error && (
        <GlassCard><p className="text-sm">{calculation.error}</p></GlassCard>
      )}

      {report && (
        <>
          <GlassCard>
            <h3 className="font-semibold">На что обратить внимание сегодня</h3>
            {mainArea && activeCount > 0 ? (
              <>
                <p className="mt-2 text-lg font-medium">{mainArea.area.icon} {mainArea.area.title}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-80">Сегодня можно уделить этой теме немного больше внимания. Это лишь подсказка для размышления, а не предсказание обязательного события.</p>
                <p className="mt-3 text-sm">{mainArea.area.dailyFocus}</p>
              </>
            ) : (
              <p className="mt-2 text-sm opacity-75">Нет одной темы, которой обязательно нужно уделить особое внимание. Выберите то, что сейчас важнее именно вам.</p>
            )}
          </GlassCard>

          <GlassCard>
            <div className="mb-4">
              <h3 className="font-semibold">Сферы жизни</h3>
              <p className="mt-1 text-sm opacity-65">Небольшие подсказки для повседневных дел, общения, отдыха и планов.</p>
            </div>
            <div className="space-y-3">
              {LIFE_AREAS.map((area) => <AreaCard key={area.id} area={area} />)}
            </div>
          </GlassCard>

          <details className="group rounded-2xl border border-border bg-card/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold">
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 opacity-65" />Астрологический разбор и расчёты</span>
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-4 border-t border-border p-4">
              <p className="text-sm leading-relaxed opacity-70">Этот раздел можно не открывать. Здесь собраны технические подробности для тех, кому интересно, как получены подсказки.</p>
          <GlassCard>
            <h3 className="font-semibold">Подробный разбор каждой сферы</h3>
            <p className="mt-1 text-sm opacity-65">Натальные дома, управители и найденные транзитные связи.</p>
            <div className="mt-3 space-y-3">
              {LIFE_AREAS.map((area) => <TechnicalAreaCard key={area.id} area={area} natalChart={natalChart} report={report} />)}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">Что сегодня особенно активировано в твоей карте</h3>
            <p className="mt-1 text-sm opacity-65">Ниже показаны фактические положения транзитных планет в натальных домах и найденные связи с управителями.</p>
            <div className="mt-3 space-y-2">
              {report.lifeAreas.length > 0 ? report.lifeAreas.map((area) => (
                <div key={area.id} className="rounded-xl bg-secondary/50 p-3">
                  <strong>{area.label}</strong>
                  <p className="mt-1 text-sm opacity-75">{area.explanation}</p>
                  <p className="mt-1 text-xs opacity-60">Дома: {area.houses.join(', ')} · транзитных оснований: {area.transitEvidence.length} · связей Даши: {area.dashaEvidence.length}</p>
                </div>
              )) : <p className="text-sm opacity-70">Нет отдельных совпадений по текущим критериям анализа.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">Поддерживающие факторы и зоны внимания</h3>
            <p className="mt-1 text-sm opacity-65">Здесь разделены типы точных аспектов. Это описание геометрии аспектов в выбранной астрологической модели, а не оценка вероятности события.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-3">
                <strong>Гармоничные типы аспектов</strong>
                <p className="mt-1 text-xs opacity-65">Трины и секстили — традиционно трактуемые как более плавные связи.</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {report.aspects.filter((aspect) => ['трин', 'секстиль'].includes(aspect.aspect)).map((aspect, index) => <li key={index}>{aspect.evidence} <span className="text-xs opacity-60">(орбис {aspect.orb.toFixed(2)}°)</span></li>)}
                </ul>
                {report.aspects.every((aspect) => !['трин', 'секстиль'].includes(aspect.aspect)) && <p className="mt-2 text-sm opacity-65">Такие аспекты не обнаружены.</p>}
              </div>
              <div className="rounded-xl border border-border p-3">
                <strong>Аспекты, требующие отдельного осмысления</strong>
                <p className="mt-1 text-xs opacity-65">Квадратуры и оппозиции традиционно трактуются как более напряжённые связи; соединение рассматривается отдельно, поскольку его смысл зависит от участвующих планет.</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {report.aspects.filter((aspect) => ['квадратура', 'оппозиция', 'соединение'].includes(aspect.aspect)).map((aspect, index) => <li key={index}>{aspect.evidence} <span className="text-xs opacity-60">(орбис {aspect.orb.toFixed(2)}°)</span></li>)}
                </ul>
                {report.aspects.every((aspect) => !['квадратура', 'оппозиция', 'соединение'].includes(aspect.aspect)) && <p className="mt-2 text-sm opacity-65">Такие аспекты не обнаружены.</p>}
              </div>
            </div>
            <p className="mt-3 text-xs opacity-60">Для индивидуальной трактовки нужно учитывать натальную функцию планет, управляемые дома, достоинства и контекст карты. Сам по себе тип аспекта не делает день хорошим или плохим.</p>
          </GlassCard>

          <PlanetaryInfluences report={report} />

          <GlassCard>
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowAllAspects(!showAllAspects)} aria-expanded={showAllAspects}>
              <span><h3 className="font-semibold">Все точные аспекты к натальным планетам</h3><span className="text-sm opacity-65">{report.aspects.length} найдено на выбранную дату</span></span>
              {showAllAspects ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {showAllAspects && <div className="mt-3 space-y-2">{report.aspects.length ? report.aspects.map((aspect, index) => <div key={index} className="rounded-xl bg-secondary/50 p-3 text-sm">{aspect.evidence}<p className="mt-1 text-xs opacity-65">Транзитный дом: {aspect.transitHouse} · натальный дом: {aspect.natalHouse ?? 'не определён'} · орбис: {aspect.orb.toFixed(2)}° · {aspect.applying === null ? 'сближение не определено' : aspect.applying ? 'сходящийся аспект' : 'расходящийся аспект'}</p></div>) : <p className="text-sm opacity-70">Точные аспекты не найдены.</p>}</div>}
          </GlassCard>


              <Methodology report={report} />

            </div>
          </details>


        </>
      )}
    </div>
  );
}
