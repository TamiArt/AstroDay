import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { buildNatalChartFacts } from '../../utils/natalChartFacts';
import { analyzeNatalYogas } from '../../utils/natalYogaAnalysis';
import type { NatalChart } from '../../utils/astrology';
import { GlassCard } from '../common/GlassCard';

const PLANET_NAMES_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const CATEGORY_LABELS = {
  raja: 'Раджа-йоги',
  wealth: 'Дхана-йоги',
  mahapurusha: 'Панча-Махапуруша',
  lunar: 'Лунные комбинации',
  planetary: 'Планетные комбинации',
  exchange: 'Обмен знаками',
  vipareeta: 'Випарита-йоги',
} as const;

export function NatalYogasSection({ natalChart }: { natalChart: NatalChart }) {
  const analysis = useMemo(
    () => analyzeNatalYogas(buildNatalChartFacts(natalChart)),
    [natalChart],
  );
  const detected = analysis.findings.length;
  const incomplete = analysis.checks.filter((item) => item.status === 'incomplete').length;

  return (
    <GlassCard>
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Йоги и специальные комбинации</h3>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Формальные правила обнаружения с доказательствами из вашей карты
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-purple-50 px-3 py-2 text-center">
            <p className="text-xl font-bold text-purple-800">{detected}</p>
            <p className="text-xs text-purple-700">найдено</p>
          </div>
        </div>

        {detected ? (
          <div className="rounded-lg bg-indigo-50/70 p-3 text-sm leading-relaxed text-indigo-950">
          Йога — это сочетание нескольких показателей натальной карты, а не отдельная планета. Ниже показано, какие именно положения образуют комбинацию, какие темы она затрагивает и какие дополнительные условия могут усиливать или ослаблять её трактовку. Само наличие йоги не гарантирует конкретных событий.
        </div>
        <div className="space-y-3">
            {analysis.findings.map((finding) => (
              <details key={finding.id} className="rounded-xl border border-purple-200 bg-purple-50/40 p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{finding.name}</h4>
                      <p className="text-xs text-gray-500">{finding.sanskritName} · {CATEGORY_LABELS[finding.category]}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Обнаружена</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{finding.description}</p>
                </summary>
                <div className="mt-3 space-y-2 border-t border-purple-100 pt-3">
                  <p className="text-sm font-semibold text-gray-800">Формальное правило</p>
                  <p className="text-sm text-gray-700">{finding.formalRule}</p>
                  <p className="text-sm font-semibold text-gray-800">Что подтверждает комбинацию</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {finding.evidence.map((item) => <li key={item} className="text-sm text-gray-700">{item}</li>)}
                  </ul>
                  <p className="text-xs text-gray-500">Участвуют планеты: {finding.participants.map((planet) => PLANET_NAMES_RU[planet] ?? planet).join(', ')}. Дома: {finding.houses.length ? finding.houses.join(', ') : 'не определены'}.</p>
                  {finding.assessment.supportingFactors.length > 0 && (
                    <div className="rounded-lg bg-emerald-50 p-2">
                      <p className="text-xs font-semibold text-emerald-900">Поддерживающие факторы</p>
                      {finding.assessment.supportingFactors.map((item) => <p key={item} className="text-xs leading-relaxed text-emerald-800">{item}</p>)}
                    </div>
                  )}
                  {finding.assessment.weakeningFactors.length > 0 && (
                    <div className="rounded-lg bg-amber-50 p-2">
                      <p className="text-xs font-semibold text-amber-900">Факторы ослабления</p>
                      {finding.assessment.weakeningFactors.map((item) => <p key={item} className="text-xs leading-relaxed text-amber-800">{item}</p>)}
                    </div>
                  )}
                  {finding.caveats.map((item) => <p key={item} className="text-xs leading-relaxed text-amber-800">{item}</p>)}
                  <details className="rounded-lg border border-gray-200 bg-white/70 p-2">
                    <summary className="cursor-pointer text-xs font-semibold text-gray-700">Что не проверено для этой комбинации</summary>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {finding.assessment.unassessedFactors.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">{item}</li>)}
                    </ul>
                  </details>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">По проверенным правилам подтверждённых комбинаций пока не найдено.</p>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-800">Проверка правил</p>
            <p className="mt-1 text-sm text-gray-600">
              {analysis.checks.filter((item) => item.status === 'not-detected').length} — не обнаружены;
              {' '}{incomplete} — не удалось проверить полностью.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              {analysis.dataQuality.complete ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              <p className="text-sm font-semibold text-gray-800">Полнота исходных данных</p>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {analysis.dataQuality.complete ? 'Все необходимые базовые позиции присутствуют.' : 'Часть правил ограничена отсутствующими позициями или домами.'}
            </p>
          </div>
        </div>

        <details className="rounded-lg border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">Какие правила проверены и что не удалось проверить</summary>
          <ul className="mt-2 space-y-2">
            {analysis.checks.map((item) => (
              <li key={item.id} className="text-xs leading-relaxed text-gray-600">
                <strong>{item.name}:</strong> {item.status === 'detected' ? 'обнаружена' : item.status === 'not-detected' ? 'не обнаружена' : 'неполные данные'} — {item.reason}
                {item.missingFacts.length ? ` Не хватает: ${item.missingFacts.join(', ')}.` : ''}
              </li>
            ))}
          </ul>
        </details>

        <details className="rounded-lg border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">Методика и ограничения</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {analysis.methodology.map((item) => <li key={item} className="text-xs text-gray-600">{item}</li>)}
            {analysis.dataQuality.warnings.map((item) => <li key={item} className="text-xs text-gray-500">{item}</li>)}
          </ul>
        </details>
      </section>
    </GlassCard>
  );
}
