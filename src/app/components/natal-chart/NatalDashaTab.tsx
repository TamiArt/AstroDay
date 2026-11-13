import { CalendarClock, ChevronDown, Clock3, Layers3, ShieldAlert, Sparkles } from 'lucide-react';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import { analyzeVimshottariDasha, type DashaLayerAnalysis, type DashaVargaEvidence } from '../../utils/vimshottariDashaAnalysis';
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface NatalDashaTabProps { natalChart: NatalChartType; }
const formatDate = (date: Date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
const layerNames = { mahadasha: 'Махадаша', antardasha: 'Антардаша', pratyantardasha: 'Пратьянтардаша' };
const PLANET_NAMES_RU: Record<string, string> = { Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий', Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету' };

function VargaEvidence({ item }: { item: DashaVargaEvidence }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{item.name} · {item.topic}</p>
        <span className={`rounded-full px-2 py-1 text-xs ${item.relevantHouseRelation === 'no-direct-house-link' ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-700'}`}>
          {item.relevantHouseRelation === 'occupies-and-rules' ? 'Находится в тематическом доме и управляет им' : item.relevantHouseRelation === 'occupies' ? 'Находится в тематическом доме' : item.relevantHouseRelation === 'rules' ? 'Управляет тематическим домом' : item.relevantHouseRelation === 'no-direct-house-link' ? 'Прямой связи не найдено' : 'Нет данных'}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-700">{item.planetSign ? `Планета находится в знаке ${item.planetSign}, в ${item.planetHouse}-м доме.` : 'Положение планеты не определено.'}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.relevantHouseRelation === 'occupies-and-rules'
        ? 'Планета одновременно находится в доме этой темы и управляет им — это прямая связь.'
        : item.relevantHouseRelation === 'occupies'
          ? 'Планета находится в доме, связанном с темой периода.'
          : item.relevantHouseRelation === 'rules'
            ? 'Планета управляет домом, связанным с темой периода.'
            : 'Прямую связь этой планеты с тематическим домом по выбранным правилам не нашли.'}</p>
      <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-gray-500">Подробное объяснение расчёта</summary><p className="mt-1 text-xs text-gray-500">{item.explanation}</p></details>
    </div>
  );
}

const PERIOD_PLANET_MEANINGS: Record<string, string> = {
  Солнце: 'личные цели, уверенность, самостоятельность и отношения с авторитетами',
  Луна: 'эмоциональное состояние, семья, привычки и ощущение безопасности',
  Марс: 'инициатива, энергия, конкуренция и умение действовать решительно',
  Меркурий: 'обучение, общение, документы, анализ и работа с информацией',
  Юпитер: 'образование, наставники, развитие и жизненные принципы',
  Венера: 'отношения, творчество, комфорт, удовольствия и личные ценности',
  Сатурн: 'ответственность, дисциплина, терпение и долгосрочные обязательства',
  Раху: 'амбиции, необычный опыт и стремление выйти за привычные рамки',
  Кету: 'самостоятельное исследование, концентрация и освобождение от лишнего',
};
const PERIOD_HOUSE_MEANINGS: Record<number, string> = {
  1: 'личность и самостоятельность', 2: 'деньги и накопления', 3: 'навыки и общение',
  4: 'дом и семья', 5: 'творчество и дети', 6: 'работа и повседневные обязанности',
  7: 'брак и партнёрство', 8: 'общие ресурсы и перемены', 9: 'обучение и мировоззрение',
  10: 'профессия и карьера', 11: 'доходы и окружение', 12: 'отдых и уединение',
};

function PlanetProfile({ analysis }: { analysis: DashaLayerAnalysis }) {
  const { profile } = analysis;
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <h5 className="text-sm font-semibold text-indigo-900">Что означает период этой планеты простыми словами</h5>
        <p className="mt-1 text-sm leading-relaxed text-gray-800">В системе Вимшоттари Даша каждому периоду соответствует определённая планета. В традиции этой системы её рассматривают как символическую тему времени, а не как причину событий. Для трактовки важно посмотреть, где планета находится в вашей карте и какими домами управляет.</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-800"><strong>{profile.planetName}</strong> в традиционной символике связывают с темами: {PERIOD_PLANET_MEANINGS[profile.planetName] ?? 'качествами этой планеты'}. В вашей карте она {profile.house ? `находится в ${profile.house}-м доме — сфере «${PERIOD_HOUSE_MEANINGS[profile.house] ?? 'жизненные задачи'}»` : 'имеет неизвестное положение по дому'}{profile.ruledHouses.length ? ` и управляет ${profile.ruledHouses.map((house) => `${house}-м домом (${PERIOD_HOUSE_MEANINGS[house]})`).join(', ')}` : ''}. <strong>Управляет домом</strong> здесь означает, что планета считается хозяином знака, стоящего на начале этого дома. Поэтому в рамках астрологической модели темы этих домов включают в разбор периода.</p>
        <p className="mt-2 text-xs text-gray-600">Это объясняет логику традиционной трактовки. Оно не предсказывает конкретное событие и не означает, что планета физически вызывает перемены.</p>
      </section>

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-gray-800">Положение планеты и дополнительные характеристики</summary>
        <div className="mt-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Положение планеты в основной карте</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{profile.planetName}</p>
          <p className="text-sm text-gray-700">{profile.sign}, {profile.degreeInSign.toFixed(2)}° · {profile.house ? `${profile.house}-й дом` : 'дом не определён'}</p>
          <p className="mt-2 text-sm text-gray-700">Какими сферами управляет: {profile.ruledHouses.length ? profile.ruledHouses.map((house) => `${house}-й дом (${PERIOD_HOUSE_MEANINGS[house] ?? 'отдельная тема'})`).join('; ') : 'в этой карте не определено'}</p>
          <p className="mt-1 text-sm text-gray-700">Достоинство <TermTooltip term="dignity" />: {profile.dignity?.label ?? 'не определено'}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Планета, управляющая знаком, где находится эта планета — диспозитор <TermTooltip term="dispositor" /></p>
          {profile.dispositor ? <>
            <p className="mt-1 text-lg font-bold text-gray-900">{PLANET_NAMES_RU[profile.dispositor.planet] ?? profile.dispositor.planet}</p>
            <p className="text-sm text-gray-700">{profile.dispositor.sign} · {profile.dispositor.house ? `${profile.dispositor.house}-й дом` : 'дом не определён'}</p>
            <p className="mt-1 text-sm text-gray-700">Достоинство: {profile.dispositor.dignity?.label ?? 'не определено'}</p>
            <p className="mt-1 text-xs text-gray-600">Управляет домами: {profile.dispositor.ruledHouses.join(', ') || 'не определены'}</p>
          </> : <p className="mt-2 text-sm text-gray-600">Диспозитор не удалось определить.</p>}
        </div>
      </div>

        </div>
      </details>

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-gray-800">Какие положения карты использованы для этой связи</summary>
        <ul className="mt-2 space-y-2">{analysis.whyHighlighted.map((reason, index) => <li key={index} className="flex gap-2 text-xs leading-relaxed text-gray-600"><span className="font-bold text-indigo-600">•</span><span>{reason}</span></li>)}</ul>
      </details>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-3">
          <h5 className="text-sm font-semibold text-gray-900">Аспекты от планеты <TermTooltip term="aspect" /></h5>
          {profile.aspectsFromPlanet.length ? <ul className="mt-2 space-y-1">{profile.aspectsFromPlanet.map((item, i) => <li key={i} className="text-xs text-gray-700">{item.kind === 'conjunction' ? 'Соединение' : 'Граха-дришти'} с {PLANET_NAMES_RU[item.target] ?? item.target} ({item.targetHouse}-й дом)</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">Не обнаружены по выбранной системе.</p>}
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <h5 className="text-sm font-semibold text-gray-900">Аспекты к планете <TermTooltip term="aspect" /></h5>
          {profile.aspectsToPlanet.length ? <ul className="mt-2 space-y-1">{profile.aspectsToPlanet.map((item, i) => <li key={i} className="text-xs text-gray-700">{PLANET_NAMES_RU[item.source] ?? item.source} ({item.sourceHouse}-й дом)</li>)}</ul> : <p className="mt-2 text-xs text-gray-500">Не обнаружены по выбранной системе.</p>}
        </div>
      </section>

      <section>
        <h5 className="mb-2 text-sm font-semibold text-gray-900">Какие сферы затрагивает эта планета в основной карте</h5>
        {profile.lifeAreaLinks.length ? <div className="grid gap-2 md:grid-cols-2">{profile.lifeAreaLinks.map((area) => <div key={area.area} className="rounded-lg border border-gray-200 bg-white p-3"><p className="text-sm font-semibold text-gray-900">{area.label}</p><p className="mt-1 text-xs text-gray-600">Дома: {area.relevantHouses.join(', ')}</p><ul className="mt-1 list-disc space-y-1 pl-4">{area.reasons.map((reason) => <li key={reason} className="text-xs text-gray-700">{reason}</li>)}</ul></div>)}</div> : <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Прямые связи с настроенными жизненными сферами не найдены. Это не означает, что тема исключена из жизни.</p>}
      </section>

      <section>
        <h5 className="mb-2 text-sm font-semibold text-gray-900">Дополнительная проверка темы по дробным картам</h5>
        {profile.vargas.length ? <div className="grid gap-2 md:grid-cols-2">{profile.vargas.map((item, index) => <VargaEvidence key={`${item.division}-${index}`} item={item} />)}</div> : <p className="text-sm text-gray-600">Для выявленных связей нет соответствующей профильной варги.</p>}
      </section>

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-gray-800">Основания и ограничения</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">{profile.evidence.map((item) => <li key={item} className="text-xs text-gray-700">{item}</li>)}</ul>
        <ul className="mt-2 list-disc space-y-1 pl-5">{profile.limitations.map((item) => <li key={item} className="text-xs text-gray-500">{item}</li>)}</ul>
      </details>
    </div>
  );
}

function PeriodCard({ analysis, active = false }: { analysis: DashaLayerAnalysis; active?: boolean }) {
  return (
    <details className={`rounded-xl border bg-white p-4 ${active ? 'border-purple-300 shadow-sm' : 'border-gray-200'}`} open={active}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{analysis.profile.planetName} · {layerNames[analysis.layer]}{active ? ' · действует сейчас' : ''}</p>
          <p className="mt-1 text-xs text-gray-600">{formatDate(analysis.startDate)} — {formatDate(analysis.endDate)}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </summary>
      <div className="mt-4"><PlanetProfile analysis={analysis} /></div>
    </details>
  );
}

export function NatalDashaTab({ natalChart }: NatalDashaTabProps) {
  const report = analyzeVimshottariDasha(natalChart);
  const current = report.current;
  const now = new Date();
  const duration = current.mahadasha.endDate.getTime() - current.mahadasha.startDate.getTime();
  const progress = Math.max(0, Math.min(100, ((now.getTime() - current.mahadasha.startDate.getTime()) / duration) * 100));
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-3 border-b border-purple-100 pb-3">
          <div className="rounded-lg bg-purple-100 p-2"><CalendarClock className="h-6 w-6 text-purple-700" /></div>
          <div><h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">Вимшоттари Даша <TermTooltip term="dasha" /></h3><p className="text-sm text-gray-600">Три уровня периода и их связь с вашей натальной картой</p></div>
        </div>
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">Как строится анализ</p>
          <p className="mt-1 text-sm leading-relaxed text-blue-900">Здесь показаны три вложенных уровня времени: Махадаша — большой период, Антардаша — подпериод внутри него, Пратьянтардаша — ещё более короткий этап. Название указывает, с какой планетой связан каждый уровень в традиционной трактовке, но не означает, что в эти даты обязательно произойдёт определённое событие. Каждую планету сначала проверяем по основной карте рождения D1, а дополнительные карты (варги) используем только для уточнения.</p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Текущая комбинация</p><h3 className="mt-1 text-xl font-bold text-gray-900">{current.mahadasha.profile.planetName} / {current.antardasha?.profile.planetName ?? '—'} / {current.pratyantardasha?.profile.planetName ?? '—'}</h3><p className="mt-1 text-xs text-gray-600">Большой период / подпериод / короткий этап</p></div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">Расчёт на текущую дату</span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600"><span>Ход Махадаши</span><span>{Math.round(progress)}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-purple-600" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-xs text-gray-600">{formatDate(current.mahadasha.startDate)} — {formatDate(current.mahadasha.endDate)}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3"><p className="text-xs font-semibold text-purple-800">Махадаша</p><p className="mt-1 font-bold text-gray-900">{current.mahadasha.profile.planetName}</p><p className="text-xs text-gray-600">{formatDate(current.mahadasha.startDate)} — {formatDate(current.mahadasha.endDate)}</p></div>
          <div className="rounded-lg border border-pink-200 bg-pink-50 p-3"><p className="text-xs font-semibold text-pink-800">Антардаша</p><p className="mt-1 font-bold text-gray-900">{current.antardasha?.profile.planetName ?? 'Нет данных'}</p><p className="text-xs text-gray-600">{current.antardasha ? `${formatDate(current.antardasha.startDate)} — ${formatDate(current.antardasha.endDate)}` : '—'}</p></div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3"><p className="text-xs font-semibold text-indigo-800">Пратьянтардаша</p><p className="mt-1 font-bold text-gray-900">{current.pratyantardasha?.profile.planetName ?? 'Нет данных'}</p><p className="text-xs text-gray-600">{current.pratyantardasha ? `${formatDate(current.pratyantardasha.startDate)} — ${formatDate(current.pratyantardasha.endDate)}` : '—'}</p></div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-700" /><h3 className="text-lg font-semibold text-gray-900">Почему выделены именно эти темы</h3></div>
        <p className="mt-2 mb-4 text-sm text-gray-600">Период сам по себе не описывает вашу жизнь. Приложение сопоставляет его планету с конкретными домами вашей карты: где она находится и какими домами управляет. Ниже показаны эти связи и исходные данные. Дополнительные карты могут уточнить трактовку, но не заменяют основную карту рождения.</p>
        <PeriodCard analysis={current.mahadasha} active />
        {current.antardasha && <PeriodCard analysis={current.antardasha} active />}
        {current.pratyantardasha && <PeriodCard analysis={current.pratyantardasha} active />}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-indigo-700" /><h3 className="text-lg font-semibold text-gray-900">Короткие периоды внутри текущей Махадаши</h3></div>
        <p className="mt-2 mb-3 text-sm text-gray-600">Внутри большого периода последовательно меняются более короткие периоды. Откройте нужный, чтобы увидеть, с какими жизненными темами связан его управитель.</p>
        <div className="space-y-2">{report.mahadashaAntardashas.map((item, index) => <PeriodCard key={`${item.planet}-${index}`} analysis={item} active={item.planet === current.antardasha?.planet && item.startDate.getTime() === current.antardasha.startDate.getTime()} />)}</div>
      </GlassCard>

      {current.antardasha && <GlassCard>
        <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-indigo-700" /><h3 className="text-lg font-semibold text-gray-900">Ещё более короткие этапы текущего подпериода</h3></div>
        <p className="mt-2 mb-3 text-sm text-gray-600">Это самые короткие из отображаемых этапов. Они уточняют, какая планета символически выделяется внутри текущего подпериода.</p>
        <div className="space-y-2">{report.antardashaPratyantardashas.map((item, index) => <PeriodCard key={`${item.planet}-${index}`} analysis={item} active={item.planet === current.pratyantardasha?.planet && item.startDate.getTime() === current.pratyantardasha.startDate.getTime()} />)}</div>
      </GlassCard>}

      <GlassCard>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-700" /><h4 className="font-semibold text-amber-950">Методика и ограничения</h4></div>
          <ul className="mt-2 list-disc space-y-1 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs leading-relaxed text-amber-900">{item}</li>)}</ul>
          <ul className="mt-3 list-disc space-y-1 pl-5">{report.warnings.map((item) => <li key={item} className="text-xs leading-relaxed text-amber-900">{item}</li>)}</ul>
        </div>
      </GlassCard>
    </div>
  );
}
