import { useMemo, useState } from 'react';
import { AlertTriangle, GitMerge, ShieldCheck } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import { buildIntegratedNatalAnalysis, type IntegratedAreaSynthesis, type IntegratedEvidence } from '../../utils/integratedNatalAnalysis';
import { GlassCard } from '../common/GlassCard';

interface Props { natalChart: NatalChart; }

const PLANETS: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
const PLANET_MEANINGS: Record<string, string> = {
  Sun: 'самостоятельность, уверенность, цели и желание проявить себя',
  Moon: 'эмоции, привычки, чувство безопасности и повседневные потребности',
  Mars: 'инициатива, решительность, действия и умение отстаивать своё',
  Mercury: 'мышление, обучение, речь, анализ и работа с информацией',
  Jupiter: 'знания, развитие, наставничество и жизненные ориентиры',
  Venus: 'отношения, симпатии, творчество, удовольствие и личные ценности',
  Saturn: 'ответственность, дисциплина, терпение и долгосрочные задачи',
  Rahu: 'сильное стремление к новому опыту и необычным целям',
  Ketu: 'углубление, самостоятельное исследование и желание отделить главное от лишнего',
};
const AREA_MEANINGS: Record<string, string> = {
  identity: 'характер, самостоятельность и то, как человек проявляет себя',
  resources: 'личные деньги, заработок, накопления и материальная устойчивость',
  skills: 'обучение, общение, навыки и собственные инициативы',
  home: 'дом, семья, жильё и чувство внутренней опоры',
  creativity: 'творчество, увлечения, самовыражение и тема детей',
  work: 'повседневная работа, обязанности, привычки и забота о себе',
  relationships: 'близкие отношения, брак, партнёрство и договорённости',
  transformation: 'общие деньги, доверие, кризисы и большие перемены',
  wisdom: 'образование, мировоззрение, наставники и расширение кругозора',
  career: 'профессия, ответственность, репутация и карьерное направление',
  gains: 'доходы от деятельности, клиенты, друзья и результаты усилий',
  retreat: 'отдых, личное пространство, расходы и дела, которые человек выполняет в одиночестве',
};
const ASPECT_MEANINGS: Record<string, string> = {
  соединение: 'две темы тесно переплетаются и действуют одновременно',
  оппозиция: 'две темы могут тянуть в разные стороны; важно искать равновесие',
  квадратура: 'между темами может ощущаться напряжение, которое требует действий и пересмотра привычного подхода',
  трин: 'две темы легче находят общий язык и могут поддерживать друг друга',
  секстиль: 'между темами есть возможность для сотрудничества, если человек сам ею пользуется',
  'специальный аспект': 'планеты связаны особым аспектом в принятой системе расчёта',
};
const houseTopic = (house: number) => ({
  1: 'личность и самостоятельность', 2: 'деньги и накопления', 3: 'навыки и общение',
  4: 'дом и семья', 5: 'творчество и дети', 6: 'работа и повседневные обязанности',
  7: 'брак и партнёрство', 8: 'общие деньги и перемены', 9: 'обучение и мировоззрение',
  10: 'профессия и карьера', 11: 'доходы и окружение', 12: 'отдых, расходы и дела в уединении',
}[house] ?? `${house}-й дом`);

function explainEvidence(item: IntegratedEvidence, area: IntegratedAreaSynthesis): string {
  const planetKey = item.factorId.match(/(?:planet|dasha|transit):([A-Z][a-z]+)/)?.[1];
  if (item.source === 'house') {
    const number = Number(item.factorId.match(/house:(\d+)/)?.[1]);
    const lordHouse = item.references.map((ref) => ref.match(/расположен в (\d+)-м доме/)?.[1]).find(Boolean);
    const occupants = item.references.find((ref) => ref.startsWith('Планеты в доме:'));
    const lordReference = item.references.find((ref) => ref.includes('управитель —'));
    const lordName = lordReference?.split('управитель —')[1]?.replace(/[.]/g, '').trim();
    const destination = lordHouse ? houseTopic(Number(lordHouse)) : '';
    return [
      `Дом ${number} в этой астрологической системе связан с темой «${houseTopic(number)}».`,
      lordName ? `У каждого дома есть планета-управитель: это планета, которая управляет знаком этого дома. Здесь управитель — ${lordName}.` : 'Планета-управитель этого дома по доступным данным не определена.',
      lordHouse && lordName ? `${lordName} находится в ${lordHouse}-м доме, который связан с темой «${destination}». Поэтому в традиционной трактовке две области — «${houseTopic(number)}» и «${destination}» — рассматриваются вместе. Например, тема ${area.title.toLowerCase()} может рассматриваться через вопросы ${destination}.` : 'Поскольку положение управителя неизвестно, приложение не делает вывод о связи этой темы с другими домами.',
      occupants ? occupants.replace('Планеты в доме:', 'Планеты, расположенные в этом доме:') : '',
    ].filter(Boolean).join(' ');
  }
  if (item.source === 'planet' && planetKey) {
    const name = PLANETS[planetKey] ?? planetKey;
    const meaning = PLANET_MEANINGS[planetKey] ?? 'свою символическую функцию';
    const placement = item.references.find((ref) => ref.startsWith(name + ':')) ?? item.references.find((ref) => ref.includes('расположен'));
    const ruled = item.references.find((ref) => ref.includes('управляет домами'));
    return `В традиции Джйотиш ${name} связывают с темами «${meaning}». Чтобы понять, почему она включена в разбор сферы «${area.title.toLowerCase()}», смотрим не только на символику планеты, но и на её фактическое положение и дома, которыми она управляет. ${placement ?? 'Положение планеты указано в технических данных.'} ${ruled ?? 'Список домов, которыми управляет планета, в этом расчёте не указан.'} Это объясняет астрологическую связь, но не доказывает, что соответствующее событие произойдёт.`;
  }
  if (item.source === 'dasha' && planetKey) {
    const name = PLANETS[planetKey] ?? planetKey;
    return `Сейчас идёт ${item.title.toLowerCase()}. В системе Вимшоттари Даша каждому отрезку времени соответствует определённая планета. Её символику и положение в вашей карте используют как тему для размышления о периоде. Здесь расчёт связывает планету ${name} со сферой «${area.title.toLowerCase()}». Это не означает, что планета физически вызывает события или что конкретное событие обязательно произойдёт в эти даты.`;
  }
  if (item.source === 'transit') {
    const match = item.factorId.match(/transit:([A-Z][a-z]+):([A-Z][a-z]+):([^:]+):/);
    const transit = match?.[1] ?? '';
    const natal = match?.[2] ?? '';
    const transitName = PLANETS[transit] ?? transit;
    const natalName = PLANETS[natal] ?? natal;
    const aspect = item.statement.split(';')[0].toLowerCase();
    const aspectMeaning = ASPECT_MEANINGS[aspect] ?? 'между планетами отмечена связь по выбранным правилам';
    return `Расчёт сравнивает сегодняшнее положение ${transitName} с положением ${natalName} в момент рождения. Он обнаружил аспект «${aspect}» — геометрическую связь между двумя положениями планет. В традиционной трактовке ${transitName} связывают с темами «${PLANET_MEANINGS[transit] ?? 'текущего периода'}», а ${natalName} — с темами «${PLANET_MEANINGS[natal] ?? 'натальной карты'}». ${aspectMeaning.charAt(0).toUpperCase() + aspectMeaning.slice(1)} Поэтому сфера «${area.title.toLowerCase()}» включена в обзор. Это символическая трактовка, а не прогноз неизбежного события.`;
  }
  if (item.source === 'varga') {
    const division = item.factorId.match(/D(\d+)/)?.[1] ?? '';
    const d1 = item.references.find((ref) => ref.startsWith('D1 дом'));
    const projected = item.references.find((ref) => ref.startsWith(`D${division}, дом`));
    return `Для дополнительной проверки темы «${area.title.toLowerCase()}» приложение сопоставляет основную карту рождения D1 и тематическую карту D${division}. D1 показывает общий рисунок карты, а D${division} рассматривает отдельную область по специальному правилу деления знаков. ${d1 ? `В основной карте: ${d1}` : ''} ${projected ? `В дополнительной карте: ${projected}` : 'Отдельные показатели тематической карты приведены в технических данных.'} Совпадение трактовок может сделать их согласованнее внутри этой системы, но дополнительная карта не является независимым подтверждением и не заменяет D1.`;
  }
  if (item.source === 'yoga') {
    const evidence = item.references.filter((ref) => !/не проверено|не удалось|ограничен/i.test(ref)).slice(0, 3);
    return `В карте отмечено сочетание «${item.title}». Йога — это название набора условий, которые должны одновременно выполняться для определённых планет и домов. Приложение включило её в тему «${area.title.toLowerCase()}», потому что среди домов, участвующих в комбинации, есть дом этой сферы. ${evidence.length ? `Что именно обнаружено: ${evidence.join('; ')}.` : 'Состав комбинации можно посмотреть в технических основаниях.'} Само название йоги не означает, что результат обязательно будет положительным или что событие произойдёт.`;
  }
  return item.statement;
}
function evidenceTitle(item: IntegratedEvidence): string {
  if (item.source !== 'transit') return item.title;
  const match = item.factorId.match(/transit:([A-Z][a-z]+):([A-Z][a-z]+):([^:]+):/);
  if (!match) return item.title;
  return `Транзитное ${PLANETS[match[1]] ?? match[1]} к натальной планете ${PLANETS[match[2]] ?? match[2]} — ${match[3]}`;
}
function sourceFamilyName(family: string): string {
  return family === 'natal-structure' ? 'натальная карта'
    : family === 'varga-projection' ? 'дополнительные карты'
      : family === 'timing-dasha' ? 'периоды Даши'
        : family === 'timing-transit' ? 'транзиты' : family;
}

function EvidenceCard({ item, area }: { item: IntegratedEvidence; area: IntegratedAreaSynthesis }) {
  const [expanded, setExpanded] = useState(false);
  const sourceName = item.source === 'house' ? 'Дом и его управитель'
    : item.source === 'planet' ? 'Положение планеты'
      : item.source === 'yoga' ? 'Комбинация планет'
        : item.source === 'varga' ? 'Дополнительная карта'
          : item.source === 'dasha' ? 'Текущий период'
            : 'Транзит';
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-indigo-700">{sourceName}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{evidenceTitle(item)}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">{explainEvidence(item, area)}</p>
      {item.references.length > 0 && <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-xs font-medium text-indigo-700">{expanded ? 'Скрыть исходные данные расчёта' : 'Посмотреть исходные данные расчёта'}</button>}
      {expanded && <ul className="mt-2 list-disc space-y-1 pl-4">{item.references.filter(Boolean).slice(0, 6).map((ref, index) => <li key={index} className="text-xs text-gray-500">{ref}</li>)}</ul>}
    </div>
  );
}

function AreaCard({ area }: { area: IntegratedAreaSynthesis }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? area.evidence : area.evidence.slice(0, 3);
  const familyNames = [...new Set(area.evidence.map((item) => item.source))].map((source) =>
    source === 'house' ? 'дома' : source === 'planet' ? 'планеты' : source === 'yoga' ? 'комбинации планет'
      : source === 'varga' ? 'дополнительные карты' : source === 'dasha' ? 'периоды' : 'транзиты',
  );
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h4 className="font-semibold text-gray-900">{area.title}</h4><p className="mt-1 text-xs text-gray-500">{AREA_MEANINGS[area.id]}</p></div>
        <span className={`rounded-full px-2 py-1 text-xs ${area.dataStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : area.dataStatus === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {area.dataStatus === 'complete' ? 'Есть расчётные основания' : area.dataStatus === 'partial' ? 'Часть данных отсутствует' : 'Оснований для вывода нет'}
        </span>
      </div>
      {area.evidence.length ? <>
        <p className="text-sm text-gray-700">Для этой темы расчёт использовал {area.uniqueFactorCount} отдельных оснований из разделов: {familyNames.join(', ')}. Это число показывает количество учтённых факторов, а не силу их влияния, важность темы или вероятность события.</p>
        {visible.map((item) => <EvidenceCard key={item.id} item={item} area={area} />)}
        {area.evidence.length > 3 && <button type="button" onClick={() => setExpanded((value) => !value)} className="text-xs font-semibold text-indigo-700">{expanded ? 'Свернуть' : `Показать остальные объяснения (${area.evidence.length})`}</button>}
      </> : <p className="text-sm text-gray-600">В рассчитанных показателях нет достаточных оснований, чтобы делать персональный вывод по этой теме.</p>}
      {area.contradictions.map((item) => <p key={item} className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{item}</p>)}
    </article>
  );
}

export function NatalIntegratedSynthesisSection({ natalChart }: Props) {
  const report = useMemo(() => buildIntegratedNatalAnalysis(natalChart), [natalChart]);
  const prominentAreas = [...report.areas].filter((area) => area.uniqueFactorCount > 0)
    .sort((a, b) => b.uniqueFactorCount - a.uniqueFactorCount).slice(0, 3);
  return (
    <GlassCard>
      <section className="space-y-4">
        <div className="flex items-start gap-3 border-b border-gray-200 pb-3">
          <div className="rounded-xl bg-indigo-50 p-2"><GitMerge className="h-5 w-5 text-indigo-700" /></div>
          <div><h3 className="text-lg font-bold text-gray-900">Какие темы чаще встречаются в расчётах карты</h3><p className="mt-1 text-sm text-gray-600">Сравнение расчётных оснований по разным жизненным сферам. Число оснований не определяет важность темы и не предсказывает события.</p></div>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="font-semibold text-gray-900">{prominentAreas.length ? `Чаще всего расчёты выделяют сферу «${prominentAreas[0].title.toLowerCase()}».` : 'Пока недостаточно данных для выделения главной темы.'}</p>
          <p className="mt-1 text-sm text-gray-700">{prominentAreas.length ? `В этой сфере найдено больше отдельных расчётных оснований, чем в других. Поэтому она чаще упоминается в астрологическом разборе. Это не означает, что она важнее остальных сфер или обязательно станет главным событием жизни.` : 'Проверьте дату, время и место рождения, а также полноту рассчитанных положений.'}</p>
          <p className="mt-2 text-xs text-gray-600">В расчёт включены {9 - report.dataQuality.missingPlanets.length} из 9 планет и {12 - report.dataQuality.missingHouses.length} из 12 домов.</p>
        </div>
        {prominentAreas.length > 1 && <section className="space-y-2"><h4 className="text-sm font-semibold text-gray-800">Следующие темы по числу расчётных оснований</h4><div className="grid gap-2 md:grid-cols-2">{prominentAreas.slice(1).map((area) => <div key={area.id} className="rounded-lg border border-gray-200 p-3"><p className="text-sm font-semibold text-gray-900">{area.title}</p><p className="mt-1 text-sm text-gray-600">{AREA_MEANINGS[area.id]}</p></div>)}</div></section>}
        {report.repeatedThemes.length > 0 && <section className="space-y-2"><h4 className="text-sm font-semibold text-gray-800">Темы, которые повторяются в разных разделах анализа</h4>{report.repeatedThemes.map((item) => <p key={item.area} className="rounded-lg border border-indigo-100 p-3 text-sm text-gray-700"><strong>{item.title}:</strong> эта тема встречается в нескольких разделах: {item.sourceFamilies.map(sourceFamilyName).join(', ')}. Разделы используют одну и ту же астрологическую модель, поэтому повторение не является независимым доказательством и не гарантирует событие.</p>)}</section>}
        {report.contradictions.length > 0 && <section className="space-y-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" />Где показатели неоднозначны</h4>{report.contradictions.map((item, index) => <div key={item.area + index} className="rounded-lg bg-amber-50 p-3"><p className="text-sm font-medium text-amber-900">{item.title}</p><p className="mt-1 text-sm text-amber-800">В этой сфере есть как поддерживающие, так и требующие внимания показатели. Поэтому её нельзя описать только как лёгкую или только как сложную.</p></div>)}</section>}
        <section className="space-y-2"><h4 className="text-sm font-semibold text-gray-800">Объяснение по всем жизненным сферам</h4><div className="grid gap-3 lg:grid-cols-2">{report.areas.map((area) => <AreaCard key={area.id} area={area} />)}</div></section>
        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800"><ShieldCheck className="h-4 w-4" />Технические детали и ограничения</summary>
          <ul className="mt-3 list-disc space-y-1 pl-5">{report.methodology.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">{item}</li>)}</ul>
          {report.dataQuality.warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{report.dataQuality.warnings.map((item, index) => <li key={index} className="text-xs text-amber-800">{item}</li>)}</ul>}
          {report.dataQuality.missingPlanets.length > 0 && <p className="mt-2 text-xs text-gray-600">Нет данных по планетам: {report.dataQuality.missingPlanets.map((item) => PLANETS[item]).join(', ')}</p>}
          {report.dataQuality.missingHouses.length > 0 && <p className="mt-1 text-xs text-gray-600">Нет данных по домам: {report.dataQuality.missingHouses.join(', ')}</p>}
        </details>
      </section>
    </GlassCard>
  );
}
