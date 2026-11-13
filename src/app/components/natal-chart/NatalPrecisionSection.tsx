import { buildNatalPrecisionReport } from '../../utils/astrologyPrecision';
import type { NatalChart } from '../../utils/astrology';
import { TermTooltip } from '../common/TermTooltip';

const PLANET_NAMES_RU: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };
const NAKSHATRA_NAMES_RU = ['Ашвини', 'Бхарани', 'Криттика', 'Рохини', 'Мригашира', 'Ардра', 'Пунарвасу', 'Пушья', 'Ашлеша', 'Магха', 'Пурва-Пхалгуни', 'Уттара-Пхалгуни', 'Хаста', 'Читра', 'Свати', 'Вишакха', 'Анурадха', 'Джйештха', 'Мула', 'Пурва-Ашадха', 'Уттара-Ашадха', 'Шравана', 'Дхаништха', 'Шатабхиша', 'Пурва-Бхадрапада', 'Уттара-Бхадрапада', 'Ревати'];

const LABELS = {
  'validated-reference': 'Сверено с эталонами',
  'calculated-model': 'Рассчитано моделью',
  'exact-mathematics': 'Точная математика',
  'school-dependent': 'Зависит от школы',
} as const;

export function NatalPrecisionSection({ natalChart }: { natalChart: NatalChart }) {
  const report = buildNatalPrecisionReport(natalChart);
  const retrograde = report.planets.filter((p) => p.motion?.state === 'retrograde');
  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Точность астрологических расчётов</h3>
        <p className="text-sm text-gray-600">Здесь отдельно показаны математические координаты и астрологические правила. Координаты можно проверить расчётом; трактовка аспектов, достоинств и других показателей зависит от выбранной школы Джйотиш.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.quality.map((item) => <div key={item.topic} className="rounded-lg border border-white bg-white/80 p-3">
          <div className="flex items-center justify-between gap-2"><strong className="text-sm text-gray-900">{item.topic}</strong>
            <span className="text-[11px] rounded-full bg-slate-100 px-2 py-1 text-slate-700">{LABELS[item.status]}</span></div>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.explanation}</p>
        </div>)}
      </div>
      <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Долготы и накшатры <TermTooltip term="nakshatra" /></h4>
        <p className="mt-1 text-xs text-gray-600">Долгота — положение точки на зодиакальном круге в градусах. Тропическая и сидерическая долготы рассчитываются в разных системах зодиака. Накшатра — один из 27 участков этого круга, пада — её четверть.</p>
        <p className="mt-1 text-xs text-gray-600">Асцендент: тропическая долгота {report.ascendant.tropicalLongitude.toFixed(4)}° · сидерическая долгота {report.ascendant.siderealLongitude.toFixed(4)}° · накшатра №{report.ascendant.nakshatraIndex + 1}, часть (пада) {report.ascendant.pada}</p>
        <div className="mt-2 overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr className="border-b text-gray-500"><th className="py-1 pr-2">Точка</th><th className="py-1 pr-2">Тропическая долгота <TermTooltip term="tropical" /></th><th className="py-1 pr-2">Сидерическая долгота <TermTooltip term="sidereal" /></th><th className="py-1 pr-2">Накшатра / пада</th></tr></thead><tbody>{report.planets.map((p) => <tr key={p.planet} className="border-b border-gray-100"><td className="py-1 pr-2 font-medium">{PLANET_NAMES_RU[p.planet] ?? p.planet}</td><td className="py-1 pr-2 tabular-nums">{p.tropicalLongitude.toFixed(3)}</td><td className="py-1 pr-2 tabular-nums">{p.siderealLongitude.toFixed(3)}</td><td className="py-1 pr-2">{NAKSHATRA_NAMES_RU[p.nakshatraIndex] ?? `№${p.nakshatraIndex + 1}`} · пада {p.pada}</td></tr>)}</tbody></table></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Ретроградность <TermTooltip term="retrograde" /></h4>
          <p className="mt-1 text-sm text-gray-700">{retrograde.length ? retrograde.map((p) => PLANET_NAMES_RU[p.planet] ?? p.planet).join(', ') : 'Ретроградных классических планет не обнаружено.'}</p>
          <p className="mt-1 text-xs text-gray-500">{report.planets.filter((p) => p.motion).map((p) => (PLANET_NAMES_RU[p.planet] ?? p.planet) + ' ' + p.motion!.dailyMotion.toFixed(3) + '°/сутки').join(' · ')}</p>
        </div>
        <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Близость к Солнцу (традиционный критерий сожжения)</h4>
          <p className="mt-1 text-sm text-gray-700">{report.planets.filter((p) => p.combustion.threshold !== null).map((p) => (PLANET_NAMES_RU[p.planet] ?? p.planet) + ': расстояние до Солнца ' + p.combustion.separation!.toFixed(2) + '° при пороге ' + p.combustion.threshold + '° — ' + (p.combustion.isCombust ? 'попадает под критерий' : 'не попадает под критерий')).join('; ')}</p>
          <p className="mt-1 text-xs text-gray-500">В разных школах используются разные пороговые расстояния. Поэтому отметка «сожжена» означает только соответствие выбранному в приложении правилу, а не физическое повреждение планеты или человека.</p>
        </div>
      </div>
      <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Соединения: знак и градусный орбис отдельно</h4>
        <p className="mt-1 text-xs text-gray-600">Для этого расчёта соединением по градусам считается расстояние не более 8°. Орбис — допустимое отклонение от точного угла. Нахождение в одном знаке само по себе ещё не означает тесного соединения.</p>
        <div className="mt-2 flex flex-wrap gap-2">{report.conjunctions.filter((p) => p.sameSign || p.withinDegreeOrb).map((p) =>
          <span key={p.planet1 + '-' + p.planet2} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-gray-700">
            {PLANET_NAMES_RU[p.planet1] ?? p.planet1} + {PLANET_NAMES_RU[p.planet2] ?? p.planet2}: расстояние {p.angularSeparation.toFixed(2)}° · {p.classification}
          </span>)}</div>
      </div>
      <div className="rounded-lg bg-white p-3"><h4 className="text-sm font-semibold">Угловые аспекты и орбисы <TermTooltip term="orb" /></h4>
        {report.aspects.length ? <ul className="mt-2 space-y-1 text-xs text-gray-700">{report.aspects.slice(0, 10).map((a) =>
          <li key={a.planet1 + '-' + a.planet2 + '-' + a.aspect}>{PLANET_NAMES_RU[a.planet1] ?? a.planet1} — {PLANET_NAMES_RU[a.planet2] ?? a.planet2}: {a.aspect}, угловое расстояние {a.separation.toFixed(2)}°, отклонение от точного угла {a.orb.toFixed(2)}° (допуск {a.maxOrb}°); {a.phase === 'unknown' ? 'фаза неизвестна' : a.phase === 'applying' ? 'расстояние сокращается' : 'расстояние увеличивается'}</li>)}</ul>
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
