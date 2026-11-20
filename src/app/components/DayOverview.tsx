import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import type { NatalChart } from '../utils/astrology';
import { getNakshatra, getNakshatraPada, NAKSHATRAS } from '../utils/astrology';
import type { Aspect } from '../utils/astrology';
import type { PanchangData } from '../utils/panchang';
import { analyzeTransits, type TransitAnalysisReport, type TransitHousePosition } from '../utils/transitAnalysis';
import {
  buildDayLifeAreaAnalyses,
  countAreaEvidence,
  type DayLifeAreaAnalysis,
} from '../utils/dayOverviewAnalysis';
import { GlassCard } from './common/GlassCard';

interface DayOverviewProps {
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  panchang: PanchangData;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function planetHouse(chart: NatalChart, planet: string): number | null {
  const position = chart.planets[planet as keyof NatalChart['planets']];
  if (!position || !chart.houses) return null;
  return chart.houses.find((house) => house.sign === position.sign)?.house ?? null;
}

function getPlanetHouseMeaning(house: number): string {
  const meanings: Record<number, string> = {
    1: 'личность и самостоятельность', 2: 'личные деньги и семейные ценности',
    3: 'общение и практические навыки', 4: 'дом и внутренняя опора',
    5: 'творчество и дети', 6: 'работа и повседневные задачи',
    7: 'отношения и партнёрство', 8: 'общие ресурсы и перемены',
    9: 'обучение и мировоззрение', 10: 'профессия и карьера',
    11: 'доходы и окружение', 12: 'отдых и уединение',
  };
  return meanings[house] ?? 'тема дома';
}

function MainTheme({ area }: { area: DayLifeAreaAnalysis | null }) {
  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/15 p-3"><Sparkles className="h-6 w-6 text-primary" /></div>
        <div className="min-w-0">
          <h3 className="font-semibold">Главная тема дня</h3>
          {area ? (
            <>
              <p className="mt-2 text-lg font-semibold">{area.definition.icon} {area.definition.title}</p>
              <p className="mt-2 text-sm leading-relaxed">{area.narrative}</p>
              <p className="mt-2 text-sm opacity-75">{area.definition.practicalFocus}</p>
              <p className="mt-2 text-xs opacity-60">Выделено по конкретным транзитным положениям и связям с натальными домами. Это символический астрологический акцент, а не обещание события.</p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed opacity-75">
              На выбранную дату расчёт не выделяет одну жизненную сферу по применяемым критериям транзитной активации. Это не означает, что день пустой или что важные события невозможны: ориентируйтесь на реальные обстоятельства и собственные приоритеты.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function EvidenceDetails({ area }: { area: DayLifeAreaAnalysis }) {
  const hasEvidence = area.evidenceCount > 0;
  return (
    <div className="space-y-3">
      <div>
        <h5 className="font-semibold text-sm">Что активировано на выбранную дату</h5>
        {hasEvidence ? (
          <div className="mt-2 space-y-2">
            {area.transitPositions.map((position) => (
              <div key={position.planet} className="rounded-xl bg-secondary/60 p-3 text-sm">
                <strong>{position.planetName}</strong>: {position.sign}, {position.degree.toFixed(2)}° — транзит проходит по натальному {position.natalHouse}-му дому.
              </div>
            ))}
            {area.aspects.map((aspect, index) => (
              <div key={`${aspect.transitPlanet}-${aspect.natalPlanet}-${index}`} className="rounded-xl bg-secondary/60 p-3 text-sm">
                {aspect.evidence}
                <p className="mt-1 text-xs opacity-65">Орбис {aspect.orb.toFixed(2)}° · расчётная сила {aspect.strength.toFixed(0)}/100 · {aspect.applying === null ? 'фаза аспекта не определена' : aspect.applying ? 'сходящийся аспект' : 'расходящийся аспект'}</p>
              </div>
            ))}
            {area.lordHits.map((hit, index) => (
              <div key={`${hit.house}-${hit.transitPlanet}-${index}`} className="rounded-xl bg-secondary/60 p-3 text-sm">
                <p>{hit.detail}</p>
                <p className="mt-1 text-xs opacity-65">Связанный натальный дом: {hit.house}-й · управитель: {hit.lordName} · его натальное положение: {hit.natalLordHouse ?? 'не определено'}-й дом.</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm opacity-70">По выбранным критериям прямые транзитные положения, точные аспекты и связи с управителями этой сферы не обнаружены. Натальная основа сферы при этом остаётся частью карты.</p>
        )}
      </div>
      <p className="text-xs opacity-60">{area.activationSummary}</p>
    </div>
  );
}

function LifeAreaCard({ area, open = false }: { area: DayLifeAreaAnalysis; open?: boolean }) {
  const { definition } = area;
  return (
    <details open={open} className="group rounded-2xl border border-border bg-card/40">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
        <span className="text-2xl" aria-hidden="true">{definition.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{definition.title}</span>
          <span className="mt-1 block text-sm opacity-70">{definition.description}</span>
          <span className="mt-2 block text-xs opacity-60">Натальная основа: {definition.houses.map((house) => `${house}-й`).join(', ')} дома · транзитных оснований: {area.evidenceCount}</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 opacity-60 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border p-4">
        <section>
          <h4 className="font-semibold">Что анализируем</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-80">
            {definition.houseMeanings.map((meaning) => <li key={meaning}>{meaning}</li>)}
          </ul>
        </section>
        <section>
          <h4 className="font-semibold">Натальная основа — постоянные особенности карты</h4>
          <p className="mt-1 text-sm leading-relaxed opacity-80">{area.natalSummary}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {area.natalBasis.map((item) => (
              <div key={item.house} className="rounded-xl bg-secondary/50 p-3 text-sm">
                <strong>{item.house}-й дом</strong> · {item.sign}
                <p className="mt-1">Управитель: {item.lordName}</p>
                <p className="mt-1 text-xs opacity-65">Натальное положение управителя: {item.lordSign}, {item.lordDegree.toFixed(2)}°{item.lordHouse ? `, ${item.lordHouse}-й дом` : ''}.</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h4 className="font-semibold">Что транзиты активируют сегодня</h4>
          <p className="mt-1 text-sm leading-relaxed opacity-80">{area.narrative}</p>
          <div className="mt-3"><EvidenceDetails area={area} /></div>
        </section>
        <section>
          <h4 className="font-semibold">Практические ориентиры</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-80">
            {definition.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        {definition.limitation && (
          <p className="rounded-xl border border-border p-3 text-xs leading-relaxed opacity-75"><strong>Важно:</strong> {definition.limitation}</p>
        )}
      </div>
    </details>
  );
}

function ActivatedAreas({ areas }: { areas: DayLifeAreaAnalysis[] }) {
  const active = areas.filter((area) => countAreaEvidence(area) > 0);
  return (
    <GlassCard>
      <h3 className="font-semibold">Что сегодня особенно активировано в твоей карте</h3>
      <p className="mt-1 text-sm opacity-65">Здесь показаны не общие характеристики знаков, а конкретные транзитные положения, аспекты и связи с управителями натальных домов.</p>
      {active.length ? (
        <div className="mt-4 space-y-3">
          {active.map((area) => (
            <div key={area.definition.id} className="rounded-xl border border-border p-3">
              <h4 className="font-semibold">{area.definition.icon} {area.definition.title}</h4>
              <p className="mt-2 text-sm leading-relaxed opacity-80">{area.narrative}</p>
              <p className="mt-2 text-xs opacity-60">{area.activationSummary}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm opacity-70">На выбранную дату нет отдельных активаций по критериям этого анализа. Это не оценка дня как благоприятного или неблагоприятного.</p>
      )}
    </GlassCard>
  );
}

function PlanetaryInfluences({ natalChart, report }: { natalChart: NatalChart; report: TransitAnalysisReport }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <GlassCard>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        <span>
          <h3 className="font-semibold">Планетарные влияния дня</h3>
          <span className="text-sm opacity-65">Транзитное положение каждой планеты и её связь именно с вашей натальной картой</span>
        </span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-3">
          {report.positions.map((position: TransitHousePosition) => {
            const natalPosition = natalChart.planets[position.planet as keyof NatalChart['planets']];
            const natalHouse = planetHouse(natalChart, position.planet);
            const ruledHouses = (natalChart.houses ?? []).filter((house) => house.lord === position.planet).map((house) => house.house);
            const nakshatraIndex = getNakshatra(position.longitude);
            const aspects = report.aspects.filter((aspect) => aspect.transitPlanet === position.planet);
            return (
              <details key={position.planet} className="rounded-xl border border-border p-3">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-semibold">
                  <span>{position.planetName}</span>
                  <span className="text-sm font-normal opacity-70">{position.sign}, {position.degree.toFixed(2)}° · натальный {position.natalHouse}-й дом</span>
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <p><strong>Накшатра и пада:</strong> {NAKSHATRAS[nakshatraIndex]?.name ?? 'не определена'}, пада {getNakshatraPada(position.longitude)}.</p>
                  <p><strong>Натальная функция:</strong> {ruledHouses.length ? `управляет ${ruledHouses.map((house) => `${house}-м домом (${getPlanetHouseMeaning(house)})`).join(', ')}.` : 'управляемые дома в натальной карте не определены.'}</p>
                  {natalPosition && (
                    <p><strong>Натальное положение:</strong> {natalPosition.signName}, {natalPosition.degree.toFixed(2)}°{natalHouse ? `, ${natalHouse}-й дом` : ''}.</p>
                  )}
                  <p><strong>Как читать транзит:</strong> {ruledHouses.length
                    ? `транзит ${position.planetName} рассматривается не отдельно от вашей карты, а также через темы ${ruledHouses.map((house) => `${house}-го дома`).join(', ')} и его натальное положение.`
                    : `для этой планеты в карте не выделены управляемые дома; её транзит рассматривается через натальный дом прохождения и аспекты.`}</p>
                  <p><strong>Движение:</strong> {position.retrograde === null ? 'ретроградность в текущем отчёте не рассчитывается.' : position.retrograde ? 'ретроградное.' : 'прямое.'}</p>
                  {aspects.length ? (
                    <div><strong>Аспекты к натальным планетам:</strong><ul className="mt-1 list-disc space-y-1 pl-5">{aspects.map((aspect, index) => <li key={index}>{aspect.evidence} Орбис {aspect.orb.toFixed(2)}°.</li>)}</ul></div>
                  ) : <p className="opacity-70">Точные градусные аспекты к натальным планетам на выбранный момент не обнаружены.</p>}
                </div>
              </details>
            );
          })}
          <div className="rounded-xl bg-secondary/50 p-3 text-sm">
            <h4 className="font-semibold">Активные периоды Вимшоттари-Даша</h4>
            <p className="mt-1">Махадаша: {report.dasha.mahadasha}; антардаша: {report.dasha.antardasha ?? 'не определена'}; пратьянтардаша: {report.dasha.pratyantardasha ?? 'не определена'}.</p>
            <p className="mt-1 text-xs opacity-65">Окончание махадаши: {report.dasha.mahadashaEnd.toLocaleDateString('ru-RU')}.</p>
            {report.dasha.activeThemes.length > 0 && <p className="mt-1 text-xs opacity-65">Темы активных периодов по модели: {report.dasha.activeThemes.join(', ')}.</p>}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Recommendations({ areas, mainArea }: { areas: DayLifeAreaAnalysis[]; mainArea: DayLifeAreaAnalysis | null }) {
  const recommendations = areas
    .filter((area) => area.evidenceCount > 0)
    .sort((a, b) => b.evidenceCount - a.evidenceCount)
    .slice(0, 4);
  return (
    <GlassCard>
      <h3 className="font-semibold">Рекомендации на сегодня</h3>
      {mainArea && (
        <div className="mt-3 rounded-xl bg-secondary/50 p-3">
          <h4 className="font-semibold">Твой ориентир на день</h4>
          <p className="mt-1 text-sm leading-relaxed">{mainArea.definition.practicalFocus}</p>
        </div>
      )}
      {recommendations.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {recommendations.map((area) => (
            <div key={area.definition.id} className="rounded-xl border border-border p-3">
              <h4 className="font-semibold text-sm">{area.definition.icon} {area.definition.title}</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-80">
                {area.definition.recommendations.slice(0, 2).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm opacity-75">Выберите одну важную для себя задачу, соотнесите планы с реальными обстоятельствами и оставьте время на отдых. Отсутствие выделенных транзитных факторов не требует откладывать дела.</p>
      )}
      <p className="mt-4 text-sm font-semibold">Главный совет дня</p>
      <p className="mt-1 text-sm opacity-80">Не распыляйтесь на множество направлений. Выберите одну важную задачу и доведите её до результата.</p>
    </GlassCard>
  );
}

function Methodology({ report }: { report: TransitAnalysisReport }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <GlassCard>
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        <span>
          <h3 className="font-semibold">Точность астрологических расчётов</h3>
          <span className="text-sm opacity-65">Методика, конкретные основания и ограничения интерпретации</span>
        </span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Что рассчитывает приложение</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-80">
              {report.methodology.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-border p-3">
            <h4 className="font-semibold text-sm">Ограничения текущей версии</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed opacity-75">
              {report.warnings.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <p className="text-xs leading-relaxed opacity-60">Натальная основа показывает постоянные темы карты. Транзиты и периоды Даши описывают выбранный момент времени. Они не заменяют проверку фактов, профессиональную консультацию или медицинские рекомендации.</p>
        </div>
      )}
    </GlassCard>
  );
}

export function DayOverview({ natalChart }: DayOverviewProps) {
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const calculation = useMemo(() => {
    try {
      const moment = new Date(`${selectedDate}T12:00:00`);
      if (!Number.isFinite(moment.getTime())) throw new Error('Выберите корректную дату.');
      if (moment < natalChart.date) throw new Error('Выбранная дата не может быть раньше даты рождения.');
      const report = analyzeTransits(natalChart, moment);
      const areas = buildDayLifeAreaAnalyses(natalChart, report);
      return { report, areas, error: null as string | null };
    } catch (error) {
      return {
        report: null,
        areas: [] as DayLifeAreaAnalysis[],
        error: error instanceof Error ? error.message : 'Не удалось рассчитать персональный прогноз.',
      };
    }
  }, [selectedDate, natalChart]);

  const mainArea = calculation.areas
    .filter((area) => area.evidenceCount > 0)
    .sort((a, b) => b.evidenceCount - a.evidenceCount)[0] ?? null;

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Персональный прогноз по системе Джйотиш</p>
            <h2 className="mt-1 text-2xl font-semibold">Твой день</h2>
            <p className="mt-1 text-sm opacity-70">{formatLongDate(selectedDate)}</p>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
            <CalendarDays className="h-4 w-4 opacity-60" />
            <span className="sr-only">Дата прогноза</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-w-0 bg-transparent outline-none" />
          </label>
        </div>
      </GlassCard>

      {calculation.error && <GlassCard><p role="alert" className="text-sm">{calculation.error}</p></GlassCard>}

      {calculation.report && (
        <>
          <MainTheme area={mainArea} />

          <GlassCard>
            <h3 className="font-semibold">Сферы жизни</h3>
            <p className="mt-1 text-sm opacity-65">Краткая оценка показывает, какие направления получили транзитную активацию. Подробное объяснение раскрывается в каждой карточке ниже; цветные оценки «хорошо/плохо» не используются.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {calculation.areas.map((area) => (
                <div key={area.definition.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{area.definition.icon} {area.definition.title}</strong>
                    <span className="shrink-0 text-xs opacity-60">{area.evidenceCount ? `${area.evidenceCount} осн.` : 'не выделено'}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-65">{area.activationSummary}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">Главные жизненные направления</h3>
            <p className="mt-1 text-sm opacity-65">Для каждой сферы приложение соединяет постоянную натальную основу с транзитами выбранной даты. Управители и натальные положения не меняются каждый день — меняются транзитные активации.</p>
            <div className="mt-4 space-y-3">
              {calculation.areas.map((area) => (
                <LifeAreaCard key={area.definition.id} area={area} open={area.definition.id === mainArea?.definition.id} />
              ))}
            </div>
          </GlassCard>

          <ActivatedAreas areas={calculation.areas} />
          <PlanetaryInfluences natalChart={natalChart} report={calculation.report} />
          <Recommendations areas={calculation.areas} mainArea={mainArea} />
          <Methodology report={calculation.report} />
          <div className="flex items-start gap-2 rounded-xl border border-border p-3 text-xs leading-relaxed opacity-70">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Астрологическая интерпретация носит символический характер. Она не предсказывает обязательные события и не заменяет медицинские, финансовые, юридические или иные профессиональные решения.</p>
          </div>
        </>
      )}
    </div>
  );
}
