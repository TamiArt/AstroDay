import type { NatalPlanetPersonalizedAnalysis } from '../../utils/natalPlanetPersonalizedAnalysis';

const HOUSE_NAMES: Record<number, string> = {
  1: 'личность и самостоятельность', 2: 'личные деньги и ценности',
  3: 'навыки и общение', 4: 'дом, семья и внутренняя опора',
  5: 'творчество, обучение и дети', 6: 'работа и повседневные задачи',
  7: 'отношения и партнёрство', 8: 'общие ресурсы и перемены',
  9: 'обучение и мировоззрение', 10: 'профессия и ответственность',
  11: 'доходы и сообщества', 12: 'уединение и восстановление',
};

const SIGN_CASE: Record<string, string> = {
  Овен: 'Овна', Телец: 'Тельца', Близнецы: 'Близнецов', Рак: 'Рака',
  Лев: 'Льва', Дева: 'Девы', Весы: 'Весов', Скорпион: 'Скорпиона',
  Стрелец: 'Стрельца', Козерог: 'Козерога', Водолей: 'Водолея', Рыбы: 'Рыб',
};

const SIGN_STYLES: Record<string, string> = {
  Овен: 'инициатива и прямота', Телец: 'устойчивость и практичность',
  Близнецы: 'гибкость и обмен информацией', Рак: 'забота и чувство безопасности',
  Лев: 'самовыражение и творчество', Дева: 'анализ и внимание к деталям',
  Весы: 'сотрудничество и баланс интересов', Скорпион: 'глубина и исследование',
  Стрелец: 'обучение и расширение кругозора', Козерог: 'структура и ответственность',
  Водолей: 'независимый взгляд и нестандартные решения', Рыбы: 'воображение и восприимчивость',
};

const PLANET_APPLICATIONS: Record<string, string[]> = {
  Sun: ['самостоятельно определять цели и брать ответственность за результат', 'развивать лидерские навыки и уверенность в решениях'],
  Moon: ['замечать условия, которые помогают сохранять эмоциональное равновесие', 'выстраивать комфортный режим и заботиться о восстановлении'],
  Mars: ['начинать сложные задачи и доводить их до результата', 'защищать границы и оценивать последствия перед решительным действием'],
  Mercury: ['анализировать информацию, проверять гипотезы и искать причины проблем', 'осваивать новые знания, инструменты и способы общения'],
  Jupiter: ['связывать знания в целостную систему', 'выбирать долгосрочные ориентиры и делиться опытом'],
  Venus: ['развивать чувство формы, цвета и композиции', 'находить взаимовыгодные договорённости'],
  Saturn: ['выстраивать устойчивые процессы', 'разделять большую цель на этапы и регулярно проверять прогресс'],
  Rahu: ['исследовать новые технологии и непривычные подходы', 'проверять нестандартные идеи небольшими экспериментами'],
  Ketu: ['глубоко изучать узкую тему', 'сосредотачиваться на главном и убирать лишние действия'],
};

const PLANET_WATCHOUTS: Record<string, string> = {
  Sun: 'не путать самостоятельность с необходимостью всё контролировать',
  Moon: 'не принимать каждое эмоциональное колебание за окончательный сигнал к действию',
  Mars: 'не торопиться с решением конфликта, не оценив последствия',
  Mercury: 'не застревать в бесконечном анализе и перепроверках',
  Jupiter: 'не считать убеждение доказанным фактом без проверки источников',
  Venus: 'не отказываться от собственных потребностей ради внешнего одобрения',
  Saturn: 'не превращать ответственность в чрезмерную строгость к себе',
  Rahu: 'не выбирать новизну только ради новизны',
  Ketu: 'не уходить в изоляцию и не терять связь с повседневными задачами',
};

const PLANET_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

function formatRuledHouses(houses: number[]): string {
  const numbers = houses.map((house) => house + '-м');
  if (numbers.length === 1) return numbers[0] + ' домом';
  return numbers.slice(0, -1).join(', ') + ' и ' + numbers[numbers.length - 1] + ' домами';
}

function getDignityExplanation(planet: NatalPlanetPersonalizedAnalysis): string {
  const dignity = planet.dignity?.dignity;
  if (dignity === 'not_applicable') {
    return 'Для Раху и Кету оценка достоинства в этой модели не применяется.';
  }
  if (dignity === 'exalted') {
    return 'В традиции Джйотиш это положение называют экзальтацией. Это один из факторов интерпретации, а не оценка личности.';
  }
  if (dignity === 'own') {
    return 'Планета находится в собственном знаке — знаке, которым она управляет.';
  }
  if (dignity === 'debilitated') {
    return 'Это положение называют падением. Его рассматривают как один из факторов карты, а не как приговор или характеристику человека.';
  }
  if (dignity === 'other') {
    return 'В этой модели не отмечены экзальтация, собственный знак или падение. Это не означает, что планета слабая или неблагоприятная: другие показатели карты рассматриваются отдельно.';
  }
  return 'Статус достоинства не рассчитан в доступных данных; оценка не подменяется предположением.';
}

export function NatalPlanetStory({ planet }: { planet: NatalPlanetPersonalizedAnalysis }) {
  if (!planet.available) {
    return <p className="text-sm leading-relaxed text-gray-600">{planet.interpretation} Недостающие данные не заменяются предположениями.</p>;
  }

  const name = PLANET_NAMES[planet.planet] ?? planet.name;
  const sign = planet.sign;
  const signGenitive = sign ? SIGN_CASE[sign] ?? sign : null;
  const signStyle = sign ? SIGN_STYLES[sign] : null;
  const houseName = planet.house ? HOUSE_NAMES[planet.house] : null;
  const ruledHouses = planet.ruledHouses.map((house) => house + '-й дом — ' + (HOUSE_NAMES[house] ?? 'сфера не определена'));
  const applications = PLANET_APPLICATIONS[planet.planet] ?? [];
  const summary = sign && planet.house
    ? name + ' связывают с темами ' + planet.function + '. В знаке ' + signGenitive + ' эта тема рассматривается через ' + (signStyle ?? 'символику знака') + ', а ' + planet.house + '-й дом связывает её с темами «' + (houseName ?? 'сфера не определена') + '».'
    : name + ' символизирует ' + planet.function + '. Часть данных о знаке или доме отсутствует, поэтому полное сочетание «планета — знак — дом» здесь не формулируется.';

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <section className="rounded-xl bg-indigo-50/70 p-3">
        <h5 className="font-semibold text-indigo-950">Главный вывод</h5>
        <p className="mt-1 font-semibold text-gray-900">{summary}</p>
        <p className="mt-2 text-xs text-gray-600">Такое прочтение относится к символической традиции Джйотиш и предлагает тему для самонаблюдения, а не психологический диагноз или обязательное описание характера.</p>
      </section>

      <section>
        <h5 className="font-semibold text-indigo-900">Что символизирует планета?</h5>
        <p className="mt-1 text-gray-800">Ключевые темы: {planet.function}.</p>
      </section>

      <section>
        <h5 className="font-semibold text-indigo-900">Как проявляется в знаке?</h5>
        <p className="mt-1 text-gray-800">
          {sign && signGenitive
            ? 'Планета находится в знаке ' + signGenitive + '. В символическом прочтении этот знак связывают с темами: ' + (signStyle ?? 'особенности знака в этой модели не описаны') + '.'
            : 'Знак планеты не определён в исходных данных.'}
        </p>
      </section>

      <section>
        <h5 className="font-semibold text-indigo-900">С какой сферой связан дом?</h5>
        <p className="mt-1 text-gray-800">
          {planet.house && houseName
            ? planet.house + '-й дом связывают с темами «' + houseName + '». Поэтому символические качества ' + name + ' рассматриваются через эту сферу жизни.'
            : 'Дом планеты не определён в исходных данных.'}
        </p>
      </section>

      <section>
        <h5 className="font-semibold text-indigo-900">Какими домами управляет планета?</h5>
        <p className="mt-1 text-gray-800">
          {ruledHouses.length
            ? name + ' управляет ' + formatRuledHouses(planet.ruledHouses) + ': ' + ruledHouses.join('; ') + '. Управление домом и положение планеты — разные связи.'
            : 'Управляемые дома не определены в доступных данных.'}
        </p>
      </section>

      <section>
        <h5 className="font-semibold text-indigo-900">Достоинство планеты</h5>
        <p className="mt-1 text-gray-800">{getDignityExplanation(planet)}</p>
      </section>

      <section>
        <h5 className="font-semibold text-indigo-900">Где эти темы могут быть полезны?</h5>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-800">
          {applications.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
        <h5 className="font-semibold text-amber-900">На что обратить внимание</h5>
        <p className="mt-1 text-gray-800">{PLANET_WATCHOUTS[planet.planet] ?? 'Полезно наблюдать за тем, как эта тема проявляется в конкретных обстоятельствах.'}.</p>
      </section>

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer font-medium text-gray-800">Дополнительные связи и технические основания</summary>
        <div className="mt-3 space-y-2 text-gray-700">
          <p>Градус внутри знака: {planet.degreeInSign === null ? 'не рассчитан' : planet.degreeInSign.toFixed(2) + '°'}.</p>
          <p>Накшатра: {planet.nakshatra ?? 'не определена'}{planet.pada ? ', пада ' + planet.pada : ''}.</p>
          {planet.supportingFactors.map((item) => <p key={item}>Дополнительный фактор: {item}</p>)}
          {planet.attentionFactors.map((item) => <p key={item}>Фактор для дополнительного внимания: {item}</p>)}
          {planet.conjunctions.length > 0 && <p>Соединения по знаку: {planet.conjunctions.map((item) => PLANET_NAMES[item] ?? item).join(', ')}. Точный орбис в этом показателе не оценивается.</p>}
          {planet.receivesAspectsFrom.length > 0 && <p>Получает аспекты от: {planet.receivesAspectsFrom.map((item) => PLANET_NAMES[item] ?? item).join(', ')}.</p>}
          {planet.aspectsToPlanets.length > 0 && <p>Аспектирует планеты: {planet.aspectsToPlanets.map((item) => PLANET_NAMES[item] ?? item).join(', ')}.</p>}
          {planet.aspectsToHouses.length > 0 && <p>Аспекты на дома: {planet.aspectsToHouses.join(', ')}.</p>}
          {planet.dispositor && <p>Управитель знака (диспозитор): {PLANET_NAMES[planet.dispositor] ?? planet.dispositor}{planet.dispositorHouse ? ', находится в ' + planet.dispositorHouse + '-м доме' : ''}.</p>}
          {planet.dispositorChain.length > 0 && <p>Цепочка диспозиторов: {planet.dispositorChain.map((step) => PLANET_NAMES[step.planet] ?? step.planet).join(' → ')}.</p>}
          {planet.evidence.map((item) => <p key={item} className="text-xs">{item}</p>)}
          {planet.limitations.map((item) => <p key={item} className="text-xs text-gray-500">{item}</p>)}
        </div>
      </details>
    </div>
  );
}
