import { useMemo, useState } from 'react';
import { AlertTriangle, GitMerge, Layers3, ShieldCheck } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import { buildIntegratedNatalAnalysis, type IntegratedAreaSynthesis } from '../../utils/integratedNatalAnalysis';
import { GlassCard } from '../common/GlassCard';

interface Props { natalChart: NatalChart; }
function AreaEvidence({ area }: { area: IntegratedAreaSynthesis }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? area.evidence : area.evidence.slice(0, 3);
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-900">{area.title}</h4>
          <p className="text-xs text-gray-500">Дома: {area.houses.join(', ')} · Уникальных факторов: {area.uniqueFactorCount}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${area.dataStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : area.dataStatus === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {area.dataStatus === 'complete' ? 'Данные доступны' : area.dataStatus === 'partial' ? 'Частичные данные' : 'Нет оснований'}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{area.summary}</p>
      {area.contradictions.map((item) => <p key={item} className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{item}</p>)}
      {visible.map((item) => (
        <details key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-800">
            {item.title} <span className="ml-1 text-xs font-normal text-gray-500">· {item.source}</span>
          </summary>
          <p className="mt-2 text-sm text-gray-700">{item.statement}</p>
          {item.references.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4">{item.references.slice(0, 8).map((ref, index) => <li key={index} className="text-xs text-gray-600">{ref}</li>)}</ul>}
          {item.duplicateMentions > 1 && <p className="mt-2 text-xs text-gray-500">Повторных упоминаний объединено: {item.duplicateMentions}. Они не увеличивают число факторов.</p>}
        </details>
      ))}
      {area.evidence.length > 3 && <button type="button" onClick={() => setExpanded((value) => !value)} className="text-xs font-semibold text-indigo-700">{expanded ? 'Свернуть' : `Показать все основания (${area.evidence.length})`}</button>}
    </article>
  );
}

export function NatalIntegratedSynthesisSection({ natalChart }: Props) {
  const report = useMemo(() => buildIntegratedNatalAnalysis(natalChart), [natalChart]);
  return (
    <GlassCard>
      <section className="space-y-4">
        <div className="flex items-start gap-3 border-b border-gray-200 pb-3">
          <div className="rounded-xl bg-indigo-50 p-2"><GitMerge className="h-5 w-5 text-indigo-700" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Единый синтез натальной карты</h3>
            <p className="mt-1 text-sm text-gray-600">{report.overview}</p>
          </div>
        </div>
        <div className="rounded-xl bg-indigo-50/70 p-4">
          <p className="font-semibold text-gray-900">{report.headline}</p>
          <p className="mt-1 text-xs text-gray-600">Состояние данных: {report.dataQuality.status === 'complete' ? 'полное по проверенным полям' : 'есть ограничения или предупреждения'} · Факторов после дедупликации: {report.evidence.length}</p>
        </div>
        {report.repeatedThemes.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800"><Layers3 className="h-4 w-4" />Темы, совпадающие между слоями</h4>
            {report.repeatedThemes.map((item) => <div key={item.area} className="rounded-lg border border-indigo-100 p-3"><p className="text-sm font-medium text-gray-900">{item.title}</p><p className="mt-1 text-xs text-gray-600">{item.explanation}</p><p className="mt-1 text-xs text-gray-500">Слои: {item.sourceFamilies.join(', ')}</p></div>)}
          </div>
        )}
        {report.contradictions.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" />Неоднозначности и противоречия</h4>
            {report.contradictions.map((item, index) => <div key={item.area + index} className="rounded-lg bg-amber-50 p-3"><p className="text-sm font-medium text-amber-900">{item.title}</p><p className="mt-1 text-xs text-amber-800">{item.explanation}</p></div>)}
          </div>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {report.areas.map((area) => <AreaEvidence key={area.id} area={area} />)}
        </div>
        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800"><ShieldCheck className="h-4 w-4" />Методика, ограничения и полнота данных</summary>
          <ul className="mt-3 list-disc space-y-1 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">{item}</li>)}</ul>
          {report.dataQuality.warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{report.dataQuality.warnings.map((item, index) => <li key={index} className="text-xs text-amber-800">{item}</li>)}</ul>}
          {report.dataQuality.missingPlanets.length > 0 && <p className="mt-2 text-xs text-gray-600">Нет планет: {report.dataQuality.missingPlanets.join(', ')}</p>}
          {report.dataQuality.missingHouses.length > 0 && <p className="mt-1 text-xs text-gray-600">Нет домов: {report.dataQuality.missingHouses.join(', ')}</p>}
        </details>
      </section>
    </GlassCard>
  );
}
