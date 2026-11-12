import { useMemo, useState } from 'react';
import { ChevronDown, Orbit, ShieldAlert } from 'lucide-react';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import { analyzeTransits, type TransitAnalysisReport, type TransitLifeArea } from '../../utils/transitAnalysis';
import { GlassCard } from '../common/GlassCard';

interface NatalTransitsTabProps { natalChart: NatalChartType; }
const formatDate = (date: Date) => date.toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">{title}</h3>{count !== undefined && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{count}</span>}</div>{children}</section>;
}
function AreaCard({ area }: { area: TransitLifeArea }) {
  return <article className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold text-gray-900">{area.label}</h4><span className={`rounded-full px-2 py-1 text-xs ${area.repeated ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{area.repeated ? 'Повтор темы' : 'Есть связь'}</span></div>
    <p className="mt-1 text-xs text-gray-500">Дома: {area.houses.join(', ')}</p>
    <p className="mt-2 text-sm text-gray-700">{area.explanation}</p>
    {area.dashaEvidence.length > 0 && <div className="mt-3"><p className="text-xs font-semibold text-purple-700">Основания в Даше</p><ul className="mt-1 list-disc space-y-1 pl-4">{area.dashaEvidence.map((item, index) => <li key={index} className="text-xs text-gray-700">{item}</li>)}</ul></div>}
    {area.transitEvidence.length > 0 && <div className="mt-3"><p className="text-xs font-semibold text-blue-700">Транзитные основания</p><ul className="mt-1 list-disc space-y-1 pl-4">{area.transitEvidence.map((item, index) => <li key={index} className="text-xs text-gray-700">{item}</li>)}</ul></div>}
  </article>;
}
function TransitReport({ report }: { report: TransitAnalysisReport }) {
  const [showMethod, setShowMethod] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const visibleAreas = showAllAreas ? report.lifeAreas : report.lifeAreas.slice(0, 6);
  return <div className="space-y-6">
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4"><p className="text-xs font-semibold uppercase text-purple-700">Махадаша</p><p className="mt-1 text-lg font-bold text-gray-900">{report.dasha.mahadasha}</p><p className="text-xs text-gray-600">до {formatDate(report.dasha.periodEnd)}</p></div>
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-blue-700">Антардаша</p><p className="mt-1 text-lg font-bold text-gray-900">{report.dasha.antardasha ?? 'Не определена'}</p><p className="text-xs text-gray-600">Промежуточный уровень</p></div>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-xs font-semibold uppercase text-indigo-700">Пратьянтардаша</p><p className="mt-1 text-lg font-bold text-gray-900">{report.dasha.pratyantardasha ?? 'Не определена'}</p><p className="text-xs text-gray-600">Краткий подпериод</p></div>
    </div>

    <Section title="Транзитные планеты по натальным домам" count={report.positions.length}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{report.positions.map((item) => <div key={item.planet} className="rounded-lg border border-gray-200 bg-white p-3"><p className="font-semibold text-gray-900">{item.planetName}</p><p className="text-sm text-gray-700">{item.sign} {item.degree.toFixed(2)}°</p><p className="mt-1 text-sm font-medium text-indigo-700">{item.natalHouse}-й натальный дом</p></div>)}</div>
    </Section>

    <Section title="Точные транзитные аспекты к натальным планетам" count={report.aspects.length}>
      {report.aspects.length ? <div className="space-y-2">{report.aspects.map((item, index) => <div key={index} className="rounded-lg border border-gray-200 bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-900">{item.transitPlanet} → {item.natalPlanet}: {item.aspect}</p><span className="text-xs text-gray-600">орбис {item.orb.toFixed(2)}° · сила {item.strength}%</span></div><p className="mt-1 text-xs text-gray-600">{item.evidence} Транзит идёт по {item.transitHouse}-му натальному дому; натальная планета находится в {item.natalHouse ?? 'неизвестном'} доме.</p><p className="mt-1 text-xs text-gray-500">{item.applying === null ? 'Фаза аспекта не определена' : item.applying ? 'Сходящийся аспект' : 'Расходящийся аспект'}</p></div>)}</div> : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">В пределах орбисов используемой системы точные аспекты не обнаружены.</p>}
    </Section>

    <Section title="Транзиты к управителям натальных домов" count={report.houseLordHits.length}>
      {report.houseLordHits.length ? <div className="space-y-2">{report.houseLordHits.map((item, index) => <div key={index} className="rounded-lg border border-gray-200 bg-white p-3"><p className="text-sm font-semibold text-gray-900">{item.house}-й дом · {item.houseTopic}</p><p className="mt-1 text-xs text-gray-600">Управитель: {item.lordName}; транзит: {item.transitPlanetName}; тип связи: {item.relation === 'exact-aspect' ? 'точный аспект' : item.relation === 'graha-drishti' ? 'граха-дришти' : 'тот же знак/дом'}.</p><p className="mt-1 text-sm text-gray-700">{item.detail}</p></div>)}</div> : <p className="text-sm text-gray-600">Связи транзитов с управителями домов по выбранным правилам не найдены.</p>}
    </Section>

    <Section title="Темы, повторяющиеся в Даше и транзитах" count={report.repeatedThemes.length}>
      {report.repeatedThemes.length ? <div className="grid gap-3 md:grid-cols-2">{report.lifeAreas.filter((area) => area.repeated).map((area) => <AreaCard key={area.id} area={area} />)}</div> : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">На выбранный момент нет тем с одновременным прямым подтверждением от активных уровней Даши и транзитов.</p>}
    </Section>
    <Section title="Связи по жизненным сферам" count={report.lifeAreas.length}>
      <div className="grid gap-3 md:grid-cols-2">{visibleAreas.map((area) => <AreaCard key={area.id} area={area} />)}</div>
      {report.lifeAreas.length > 6 && <button type="button" onClick={() => setShowAllAreas((value) => !value)} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">{showAllAreas ? 'Свернуть' : 'Показать все сферы'}</button>}
    </Section>

    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-700"/><h3 className="text-sm font-semibold text-amber-900">Ограничения интерпретации</h3></div><ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning) => <li key={warning} className="text-xs text-amber-900">{warning}</li>)}</ul></div>
    <div className="rounded-xl border border-gray-200 bg-white p-4"><button type="button" onClick={() => setShowMethod((value) => !value)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900"><span>Методика расчёта</span><ChevronDown className={`h-4 w-4 transition-transform ${showMethod ? 'rotate-180' : ''}`}/></button>{showMethod && <ul className="mt-3 list-disc space-y-2 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul>}</div>
  </div>;
}

export function NatalTransitsTab({ natalChart }: NatalTransitsTabProps) {
  const report = useMemo(() => {
    try { return { data: analyzeTransits(natalChart), error: null }; }
    catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Не удалось рассчитать транзиты' }; }
  }, [natalChart]);
  return <div className="space-y-5">
    <GlassCard><div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-100 p-3"><Orbit className="h-6 w-6 text-indigo-700"/></div><div><h2 className="text-xl font-bold text-gray-900">Транзиты и натальная карта</h2><p className="mt-1 text-sm text-gray-600">Положение планет на {formatDate(report.data?.moment ?? new Date())}. Все дома считаются от натальной Лагны.</p></div></div></GlassCard>
    {report.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{report.error}</div> : report.data && <TransitReport report={report.data}/>}
  </div>;
}
