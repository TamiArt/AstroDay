import { buildNatalChartFacts } from '../../utils/natalChartFacts';
import { NatalYogasSection } from './NatalYogasSection';
import { NatalPrecisionSection } from './NatalPrecisionSection';
import { NatalPlanetStory } from './NatalPlanetStory';
import { NatalIntegratedSynthesisSection } from './NatalIntegratedSynthesisSection';
import {
  AlertCircle,
  CheckCircle,
  Heart,
  Home as HomeIcon,
  Moon,
  Sparkles,
  Star,
  Sun,
  Target,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { SIGNS_RU } from '../../utils/astrology';
import type { NatalChart as NatalChartType } from '../../utils/astrology';
import { analyzeAllNatalHouses } from '../../utils/natalHousePersonalizedAnalysis';
import { analyzeAllNatalPlanets } from '../../utils/natalPlanetPersonalizedAnalysis';
import { getPlanetHouse } from '../../utils/natalStrengthAnalysis';
import { getSunHouseFocus } from '../../utils/natalAnalysisGuidance';
import { getMoonHouseFocus } from '../../utils/natalPersonalFocus';
import { getAscendantDescription, getMoonDescription, getSunDescription } from '../../utils/natalChartDescriptions';
import { GlassCard } from '../common/GlassCard';
import { TermTooltip } from '../common/TermTooltip';

interface NatalAnalysisTabProps {
  natalChart: NatalChartType;
}

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: string;
  children: ReactNode;
}

function BulletList({ items, tone }: { items: string[]; tone: 'green' | 'orange' | 'blue' | 'yellow' }) {
  const toneClass = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
  }[tone];

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={item} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
          <span className={`${toneClass} font-bold mt-0.5`}>{tone === 'orange' ? '!' : index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InsightCard({ icon: Icon, title, subtitle, accent, children }: InsightCardProps) {
  return (
    <GlassCard>
      <div className="space-y-4">
        <div className={`flex items-center gap-3 pb-3 border-b ${accent}`}>
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </GlassCard>
  );
}

const HOUSE_PLAIN_NAMES: Record<number, string> = {
  1: 'личность и самостоятельность', 2: 'личные деньги и накопления',
  3: 'навыки и общение', 4: 'дом и семья', 5: 'творчество и дети',
  6: 'работа и повседневные обязанности', 7: 'брак и партнёрство',
  8: 'общие деньги и перемены', 9: 'обучение и мировоззрение',
  10: 'профессия и карьера', 11: 'доходы, клиенты и окружение',
  12: 'отдых, расходы и уединение',
};

const HOUSE_PLANET_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const SIGN_STYLES: Record<string, string> = {
  Овен: 'инициатива, прямота и стремление действовать быстро',
  Телец: 'устойчивость, практичность и постепенное развитие',
  Близнецы: 'обмен информацией, гибкость и разнообразие интересов',
  Рак: 'забота, эмоциональная вовлечённость и потребность в безопасности',
  Лев: 'самовыражение, творчество и желание проявить индивидуальность',
  Дева: 'анализ, точность, порядок и внимание к деталям',
  Весы: 'сотрудничество, баланс интересов и поиск договорённостей',
  Скорпион: 'глубина, исследование, приватность и работа со сложными темами',
  Стрелец: 'обучение, расширение кругозора и поиск смысла',
  Козерог: 'структура, ответственность и движение к долгосрочному результату',
  Водолей: 'независимый взгляд, коллективные идеи и нестандартные решения',
  Рыбы: 'воображение, восприимчивость и работа с тонкими нюансами',
};

const HOUSE_LIFE_EXAMPLES: Record<number, string> = {
  1: 'как человек начинает дела, принимает самостоятельные решения и предъявляет себя миру',
  2: 'как человек обращается с личными деньгами, формирует накопления и выражает свои ценности',
  3: 'как человек учится на практике, общается, осваивает инструменты и запускает небольшие проекты',
  4: 'как человек организует быт, выстраивает личное пространство и ищет чувство опоры',
  5: 'как человек выражает творческие идеи, развивает увлечения и взаимодействует с темой детей',
  6: 'как человек выстраивает рабочие процессы, справляется с регулярными задачами и поддерживает режим',
  7: 'как человек договаривается, строит партнёрство и взаимодействует с клиентами',
  8: 'как человек обсуждает общие деньги, распределяет обязательства и проходит периоды перемен',
  9: 'как человек получает образование, формирует убеждения и выбирает наставников',
  10: 'как человек строит профессиональную траекторию, принимает ответственность и показывает результат',
  11: 'как человек получает отдачу от усилий, взаимодействует с сообществами и расширяет круг контактов',
  12: 'как человек восстанавливается, планирует расходы и организует время вне публичных обязанностей',
};

const HOUSE_PRACTICAL_STEPS: Record<number, string> = {
  1: 'Выберите одну личную цель и определите действие, которое можете выполнить самостоятельно.',
  2: 'Запишите регулярные доходы и расходы, затем выберите один реалистичный финансовый ориентир.',
  3: 'Освойте небольшой практический навык и закрепите его конкретным заданием.',
  4: 'Определите, что сделает домашнее пространство удобнее, и начните с одного изменения.',
  5: 'Выделите регулярное время на творчество, увлечение или совместное занятие с ребёнком.',
  6: 'Разделите повторяющуюся задачу на этапы и уберите один источник лишней нагрузки.',
  7: 'Обсудите ожидания, границы и ответственность сторон до принятия общего решения.',
  8: 'Проверьте условия общих финансовых и юридических обязательств, включая возможные риски.',
  9: 'Составьте план обучения и заранее определите, как будете проверять качество источников.',
  10: 'Выберите профессиональный навык и зафиксируйте измеримый результат его применения.',
  11: 'Определите, какие контакты и сообщества действительно помогают вашим целям.',
  12: 'Запланируйте время на восстановление и проверьте, какие расходы можно сделать осознаннее.',
};





function HouseQuickMeaning({ house }: { house: ReturnType<typeof analyzeAllNatalHouses>[number] }) {
  if (!house.available) {
    return <p className="text-sm text-gray-600">Нет исходных данных, чтобы определить знак, управителя и связи этого дома. Персональная трактовка не подменяется догадками.</p>;
  }

  const occupants = house.occupants.map((planet) => HOUSE_PLANET_NAMES[planet] ?? planet);
  const signStyle = house.sign ? SIGN_STYLES[house.sign] : null;
  const destination = house.lordHouse ? HOUSE_PLAIN_NAMES[house.lordHouse] : null;
  const ruledElsewhere = house.ruledHouses.filter((item) => item !== house.house);
  const lordSentence = !house.lordName
    ? 'Управитель дома не определён в исходных данных.'
    : house.lordHouse === null
      ? `${house.lordName} — управитель этого дома, но его положение в домах не определено.`
      : house.lordHouse === house.house
        ? `${house.lordName} находится в собственном доме. В традиционной трактовке это усиливает прямую связь планеты с темой дома.`
        : `${house.lordName} — управитель этого дома — находится в ${house.lordHouse}-м доме (${destination ?? 'другая жизненная сфера'}). Поэтому темы этих двух домов связываются через одну планету.`;
  const mercuryVirgoLord = house.lordName === 'Меркурий' && house.lordSign === 'Дева';
  const dignityText = mercuryVirgoLord
    ? 'Меркурий находится в Деве — собственном знаке и знаке экзальтации. В традиции Джйотиш оба достоинства учитываются одновременно.'
    : house.lordDignity
      ? `Управитель имеет оценку достоинства «${house.lordDignity}». Это качественный показатель принятой модели, а не измерение объективной силы.`
      : 'Оценка достоинства управителя недоступна.';
  const statusText = house.synthesis === 'supportive'
    ? 'По выбранным критериям есть поддерживающие факторы; они не гарантируют конкретный результат.'
    : house.synthesis === 'challenging'
      ? 'Есть показатели, которым стоит уделить внимание; они не означают неизбежных трудностей.'
      : house.synthesis === 'mixed'
        ? 'Картина неоднородная: присутствуют и поддерживающие факторы, и факторы, требующие внимания.'
        : house.synthesis === 'incomplete'
          ? 'Для целостного вывода не хватает части исходных данных.'
          : 'По выбранным критериям нет явного перевеса поддерживающих или напряжённых факторов.';

  return (
    <div className="space-y-3">
      <section>
        <p className="text-xs font-semibold text-gray-500">1. О ЧЁМ ЭТОТ ДОМ</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-800">{house.theme}.</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">
          В практической жизни это может относиться к тому, {HOUSE_LIFE_EXAMPLES[house.house] ?? 'как человек проживает соответствующую сферу'}.
        </p>
      </section>

      <section className="rounded-lg bg-indigo-50/70 p-3">
        <p className="text-xs font-semibold text-indigo-800">2. ЗНАК ДОМА — КАК ПРОЯВЛЯЕТСЯ ТЕМА</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-950">
          {house.sign ? `Дом находится в знаке ${house.sign}.` : 'Знак дома не определён.'}
          {signStyle ? ` В символическом прочтении этот знак связан с такими способами действовать: ${signStyle}.` : ''}
        </p>
      </section>

      <section>
        <p className="text-xs font-semibold text-gray-500">3. УПРАВИТЕЛЬ ДОМА — С ЧЕМ СВЯЗАНА ЭТА СФЕРА</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-800">{lordSentence}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">{dignityText}</p>
        {ruledElsewhere.length > 0 && (
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            Эта же планета управляет также {ruledElsewhere.map((item) => `${item}-м домом — ${HOUSE_PLAIN_NAMES[item] ?? 'дополнительной сферой'}`).join('; ')}. Поэтому темы этих домов рассматриваются совместно, а не как независимые показатели.
          </p>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold text-gray-500">4. ПЛАНЕТЫ В ДОМЕ</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-800">
          {occupants.length
            ? `В доме расположены: ${occupants.join(', ')}. Их символические функции добавляют дополнительные оттенки к теме дома.`
            : 'Планет в доме нет. Это не означает, что сфера не важна: её основным ориентиром остаются знак и положение управителя.'}
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-700">КАК ЭТО МОЖЕТ ПРОЯВЛЯТЬСЯ В ЖИЗНИ</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">
          Например, можно наблюдать, как вы решаете задачи этой сферы, какие привычные способы помогают, а какие требуют пересмотра. Само положение дома не предсказывает конкретное событие.
        </p>
        <p className="mt-2 text-xs font-semibold text-indigo-800">ПРАКТИЧЕСКИЙ ШАГ</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-800">{HOUSE_PRACTICAL_STEPS[house.house]}</p>
      </section>

      <p className="text-xs leading-relaxed text-gray-600">{statusText}</p>

      <details className="rounded-lg border border-gray-100 p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">Расчётные данные и ограничения</summary>
        <div className="mt-2 space-y-2 text-xs text-gray-600">
          <p><strong>Знак дома:</strong> {house.sign ?? 'не определён'}</p>
          <p><strong>Управитель:</strong> {house.lordName ?? 'не определён'}; знак {house.lordSign ?? 'не определён'}; дом {house.lordHouse ?? 'не определён'}.</p>
          <p><strong>Достоинство управителя:</strong> {house.lordDignity ?? 'не определено'}</p>
          <p><strong>Планеты в доме:</strong> {occupants.length ? occupants.join(', ') : 'нет'}</p>
          <p><strong>Аспекты на дом:</strong> {house.aspects.length ? house.aspects.map((item) => HOUSE_PLANET_NAMES[item] ?? item).join(', ') : 'не обнаружены по выбранной схеме'}</p>
          <p><strong>Связанные дома:</strong> {house.connectedHouses.length ? house.connectedHouses.join(', ') : 'не выявлены'}</p>
          {house.dispositorChain.length > 0 && <p><strong>Цепочка диспозиторов:</strong> {house.dispositorChain.map((item) => `${HOUSE_PLANET_NAMES[item.planet] ?? item.planet} — ${item.sign}${item.house === null ? '' : `, ${item.house}-й дом`}`).join(' → ')}</p>}
          {house.supportingFactors.length > 0 && <p><strong>Поддерживающие факторы:</strong> {house.supportingFactors.join(' ')}</p>}
          {house.attentionFactors.length > 0 && <p><strong>Факторы внимания:</strong> {house.attentionFactors.join(' ')}</p>}
          {house.evidence.length > 0 && <details><summary className="cursor-pointer font-medium">Полные технические основания</summary><ul className="mt-1 list-disc space-y-1 pl-4">{house.evidence.map((item) => <li key={item}>{item}</li>)}</ul></details>}
          {house.limitations.map((item) => <p key={item} className="text-gray-500">{item}</p>)}
        </div>
      </details>
    </div>
  );
}



function PlanetQuickMeaning({ planet }: { planet: ReturnType<typeof analyzeAllNatalPlanets>[number] }) {
  return <NatalPlanetStory planet={planet} />;
}

export function NatalAnalysisTab({ natalChart }: NatalAnalysisTabProps) {
  const sunHouse = getPlanetHouse(natalChart, 'Sun');
  const moonHouse = getPlanetHouse(natalChart, 'Moon');
  const sunFocus = getSunHouseFocus(natalChart, sunHouse);
  const chartFacts = buildNatalChartFacts(natalChart);
  const allHouseAnalyses = analyzeAllNatalHouses(chartFacts);
  const allPlanetAnalyses = analyzeAllNatalPlanets(chartFacts);
  const moonHouseFocus = getMoonHouseFocus(natalChart, moonHouse);
  const ascDesc = getAscendantDescription(natalChart.ascendant.signName);
  const sunSignRu = SIGNS_RU[natalChart.planets.Sun.sign] ?? natalChart.planets.Sun.signName;
  const moonSignRu = SIGNS_RU[natalChart.planets.Moon.sign] ?? natalChart.planets.Moon.signName;
  const sunDesc = getSunDescription(sunSignRu, sunHouse);
  const moonDesc = getMoonDescription(moonSignRu, moonHouse);

  return (
    <div className="space-y-6">
      <InsightCard
        icon={Star}
        title={ascDesc.title}
        subtitle="Основа характера, тело и первый способ реагировать на жизнь"
        accent="border-purple-200"
      >
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            Общая символика знака Лагны
            <TermTooltip term="ascendant" />
          </h4>
          <p className="text-sm text-gray-800 leading-relaxed mb-3">{ascDesc.whatItIs}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.meaning}</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-700 uppercase mb-2">Управитель Лагны <TermTooltip term="lagna" /> — куда направлена энергия личности</h4>
          <HouseQuickMeaning house={allHouseAnalyses[0]} />
        </div>

        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-700 uppercase mb-2">Типичные проявления знака (общая символика)</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.howManifests}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-700 uppercase mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Типичные сильные стороны знака
            </h4>
            <BulletList items={ascDesc.strengths} tone="green" />
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-700 uppercase mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Типичные зоны роста знака
            </h4>
            <BulletList items={ascDesc.challenges} tone="orange" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Общие практики для самонаблюдения
          </h4>
          <BulletList items={ascDesc.practicalAdvice} tone="blue" />
        </div>

        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-dashed border-pink-400">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-pink-600" />
            Общая идея для самонаблюдения
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{ascDesc.dailyChallenge}</p>
        </div>
      </InsightCard>

      <InsightCard
        icon={Sun}
        title={sunDesc.title}
        subtitle={`Солнце в ${sunSignRu}, ${sunHouse ? `${sunHouse}-й дом` : 'дом не определён'}`}
        accent="border-yellow-200"
      >
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-2">Общая символика Солнца</h4>
          <p className="text-sm text-gray-800 leading-relaxed mb-3">{sunDesc.essence}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{sunDesc.lifePurpose}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-yellow-200">
            <h4 className="text-sm font-semibold text-yellow-700 uppercase mb-2">Как проявляться</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{sunDesc.inSign}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-700 uppercase mb-2">Где светить</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{sunFocus}</p>
            <div className="mt-3 border-t border-orange-100 pt-3">
              <PlanetQuickMeaning planet={allPlanetAnalyses.find((item) => item.planet === 'Sun')!} />
            </div>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-600" />
            Возможные действия по теме дома
          </h4>
          <BulletList items={sunDesc.practicalSteps} tone="yellow" />
        </div>
      </InsightCard>

      <InsightCard
        icon={Moon}
        title={moonDesc.title}
        subtitle={`Луна в ${moonSignRu}, ${moonHouse ? `${moonHouse}-й дом` : 'дом не определён'}`}
        accent="border-blue-200"
      >
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
          <h4 className="font-semibold text-gray-900 mb-2">Общая символика Луны</h4>
          <p className="text-sm text-gray-800 leading-relaxed">{moonDesc.essence}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-700 uppercase mb-2">Конкретная жизненная сфера Луны</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{moonHouseFocus}</p>
          <div className="mt-3 border-t border-blue-100 pt-3">
            <PlanetQuickMeaning planet={allPlanetAnalyses.find((item) => item.planet === 'Moon')!} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-700 uppercase mb-2">Эмоциональные потребности</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{moonDesc.emotionalNeeds}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-700 uppercase mb-2">Где искать комфорт</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{moonDesc.inHouse}</p>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
          <h4 className="text-sm font-semibold text-purple-800 uppercase mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Что делает вас счастливее
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{moonDesc.comfort}</p>
        </div>
      </InsightCard>

      <GlassCard>
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Как складываются три главных показателя</h3>
          <p className="text-sm text-gray-600">Лагна, Солнце и Луна описывают разные стороны личности. Их не нужно смешивать в одну характеристику.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-3">
              <h4 className="font-semibold text-gray-900">Лагна — ваш способ действовать</h4>
              <p className="mt-1 text-sm text-gray-700">{ascDesc.meaning}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
              <h4 className="font-semibold text-gray-900">Солнце — цели и воля</h4>
              <p className="mt-1 text-sm text-gray-700">{sunDesc.essence} {sunDesc.lifePurpose}</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
              <h4 className="font-semibold text-gray-900">Луна — чувства и потребности</h4>
              <p className="mt-1 text-sm text-gray-700">{moonDesc.essence} {moonDesc.emotionalNeeds}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700">Практически это можно читать так: Лагна показывает, как вы обычно действуете; Солнце — к чему стремитесь; Луна — что помогает чувствовать себя спокойно и устойчиво.</p>
        </section>
      </GlassCard>

      <GlassCard>
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Все 12 домов простыми словами</h3>
              <p className="text-sm text-gray-600">Для каждого дома: его тема, планеты, управитель и простое объяснение связи с другой сферой жизни.</p>
              <p className="mt-1 text-xs text-indigo-700">Восходящий знак (Асцендент): {natalChart.ascendant.signName}. Используется система Джйотиш с айанамшей Лахири и методом целых знаков: каждый знак считается отдельным домом.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {allHouseAnalyses.map((house) => (
              <section key={house.house} className="rounded-xl border border-gray-200 bg-white/80 p-4 space-y-3">
                <h4 className="font-semibold text-gray-900">{house.house}-й дом — {house.theme}</h4>
                <HouseQuickMeaning house={house} />
              </section>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-600 to-violet-600">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Разбор девяти планет и лунных узлов</h3>
              <p className="text-sm text-gray-600">Где находится планета, с какими жизненными сферами её связывает карта и какие дополнительные связи учитываются в трактовке.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {allPlanetAnalyses.map((planet) => (
              <section key={planet.planet} className="rounded-xl border border-gray-200 bg-white/80 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{planet.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {planet.available
                        ? `${planet.sign}; ${planet.house ? `${planet.house}-й дом — ${HOUSE_PLAIN_NAMES[planet.house]}` : 'дом не определён'}`
                        : 'Положение планеты не рассчитано'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    planet.synthesis === 'supportive' ? 'bg-green-100 text-green-700'
                      : planet.synthesis === 'challenging' ? 'bg-amber-100 text-amber-800'
                        : planet.synthesis === 'mixed' ? 'bg-blue-100 text-blue-700'
                          : planet.synthesis === 'incomplete' ? 'bg-gray-100 text-gray-600'
                            : 'bg-slate-100 text-slate-700'
                  }`}>
                    {planet.synthesis === 'supportive' ? 'Есть поддержка'
                      : planet.synthesis === 'challenging' ? 'Требует внимания'
                        : planet.synthesis === 'mixed' ? 'Смешанные факторы'
                          : planet.synthesis === 'incomplete' ? 'Недостаточно данных' : 'Нейтрально'}
                  </span>
                </div>
                <PlanetQuickMeaning planet={planet} />
                <details className="rounded-lg border border-gray-100 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">Дополнительные астрологические показатели</summary>
                  <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Градус и накшатра <TermTooltip term="nakshatra" /></h5>
                    <p className="text-sm text-gray-700">{planet.degreeInSign?.toFixed(2) ?? '—'}° · {planet.nakshatra ?? 'накшатра не определена'}{planet.pada ? `, пада ${planet.pada}` : ''}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Какими сферами управляет планета</h5>
                    <p className="text-sm text-gray-700">{planet.ruledHouses.length ? planet.ruledHouses.map((house) => `${house}-й дом — ${HOUSE_PLAIN_NAMES[house]}`).join('; ') : 'Не определены'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Достоинство <TermTooltip term="dignity" /></h5>
                    <p className="text-sm text-gray-700">{planet.dignity?.label ?? 'Не определено'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Соединения по знаку <TermTooltip term="conjunction" /></h5>
                    <p className="text-sm text-gray-700">{planet.conjunctions.length ? planet.conjunctions.join(', ') : 'Не обнаружены'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Исходящие аспекты <TermTooltip term="aspect" /></h5>
                    <p className="text-sm text-gray-700">{planet.aspectsToPlanets.length ? planet.aspectsToPlanets.join(', ') : 'Не обнаружены'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Входящие аспекты <TermTooltip term="aspect" /></h5>
                    <p className="text-sm text-gray-700">{planet.receivesAspectsFrom.length ? planet.receivesAspectsFrom.join(', ') : 'Не обнаружены'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Аспекты на дома <TermTooltip term="aspect" /></h5>
                    <p className="text-sm text-gray-700">{planet.aspectsToHouses.length ? planet.aspectsToHouses.join(', ') : 'Не обнаружены'}</p>
                  </div>
                </div>
                {planet.outgoingAspectDetails.length || planet.incomingAspectDetails.length || planet.houseAspectDetails.length ? (
                  <div className="rounded-lg bg-sky-50 p-3 space-y-1">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-sky-800">Как планеты связаны аспектами</h5>
                    <p className="text-xs text-sky-800">Аспект — это связь между планетами или домами по определённому угловому правилу. Здесь указано, из какого дома идёт связь и какой тип аспекта использован.</p>
                    {planet.outgoingAspectDetails.map((aspect) => <p key={`out-${aspect.planet}`} className="text-xs text-sky-900">Из {aspect.sourceHouse}-го дома к {aspect.planet} в {aspect.targetHouse}-м доме: {aspect.offset}-й Parashari аспект.</p>)}
                    {planet.incomingAspectDetails.map((aspect) => <p key={`in-${aspect.planet}`} className="text-xs text-sky-900">От {aspect.planet} из {aspect.sourceHouse}-го дома к этой планете в {aspect.targetHouse}-м доме: {aspect.offset}-й Parashari аспект.</p>)}
                    {planet.houseAspectDetails.map((aspect) => <p key={`house-${aspect.house}`} className="text-xs text-sky-900">Аспект на {aspect.house}-й дом: {aspect.kind}.</p>)}
                  </div>
                ) : null}
                {planet.dispositorChain.length ? (
                  <div className="rounded-lg bg-violet-50 p-3 space-y-1">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-violet-800">Цепочка управителей знаков <TermTooltip term="dispositor" /></h5>
                    <p className="text-xs text-violet-800">Каждая планета находится в определённом знаке. У этого знака есть своя управляющая планета; её положение образует следующее звено цепочки. Так приложение показывает дополнительные связи между планетами.</p>
                    <p className="text-sm text-violet-900">
                      {planet.dispositorChain.map((step) => `${step.planet} — ${step.sign}${step.house === null ? '' : `, ${step.house}-й дом`}${step.dignity ? `, ${step.dignity}` : ''}`).join(' → ')}
                    </p>
                    <p className="text-xs text-violet-800">
                      {planet.dispositorChainEnd === 'self-dispositor' ? 'Завершение: собственный диспозитор'
                        : planet.dispositorChainEnd === 'cycle' ? 'Завершение: цикл диспозиторов'
                          : planet.dispositorChainEnd === 'limit' ? 'Достигнут предел глубины цепочки'
                            : 'Цепочка неполная: данных следующего звена нет'}
                    </p>
                  </div>
                ) : null}
                {planet.supportingFactors.length ? (
                  <div className="rounded-lg bg-green-50 p-3 space-y-1">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-green-800">Поддерживающие показатели</h5>
                    {planet.supportingFactors.map((item) => <p key={item} className="text-sm text-green-900">{item}</p>)}
                  </div>
                ) : null}
                {planet.attentionFactors.length ? (
                  <div className="rounded-lg bg-amber-50 p-3 space-y-1">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-amber-800">Факторы, требующие внимания</h5>
                    {planet.attentionFactors.map((item) => <p key={item} className="text-sm text-amber-900">{item}</p>)}
                  </div>
                ) : null}
                <details className="rounded-lg border border-gray-100 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">Показать доказательства и ограничения</summary>
                  <ul className="mt-2 space-y-1 list-disc pl-5">
                    {planet.evidence.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-600">{item}</li>)}
                  </ul>
                  <ul className="mt-2 space-y-1 list-disc pl-5">
                    {planet.limitations.map((item) => <li key={item} className="text-xs leading-relaxed text-gray-500">{item}</li>)}
                  </ul>
                </details>
                  </div>
                </details>
              </section>
            ))}
          </div>
        </div>
      </GlassCard>

      <NatalIntegratedSynthesisSection natalChart={natalChart} />
      <NatalYogasSection natalChart={natalChart} />

      <GlassCard>
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-600">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            Как читать это без перегруза
          </h4>
          <BulletList
            tone="yellow"
            items={[
              'Начните с Лагны: она показывает природный стиль жизни и базовую стратегию.',
              'Солнце используйте как ориентир цели, а Луну как индикатор эмоционального ресурса.',
              'Переходите к домам и аспектам только после этого: так карта не превращается в набор разрозненных фактов.',
            ]}
          />
        </div>
      </GlassCard>

      <NatalPrecisionSection natalChart={natalChart} />
    </div>
  );
}
