import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import type { NatalChart } from '../utils/astrology';
import { getNakshatra, getNakshatraPada, NAKSHATRAS } from '../utils/astrology';
import type { Aspect } from '../utils/astrology';
import type { PanchangData } from '../utils/panchang';
import { analyzeTransits, type TransitAnalysisReport, type TransitHousePosition } from '../utils/transitAnalysis';
import {
  buildDayLifeAreaAnalyses,
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
          <h3 className="font-semibold">На чём сегодня сосредоточено больше всего астрологических связей</h3>
          {area ? (
            <>
              <p className="mt-2 text-lg font-semibold">{area.definition.icon} {area.definition.title}</p>
              <p className="mt-2 text-sm leading-relaxed">{area.simpleSummary}</p>
              <p className="mt-3 text-sm opacity-80">{area.definition.practicalFocus}</p>
              <p className="mt-3 text-xs opacity-65">Тема выбрана по наибольшему количеству учтённых расчётных связей: {area.evidenceCount}. Это не оценка здоровья, энергии, успешности или благоприятности дня и не прогноз обязательного события.</p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed opacity-75">
              На выбранную дату модель не выделяет одну сферу по применяемым критериям. Это не означает, что день пустой или что важные события невозможны: ориентируйтесь на реальные обстоятельства и собственные приоритеты.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function getAreaEvidenceKeys(area: DayLifeAreaAnalysis): string[] {
  return [
    ...area.transitPositions.map((item) => `position:${item.planet}`),
    ...area.aspects.map((item) => `aspect:${item.transitPlanet}:${item.natalPlanet}:${item.aspect}`),
    ...area.lordHits
      .filter((item) => item.relation !== 'exact-aspect')
      .map((item) => `lord:${item.house}:${item.transitPlanet}:${item.relation}`),
  ];
}

function countSharedEvidence(area: DayLifeAreaAnalysis, areas: DayLifeAreaAnalysis[]): number {
  const ownKeys = new Set(getAreaEvidenceKeys(area));
  return [...ownKeys].filter((key) =>
    areas.filter((candidate) => getAreaEvidenceKeys(candidate).includes(key)).length > 1,
  ).length;
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

function LifeAreaCard({
  area,
  open = false,
  sharedEvidenceCount,
}: {
  area: DayLifeAreaAnalysis;
  open?: boolean;
  sharedEvidenceCount: number;
}) {
  const { definition } = area;
  return (
    <details open={open} className="group rounded-2xl border border-border bg-card/40">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
        <span className="text-2xl" aria-hidden="true">{definition.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{definition.title}</span>
          <span className="mt-1 block text-sm opacity-70">{definition.description}</span>
          <span className="mt-2 block text-xs opacity-70">{area.evidenceCount} учтённых связей</span>
          {sharedEvidenceCount > 0 && (
            <span className="mt-1 block text-xs opacity-60">{sharedEvidenceCount} из них также учитываются в других сферах</span>
          )}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 opacity-60 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border p-4">
        <section>
          <h4 className="font-semibold">Простое объяснение</h4>
          <p className="mt-1 text-sm leading-relaxed opacity-80">{area.simpleSummary}</p>
        </section>
        <section>
          <h4 className="font-semibold">Что это означает в обычной жизни</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-80">
            {definition.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section>
          <h4 className="font-semibold">Почему приложение выделило эту тему?</h4>
          <p className="mt-1 text-sm leading-relaxed opacity-80">
            В расчёте участвуют {definition.houses.map((house) => `${house}-й`).join(', ')} дома натальной карты и связанные с ними транзитные положения, аспекты и управители.
          </p>
          <p className="mt-2 text-xs opacity-65">{area.activationSummary}</p>
          <details className="mt-3 rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">Какие дома участвуют</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed opacity-80">
              {definition.houseMeanings.map((meaning) => <li key={meaning}>{meaning}</li>)}
            </ul>
            <p className="mt-2 text-sm opacity-75">{area.natalSummary}</p>
          </details>
          <details className="mt-2 rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">Какие планеты и аспекты учтены</summary>
            <div className="mt-3"><EvidenceDetails area={area} /></div>
          </details>
          <details className="mt-2 rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">Технические расчёты</summary>
            <div className="mt-2 space-y-2 text-xs leading-relaxed opacity-70">
              {area.natalBasis.map((item) => (
                <p key={item.house}>
                  {item.house}-й дом в знаке {item.sign}; управитель — {item.lordName}, его натальное положение — {item.lordSign}, {item.lordDegree.toFixed(2)}°{item.lordHouse ? `, ${item.lordHouse}-й дом` : ''}.
                </p>
              ))}
              <p>{area.narrative}</p>
            </div>
          </details>
        </section>
        {definition.limitation && (
          <p className="rounded-xl border border-border p-3 text-xs leading-relaxed opacity-75"><strong>Важно:</strong> {definition.limitation}</p>
        )}
      </div>
    </details>
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

function Recommendations({ mainArea }: { mainArea: DayLifeAreaAnalysis | null }) {
  return (
    <GlassCard>
      <h3 className="font-semibold">Твой ориентир на день</h3>
      {mainArea ? (
        <>
          <p className="mt-2 text-sm leading-relaxed opacity-80">{mainArea.definition.practicalFocus}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {mainArea.definition.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-4 rounded-xl bg-secondary/50 p-3 text-sm">
            <strong>Главный совет:</strong> {mainArea.definition.recommendations[0]}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed opacity-75">
          Выберите одну важную для себя задачу, соотнесите планы с реальными обстоятельствами и оставьте время на отдых. Отсутствие выделенных транзитных факторов не требует откладывать дела.
        </p>
      )}
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
          <details className="rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold">Краткий словарь астрологических терминов</summary>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="font-medium">Натальная карта</dt><dd className="opacity-75">Карта неба на момент рождения.</dd></div>
              <div><dt className="font-medium">Транзит</dt><dd className="opacity-75">Текущее положение планеты относительно натальной карты.</dd></div>
              <div><dt className="font-medium">Натальный дом</dt><dd className="opacity-75">Одна из двенадцати областей натальной карты.</dd></div>
              <div><dt className="font-medium">Управитель дома</dt><dd className="opacity-75">Планета, связанная со знаком на куспиде/начале дома в используемой системе.</dd></div>
              <div><dt className="font-medium">Аспект</dt><dd className="opacity-75">Угловое соотношение между двумя планетами.</dd></div>
              <div><dt className="font-medium">Соединение</dt><dd className="opacity-75">Аспект, при котором планеты находятся близко по долготе.</dd></div>
              <div><dt className="font-medium">Квадратура</dt><dd className="opacity-75">Аспект с углом около 90°.</dd></div>
              <div><dt className="font-medium">Трин</dt><dd className="opacity-75">Аспект с углом около 120°.</dd></div>
              <div><dt className="font-medium">Орбис</dt><dd className="opacity-75">Отклонение фактического угла от точного угла аспекта.</dd></div>
            </dl>
          </details>
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
  const orderedAreas = mainArea
    ? [mainArea, ...calculation.areas.filter((area) => area.definition.id !== mainArea.definition.id)]
    : calculation.areas;

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Персональный прогноз</p>
            <h2 className="mt-1 text-2xl font-semibold">Прогноз на выбранный день</h2>
            <p className="mt-1 text-sm opacity-70">{formatLongDate(selectedDate)}</p>
            <p className="mt-1 text-xs opacity-65">Момент расчёта: 12:00, местное время браузера ({Intl.DateTimeFormat().resolvedOptions().timeZone || 'часовой пояс браузера'}). Быстрые факторы, особенно Луна, могут меняться в течение дня.</p>
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
            <h3 className="font-semibold">Все сферы жизни</h3>
            <p className="mt-1 text-sm opacity-65">Главная тема показана первой, остальные сферы сохранены в исходном порядке. Числа обозначают количество учтённых расчётных связей, а не проценты, рейтинг или оценку «хорошо/плохо».</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {orderedAreas.map((area) => (
                <div key={area.definition.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{area.definition.icon} {area.definition.title}</strong>
                    <span className="shrink-0 text-xs opacity-65">{area.evidenceCount} связ.</span>
                  </div>
                  <p className="mt-1 text-xs opacity-65">{area.definition.description}</p>
                  {area.definition.id === mainArea?.definition.id && (
                    <p className="mt-2 text-xs font-medium text-primary">Главная тема дня</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed opacity-65">Одна и та же астрологическая связь может учитываться в нескольких сферах, если затрагивает их натальные дома или управителей. Поэтому числа по карточкам не складываются в количество уникальных событий.</p>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">Подробный разбор сфер</h3>
            <p className="mt-1 text-sm opacity-65">Сначала простое объяснение и практические ориентиры, затем натальная основа и технические расчёты.</p>
            <div className="mt-4 space-y-3">
              {orderedAreas.map((area) => (
                <LifeAreaCard
                  key={area.definition.id}
                  area={area}
                  open={area.definition.id === mainArea?.definition.id}
                  sharedEvidenceCount={countSharedEvidence(area, calculation.areas)}
                />
              ))}
            </div>
          </GlassCard>

          <PlanetaryInfluences natalChart={natalChart} report={calculation.report} />
          <Recommendations mainArea={mainArea} />
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
