import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ShieldAlert, Sparkles } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import { buildUnifiedLifeForecast, type ForecastAreaId, type UnifiedLifeAreaForecast } from '../../utils/unifiedLifeForecast';
import { GlassCard } from '../common/GlassCard';

interface NatalForecastTabProps { natalChart: NatalChart; }
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
      <h5 className="text-sm font-semibold text-gray-800">Доказательства и источники</h5>
      <span className="text-xs text-gray-500">{area.evidence.length}</span>
    </div>
    {visible.length ? visible.map((item, index) => (
      <details key={item.source + ':' + index} className="rounded-lg border border-gray-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-800">{item.label}<span className="ml-2 text-xs font-normal text-gray-500">· {item.source}</span></summary>
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
      <div><h3 className="font-semibold text-gray-900">{area.title}</h3><p className="mt-1 text-xs text-gray-500">Дома: {area.houses.join(', ')}</p></div>
      <span className={`rounded-full px-2 py-1 text-xs ${area.dataStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : area.dataStatus === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{area.dataStatus === 'complete' ? 'Данные полные' : area.dataStatus === 'partial' ? 'Частичные данные' : 'Нет прямых оснований'}</span>
    </div>
    <p className="text-sm leading-relaxed text-gray-700">{area.synthesis}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-emerald-50/70 p-3"><h4 className="text-xs font-semibold text-emerald-800">Поддерживающие факторы</h4>{area.supportingFactors.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{area.supportingFactors.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">Отдельные факторы не выделены.</p>}</div>
      <div className="rounded-xl bg-amber-50/70 p-3"><h4 className="text-xs font-semibold text-amber-800">Факторы напряжения</h4>{area.tensionFactors.length ? <ul className="mt-2 list-disc space-y-1 pl-4">{area.tensionFactors.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">Отдельные факторы не выделены.</p>}</div>
    </div>
    {area.vargaEvidence.length > 0 && <div><h4 className="text-xs font-semibold text-gray-700">Профильные варги</h4><ul className="mt-1 list-disc space-y-1 pl-4">{area.vargaEvidence.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul></div>}
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
      <div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-100 p-3"><Sparkles className="h-6 w-6 text-indigo-700"/></div><div><h2 className="text-xl font-bold text-gray-900">Единый прогноз по жизненным сферам</h2><p className="mt-1 text-sm text-gray-600">Сопоставление домов и планет D1, йог, профильных варг, Вимшоттари-Даши и транзитов. Каждый вывод сопровождается источником и evidence.</p></div></div>
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
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-gray-500">Период: {report.startDate.toLocaleDateString('ru-RU')} — {report.endDate.toLocaleDateString('ru-RU')}</p><p className="text-xs text-gray-500">Событий: {report.transitTimeline.events.length} · точных аспектов: {report.transitTimeline.aspectWindows.length} · периодов Даши: {report.transitTimeline.dashaActivations.length}</p></div><label className="text-xs font-medium text-gray-700">Выбранная сфера<select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value as ForecastAreaId)} className="ml-2 rounded-lg border border-gray-300 bg-white p-2 text-sm">{AREA_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
      {selected && <ForecastAreaCard area={selected}/>}
      <div className="grid gap-3 md:grid-cols-2">{report.areas.filter((area) => area.id !== selectedArea).map((area) => <button type="button" key={area.id} onClick={() => setSelectedArea(area.id)} className="rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-indigo-300"><span className="text-sm font-semibold text-gray-800">{area.title}</span><span className="mt-1 block text-xs text-gray-500">Оснований: {area.evidence.length} · временных указаний: {area.timingIndicators.length}</span></button>)}</div>
      <GlassCard><h3 className="font-semibold text-gray-900">Календарь транзитов</h3><div className="mt-3 space-y-2">{report.transitTimeline.events.slice(0, 80).map((event) => <div key={event.id} className="rounded-lg border border-gray-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-800">{event.kind === 'exact-aspect' ? `${event.planet} · ${event.aspect} · ${event.natalPlanet}` : `${event.planet} · ${event.from} → ${event.to}`}</p><span className="text-xs text-gray-500">{event.exactAt.toLocaleString('ru-RU')}</span></div><p className="mt-1 text-xs text-gray-600">{event.evidence.join(' ')}</p></div>)}</div>{report.transitTimeline.events.length > 80 && <p className="mt-2 text-xs text-gray-500">Показаны первые 80 событий; полный расчёт учитывает весь выбранный интервал.</p>}</GlassCard>
      <GlassCard><h3 className="font-semibold text-gray-900">Периоды усиления и ослабления аспектов</h3><p className="mt-1 text-xs text-gray-500">Окно начинается при входе в заданный орбис, достигает максимума в момент точного аспекта и завершается при выходе из орбиса либо на границе выбранного периода.</p><div className="mt-3 space-y-2">{report.transitTimeline.aspectWindows.slice(0, 60).map((window) => <div key={window.id} className="rounded-lg border border-gray-200 p-3"><p className="text-sm font-semibold text-gray-800">{window.transitPlanet} · {window.aspect} · {window.natalPlanet}</p><p className="mt-1 text-xs text-gray-600">Начало: {window.startsAt.toLocaleString('ru-RU')} · точный момент: {window.exactAt.toLocaleString('ru-RU')} · окончание: {window.endsAt.toLocaleString('ru-RU')}</p><p className="mt-1 text-xs text-gray-500">{window.evidence.join(' ')}</p></div>)}</div>{report.transitTimeline.aspectWindows.length > 60 && <p className="mt-2 text-xs text-gray-500">Показаны первые 60 окон.</p>}</GlassCard>
      <GlassCard><h3 className="font-semibold text-gray-900">Методика и ограничения</h3><ul className="mt-2 list-disc space-y-1 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul><div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/><div>{report.warnings.map((item) => <p key={item} className="text-xs text-amber-900">{item}</p>)}</div></div></GlassCard>
    </>}
  </div>;
}
