import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, CircleHelp, Sparkles } from 'lucide-react';
import type { NatalChart } from '../../utils/astrology';
import {
  analyzeLifeTopics,
  analyzePersonalizedHouses,
  type LifeTopicInsight,
} from '../../utils/personalizedHouseAnalysis';
import { HOUSES_DETAILED } from '../../utils/housesDescriptions';
import { GlassCard } from '../common/GlassCard';

interface NatalHousesTabProps {
  natalChart: NatalChart;
}

const TOPIC_ORDER: LifeTopicInsight['id'][] = [
  'talents', 'money', 'career', 'children', 'home_family',
  'wellbeing', 'inner_growth', 'relationships',
];

const TOPIC_PLAIN_SUMMARIES: Record<LifeTopicInsight['id'], string> = {
  talents: 'Где легче раскрывать способности, учиться, придумывать новое и создавать собственные работы.',
  money: 'Какие навыки и виды деятельности символически связаны с личным заработком, накоплениями и дополнительными доходами.',
  career: 'Как человек может проявляться в профессии, решать задачи, строить репутацию и развиваться в работе.',
  children: 'Тема детей, воспитания, заботы, передачи знаний и радости от совместного творчества. Это не прогноз беременности или фертильности.',
  home_family: 'Что в традиционной трактовке связано с домом, семьёй, жильём, близкими и ощущением внутренней опоры.',
  wellbeing: 'Как символически описываются повседневные обязанности, нагрузка, привычки, отдых и восстановление. Это не медицинская оценка.',
  inner_growth: 'Что связано с обучением, убеждениями, поиском смысла, духовными практиками и расширением кругозора.',
  relationships: 'Как карта описывает темы брака, близкого партнёрства, договорённостей и взаимодействия один на один.',
};

function HouseCard({ house, expanded, onToggle }: {
  house: ReturnType<typeof analyzePersonalizedHouses>[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const description = HOUSES_DETAILED[house.house];
  if (!description) return null;

  return (
    <GlassCard>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-800">{house.house}</span>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900">{description.russianName}</h4>
              <p className="text-xs text-gray-600">{house.sign} · управитель: {house.lord}</p>
            </div>
          </div>
          <span className="shrink-0 text-gray-500">{expanded ? <ChevronUp /> : <ChevronDown />}</span>
        </div>
      </button>

      <p className="mt-3 text-sm leading-relaxed text-gray-700">{description.whatItIs}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-900">Планеты в доме</p>
          {house.occupants.length ? (
            <ul className="mt-1 space-y-1">
              {house.occupants.map((planet) => (
                <li key={planet.name} className="text-sm text-gray-800">
                  <strong>{planet.name}</strong> — {planet.sign}
                </li>
              ))}
            </ul>
          ) : <p className="mt-1 text-sm text-gray-700">Планет нет. Это нормально: дом читают через его знак и управителя.</p>}
        </div>
        <div className="rounded-xl bg-purple-50 p-3">
          <p className="text-xs font-semibold text-purple-900">Управитель дома</p>
          <p className="mt-1 text-sm text-gray-800">
            {house.lord} находится: {house.lordHouse ? `${house.lordHouse}-й дом` : 'положение не определено'}{house.lordSign ? `, знак ${house.lordSign}` : ''}.
          </p>
          {house.lordNakshatra && <p className="mt-1 text-xs text-gray-600">Накшатра: {house.lordNakshatra}</p>}
          <p className="mt-1 text-xs text-gray-600">Простыми словами: управитель — планета, которая «отвечает» за знак этого дома.</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
          <section>
            <h5 className="text-sm font-semibold text-gray-900">Что это означает в вашей карте</h5>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">{house.interpretation}</p>
          </section>

          {house.occupantInterpretations.length > 0 && (
            <section>
              <h5 className="text-sm font-semibold text-gray-900">Что добавляют планеты в доме</h5>
              <ul className="mt-2 space-y-2">
                {house.occupantInterpretations.map((item) => (
                  <li key={item} className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h5 className="text-sm font-semibold text-gray-900">Аспекты и связи</h5>
            {house.planetaryConnections.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {house.planetaryConnections.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-gray-700">• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-gray-600">В используемой схеме Джйотиш прямые аспекты и соединения для этого дома не обнаружены.</p>
            )}
            <p className="mt-2 text-xs text-gray-500">Аспект — это связь, которую планета образует с домом или другой планетой по правилам выбранной астрологической системы.</p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-green-50 p-3">
              <h5 className="text-sm font-semibold text-green-900">Что можно развивать</h5>
              <ul className="mt-2 space-y-1">
                {house.practicalActions.map((item) => <li key={item} className="text-sm text-gray-700">• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <h5 className="text-sm font-semibold text-amber-900">На что обратить внимание</h5>
              <ul className="mt-2 space-y-1">
                {house.watchouts.map((item) => <li key={item} className="text-sm text-gray-700">• {item}</li>)}
              </ul>
            </div>
          </section>

          <details className="rounded-xl border border-gray-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">Показать расчётные основания</summary>
            <ul className="mt-2 space-y-1">
              {house.evidence.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">• {item}</li>)}
            </ul>
          </details>
        </div>
      )}
    </GlassCard>
  );
}

function LifeTopicCard({ topic }: { topic: LifeTopicInsight }) {
  const usefulFactors = [...topic.keyFactors, ...topic.directions].slice(0, 5);
  return (
    <GlassCard>
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900">{topic.title}</h4>
          <p className="mt-1 text-xs text-gray-500">Главные дома: {topic.primaryHouses.join(', ')} · Связанные дома: {topic.supportingHouses.length ? topic.supportingHouses.join(', ') : 'нет'}</p>
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{TOPIC_PLAIN_SUMMARIES[topic.id]}</p>
        {usefulFactors.length > 0 && (
          <div className="rounded-xl bg-purple-50 p-3">
            <p className="text-xs font-semibold text-purple-900">Что именно учитывается в вашей карте</p>
            <ul className="mt-2 space-y-1">
              {usefulFactors.map((factor) => <li key={factor} className="text-sm leading-relaxed text-gray-700">• {factor}</li>)}
            </ul>
          </div>
        )}
        <p className="text-xs leading-relaxed text-gray-600">{topic.synthesis}</p>
      </div>
    </GlassCard>
  );
}

export function NatalHousesTab({ natalChart }: NatalHousesTabProps) {
  const [expandedHouse, setExpandedHouse] = useState<number | null>(1);
  const houses = useMemo(() => analyzePersonalizedHouses(natalChart), [natalChart]);
  const topics = useMemo(() => analyzeLifeTopics(natalChart), [natalChart]);
  const orderedTopics = TOPIC_ORDER.map((id) => topics.find((topic) => topic.id === id)).filter((topic): topic is LifeTopicInsight => Boolean(topic));

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 h-6 w-6 shrink-0 text-purple-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Как читать этот раздел</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              Сначала разберём каждый дом отдельно: его темы, планеты внутри, управителя и аспекты. Затем — восемь важных сфер жизни, в которых несколько домов работают вместе.
              <strong> Планета в доме</strong> показывает, какая тема добавляет туда свои качества. <strong>Управитель</strong> — планета, связанная со знаком дома. <strong>Аспект</strong> — связь между планетами или влияние планеты на дом по правилам Джйотиш.
            </p>
            <p className="mt-2 text-xs text-gray-500">Это традиционная астрологическая интерпретация, а не научный прогноз. Отсутствие планет в доме не означает, что соответствующая сфера не важна или не будет развиваться.</p>
          </div>
        </div>
      </GlassCard>

      <section className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900">1. Все 12 домов — по порядку</h3>
          <p className="text-sm text-gray-600">Нажмите на дом, чтобы раскрыть подробный разбор. Краткая информация видна сразу.</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {houses.map((house) => (
            <HouseCard
              key={house.house}
              house={house}
              expanded={expandedHouse === house.house}
              onToggle={() => setExpandedHouse((current) => current === house.house ? null : house.house)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">2. Главные сферы жизни — короткие выводы</h3>
        </div>
        <p className="text-sm text-gray-600">Здесь несколько домов объединены в одну тему. Это помогает увидеть общую картину, не повторяя весь подробный разбор.</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {orderedTopics.map((topic) => <LifeTopicCard key={topic.id} topic={topic} />)}
        </div>
      </section>

      <GlassCard>
        <p className="text-sm leading-relaxed text-gray-700">
          Важно: астрология не определяет медицинскую фертильность, дату зачатия, количество детей, диагнозы или гарантированный доход. Такие вопросы решаются по реальным данным и с профильными специалистами.
        </p>
      </GlassCard>
    </div>
  );
}
