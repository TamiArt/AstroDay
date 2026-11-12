import { buildNatalChartFacts } from '../../utils/natalChartFacts';
import { NatalYogasSection } from './NatalYogasSection';
import { NatalPrecisionSection } from './NatalPrecisionSection';
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

function getHouseConnectionText(house: ReturnType<typeof analyzeAllNatalHouses>[number]): string {
  if (!house.available || !house.lord || house.lordHouse === null) {
    return 'Положение управителя не определено, поэтому связь с другими сферами пока нельзя описать.';
  }
  const destination = HOUSE_PLAIN_NAMES[house.lordHouse] ?? `${house.lordHouse}-й дом`;
  if (house.lordHouse === house.house) {
    return `Управитель находится в своём доме. Тема ${HOUSE_PLAIN_NAMES[house.house]} получает прямой акцент.`;
  }
  return `Управитель находится в ${house.lordHouse}-м доме. Поэтому тема ${HOUSE_PLAIN_NAMES[house.house]} связывается с темой «${destination}».`;
}

function HouseQuickMeaning({ house }: { house: ReturnType<typeof analyzeAllNatalHouses>[number] }) {
  if (!house.available) {
    return <p className="text-sm text-gray-600">Нет исходных данных, чтобы определить знак и управителя этого дома.</p>;
  }
  const occupants = house.occupants.map((planet) => HOUSE_PLANET_NAMES[planet] ?? planet);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-500">О ЧЁМ ЭТОТ ДОМ</p>
        <p className="mt-1 text-sm text-gray-800">{house.theme.charAt(0).toUpperCase() + house.theme.slice(1)}.</p>
        <p className="mt-1 text-xs text-gray-600">Знак: {house.sign ?? 'не определён'}.</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500">ПЛАНЕТЫ В ДОМЕ</p>
        <p className="mt-1 text-sm text-gray-800">{occupants.length ? occupants.join(', ') : 'Планет нет — основное внимание уделяем управителю дома.'}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500">УПРАВИТЕЛЬ</p>
        <p className="mt-1 text-sm text-gray-800">{house.lordName ?? 'Не определён'}{house.lordSign ? ` находится в знаке ${house.lordSign}` : ''}{house.lordHouse ? `, в ${house.lordHouse}-м доме` : ''}{house.lordDignity ? `. Положение: ${house.lordDignity}` : ''}.</p>
      </div>
      <div className="rounded-lg bg-indigo-50/70 p-3">
        <p className="text-xs font-semibold text-indigo-800">ЧТО ЭТО ЗНАЧИТ ПРОСТЫМИ СЛОВАМИ</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-950">{getHouseConnectionText(house)}</p>
        {house.ruledHouses.filter((item) => item !== house.house).length > 0 && (
          <p className="mt-2 text-xs text-indigo-800">Этот же управитель отвечает также за {house.ruledHouses.filter((item) => item !== house.house).map((item) => `${item}-й дом (${HOUSE_PLAIN_NAMES[item]})`).join(', ')}.</p>
        )}
      </div>
      <details className="rounded-lg border border-gray-100 p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">Дополнительные показатели</summary>
        <div className="mt-2 space-y-2 text-xs text-gray-600">
          <p><strong>Знак дома:</strong> {house.sign ?? 'не определён'}</p>
          <p><strong>Аспекты на дом:</strong> {house.aspects.length ? house.aspects.map((item) => HOUSE_PLANET_NAMES[item] ?? item).join(', ') : 'не обнаружены по выбранной схеме'}</p>
          <p><strong>Связанные дома:</strong> {house.connectedHouses.length ? house.connectedHouses.join(', ') : 'отдельная связь не выявлена'}</p>
          {house.dispositorChain.length > 0 && <p><strong>Цепочка диспозиторов:</strong> <TermTooltip term="dispositor" /> {house.dispositorChain.map((item) => `${HOUSE_PLANET_NAMES[item.planet] ?? item.planet} — ${item.sign}${item.house === null ? '' : `, ${item.house}-й дом`}`).join(' → ')}</p>}
          {house.supportingFactors.length > 0 && <p><strong>Поддержка:</strong> {house.supportingFactors.join(' ')}</p>}
          {house.attentionFactors.length > 0 && <p><strong>Что требует внимания:</strong> {house.attentionFactors.join(' ')}</p>}
          {house.evidence.length > 0 && <details><summary className="cursor-pointer font-medium">Технические основания</summary><ul className="mt-1 list-disc space-y-1 pl-4">{house.evidence.map((item) => <li key={item}>{item}</li>)}</ul></details>}
          {house.limitations.length > 0 && <p className="text-gray-500">{house.limitations[0]}</p>}
        </div>
      </details>
    </div>
  );
}

const PLANET_PLAIN_MEANINGS: Record<string, string> = {
  Sun: 'личная воля, уверенность, цели и самостоятельность',
  Moon: 'эмоции, привычки, потребность в безопасности и забота',
  Mars: 'инициатива, решительность, действия и защита своих интересов',
  Mercury: 'мышление, обучение, общение, анализ и информация',
  Jupiter: 'знания, развитие, наставничество и жизненные ориентиры',
  Venus: 'отношения, симпатии, творчество, удовольствие и ценности',
  Saturn: 'ответственность, дисциплина, терпение и долгосрочные задачи',
  Rahu: 'амбиции, новый опыт и стремление попробовать непривычное',
  Ketu: 'исследование, концентрация и умение отделять главное от лишнего',
};
const PLANET_RU_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};
function PlanetQuickMeaning({ planet }: { planet: ReturnType<typeof analyzeAllNatalPlanets>[number] }) {
  if (!planet.available) return <p className="text-sm text-gray-600">Недостаточно данных, чтобы объяснить положение этой планеты.</p>;
  const name = PLANET_RU_NAMES[planet.planet] ?? planet.name;
  const meaning = PLANET_PLAIN_MEANINGS[planet.planet] ?? 'своя символическая функция';
  const houseName = HOUSE_PLAIN_NAMES[planet.house ?? 0] ?? 'неопределённая жизненная сфера';
  const ruled = planet.ruledHouses.map((house) => `${house}-й дом — ${HOUSE_PLAIN_NAMES[house]}`).join('; ');
  return (
    <div className="rounded-lg bg-indigo-50/70 p-3 space-y-2">
      <p className="text-xs font-semibold text-indigo-800">ЧТО ЭТА ПЛАНЕТА ОЗНАЧАЕТ В ВАШЕЙ КАРТЕ</p>
      <p className="text-sm leading-relaxed text-gray-800"><strong>{name}</strong> символизирует {meaning}. В вашей карте она находится в знаке {planet.sign}{planet.house ? `, в ${planet.house}-м доме — сфере «${houseName}»` : ''}.</p>
      <p className="text-sm leading-relaxed text-gray-800">{planet.house ? `Это связывает качества планеты с темами «${houseName}».` : 'Дом, через который проявляются качества планеты, пока не определён.'} {ruled ? `Кроме того, она управляет: ${ruled}.` : 'Управляемые ею дома в расчёте не определены.'}</p>
      <p className="text-xs text-gray-600">Это символическое описание роли планеты, а не характеристика человека по одному показателю.</p>
    </div>
  );
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
      <NatalPrecisionSection natalChart={natalChart} />
      <NatalIntegratedSynthesisSection natalChart={natalChart} />
      <NatalYogasSection natalChart={natalChart} />
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
    </div>
  );
}
