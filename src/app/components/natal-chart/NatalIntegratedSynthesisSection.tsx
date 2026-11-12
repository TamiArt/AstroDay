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
  retreat: 'отдых, восстановление, уединение и завершение дел',
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
  10: 'профессия и карьера', 11: 'доходы и окружение', 12: 'отдых и уединение',
}[house] ?? `${house}-й дом`);

function explainEvidence(item: IntegratedEvidence, area: IntegratedAreaSynthesis): string {
  const planetKey = item.factorId.match(/(?:planet|dasha|transit):([A-Z][a-z]+)/)?.[1];
  if (item.source === 'house') {
    const number = Number(item.factorId.match(/house:(\d+)/)?.[1]);
    const lordHouse = item.references.map((ref) => ref.match(/расположен в (\d+)-м доме/)?.[1]).find(Boolean);
    const occupants = item.references.find((ref) => ref.startsWith('Планеты в доме:'));
    const lord = item.references.find((ref) => ref.includes('управитель —'));
    return `Ваша сфера «${area.title.toLowerCase()}» связана с ${number}-м домом — ${houseTopic(number)}. ${lord ?? ''} ${lordHouse ? `Его управитель находится в ${lordHouse}-м доме, поэтому эта тема также связана со сферой «${houseTopic(Number(lordHouse))}».` : ''} ${occupants ?? ''}`.trim();
  }
  if (item.source === 'planet' && planetKey) {
    const name = PLANETS[planetKey] ?? planetKey;
    const meaning = PLANET_MEANINGS[planetKey] ?? 'своя символическая функция';
    const placement = item.references.find((ref) => ref.startsWith(name + ':')) ?? item.references.find((ref) => ref.includes('расположен'));
    const ruled = item.references.find((ref) => ref.includes('управляет домами'));
    return `${name} связан(а) с темами ${meaning}. В вашей карте его положение и дома, которыми он управляет, добавляют эту планету к теме «${area.title.toLowerCase()}». ${placement ?? ''} ${ruled ?? ''}`.trim();
  }
  if (item.source === 'dasha' && planetKey) {
    const name = PLANETS[planetKey] ?? planetKey;
    return `Сейчас действует один из периодов планеты ${name}. В традиционной астрологии это означает, что темы, связанные с ${name.toLowerCase()} ( ${PLANET_MEANINGS[planetKey] ?? 'её символикой'} ), могут становиться заметнее. В этой карте период сопоставлен со сферой «${area.title.toLowerCase()}». Это описание периода, а не обещание конкретного события.`;
  }
  if (item.source === 'transit') {
    const match = item.factorId.match(/transit:([A-Z][a-z]+):([A-Z][a-z]+):([^:]+):/);
    const transit = match?.[1] ?? '';
    const natal = match?.[2] ?? '';
    const transitName = PLANETS[transit] ?? transit;
    const natalName = PLANETS[natal] ?? natal;
    const aspect = item.statement.split(';')[0].toLowerCase();
    const aspectMeaning = ASPECT_MEANINGS[aspect] ?? 'планеты взаимодействуют и затрагивают связанные с ними темы';
    return `Транзитное ${transitName} сейчас образует аспект «${aspect}» к вашей натальной планете ${natalName}. ${transitName} символизирует ${PLANET_MEANINGS[transit] ?? 'текущие внешние обстоятельства'}, а ${natalName} — ${PLANET_MEANINGS[natal] ?? 'личные особенности и привычные реакции'}. ${aspectMeaning.charAt(0).toUpperCase() + aspectMeaning.slice(1)}. Это повод обратить внимание на сферу «${area.title.toLowerCase()}», а не прогноз неизбежного события.`;
  }
  if (item.source === 'varga') {
    const division = item.factorId.match(/D(\d+)/)?.[1] ?? '';
    return `Дополнительная карта D${division} рассматривает тему «${area.title.toLowerCase()}» с отдельной стороны. Её показатели нужно читать вместе с основной картой D1: они уточняют тему, но не отменяют и не заменяют основные натальные положения.`;
  }
  if (item.source === 'yoga') {
    return `В карте обнаружена комбинация «${item.title}». В традиционной астрологии такую комбинацию рассматривают как дополнительный оттенок темы «${area.title.toLowerCase()}». Её значение зависит от положения участвующих планет и других показателей карты.`;
  }
  return item.statement;
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
      <p className="mt-1 text-sm font-semibold text-gray-900">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">{explainEvidence(item, area)}</p>
      {item.references.length > 0 && <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-xs font-medium text-indigo-700">{expanded ? 'Скрыть технические основания' : 'Почему сделан такой вывод?'}</button>}
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
          {area.dataStatus === 'complete' ? 'Есть показатели' : area.dataStatus === 'partial' ? 'Часть данных отсутствует' : 'Показателей нет'}
        </span>
      </div>
      {area.evidence.length ? <>
        <p className="text-sm text-gray-700">В вашей карте эта тема отмечена через: {familyNames.join(', ')}. Найдено {area.uniqueFactorCount} разных показателя. Это не рейтинг важности и не оценка вероятности события.</p>
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
          <div><h3 className="text-lg font-bold text-gray-900">Главные темы натальной карты</h3><p className="mt-1 text-sm text-gray-600">Объяснение того, какие жизненные сферы выделяются и какие показатели на это указывают.</p></div>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="font-semibold text-gray-900">{prominentAreas.length ? `Наиболее заметная тема — «${prominentAreas[0].title.toLowerCase()}».` : 'Пока недостаточно данных для выделения главной темы.'}</p>
          <p className="mt-1 text-sm text-gray-700">{prominentAreas.length ? `В этой сфере собрано больше разных показателей, чем в других. Это означает, что тема чаще возвращается в символическом описании карты, но не означает, что она обязательно станет главным событием жизни.` : 'Проверьте дату, время и место рождения, а также полноту рассчитанных положений.'}</p>
          <p className="mt-2 text-xs text-gray-600">В расчёт включены {9 - report.dataQuality.missingPlanets.length} из 9 планет и {12 - report.dataQuality.missingHouses.length} из 12 домов.</p>
        </div>
        {prominentAreas.length > 1 && <section className="space-y-2"><h4 className="text-sm font-semibold text-gray-800">Другие заметные темы</h4><div className="grid gap-2 md:grid-cols-2">{prominentAreas.slice(1).map((area) => <div key={area.id} className="rounded-lg border border-gray-200 p-3"><p className="text-sm font-semibold text-gray-900">{area.title}</p><p className="mt-1 text-sm text-gray-600">{AREA_MEANINGS[area.id]}</p></div>)}</div></section>}
        {report.repeatedThemes.length > 0 && <section className="space-y-2"><h4 className="text-sm font-semibold text-gray-800">Темы, которые подтверждаются разными частями анализа</h4>{report.repeatedThemes.map((item) => <p key={item.area} className="rounded-lg border border-indigo-100 p-3 text-sm text-gray-700"><strong>{item.title}:</strong> эта тема встречается и в натальных показателях, и в дополнительных слоях анализа. Это согласование трактовок, а не гарантия события.</p>)}</section>}
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
