import { useMemo, useState } from 'react';
import { ChevronDown, Orbit, ShieldAlert } from 'lucide-react';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import { analyzeTransits, type TransitAnalysisReport, type TransitLifeArea, type TransitNatalAspect, type TransitHouseLordHit, type TransitHousePosition } from '../../utils/transitAnalysis';
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface NatalTransitsTabProps { natalChart: NatalChartType; }
const formatDate = (date: Date) => date.toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const PLANETS: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };
const PLANET_MEANINGS: Record<string, string> = {
  Sun: 'уверенность, цели, самостоятельность и желание проявить себя',
  Moon: 'эмоции, привычки, чувство безопасности и повседневные потребности',
  Mars: 'энергия, решительность, инициативность и умение отстаивать своё',
  Mercury: 'мышление, обучение, общение, анализ и обмен информацией',
  Jupiter: 'развитие, знания, наставничество и жизненные ориентиры',
  Venus: 'любовь, симпатии, творчество, удовольствие и личные ценности',
  Saturn: 'ответственность, дисциплина, ограничения и долгосрочные задачи',
  Rahu: 'стремление к новому, амбиции и непривычный опыт',
  Ketu: 'самостоятельное исследование, концентрация и отказ от лишнего',
};
const HOUSE_MEANINGS: Record<number, string> = {
  1: 'личность, здоровье, самоощущение и самостоятельные действия',
  2: 'личные деньги, накопления, речь и семейные ценности',
  3: 'общение, обучение, навыки и собственные инициативы',
  4: 'дом, семья, жильё и внутреннее чувство опоры',
  5: 'творчество, увлечения, романтика и дети',
  6: 'работа, повседневные обязанности, режим и решение проблем',
  7: 'брак, близкие отношения, партнёрство и договорённости',
  8: 'общие деньги, доверие, кризисы и большие перемены',
  9: 'образование, мировоззрение, наставники и дальние поездки',
  10: 'профессия, карьера, ответственность и репутация',
  11: 'доходы, клиенты, друзья, сообщества и результаты усилий',
  12: 'отдых, восстановление, расходы, уединение и завершение дел',
};
const ASPECT_MEANINGS: Record<string, string> = {
  соединение: 'Темы двух планет тесно переплетаются. Их влияние в символической трактовке проявляется одновременно.',
  оппозиция: 'Может ощущаться противоречие между двумя темами. Важно не выбирать одну сторону автоматически, а искать равновесие.',
  квадратура: 'Может возникать напряжение, которое подталкивает пересмотреть привычный подход и что-то изменить.',
  трин: 'Две темы легче поддерживают друг друга. Возможностями всё равно нужно пользоваться осознанно.',
  секстиль: 'Есть возможность наладить взаимодействие двух тем, но результат требует собственных действий.',
  'специальный аспект': 'Планеты связаны особым аспектом в принятой системе Джйотиш.',
};
const ru = (planet: string) => PLANETS[planet] ?? planet;
const houseMeaning = (house: number | null) => house ? HOUSE_MEANINGS[house] : 'жизненная сфера пока не определена';

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">{title}</h3>{count !== undefined && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{count}</span>}</div>{children}</section>;
}
function PositionCard({ item }: { item: TransitHousePosition }) {
  return <article className="rounded-lg border border-gray-200 bg-white p-3">
    <p className="font-semibold text-gray-900">{item.planetName}</p>
    <p className="text-sm text-gray-700">{item.sign} {item.degree.toFixed(2)}°</p>
    <p className="mt-1 text-sm font-medium text-indigo-700">{item.natalHouse}-й дом вашей карты</p>
    <p className="mt-2 text-sm leading-relaxed text-gray-700">Сейчас эта планета проходит по сфере «{houseMeaning(item.natalHouse)}». В астрологической трактовке это делает её темы — {PLANET_MEANINGS[item.planet]} — более заметными в повседневных обстоятельствах.</p>
  </article>;
}
function AspectCard({ item }: { item: TransitNatalAspect }) {
  const aspectMeaning = ASPECT_MEANINGS[item.aspect] ?? ASPECT_MEANINGS['специальный аспект'];
  return <article className="rounded-lg border border-gray-200 bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-gray-900">{ru(item.transitPlanet)} → ваша натальная {ru(item.natalPlanet)}: {item.aspect}</p>
      <span className="text-xs text-gray-600">Отклонение от точного угла: {item.orb.toFixed(2)}° · расчётный показатель: {item.strength}%</span>
    </div>
    <p className="mt-2 text-sm leading-relaxed text-gray-700">Сейчас транзитная планета {ru(item.transitPlanet)} затрагивает качества вашей натальной планеты {ru(item.natalPlanet)}. {ru(item.transitPlanet)} отвечает за {PLANET_MEANINGS[item.transitPlanet] ?? 'текущие стремления'}, а {ru(item.natalPlanet)} — за {PLANET_MEANINGS[item.natalPlanet] ?? 'личные реакции'}.</p>
    <p className="mt-2 rounded-lg bg-indigo-50 p-3 text-sm leading-relaxed text-indigo-950"><strong>Что означает эта комбинация:</strong> {aspectMeaning} Транзит проходит по {item.transitHouse}-му дому ({houseMeaning(item.transitHouse)}); натальная планета находится в {item.natalHouse ? `${item.natalHouse}-м доме (${houseMeaning(item.natalHouse)})` : 'доме, который не удалось определить'}.</p>
    <p className="mt-2 text-xs text-gray-500">{item.applying === null ? 'Сходится или расходится — данных для определения фазы нет.' : item.applying ? 'Аспект сходящийся: точка аспекта ещё приближается.' : 'Аспект расходящийся: точка точного аспекта уже пройдена.'} Это символическая интерпретация, а не указание на обязательное событие.</p>
  </article>;
}
function LordHitCard({ item }: { item: TransitHouseLordHit }) {
  const relation = item.relation === 'exact-aspect' ? 'образует точный градусный аспект'
    : item.relation === 'graha-drishti' ? 'оказывает традиционный аспект Джйотиш'
      : 'проходит по тому же знаку и дому';
  return <article className="rounded-lg border border-gray-200 bg-white p-3">
    <p className="text-sm font-semibold text-gray-900">{item.house}-й дом — {item.houseTopic}</p>
    <p className="mt-1 text-sm text-gray-700">Управитель этой сферы — {item.lordName}. Сейчас транзитное {item.transitPlanetName} {relation} к его положению в натальной карте.</p>
    <p className="mt-2 text-sm leading-relaxed text-indigo-950">Простыми словами: текущие обстоятельства могут символически затрагивать сферу «{item.houseTopic}» через темы планеты-управителя. Само по себе это не означает, что обязательно произойдёт конкретное событие.</p>
    <details className="mt-2 rounded-lg border border-gray-100 p-2"><summary className="cursor-pointer text-xs font-medium text-gray-600">Техническое основание связи</summary><p className="mt-1 text-xs text-gray-500">{item.detail}</p></details>
  </article>;
}
function AreaCard({ area }: { area: TransitLifeArea }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const dashaNames = area.dashaEvidence.map((item) => item.split(':')[0]).filter(Boolean);
  return <article className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold text-gray-900">{area.label}</h4><span className={`rounded-full px-2 py-1 text-xs ${area.repeated ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{area.repeated ? 'Отмечена и в Даше, и в транзитах' : 'Есть один вид показателей'}</span></div>
    <p className="mt-2 text-sm leading-relaxed text-gray-700">{area.repeated
      ? `Эта тема выделяется сразу двумя способами: её затрагивает текущий период Даши (${dashaNames.join(', ') || 'активные периоды'}) и одновременно транзитные положения или аспекты. В традиционной трактовке это делает тему более заметной для внимания.`
      : area.dashaEvidence.length
        ? `Тема связана с текущими периодами Даши (${dashaNames.join(', ')}). Это символический фон периода; прямого транзитного совпадения по выбранным правилам не найдено.`
        : 'Тема затронута текущими транзитными положениями или аспектами. Совпадения с активными периодами Даши по выбранным правилам не обнаружено.'}</p>
    <p className="mt-1 text-xs text-gray-500">Связанные дома: {area.houses.map((house) => `${house}-й дом — ${houseMeaning(house)}`).join('; ')}.</p>
    {(area.dashaEvidence.length + area.transitEvidence.length) > 0 && <button type="button" onClick={() => setShowEvidence((value) => !value)} className="mt-2 text-xs font-semibold text-indigo-700">{showEvidence ? 'Скрыть основания' : 'Посмотреть, какие расчёты это показывают'}</button>}
    {showEvidence && <div className="mt-2 space-y-2">{area.dashaEvidence.map((item, index) => <p key={`d-${index}`} className="rounded-lg bg-purple-50 p-2 text-xs text-gray-700">{item}</p>)}{area.transitEvidence.map((item, index) => <p key={`t-${index}`} className="rounded-lg bg-blue-50 p-2 text-xs text-gray-700">{item}</p>)}</div>}
  </article>;
}
function TransitReport({ report }: { report: TransitAnalysisReport }) {
  const [showMethod, setShowMethod] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const visibleAreas = showAllAreas ? report.lifeAreas : report.lifeAreas.slice(0, 6);
  return <div className="space-y-6">
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <h3 className="font-semibold text-gray-900">Что такое транзит и как читать этот раздел</h3>
      <p className="mt-1 text-sm text-gray-700">Транзит — это текущее положение планеты на небе. Приложение сравнивает его с вашей картой рождения и показывает символические связи с домами и планетами. Это астрологическая модель для размышления, а не научный прогноз и не обещание событий.</p>
    </div>
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <h3 className="font-semibold text-gray-900">Как читать текущие периоды <TermTooltip term="dasha" /></h3>
      <p className="mt-1 text-sm text-gray-700"><strong>Махадаша</strong> — большой жизненный период, задающий общий фон. <strong>Антардаша</strong> — более короткий этап внутри него. <strong>Пратьянтардаша</strong> — ещё более короткий подпериод, который уточняет текущий отрезок времени. Все три периода действуют одновременно, но не означают три отдельных события.</p>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4"><p className="text-xs font-semibold uppercase text-purple-700">Большой период — Махадаша</p><p className="mt-1 text-lg font-bold text-gray-900">{report.dasha.mahadasha}</p><p className="text-xs text-gray-600">До {formatDate(report.dasha.mahadashaEnd)}</p></div>
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-blue-700">Подпериод — Антардаша</p><p className="mt-1 text-lg font-bold text-gray-900">{report.dasha.antardasha ?? 'Не определена'}</p><p className="text-xs text-gray-600">Уточняет большой период</p>{report.dasha.antardashaEnd && <p className="mt-1 text-xs text-gray-600">До {formatDate(report.dasha.antardashaEnd)}</p>}</div>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-xs font-semibold uppercase text-indigo-700">Короткий подпериод — Пратьянтардаша</p><p className="mt-1 text-lg font-bold text-gray-900">{report.dasha.pratyantardasha ?? 'Не определена'}</p><p className="text-xs text-gray-600">Уточняет ближайший отрезок</p>{report.dasha.pratyantardashaEnd && <p className="mt-1 text-xs text-gray-600">До {formatDate(report.dasha.pratyantardashaEnd)}</p>}</div>
    </div>
    <Section title="Где сейчас сосредоточено внимание по транзитам" count={report.positions.length}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{report.positions.map((item) => <PositionCard key={item.planet} item={item}/>)}</div>
    </Section>
    <Section title="Что означают конкретные аспекты планет" count={report.aspects.length}>
      {report.aspects.length ? <div className="space-y-2">{report.aspects.map((item, index) => <AspectCard key={index} item={item}/>)}</div> : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Сейчас нет точных градусных аспектов в пределах орбисов этой системы. Это не означает отсутствия любых жизненных изменений.</p>}
    </Section>
    <Section title="Когда транзит затрагивает управителя дома" count={report.houseLordHits.length}>
      {report.houseLordHits.length ? <div className="space-y-2">{report.houseLordHits.map((item, index) => <LordHitCard key={index} item={item}/>)}</div> : <p className="text-sm text-gray-600">На этот момент прямых связей с управителями домов по выбранным правилам не обнаружено.</p>}
    </Section>
    <Section title="Темы, которые одновременно выделены Дашей и транзитами" count={report.repeatedThemes.length}>
      {report.repeatedThemes.length ? <div className="grid gap-3 md:grid-cols-2">{report.lifeAreas.filter((area) => area.repeated).map((area) => <AreaCard key={area.id} area={area}/>)}</div> : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Сейчас нет сфер, которые одновременно отмечены активными периодами Даши и транзитами. Это не означает, что в этих сферах ничего не происходит.</p>}
    </Section>
    <Section title="Другие затронутые жизненные сферы" count={report.lifeAreas.length}>
      <div className="grid gap-3 md:grid-cols-2">{visibleAreas.map((area) => <AreaCard key={area.id} area={area}/>)}</div>
      {report.lifeAreas.length > 6 && <button type="button" onClick={() => setShowAllAreas((value) => !value)} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">{showAllAreas ? 'Свернуть' : 'Показать все сферы'}</button>}
    </Section>
    <details className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-amber-900"><ShieldAlert className="h-4 w-4"/>Ограничения и точность интерпретации</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">{report.warnings.map((warning) => <li key={warning} className="text-xs text-amber-900">{warning}</li>)}</ul>
      <button type="button" onClick={() => setShowMethod((value) => !value)} className="mt-3 flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900"><span>Как выполняется расчёт</span><ChevronDown className={`h-4 w-4 transition-transform ${showMethod ? 'rotate-180' : ''}`}/></button>
      {showMethod && <ul className="mt-3 list-disc space-y-2 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul>}
    </details>
  </div>;
}

export function NatalTransitsTab({ natalChart }: NatalTransitsTabProps) {
  const report = useMemo(() => {
    try { return { data: analyzeTransits(natalChart), error: null }; }
    catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Не удалось рассчитать транзиты' }; }
  }, [natalChart]);
  return <div className="space-y-5">
    <GlassCard><div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-100 p-3"><Orbit className="h-6 w-6 text-indigo-700"/></div><div><h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">Транзиты и натальная карта <TermTooltip term="transit" /></h2><p className="mt-1 text-sm text-gray-600">Положение планет на {formatDate(report.data?.moment ?? new Date())}. Здесь показано, какие темы натальной карты символически затрагиваются движением планет на выбранный момент.</p></div></div></GlassCard>
    {report.error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{report.error}</div> : report.data && <TransitReport report={report.data}/>}
  </div>;
}
