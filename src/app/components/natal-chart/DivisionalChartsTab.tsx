import { BookOpen, Layers, ShieldAlert } from 'lucide-react';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import { analyzeDivisionalCharts, VARGA_ANALYSIS_RULES, type VargaAnalysis, type VargaHouseEvidence } from '../../utils/divisionalChartAnalysis';
import { calculateAllDivisionalCharts } from '../../utils/divisionalCharts';
import { GlassCard } from '../common/GlassCard';
import { DivisionalChartWheel } from '../DivisionalChartWheel';
import { TermTooltip } from '../common/TermTooltip';

const PLANET_NAMES_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const HOUSE_MEANINGS: Record<number, string> = {
  1: 'личность и самостоятельность', 2: 'личные деньги и накопления',
  3: 'общение и навыки', 4: 'дом и семья', 5: 'творчество и дети',
  6: 'работа и повседневные обязанности', 7: 'брак и партнёрство',
  8: 'общие ресурсы и перемены', 9: 'обучение и мировоззрение',
  10: 'профессия и карьера', 11: 'доходы и окружение', 12: 'отдых и уединение',
};

interface DivisionalChartsTabProps {
  natalChart: NatalChartType;
}

function HouseEvidence({ item }: { item: VargaHouseEvidence }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-sm font-semibold text-gray-900">{item.house}-й дом — {HOUSE_MEANINGS[item.house] ?? 'отдельная тема карты'}</p>
      <p className="mt-1 text-xs text-gray-700">Знак: {item.sign}. Управитель: {PLANET_NAMES_RU[item.lord] ?? item.lord}{item.lordHouse ? `, находится в ${item.lordHouse}-м доме` : ' — положение не определено'}.</p>
      <p className="mt-1 text-xs text-gray-600">Планеты в доме: {item.occupants.length ? item.occupants.map((planet) => PLANET_NAMES_RU[planet] ?? planet).join(', ') : 'нет'}</p>
    </div>
  );
}

function VargaDetail({ analysis }: { analysis: VargaAnalysis }) {
  const riskLabel = analysis.boundarySensitivity.risk === 'high' ? 'высокая близость к границе'
    : analysis.boundarySensitivity.risk === 'moderate' ? 'умеренная близость к границе' : 'нет близости к границе по выбранному порогу';
  return (
    <details className="rounded-xl border border-indigo-100 bg-white p-4" open={false}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div><h4 className="font-bold text-gray-900">{analysis.name}</h4><p className="text-sm text-indigo-700">{analysis.topic}</p></div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-800">Дополнительная карта по теме</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">Эта дополнительная карта рассматривает тему «{analysis.topic.toLowerCase()}». Основная карта рождения D1 <TermTooltip term="d1" /> показывает общий рисунок карты, а дополнительная варга <TermTooltip term="varga" /> помогает подробнее рассмотреть только указанную область. Её нельзя читать отдельно от D1.</p>
      </summary>
      <div className="mt-4 space-y-4">
        <section className="rounded-lg bg-indigo-50/70 p-3"><h5 className="text-sm font-semibold text-indigo-900">Как понять результат</h5><p className="mt-1 text-sm leading-relaxed text-gray-800">Сравните, какие планеты и темы повторяются в основной карте D1 и в дополнительной карте. Если указания совпадают, трактовка темы становится более согласованной. Если различаются, это не ошибка: дополнительная карта показывает другой слой той же жизненной области.</p></section>
        <details className="rounded-lg border border-gray-200 p-3"><summary className="cursor-pointer text-sm font-semibold text-gray-700">Подробные технические основания</summary><p className="mt-2 text-xs text-gray-600">{analysis.interpretiveScope}</p>
        <section><h5 className="mb-2 text-sm font-semibold text-gray-900">D1 — исходные показатели <TermTooltip term="d1" /></h5><div className="grid gap-2 md:grid-cols-2">{analysis.d1Evidence.map((item) => <HouseEvidence key={item.house} item={item} />)}</div></section>
        <section><h5 className="mb-2 text-sm font-semibold text-gray-900">Показатели тематической варги <TermTooltip term="varga" /></h5><div className="grid gap-2 md:grid-cols-2">{analysis.vargaEvidence.map((item) => <HouseEvidence key={item.house} item={item} />)}</div></section>
        <section><h5 className="mb-2 text-sm font-semibold text-gray-900">Сопоставление одних и тех же планет</h5>
          <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr className="border-b text-gray-500"><th className="py-2 pr-2">Планета / роль</th><th className="py-2 pr-2">D1</th><th className="py-2 pr-2">{analysis.name.split(' — ')[0]}</th></tr></thead><tbody>
            {analysis.comparisons.map((item) => <tr key={item.planet} className="border-b border-gray-100"><td className="py-2 pr-2 font-medium">{item.planet}<div className="text-gray-500">{item.role === 'karaka' ? 'карака' : 'управитель тематического дома D1'}</div></td><td className="py-2 pr-2">{item.d1Sign}, {item.d1House}-й дом</td><td className="py-2 pr-2">{item.vargaSign}, {item.vargaHouse}-й дом</td></tr>)}
          </tbody></table></div>
        </section>
        <section className="rounded-lg bg-slate-50 p-3"><h5 className="text-sm font-semibold text-gray-900">Правило расчёта</h5><p className="mt-1 text-xs text-gray-700">{analysis.calculationRule}</p><p className="mt-2 text-xs text-gray-600">Размер сегмента: {analysis.boundarySensitivity.segmentWidthDegrees.toFixed(4)}°. До ближайшей границы Лагны: {analysis.boundarySensitivity.distanceToNearestAscendantBoundary.toFixed(4)}° ({riskLabel}). Это геометрическая близость, не оценка точности времени рождения.</p></section>
        <section><h5 className="mb-2 text-sm font-semibold text-gray-900">Ограничения интерпретации</h5><ul className="list-disc space-y-1 pl-5">{analysis.limitations.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul></section>
        <section><h5 className="mb-2 text-sm font-semibold text-gray-900">Методика</h5><ul className="list-disc space-y-1 pl-5">{analysis.methodology.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}</ul></section>
        </details>
      </div>
    </details>
  );
}

export function DivisionalChartsTab({ natalChart }: DivisionalChartsTabProps) {
  const report = analyzeDivisionalCharts(natalChart);
  const requestedDivisions = new Set(VARGA_ANALYSIS_RULES.map((rule) => rule.division));
  const divisionalCharts = calculateAllDivisionalCharts(natalChart.planets, natalChart.ascendant.siderealLon)
    .filter((chart) => requestedDivisions.has(chart.division));

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-3 border-b border-indigo-100 pb-3">
          <div className="rounded-lg bg-indigo-100 p-2"><Layers className="h-6 w-6 text-indigo-700" /></div>
          <div><h3 className="text-lg font-bold text-gray-900">Дополнительные карты — подробности по отдельным темам</h3><p className="text-sm text-gray-600">D1 — общая карта рождения. Дополнительные карты рассчитываются по отдельным правилам и помогают рассмотреть конкретную тему, но не заменяют основную карту.</p></div>
        </div>
        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <h4 className="font-semibold text-indigo-950">Основная карта рождения — D1 (Раши) <TermTooltip term="d1" /></h4>
          <p className="mt-1 text-sm text-indigo-900">Восходящий знак (Асцендент): {report.baseChart.ascendantSign}, {report.baseChart.ascendantDegree.toFixed(2)}°.</p>
          <p className="mt-2 text-sm text-gray-700">{report.baseChart.principle}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">{report.baseChart.evidence.map((item) => <HouseEvidence key={item.house} item={item} />)}</div>
          <p className="mt-3 text-xs text-gray-600">Все выводы по дополнительным картам нужно сверять с D1. Если время рождения указано неточно, положения в некоторых варгах могут измениться.</p>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Схемы дополнительных карт</h3><p className="mb-4 text-sm text-gray-600">Обозначение D2, D9, D10 и т. п. — номер конкретного деления знаков. Это технические схемы расчёта, а не отдельные гороскопы.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {divisionalCharts.map((chart) => <div key={chart.division} className="rounded-lg border border-gray-200 bg-white p-3"><DivisionalChartWheel chart={chart} size={210} /><p className="mt-2 text-center text-xs text-gray-600">{chart.calculationRule === 'specific' ? 'Отдельное правило Парашари' : 'Общая формула'}</p></div>)}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-indigo-700" /><h3 className="text-lg font-semibold text-gray-900">Как читать дополнительные карты</h3></div>
        <p className="mt-2 mb-4 text-sm text-gray-600">Откройте интересующую тему, чтобы увидеть, какие показатели повторяются в основной карте и дополнительной. Система не делит карты на «хорошие» и «плохие» — она показывает, где указания совпадают, а где различаются.</p>
        <div className="space-y-3">{report.analyses.map((analysis) => <VargaDetail key={analysis.division} analysis={analysis} />)}</div>
      </GlassCard>

      <GlassCard>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-700" /><h4 className="font-semibold text-amber-950">Общие ограничения</h4></div>
          <ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning) => <li key={warning} className="text-xs text-amber-900">{warning}</li>)}</ul>
        </div>
      </GlassCard>
    </div>
  );
}
