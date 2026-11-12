import { buildNatalPrecisionReport } from '../../utils/astrologyPrecision';
import type { NatalChart } from '../../utils/astrology';

const LABELS = {
  'validated-reference': 'Сверено с эталонами',
  'calculated-model': 'Рассчитано моделью',
  'exact-mathematics': 'Точная математика',
  'school-dependent': 'Зависит от школы',
} as const;

export function NatalPrecisionSection({ natalChart }: { natalChart: NatalChart }) {
  const report = buildNatalPrecisionReport(natalChart);
  const combust = report.planets.filter((p) => p.combustion.status === 'combust');
  const retrograde = report.planets.filter((p) => p.motion?.state === 'retrograde');
  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Точность астрологических расчётов</h3>
        <p className="text-sm text-gray-600">Численные показатели отделены от правил, зависящих от выбранной астрологической школы.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.quality.map((item) => <div key={item.topic} className="rounded-lg border border-white bg-white/80 p-3">
          <div className="flex items-center justify-between gap-2"><strong className="text-sm text-gray-900">{item.topic}</strong>
            <span className="text-[11px] rounded-full bg-slate-100 px-2 py-1 text-slate-700">{LABELS[item.status]}</span></div>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.explanation}</p>
        </div>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Ретроградность</h4>
          <p className="mt-1 text-sm text-gray-700">{retrograde.length ? retrograde.map((p) => p.planet).join(', ') : 'Ретроградных классических планет не обнаружено.'}</p>
          <p className="mt-1 text-xs text-gray-500">{report.planets.filter((p) => p.motion).map((p) => p.planet + ' ' + p.motion!.dailyMotion.toFixed(3) + '°/сутки').join(' · ')}</p>
        </div>
        <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Сожжение (Surya Siddhanta)</h4>
          <p className="mt-1 text-sm text-gray-700">{combust.length ? combust.map((p) => p.planet + ' — ' + p.combustion.separation!.toFixed(2) + '° / порог ' + p.combustion.threshold + '°').join('; ') : 'Планет в пределах применяемых орбисов нет.'}</p>
          <p className="mt-1 text-xs text-gray-500">Другие школы могут использовать иные пороги.</p>
        </div>
      </div>
      <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Соединения: знак и градусный орбис отдельно</h4>
        <p className="mt-1 text-xs text-gray-600">Градусное соединение использует орбис 8°; один общий знак сам по себе не означает тесное соединение.</p>
        <div className="mt-2 flex flex-wrap gap-2">{report.conjunctions.filter((p) => p.sameSign || p.withinDegreeOrb).map((p) =>
          <span key={p.planet1 + '-' + p.planet2} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-gray-700">
            {p.planet1} + {p.planet2}: {p.angularSeparation.toFixed(2)}° · {p.classification}
          </span>)}</div>
      </div>
      <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Угловые аспекты и орбисы</h4>
        {report.aspects.length ? <ul className="mt-2 space-y-1 text-xs text-gray-700">{report.aspects.slice(0, 10).map((a) =>
          <li key={a.planet1 + '-' + a.planet2 + '-' + a.aspect}>{a.planet1} — {a.planet2}: {a.aspect}, расстояние {a.separation.toFixed(2)}°, орбис {a.orb.toFixed(2)}° / {a.maxOrb}°; {a.phase === 'unknown' ? 'фаза неизвестна' : a.phase === 'applying' ? 'сходящийся' : 'расходящийся'}</li>)}</ul>
          : <p className="mt-1 text-xs text-gray-600">Аспекты в пределах заданных орбисов не обнаружены.</p>}
      </div>
      <details className="rounded-lg bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Методика и ограничения</summary>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-600">
          {Object.entries(report.methodology).map(([key, value]) => <li key={key}>{value}</li>)}
          {report.limitations.map((value) => <li key={value}>{value}</li>)}
        </ul>
      </details>
    </section>
  );
}
