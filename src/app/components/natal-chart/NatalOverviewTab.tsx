import { useEffect, useMemo, useState } from 'react';
import { NatalChart as NatalChartType } from '../../utils/astrology';
import { buildNatalChartFacts } from '../../utils/natalChartFacts';
import { analyzeAllNatalPlanets } from '../../utils/natalPlanetPersonalizedAnalysis';
import { getPlanetIcon } from '../../utils/planetUtils';
import { GlassCard } from '../common/GlassCard';
import { NatalChartWheel } from '../NatalChartWheel';
import { PlanetsPositionTable } from '../PlanetsPositionTable';
import { NatalPlanetStory } from './NatalPlanetStory';

interface NatalOverviewTabProps {
  natalChart: NatalChartType;
}

const SIGN_CASE: Record<string, string> = {
  Овен: 'Овна', Телец: 'Тельца', Близнецы: 'Близнецов', Рак: 'Рака',
  Лев: 'Льва', Дева: 'Девы', Весы: 'Весов', Скорпион: 'Скорпиона',
  Стрелец: 'Стрельца', Козерог: 'Козерога', Водолей: 'Водолея', Рыбы: 'Рыб',
};
const HOUSE_MEANINGS: Record<number, string> = {
  1: 'личность и самостоятельность', 2: 'личные деньги и ценности',
  3: 'навыки и общение', 4: 'дом, семья и внутренняя опора',
  5: 'творчество, обучение и дети', 6: 'работа и повседневные задачи',
  7: 'отношения и партнёрство', 8: 'общие ресурсы и перемены',
  9: 'обучение и мировоззрение', 10: 'профессия и ответственность',
  11: 'доходы и сообщества', 12: 'уединение и восстановление',
};
const PLANET_LABELS: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

function signInGenitive(sign: string | null | undefined): string {
  return sign ? SIGN_CASE[sign] ?? sign : 'не определён';
}

export function NatalOverviewTab({ natalChart }: NatalOverviewTabProps) {
  const [showAspects, setShowAspects] = useState(false);
  const [activePlanet, setActivePlanet] = useState<string | null>(null);
  const [activeHouse, setActiveHouse] = useState<number | null>(null);
  const facts = useMemo(() => buildNatalChartFacts(natalChart), [natalChart]);
  const planets = useMemo(() => analyzeAllNatalPlanets(facts), [facts]);
  const sun = planets.find((planet) => planet.planet === 'Sun') ?? null;
  const moon = planets.find((planet) => planet.planet === 'Moon') ?? null;
  const ascendantSign = facts.chart.ascendantSign;
  const firstHouse = facts.houses.find((house) => house.number === 1) ?? null;
  const firstHouseLord = firstHouse?.lord ?? null;
  const firstHouseLordHouse = firstHouseLord ? facts.planets[firstHouseLord]?.house ?? null : null;
  const selectedHouse = activeHouse
    ? facts.houses.find((house) => house.number === activeHouse) ?? null
    : null;

  useEffect(() => {
    if (!activePlanet) return;
    document.getElementById('planet-card-' + activePlanet)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activePlanet]);

  const renderMainPoint = (
    title: string,
    subtitle: string,
    sign: string | null,
    house: number | null,
    icon: string,
  ) => (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-700">
        {sign ? 'Знак ' + signInGenitive(sign) : 'Знак не рассчитан'}
        {house ? ' · ' + house + '-й дом' : ''}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Натальная карта</p>
        <h3 className="mt-1 text-xl font-bold text-gray-900">Что показывает моя карта?</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
          Это схема расположения небесных тел на момент рождения. В традиции Джйотиш её используют
          для символического изучения разных жизненных тем. Карта не является научным описанием
          личности и не определяет, каким человек обязательно должен быть.
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Три главные точки карты</h3>
        <p className="mt-1 text-sm text-gray-600">Это три разных ориентира, а не три оценки личности.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {renderMainPoint('Солнце', 'Воля и самоопределение', sun?.sign ?? null, sun?.house ?? null, getPlanetIcon('Sun'))}
          {renderMainPoint('Луна', 'Эмоции и повседневные потребности', moon?.sign ?? null, moon?.house ?? null, getPlanetIcon('Moon'))}
          {renderMainPoint('Асцендент', 'Знак, с которого начинается 1-й дом', ascendantSign, 1, '↗')}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Как читать положение планеты?</h3>
        <p className="mt-1 text-sm text-gray-600">Каждый элемент отвечает на свой вопрос. Вместе они дают основу символической интерпретации.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-2xl" aria-hidden="true">☀</p>
            <h4 className="mt-2 font-semibold">Планета — ЧТО?</h4>
            <p className="mt-1 text-sm text-gray-700">Какую тему символизирует. Например, Солнце связывают с волей, самоопределением и ответственностью.</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-2xl" aria-hidden="true">♏</p>
            <h4 className="mt-2 font-semibold">Знак — КАК?</h4>
            <p className="mt-1 text-sm text-gray-700">Каким способом символически проявляется тема планеты. Например, Скорпион связывают с глубиной и исследованием.</p>
          </div>
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
            <p className="text-2xl" aria-hidden="true">⌂</p>
            <h4 className="mt-2 font-semibold">Дом — ГДЕ?</h4>
            <p className="mt-1 text-sm text-gray-700">С какой сферой жизни связывают положение. Например, 4-й дом — дом, семья и внутренняя опора.</p>
          </div>
        </div>
        {sun?.available && sun.sign && sun.house && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white/80 p-4">
            <h4 className="font-semibold text-gray-900">Пример из вашей карты: Солнце</h4>
            <p className="mt-1 text-sm text-gray-700">
              Солнце символизирует волю и самоопределение. Оно находится в знаке {signInGenitive(sun.sign)}, в {sun.house}-м доме.
              Этот дом связывают с темами «{HOUSE_MEANINGS[sun.house] ?? 'сфера не определена'}».
            </p>
            <p className="mt-2 text-sm text-gray-700">
              В традиции Джйотиш это сочетание связывает тему самостоятельности с вопросами
              {sun.house === 4 ? ' дома, семьи и внутренней опоры' : ' ' + (HOUSE_MEANINGS[sun.house] ?? 'соответствующей сферы жизни')}.
              Это направление для самонаблюдения, а не утверждение о ваших чертах.
            </p>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Как работает управитель дома?</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          У каждого знака есть планета-управитель. Если знак стоит в определённом доме,
          его управитель связывает темы этого дома со своим положением в карте.
        </p>
        {firstHouse && firstHouseLord && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white/80 p-4">
            <p className="text-sm font-semibold text-gray-900">
              1-й дом: {firstHouse.sign} → {PLANET_LABELS[firstHouseLord] ?? firstHouseLord}
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {PLANET_LABELS[firstHouseLord] ?? firstHouseLord} управляет знаком {firstHouse.sign}.
              {firstHouseLordHouse
                ? ' Эта планета находится в ' + firstHouseLordHouse + '-м доме.'
                : ' Положение управителя в доме не определено.'}
              {' '}Поэтому темы 1-го дома (личность и самостоятельность) связываются с темами
              {firstHouseLordHouse
                ? ' ' + (HOUSE_MEANINGS[firstHouseLordHouse] ?? 'дома расположения управителя') + '.'
                : ' положения управителя в карте.'}
            </p>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Мои планеты</h3>
        <p className="mt-1 text-sm text-gray-600">
          Кратко — символика и положение каждой планеты. Нажмите на карточку, чтобы открыть
          одинаково устроенный подробный разбор.
        </p>
        <div className="mt-4 space-y-3">
          {planets.map((planet) => {
            const isBhadra = planet.planet === 'Mercury'
              && ['Близнецы', 'Дева'].includes(planet.sign ?? '')
              && [1, 4, 7, 10].includes(planet.house ?? 0);
            return (
              <details
                id={'planet-card-' + planet.planet}
                key={planet.planet}
                open={activePlanet === planet.planet}
                onToggle={(event) => {
                  if (event.currentTarget.open) setActivePlanet(planet.planet);
                  else if (activePlanet === planet.planet) setActivePlanet(null);
                }}
                className="rounded-xl border border-gray-200 bg-white/80 p-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{getPlanetIcon(planet.planet)}</span>
                        <h4 className="font-semibold text-gray-900">{planet.name}</h4>
                        {isBhadra && <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">Бхадра-йога</span>}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{planet.function}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {planet.available
                          ? (planet.sign ? 'Знак ' + signInGenitive(planet.sign) : 'знак не определён') + ' · ' + (planet.house ? planet.house + '-й дом' : 'дом не определён')
                          : 'Положение не рассчитано'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-indigo-700">{activePlanet === planet.planet ? 'Скрыть подробности ↑' : 'Подробнее ↓'}</span>
                  </div>
                </summary>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <NatalPlanetStory planet={planet} />
                </div>
              </details>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Натальная карта</h3>
            <p className="mt-1 text-sm text-gray-600">Схема показывает знаки, номера домов и расположение планет.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAspects}
              onChange={(event) => setShowAspects(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Показать аспекты</span>
          </label>
        </div>
        <ul className="mb-3 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
          <li>Числа 1–12 — номера домов.</li>
          <li>Названия по окружности — знаки зодиака.</li>
          <li>Символы — планеты и Асцендент.</li>
          <li>Асцендент задаёт начало 1-го дома.</li>
        </ul>
        <NatalChartWheel
          natalChart={natalChart}
          showAspects={showAspects}
          onPlanetSelect={(planet) => setActivePlanet(planet)}
          onHouseSelect={(house) => setActiveHouse(house)}
        />
        {selectedHouse && (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
            <p className="font-semibold text-gray-900">{selectedHouse.number}-й дом — {HOUSE_MEANINGS[selectedHouse.number]}</p>
            <p className="mt-1 text-sm text-gray-700">Знак дома: {selectedHouse.sign}. Управитель: {selectedHouse.lord ? PLANET_LABELS[selectedHouse.lord] : 'не определён'}.</p>
            {selectedHouse.lord && selectedHouse.lordHouse && (
              <p className="mt-1 text-sm text-gray-700">
                Управитель находится в {selectedHouse.lordHouse}-м доме. Темы {selectedHouse.number}-го дома в этой модели связываются с темами дома, где расположен его управитель.
              </p>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Позиции планет</h3>
        <p className="mt-1 text-sm text-gray-600">Сначала — знак и дом. Градусы, накшатра и пада доступны в раскрывающихся строках.</p>
        <div className="mt-3"><PlanetsPositionTable natalChart={natalChart} /></div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Как читать натальную карту: словарь</h3>
        <details className="mt-3 rounded-xl border border-gray-200 p-3">
          <summary className="cursor-pointer font-medium text-gray-800">Показать простые объяснения терминов</summary>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="font-semibold">Натальная карта</dt><dd className="text-gray-600">Схема положения небесных тел на момент рождения.</dd></div>
            <div><dt className="font-semibold">Планета</dt><dd className="text-gray-600">Символ определённой темы или функции в астрологической традиции.</dd></div>
            <div><dt className="font-semibold">Знак</dt><dd className="text-gray-600">Символический способ проявления качеств планеты.</dd></div>
            <div><dt className="font-semibold">Дом</dt><dd className="text-gray-600">Сфера жизни, с которой связывают положение планеты.</dd></div>
            <div><dt className="font-semibold">Асцендент</dt><dd className="text-gray-600">Знак, с которого начинается 1-й дом.</dd></div>
            <div><dt className="font-semibold">Управитель дома</dt><dd className="text-gray-600">Планета, управляющая знаком на начале дома. Её положение связывает темы этого дома с другой сферой карты.</dd></div>
            <div><dt className="font-semibold">Накшатра</dt><dd className="text-gray-600">Один из 27 участков зодиакального пути Луны.</dd></div>
            <div><dt className="font-semibold">Пада</dt><dd className="text-gray-600">Одна из четырёх частей накшатры.</dd></div>
            <div><dt className="font-semibold">Градусы</dt><dd className="text-gray-600">Точное положение планеты внутри знака.</dd></div>
            <div><dt className="font-semibold">Достоинство</dt><dd className="text-gray-600">Традиционный астрологический статус положения планеты; не рейтинг личности и не оценка жизненного успеха.</dd></div>
          </dl>
        </details>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-900">Точность расчётов и принципы интерпретации</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          Расчёт использует сидерический зодиак, айанамшу Лахири и систему домов Whole Sign
          (целые знаки): знак Асцендента считается 1-м домом, следующий знак — 2-м и так далее.
          Для аспектов применяется система Parashari graha drishti.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          Астрологические трактовки относятся к символической традиции Джйотиш. Они не являются
          научным описанием личности, психологической диагностикой или гарантированным прогнозом.
          Воспринимайте их как материал для размышления, а важные решения принимайте на основе
          проверяемых фактов и профессиональных рекомендаций.
        </p>
        {facts.dataQuality.warnings.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-800">
            {facts.dataQuality.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
