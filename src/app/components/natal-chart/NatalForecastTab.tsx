import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ShieldAlert, Sparkles } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import { buildUnifiedLifeForecast, type ForecastAreaId, type UnifiedLifeAreaForecast } from '../../utils/unifiedLifeForecast';
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface NatalForecastTabProps { natalChart: NatalChart; }
const PLANET_NAMES_RU: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };
const HOUSE_MEANINGS: Record<number, string> = { 1: 'личность', 2: 'личные деньги', 3: 'общение и навыки', 4: 'дом и семья', 5: 'творчество и дети', 6: 'работа и повседневные дела', 7: 'партнёрство', 8: 'общие ресурсы и перемены', 9: 'обучение и мировоззрение', 10: 'карьера', 11: 'доходы и окружение', 12: 'отдых и уединение' };
const planetRu = (planet: string) => PLANET_NAMES_RU[planet] ?? planet;
const AREA_OPTIONS: Array<{ id: ForecastAreaId; label: string }> = [
  { id: 'career', label: 'Работа и профессиональная реализация' },
  { id: 'finances', label: 'Финансы и источники дохода' },
  { id: 'relationships', label: 'Отношения и партнёрство' },
  { id: 'children', label: 'Дети и родительство' },
  { id: 'learning', label: 'Обучение и интеллектуальное развитие' },
  { id: 'creativity', label: 'Творчество и самореализация' },
  { id: 'home', label: 'Дом, семья и недвижимость' },
  { id: 'personal-growth', label: 'Личное развитие' },
];
const toInputDate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const parseInputDate = (value: string) => new Date(value + 'T12:00:00');

function EvidenceList({ area }: { area: UnifiedLifeAreaForecast }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? area.evidence : area.evidence.slice(0, 4);
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <h5 className="text-sm font-semibold text-gray-800">Показатели карты, на которых основан вывод</h5>
      <span className="text-xs text-gray-500">{area.evidence.length}</span>
    </div>
    {visible.length ? visible.map((item, index) => (
      <details key={item.source + ':' + index} className="rounded-lg border border-gray-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-800">{item.label}<span className="ml-2 text-xs font-normal text-gray-500">· источник: {item.source}</span></summary>
        <p className="mt-2 text-xs leading-relaxed text-gray-600">{item.detail}</p>
      </details>
    )) : <p className="text-sm text-gray-500">Для этой сферы не найдено прямых оснований в выбранных правилах.</p>}
    {area.evidence.length > 4 && <button type="button" onClick={() => setExpanded((value) => !value)} className="text-xs font-semibold text-indigo-700">{expanded ? 'Свернуть доказательства' : 'Показать все доказательства'}</button>}
  </div>;
}
function ForecastAreaCard({ area }: { area: UnifiedLifeAreaForecast }) {
  const [showTiming, setShowTiming] = useState(true);
  return <article className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="font-semibold text-gray-900">{area.title}</h3><p className="mt-1 text-xs text-gray-500">Связанные сферы: {area.houses.map((house) => `${house}-й дом — ${HOUSE_MEANINGS[house] ?? 'отдельная тема'}`).join('; ')}</p></div>
      <span className={`rounded-full px-2 py-1 text-xs ${area.dataStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : area.dataStatus === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{area.dataStatus === 'complete' ? 'Данные полные' : area.dataStatus === 'partial' ? 'Частичные данные' : 'Нет прямых оснований'}</span>
    </div>
    <p className="text-sm leading-relaxed text-gray-700">{area.synthesis}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-emerald-50/70 p-3"><h4 className="text-xs font-semibold text-emerald-800">Поддерживающие факторы</h4>{area.supportingFactors.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{area.supportingFactors.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">Отдельные факторы не выделены.</p>}</div>
      <div className="rounded-xl bg-amber-50/70 p-3"><h4 className="text-xs font-semibold text-amber-800">Факторы напряжения</h4>{area.tensionFactors.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{area.tensionFactors.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">Отдельные факторы не выделены.</p>}</div>
    </div>
    {area.vargaEvidence.length > 0 && <div><h4 className="text-xs font-semibold text-gray-700">Профильные варги <TermTooltip term="varga" /></h4><ul className="mt-1 list-disc space-y-1 pl-4">{area.vargaEvidence.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul></div>}
    <div>
      <button type="button" onClick={() => setShowTiming((value) => !value)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-800"><span>Временные показатели ({area.timingIndicators.length})</span><ChevronDown className={`h-4 w-4 transition-transform ${showTiming ? 'rotate-180' : ''}`}/></button>
      {showTiming && (area.timingIndicators.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{area.timingIndicators.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">В выбранном интервале прямые временные указания не найдены.</p>)}
    </div>
    <EvidenceList area={area}/>
    <div className="rounded-lg bg-gray-50 p-3"><h4 className="text-xs font-semibold text-gray-700">Ограничения</h4>{area.limitations.map((item) => <p key={item} className="mt-1 text-xs text-gray-600">{item}</p>)}</div>
  </article>;
}

export function NatalForecastTab({ natalChart }: NatalForecastTabProps) {
  const today = new Date();
  const [startValue, setStartValue] = useState(toInputDate(today));
  const [endValue, setEndValue] = useState(toInputDate(new Date(today.getTime() + 365 * 86400000)));
  const [selectedArea, setSelectedArea] = useState<ForecastAreaId>('career');
  const [stepHours, setStepHours] = useState('12');
  const [calculationKey, setCalculationKey] = useState(0);
  const [error, setError] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showAllWindows, setShowAllWindows] = useState(false);
  const report = useMemo(() => {
    if (!isCalculated) return null;
    try {
      return buildUnifiedLifeForecast(natalChart, parseInputDate(startValue), parseInputDate(endValue), { stepHours: Number(stepHours) });
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : 'Не удалось рассчитать единый прогноз' };
    }
  }, [natalChart, startValue, endValue, stepHours, calculationKey, isCalculated]);
  const selected = report && !('error' in report) ? report.areas.find((area) => area.id === selectedArea) : null;
  const runCalculation = () => {
    setError('');
    if (!startValue || !endValue || parseInputDate(endValue) <= parseInputDate(startValue)) {
      setError('Укажите корректные даты: окончание должно быть позже начала.');
      return;
    }
    if ((parseInputDate(endValue).getTime() - parseInputDate(startValue).getTime()) > 3 * 366 * 86400000) {
      setError('Максимальный интервал календаря — три года.');
      return;
    }
    setCalculationKey((value) => value + 1);
    setIsCalculated(true);
  };
  return <div className="space-y-5">
    <GlassCard>
      <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-100 p-3"><Sparkles className="h-6 w-6 text-indigo-700"/></div><div><h2 className="text-xl font-bold text-gray-900">Сводный разбор периода по жизненным сферам</h2><p className="mt-1 text-sm text-gray-600">Сопоставление основной карты D1 <TermTooltip term="d1" />, специальных комбинаций (йог) <TermTooltip term="natalYoga" />, дополнительных карт (варг) <TermTooltip term="varga" />, планетных периодов Даши <TermTooltip term="dasha" /> и текущих транзитов <TermTooltip term="transit" />. Каждый вывод сопровождается основаниями и ограничениями. Это символическая астрологическая интерпретация, а не предсказание фактических событий.</p></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-gray-700">Начало периода<input type="date" value={startValue} onChange={(event) => setStartValue(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"/></label>
        <label className="text-xs font-medium text-gray-700">Окончание периода<input type="date" value={endValue} onChange={(event) => setEndValue(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"/></label>
        <label className="text-xs font-medium text-gray-700">Шаг транзитного поиска<select value={stepHours} onChange={(event) => setStepHours(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"><option value="6">6 часов · подробный</option><option value="12">12 часов · точнее для Луны</option><option value="24">24 часа · стандартный</option><option value="48">48 часов · быстрый</option></select></label>
        <div className="flex items-end"><button type="button" onClick={runCalculation} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><CalendarDays className="mr-2 inline h-4 w-4"/>Рассчитать период</button></div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {report && 'error' in report && <p role="alert" className="mt-3 text-sm text-red-700">{report.error}</p>}
    </GlassCard>
    {report && !('error' in report) && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-gray-500">Период: {report.startDate.toLocaleDateString('ru-RU')} — {report.endDate.toLocaleDateString('ru-RU')}</p><p className="text-xs text-gray-500">Астрологических моментов: {report.transitTimeline.events.length} · точных аспектов: {report.transitTimeline.aspectWindows.length} · периодов Даши: {report.transitTimeline.dashaActivations.length}</p></div><label className="text-xs font-medium text-gray-700">Выбранная сфера<select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value as ForecastAreaId)} className="ml-2 rounded-lg border border-gray-300 bg-white p-2 text-sm">{AREA_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
      {selected && <ForecastAreaCard area={selected}/>}
      <div className="grid gap-3 md:grid-cols-2">{report.areas.filter((area) => area.id !== selectedArea).map((area) => <details key={area.id} className="rounded-xl border border-gray-200 bg-white p-3"><summary className="cursor-pointer text-sm font-semibold text-gray-800">{area.title}<span className="mt-1 block text-xs font-normal text-gray-500">Поддержка: {area.supportingFactors.length} · напряжение: {area.tensionFactors.length} · сроки: {area.timingIndicators.length} · оснований: {area.evidence.length}</span></summary><div className="mt-3"><ForecastAreaCard area={area}/></div></details>)}</div>
      <GlassCard><h3 className="font-semibold text-gray-900">Календарь астрологических моментов</h3><div className="mt-3 space-y-2">{report.transitTimeline.events.slice(0, showAllEvents ? report.transitTimeline.events.length : 80).map((event) => <div key={event.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-800">{event.kind === 'exact-aspect' ? `${planetRu(event.planet)} · ${event.aspect} · ${planetRu(event.natalPlanet ?? '')}` : `${planetRu(event.planet)} · ${event.from} → ${event.to}`}</p><span className="text-xs text-gray-500">{event.exactAt.toLocaleString('ru-RU')}</span></div><p className="mt-1 text-xs text-gray-600">Основание расчёта: {event.evidence.join(' ')}</p></div>)}</div>{report.transitTimeline.events.length > 80 && <button type="button" onClick={() => setShowAllEvents((value) => !value)} className="mt-2 text-xs font-semibold text-indigo-700">{showAllEvents ? 'Свернуть список' : 'Показать все события'}</button>}</GlassCard>
      <GlassCard><h3 className="font-semibold text-gray-900">Периоды Даши и связанные с ними темы</h3><p className="mt-1 text-xs text-gray-500">Здесь показано, с какими темами астрологическая система связывает текущие и ближайшие периоды. «Совпадение с транзитом» означает, что в пределах этого периода найден дополнительный аспект к планете, связанной с теми же домами. Это совпадение внутри расчётной модели, а не подтверждение будущего события.</p><div className="mt-3 space-y-2">{report.transitTimeline.dashaActivations.map((item) => <div key={item.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-800">{item.layer} · {planetRu(item.planet)}</p><span className={`rounded-full px-2 py-1 text-xs ${item.repeatedByTransit ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{item.repeatedByTransit ? 'Есть совпадение с транзитом' : 'Тема Даши'}</span></div><p className="mt-1 text-xs text-gray-600">{item.startsAt.toLocaleDateString('ru-RU')} — {item.endsAt.toLocaleDateString('ru-RU')}</p><p className="mt-1 text-xs text-gray-700">Темы: {item.themes.join(', ')}</p><ul className="mt-1 list-disc space-y-1 pl-4">{item.evidence.slice(0, 3).map((entry) => <li key={entry} className="text-xs text-gray-500">{entry}</li>)}</ul></div>)}</div>{report.transitTimeline.dashaActivations.length === 0 && <p className="mt-2 text-sm text-gray-500">В выбранном интервале доступные периоды Даши не содержат прямых тематических связей.</p>}</GlassCard>
      <GlassCard><h3 className="font-semibold text-gray-900">Интервалы точных аспектов <TermTooltip term="orb" /></h3><p className="mt-1 text-xs text-gray-500">Интервал начинается, когда угол между планетами попадает в заданный орбис, достигает точности в момент точного аспекта и заканчивается при выходе из орбиса или на границе выбранного периода. Это описание расчёта, а не период гарантированных событий.</p><div className="mt-3 space-y-2">{report.transitTimeline.aspectWindows.slice(0, showAllWindows ? report.transitTimeline.aspectWindows.length : 60).map((window) => <div key={window.id} className="rounded-lg border border-gray-200 p-3"><p className="text-sm font-semibold text-gray-800">{planetRu(window.transitPlanet)} · {window.aspect} · {planetRu(window.natalPlanet)}</p><p className="mt-1 text-xs text-gray-600">Начало: {window.startsAt.toLocaleString('ru-RU')} · точный момент: {window.exactAt.toLocaleString('ru-RU')} · окончание: {window.endsAt.toLocaleString('ru-RU')}</p><p className="mt-1 text-xs text-gray-500">{window.evidence.join(' ')}</p></div>)}</div>{report.transitTimeline.aspectWindows.length > 60 && <button type="button" onClick={() => setShowAllWindows((value) => !value)} className="mt-2 text-xs font-semibold text-indigo-700">{showAllWindows ? 'Свернуть список' : 'Показать все периоды'}</button>}</GlassCard>
      <GlassCard><h3 className="font-semibold text-gray-900">Методика и ограничения</h3><ul className="mt-2 list-disc space-y-1 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul><div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/><div>{report.warnings.map((item) => <p key={item} className="text-xs text-amber-900">{item}</p>)}</div></div></GlassCard>
    </>}
  </div>;
}
