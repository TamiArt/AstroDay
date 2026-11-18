import { useMemo, useState } from 'react';
import { AlertTriangle, GitMerge, ShieldCheck } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import {
  buildIntegratedNatalAnalysis,
  type IntegratedAreaSynthesis,
  type IntegratedEvidence,
} from '../../utils/integratedNatalAnalysis';
import { GlassCard } from '../common/GlassCard';

interface Props {
  natalChart: NatalChart;
}

const PLANETS: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const PLANET_MEANINGS: Record<string, string> = {
  Sun: 'воля, самостоятельность, цели и желание проявить себя',
  Moon: 'эмоции, привычки, чувство безопасности и повседневные потребности',
  Mars: 'инициатива, решительность, действия и защита своих интересов',
  Mercury: 'мышление, обучение, речь, анализ и работа с информацией',
  Jupiter: 'знания, развитие, наставничество и жизненные ориентиры',
  Venus: 'отношения, творчество, удовольствие и личные ценности',
  Saturn: 'ответственность, дисциплина, терпение и долгосрочные задачи',
  Rahu: 'новый опыт, амбиции и нестандартные подходы',
  Ketu: 'исследование, концентрация и умение отделять главное от лишнего',
};

const AREA_MEANINGS: Record<string, string> = {
  identity: 'характер, самостоятельность и то, как человек проявляет себя',
  resources: 'личные деньги, заработок, накопления и материальная устойчивость',
  skills: 'обучение, общение, навыки и собственные инициативы',
  home: 'дом, семья, жильё и чувство внутренней опоры',
  creativity: 'творчество, увлечения, самовыражение и тема детей',
  work: 'повседневная работа, обязанности, привычки и забота о себе',
  relationships: 'близкие отношения, брак, партнёрство и договорённости',
  transformation: 'общие деньги, доверие и большие перемены',
  wisdom: 'образование, мировоззрение, наставники и расширение кругозора',
  career: 'профессия, ответственность, репутация и карьерное направление',
  gains: 'доходы от деятельности, клиенты, друзья и результаты усилий',
  retreat: 'отдых, личное пространство, расходы и завершение дел',
};

const AREA_EXAMPLES: Record<string, string> = {
  identity: 'замечать свои привычные способы принимать решения и выбирать, какие из них действительно помогают',
  resources: 'сравнивать варианты заработка, планировать расходы и опираться на проверяемые данные',
  skills: 'осваивать новые инструменты, тренировать навыки и яснее формулировать свои мысли',
  home: 'создавать удобное личное пространство и заранее обсуждать бытовые ожидания с близкими',
  creativity: 'выделять время на собственные проекты, обучение и занятия, которые приносят интерес',
  work: 'разбивать большие задачи на понятные шаги и выстраивать устойчивый распорядок',
  relationships: 'обсуждать ожидания, границы и договорённости до того, как возникнет недопонимание',
  transformation: 'внимательно разбирать общие обязательства, риски и условия важных договорённостей',
  wisdom: 'составлять план обучения, проверять источники и сопоставлять разные точки зрения',
  career: 'развивать профессиональные навыки, фиксировать результаты и собирать портфолио',
  gains: 'поддерживать полезные профессиональные связи и переводить долгосрочные цели в конкретные шаги',
  retreat: 'заранее планировать отдых, пересматривать лишние расходы и оставлять время на восстановление',
};

const PLANET_EXAMPLES: Record<string, string[]> = {
  Sun: ['самостоятельные решения', 'постановка целей', 'ответственность за результат'],
  Moon: ['понимание своих потребностей', 'забота и поддержка', 'создание устойчивого ритма'],
  Mars: ['решение сложных задач', 'инициатива', 'защита личных границ'],
  Mercury: ['анализ информации', 'поиск ошибок и несоответствий', 'обучение и объяснение сложных вещей'],
  Jupiter: ['обучение и наставничество', 'работа со знаниями', 'расширение профессионального кругозора'],
  Venus: ['творческие проекты', 'поиск компромиссов', 'работа с эстетикой и ценностями'],
  Saturn: ['долгосрочное планирование', 'системная работа', 'последовательное развитие мастерства'],
  Rahu: ['изучение новых технологий', 'эксперименты', 'нестандартные решения с проверкой рисков'],
  Ketu: ['исследование сложных тем', 'сосредоточенная самостоятельная работа', 'отделение главного от второстепенного'],
};

const PLANET_WATCHOUTS: Record<string, string> = {
  Sun: 'не превращать самостоятельность в нежелание учитывать чужую точку зрения',
  Moon: 'не принимать решения только под влиянием сиюминутного настроения',
  Mars: 'не торопиться с действиями, когда сначала полезнее оценить последствия',
  Mercury: 'не застревать в бесконечном анализе и перепроверках',
  Jupiter: 'не подменять проверку фактов уверенностью в собственной правоте',
  Venus: 'не жертвовать своими потребностями ради одобрения или комфорта',
  Saturn: 'не требовать от себя идеального результата и не откладывать отдых',
  Rahu: 'не гнаться за новизной без оценки практической пользы и рисков',
  Ketu: 'не уходить в чрезмерную отстранённость от повседневных задач',
};

const HOUSE_TOPICS = (house: number) => ({
  1: 'личность и самостоятельность',
  2: 'деньги и личные ресурсы',
  3: 'навыки и коммуникация',
  4: 'дом и внутренняя опора',
  5: 'творчество и дети',
  6: 'работа и повседневные задачи',
  7: 'отношения и партнёрство',
  8: 'общие ресурсы и перемены',
  9: 'обучение и мировоззрение',
  10: 'профессия и реализация',
  11: 'доходы и окружение',
  12: 'восстановление и завершение циклов',
}[house] ?? `${house}-й дом`);

function getPlanetKey(item: IntegratedEvidence): string | null {
  return item.factorId.match(/(?:planet|dasha|transit):([A-Z][a-z]+)/)?.[1] ?? null;
}

function getPlanetPlacement(item: IntegratedEvidence): string {
  const key = getPlanetKey(item);
  const name = key ? PLANETS[key] : null;
  const sign = item.references.find((reference) => name && reference.startsWith(`${name} находится в знаке`));
  const house = item.references.find((reference) => reference.startsWith('Планета расположена в'));
  const dignity = item.references.find((reference) => reference.startsWith('Оценка достоинства:'));
  const ruled = item.references.find((reference) => reference.startsWith('Управляет домами:'));
  return [
    sign?.replace(/, на [\d.]+° знака\./, '.'),
    house?.replace('Планета расположена', 'Она расположена'),
    dignity,
    ruled,
  ].filter(Boolean).join(' ');
}

function buildPersonalSummary(area: IntegratedAreaSynthesis): string {
  const planet = area.evidence.find((item) => item.source === 'planet');
  const house = area.evidence.find((item) => item.source === 'house');
  const yoga = area.evidence.find((item) => item.source === 'yoga');
  const parts: string[] = [];

  if (planet) {
    const key = getPlanetKey(planet);
    const placement = getPlanetPlacement(planet);
    const meaning = key ? PLANET_MEANINGS[key] : '';
    if (placement) parts.push(placement);
    if (meaning) parts.push(`${PLANETS[key!]} в традиции Джйотиш связывают с темами: ${meaning}.`);
  } else if (house) {
    parts.push(house.statement);
  }

  if (yoga) {
    const yogaName = yoga.factorId.includes('mahapurusha-mercury')
      ? 'Бхадра-махапуруша-йога (Бхадра-йога)'
      : yoga.title;
    parts.push(`Дополнительно обнаружена комбинация «${yogaName}»: ${yoga.statement}`);
  }

  if (!parts.length) {
    return 'В доступных расчётах пока недостаточно персональных показателей для содержательного вывода по этой сфере. Приложение не будет заменять отсутствующие данные предположениями.';
  }

  return parts.join(' ');
}

function explainEvidence(item: IntegratedEvidence, area: IntegratedAreaSynthesis): string {
  const key = getPlanetKey(item);
  if (item.source === 'house') {
    const house = Number(item.factorId.match(/house:(\d+)/)?.[1]);
    const lordHouse = item.references.map((ref) => ref.match(/расположен в (\d+)-м доме/)?.[1]).find(Boolean);
    const lord = item.references.find((ref) => ref.includes('управитель —'))?.split('управитель —')[1]?.replace(/[.]/g, '').trim();
    const occupants = item.references.find((ref) => ref.startsWith('Планеты в доме:'));
    return [
      `${house}-й дом связан с темой «${HOUSE_TOPICS(house)}».`,
      lord ? `Управитель этого дома — ${lord}.` : '',
      lordHouse && lord ? `${lord} находится в ${lordHouse}-м доме, поэтому темы «${HOUSE_TOPICS(house)}» и «${HOUSE_TOPICS(Number(lordHouse))}» рассматриваются вместе.` : '',
      occupants ? occupants.replace('Планеты в доме:', 'В этом доме расположены планеты:') : '',
    ].filter(Boolean).join(' ');
  }

  if (item.source === 'planet' && key) {
    const placement = getPlanetPlacement(item);
    return `${PLANETS[key]} символически связывают с темами «${PLANET_MEANINGS[key] ?? 'своей функцией в традиции'}». ${placement} Это объясняет, почему показатель включён в разбор, но не доказывает событие или неизменную черту характера.`;
  }

  if (item.source === 'yoga') {
    const evidence = item.references.filter((ref) => !/не проверено|не удалось|ограничен/i.test(ref)).slice(0, 2);
    const caveat = item.references.find((ref) => /не провер|не оцени|не учитыв|ограничен/i.test(ref));
    return `«${item.title}» — традиционное название сочетания астрологических условий. ${item.statement} ${evidence.join(' ')} ${caveat ?? 'Полный перечень условий и ограничений доступен в исходных данных расчёта.'}`;
  }

  if (item.source === 'varga') {
    const division = item.factorId.match(/D(\d+)/)?.[1] ?? '';
    return `Дополнительная карта D${division} используется как тематическое уточнение основной карты D1. Она не является независимым подтверждением и не заменяет натальную карту.`;
  }

  if (item.source === 'dasha') {
    return `${item.title}: в традиции Вимшоттари Даша этот период рассматривают через символику планеты и её положение в натальной карте. Это временной контекст для размышления, а не обещание события.`;
  }

  if (item.source === 'transit') {
    return `Транзит сопоставляет текущее положение планет с натальной картой. Он добавляет временной контекст к теме «${area.title.toLowerCase()}», но не гарантирует событие.`;
  }

  return item.statement;
}

function EvidenceDetails({ area }: { area: IntegratedAreaSynthesis }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-gray-800"
      >
        <span>Почему приложение сделало такой вывод?</span>
        <span className="text-indigo-700">{expanded ? 'Скрыть' : 'Подробнее'}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {area.evidence.map((item) => (
            <article key={item.id} className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold text-indigo-700">
                {item.source === 'house' ? 'Дом и его управитель'
                  : item.source === 'planet' ? 'Положение планеты'
                    : item.source === 'yoga' ? 'Комбинация планет'
                      : item.source === 'varga' ? 'Дополнительная карта'
                        : item.source === 'dasha' ? 'Период Даши' : 'Транзит'}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{explainEvidence(item, area)}</p>
              {item.references.length > 0 && (
                <details className="mt-2 rounded-lg border border-gray-200 bg-white p-2">
                  <summary className="cursor-pointer text-xs font-medium text-gray-600">Посмотреть исходные данные расчёта</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {item.references.map((reference, index) => (
                      <li key={index} className="text-xs leading-relaxed text-gray-500">{reference}</li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          ))}
          {area.contradictions.map((item) => (
            <p key={item} className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{item}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function AreaCard({ area }: { area: IntegratedAreaSynthesis }) {
  const planet = area.evidence.find((item) => item.source === 'planet');
  const planetKey = planet ? getPlanetKey(planet) : null;
  const examples = planetKey ? PLANET_EXAMPLES[planetKey] : [];
  const watchout = planetKey ? PLANET_WATCHOUTS[planetKey] : null;
  const hasEvidence = area.evidence.length > 0;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div>
        <h4 className="font-semibold text-gray-900">{area.title}</h4>
        <p className="mt-1 text-xs text-gray-500">{AREA_MEANINGS[area.id]}</p>
      </div>

      {hasEvidence ? (
        <>
          <p className="text-sm leading-relaxed text-gray-800">{buildPersonalSummary(area)}</p>
          {examples.length > 0 && (
            <section className="space-y-1">
              <h5 className="text-sm font-semibold text-gray-800">Как эти качества могут проявляться</h5>
              <p className="text-sm leading-relaxed text-gray-700">{examples.join('; ')}.</p>
            </section>
          )}
          <section className="rounded-lg bg-blue-50 p-3 space-y-1">
            <h5 className="text-sm font-semibold text-blue-900">Практический шаг</h5>
            <p className="text-sm leading-relaxed text-gray-800">{AREA_EXAMPLES[area.id]}</p>
          </section>
          {watchout && (
            <p className="text-xs leading-relaxed text-gray-600"><strong>На что обратить внимание:</strong> {watchout}.</p>
          )}
          <EvidenceDetails area={area} />
        </>
      ) : (
        <p className="text-sm leading-relaxed text-gray-600">
          {area.dataStatus === 'unavailable'
            ? 'В доступных расчётах нет достаточных оснований для персонального вывода по этой сфере.'
            : 'Часть исходных данных отсутствует. Приложение не будет дополнять разбор предположениями.'}
        </p>
      )}
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
            <h3 className="text-lg font-bold text-gray-900">Персональный анализ по сферам жизни</h3>
            <p className="mt-1 text-sm text-gray-600">
              Сначала — понятное объяснение и практический смысл. Расчётные основания и технические подробности можно открыть отдельно.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="font-semibold text-gray-900">Как читать этот разбор</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            Выводы формируются по сочетанию показателей натальной карты. Дополнительные карты, Даша и транзиты уточняют контекст, но не являются независимым доказательством и не гарантируют события.
          </p>
        </div>

        {report.contradictions.length > 0 && (
          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />Неоднозначные показатели
            </h4>
            {report.contradictions.map((item, index) => (
              <div key={item.area + index} className="rounded-lg bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">{item.title}</p>
                <p className="mt-1 text-sm text-amber-800">{item.explanation}</p>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-3 lg:grid-cols-2">
          {report.areas.map((area) => <AreaCard key={area.id} area={area} />)}
        </section>

        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
            <ShieldCheck className="h-4 w-4" />Методика расчёта и общие ограничения
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {report.methodology.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">{item}</li>)}
          </ul>
          {report.dataQuality.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {report.dataQuality.warnings.map((item, index) => <li key={index} className="text-xs text-amber-800">{item}</li>)}
            </ul>
          )}
          {report.dataQuality.missingPlanets.length > 0 && (
            <p className="mt-2 text-xs text-gray-600">Нет данных по планетам: {report.dataQuality.missingPlanets.map((item) => PLANETS[item]).join(', ')}</p>
          )}
          {report.dataQuality.missingHouses.length > 0 && (
            <p className="mt-1 text-xs text-gray-600">Нет данных по домам: {report.dataQuality.missingHouses.join(', ')}</p>
          )}
        </details>
      </section>
    </GlassCard>
  );
}
