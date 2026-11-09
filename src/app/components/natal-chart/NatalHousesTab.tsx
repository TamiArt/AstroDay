import { useMemo, useState } from 'react';
import {
  Activity, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Compass, Home, Lightbulb,
  Sparkles, Target, Wallet, BriefcaseBusiness, Baby, Palette, HeartHandshake,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import {
  analyzeLifeTopics,
  analyzePersonalizedHouses,
  getVargaEvidence,
  type LifeTopicInsight,
} from '../../utils/personalizedHouseAnalysis';
import { HOUSES_DETAILED } from '../../utils/housesDescriptions';
import { analyzeHouseLords, type HouseLordInsight } from '../../utils/natalHouseLordAnalysis';
import { GlassCard } from '../common/GlassCard';

interface NatalHousesTabProps {
  natalChart: NatalChartType;
}

const TOPIC_ICONS: Record<LifeTopicInsight['id'], LucideIcon> = {
  talents: Palette,
  money: Wallet,
  career: BriefcaseBusiness,
  children: Baby,
  relationships: HeartHandshake,
  home_family: Home,
  wellbeing: Activity,
  inner_growth: Compass,
};

function EvidenceList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="text-xs text-gray-600 leading-relaxed">• {item}</li>
      ))}
    </ul>
  );
}

function TopicCard({ topic, natalChart }: { topic: LifeTopicInsight; natalChart: NatalChartType }) {
  const Icon = TOPIC_ICONS[topic.id];
  const vargaDivision = topic.id === 'money'
    ? 2
    : topic.id === 'talents'
      ? 24
      : topic.id === 'children'
        ? 7
        : topic.id === 'relationships' || topic.id === 'inner_growth'
          ? 9
          : topic.id === 'career'
            ? 10
            : null;
  const vargaEvidence = vargaDivision
    ? getVargaEvidence(natalChart, vargaDivision)
    : [];

  return (
    <GlassCard>
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-purple-100 pb-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Icon className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{topic.title}</h3>
            <p className="text-xs text-gray-500">Основные дома: {topic.primaryHouses.join(', ')} · Дополнительные связи: {topic.supportingHouses.length ? topic.supportingHouses.join(', ') : 'нет'}</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-800">{topic.interpretation}</p>

        {topic.keyFactors.length > 0 && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-purple-900">Ключевые показатели именно этой карты</h4>
            <EvidenceList items={topic.keyFactors} />
          </div>
        )}

        <p className="text-xs leading-relaxed text-gray-500">
          Основные дома задают предмет анализа; дополнительные дома показывают связанные темы и не имеют автоматически равного веса. Поддержка оценивается здесь по достоинству управителей и их диспозиторов, а не по полной Shadbala.
        </p>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-green-900">Что поддерживает эту сферу</h4>
          {topic.supportingFactors.length > 0
            ? <EvidenceList items={topic.supportingFactors} />
            : <p className="text-xs leading-relaxed text-gray-600">По выбранным критериям выраженных поддерживающих достоинств управителей не обнаружено. Это не означает отсутствия возможностей.</p>}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-amber-900">Факторы, требующие внимания</h4>
          <EvidenceList items={topic.attentionPoints} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Общий вывод по сфере</h4>
          <p className="text-sm leading-relaxed text-gray-700">{topic.synthesis}</p>
        </div>

        {topic.developmentPoints.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-amber-900">Как читать эти связи на практике</h4>
            <EvidenceList items={topic.developmentPoints} />
          </div>
        )}

        {topic.directions.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-purple-800">Направления, которые стоит проверить на практике</h4>
            <ul className="space-y-2">
              {topic.directions.map((direction) => (
                <li key={direction} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-purple-600">↗</span>
                  <span>{direction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
            <Target className="h-4 w-4" /> Что можно сделать
          </h4>
          <ul className="space-y-2">
            {topic.actions.map((action) => (
              <li key={action} className="text-sm leading-relaxed text-gray-700">• {action}</li>
            ))}
          </ul>
        </div>

        {vargaEvidence.length > 0 && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-indigo-900">
              Дополнительная карта {vargaDivision === 2 ? 'D2 — Хора' : vargaDivision === 7 ? 'D7 — Саптамша' : vargaDivision === 9 ? 'D9 — Навамша' : vargaDivision === 10 ? 'D10 — Дашамша' : 'D24 — Сиддхамша'}
            </h4>
            <EvidenceList items={vargaEvidence} />
            <p className="mt-2 text-xs text-gray-600">
              Дробная карта используется как дополнительный символический слой. Она не подтверждает и не предсказывает конкретные события.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="mb-1 text-sm font-semibold text-amber-900">Период и время</h4>
          <p className="text-xs leading-relaxed text-gray-700">{topic.timingNote}</p>
        </div>

        <details className="rounded-lg border border-gray-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-800">На каких показателях карты основан вывод</summary>
          <div className="mt-3">
            <EvidenceList items={topic.evidence} />
          </div>
        </details>
      </div>
    </GlassCard>
  );
}


function HouseLordCard({ insight }: { insight: HouseLordInsight }) {
  return (
    <GlassCard>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-purple-100 pb-3">
          <div>
            <h4 className="font-bold text-gray-900">{insight.house}-й дом · управитель {insight.lord}</h4>
            <p className="text-xs text-gray-500">{insight.houseSign} · {insight.houseTheme}</p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
            {insight.lordHouse ? `${insight.lordHouse}-й дом` : 'положение неизвестно'}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-gray-800">{insight.interpretation}</p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <h5 className="mb-2 text-sm font-semibold text-gray-900">Положение и достоинство</h5>
            <p className="text-xs leading-relaxed text-gray-700">
              {insight.lordSign ?? 'Знак не определён'} · {insight.dignity}. {insight.dignityExplanation}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Управляемые дома: {insight.ruledHouses.length ? insight.ruledHouses.join(', ') : 'не определены'}
            </p>
            {insight.lordNakshatra && (
              <p className="mt-1 text-xs text-gray-600">Накшатра: {insight.lordNakshatra}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <h5 className="mb-2 text-sm font-semibold text-gray-900">Цепочка диспозиторов</h5>
            {insight.dispositorChain.length ? (
              <ol className="space-y-1.5">
                {insight.dispositorChain.map((step) => (
                  <li key={step.planetKey + step.depth} className="text-xs leading-relaxed text-gray-700">
                    <span className="font-semibold">{step.depth === 0 ? 'Управитель' : `Шаг ${step.depth}`}: {step.planet}</span>
                    {' — '}{step.sign}, {step.house ? `${step.house}-й дом` : 'дом не определён'}; управляет: {step.ruledHouses.join(', ') || 'нет данных'}; {step.dignity}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-gray-600">Цепочку построить нельзя: положение управителя отсутствует.</p>
            )}
            {insight.chainCycleDetected && (
              <p className="mt-2 text-xs font-medium text-amber-700">Обнаружен цикл: обход остановлен на повторе планеты.</p>
            )}
            {insight.chainMissingPlanet && (
              <p className="mt-2 text-xs text-amber-700">Нет данных планеты {insight.chainMissingPlanet}.</p>
            )}
          </div>
        </div>

        {insight.repeatedRulership && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <h5 className="mb-1 text-sm font-semibold text-indigo-900">Повторяющаяся связь домов</h5>
            <p className="text-xs leading-relaxed text-gray-700">{insight.repeatedRulership}</p>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <h5 className="mb-1 text-sm font-semibold text-blue-900">Сводная оценка сочетания факторов</h5>
          <p className="text-xs leading-relaxed text-gray-700">{insight.overallSynthesis}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <h5 className="mb-2 text-sm font-semibold text-green-900">Поддерживающие факторы</h5>
            <EvidenceList items={insight.supportingFactors} />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <h5 className="mb-2 text-sm font-semibold text-amber-900">Факторы внимания</h5>
            <EvidenceList items={insight.attentionFactors} />
          </div>
        </div>

        <details className="rounded-lg border border-gray-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-800">Аспекты, соединения и исходные доказательства</summary>
          <div className="mt-3 space-y-3">
            <div>
              <h5 className="mb-1 text-xs font-semibold text-gray-800">Аспекты на положение управителя</h5>
              <EvidenceList items={insight.incomingAspects.map((item) => `${item.source} из ${item.sourceHouse}-го дома: ${item.kind}`)} />
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold text-gray-800">Аспекты самого управителя</h5>
              <EvidenceList items={insight.outgoingAspects.map((item) => `${item.kind} на ${item.targetHouse}-й дом`)} />
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold text-gray-800">Соединения по знаку</h5>
              <EvidenceList items={insight.conjunctions.length ? insight.conjunctions : ['Других планет в том же знаке нет.']} />
              <p className="mt-1 text-xs text-gray-500">Соединение определяется по общему знаку; точный градусный орбис здесь не рассчитывается.</p>
            </div>
            <EvidenceList items={insight.evidence} />
          </div>
        </details>
      </div>
    </GlassCard>
  );
}

export function NatalHousesTab({ natalChart }: NatalHousesTabProps) {
  const [expandedHouse, setExpandedHouse] = useState<number | null>(1);
  const personalizedHouses = useMemo(() => analyzePersonalizedHouses(natalChart), [natalChart]);
  const lifeTopics = useMemo(() => analyzeLifeTopics(natalChart), [natalChart]);
  const houseLordInsights = useMemo(() => analyzeHouseLords(natalChart), [natalChart]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="rounded-lg border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
          <div className="flex items-start gap-3">
            <Home className="mt-0.5 h-6 w-6 flex-shrink-0 text-purple-600" />
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Дома твоей натальной карты — персональная интерпретация</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                Здесь учитываются знак дома, его управитель и достоинство, положение планет, их накшатры и граха-дришти.
                В оценке достоинства 90/100 означает экзальтацию, 75/100 — собственный знак, 25/100 — падение,
                50/100 — прочий знак. Это условная шкала достоинства, не полная Shadbala и не научная мера силы.
                Для каждой жизненной сферы отдельно показана связь Махадаши и Антардаши с её домами и управителями.
                Выводы остаются символическими гипотезами, а не неизбежным сценарием жизни.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Главные жизненные направления</h3>
          <p className="text-sm text-gray-600">Сферы, где карта соединяет несколько домов и планетных показателей</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {lifeTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} natalChart={natalChart} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Управители домов — углублённый анализ</h3>
          <p className="text-sm text-gray-600">
            Для каждого дома показаны положение и достоинство управителя, управляемые им дома,
            цепочка диспозиторов, аспекты, соединения и повторяющиеся связи. Цепочка ограничена
            тремя переходами и останавливается при обнаружении цикла.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {houseLordInsights.map((insight) => (
            <HouseLordCard key={insight.house} insight={insight} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Подробно о каждом из 12 домов</h3>
          <p className="text-sm text-gray-600">Раскрывай дом, чтобы увидеть его персональную связь с остальными сферами карты</p>
        </div>

        {personalizedHouses.map((personal) => {
          const details = HOUSES_DETAILED[personal.house];
          const isExpanded = expandedHouse === personal.house;
          if (!details) return null;

          return (
            <GlassCard key={personal.house}>
              <button
                type="button"
                className="w-full text-left"
                aria-expanded={isExpanded}
                onClick={() => setExpandedHouse(isExpanded ? null : personal.house)}
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-lg font-bold text-white">
                      {personal.house}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{details.russianName}</h4>
                      <p className="text-sm text-gray-600">{personal.sign} · управитель {personal.lord}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {personal.occupants.slice(0, 3).map((planet) => (
                      <span key={planet.name} className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{planet.name}</span>
                    ))}
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-purple-600" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>
              </button>

              {!isExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-700">{details.whatItIs}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Управитель расположен: {personal.lordHouse ? `${personal.lordHouse}-й дом` : 'данные недоступны'}
                  </p>
                </div>
              )}

              {isExpanded && (
                <div className="space-y-5 border-t border-purple-100 px-4 pb-5 pt-5">
                  <div>
                    <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                      <Sparkles className="h-4 w-4 text-purple-600" /> Что это означает именно в твоей карте
                    </h5>
                    <p className="text-sm leading-relaxed text-gray-700">{personal.interpretation}</p>
                  </div>

                  {personal.occupantInterpretations.length > 0 && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                      <h5 className="mb-3 text-sm font-semibold text-indigo-900">Что конкретно означает планета в этом доме</h5>
                      <div className="space-y-3">
                        {personal.occupantInterpretations.map((item) => (
                          <p key={item} className="text-sm leading-relaxed text-gray-700">{item}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h5 className="mb-2 text-sm font-semibold text-blue-900">Как планеты связаны между собой</h5>
                    {personal.planetaryConnections.length > 0 ? (
                      <ul className="space-y-2">
                        {personal.planetaryConnections.map((item) => (
                          <li key={item} className="text-sm leading-relaxed text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-relaxed text-gray-600">
                        Среди планет, связанных с этим домом, не найдено соединений или классических граха-дришти по используемой схеме Парашари.
                        Это не означает отсутствия любых других астрологических связей.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-800">
                      <Lightbulb className="h-4 w-4" /> Как применить в жизни
                    </h5>
                    <ul className="space-y-2">
                      {personal.practicalActions.map((action) => (
                        <li key={action} className="text-sm leading-relaxed text-gray-700">• {action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <AlertCircle className="h-4 w-4" /> На что обратить внимание
                    </h5>
                    <ul className="space-y-1.5">
                      {personal.watchouts.map((item) => <li key={item} className="text-sm text-gray-700">• {item}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <CheckCircle className="h-4 w-4 text-blue-600" /> Данные, на которых основан разбор
                    </h5>
                    <EvidenceList items={personal.evidence} />
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </section>

      <GlassCard>
        <div className="flex items-start gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <h4 className="font-semibold text-gray-900">Как правильно использовать астрологические выводы</h4>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              Джйотиш — традиционная символическая система, а не научно подтверждённый способ прогнозирования.
              Она не определяет медицинскую фертильность, дату зачатия, количество детей, гарантированный доход
              или лучший день для финансовой сделки. Используй рекомендации как идеи для проверки, а решения
              принимай на основе фактов, собственных интересов и консультаций профильных специалистов.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
