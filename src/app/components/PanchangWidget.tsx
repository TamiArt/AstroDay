import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { PanchangData } from '../utils/panchang';
import { NAKSHATRAS } from '../utils/astrology';
import { TermTooltip } from './common/TermTooltip';
import { getPlanetName } from '../utils/planetUtils';
import type { AstrologyTermId } from '../utils/astrologyTerms';

interface PanchangWidgetProps {
  panchang: PanchangData;
  date: Date;
  timezone: string;
}

interface PanchangItem {
  id: string;
  term: AstrologyTermId;
  icon: string;
  title: string;
  question: string;
  value: string;
  summary: string;
  meaningLabel: string;
  meaning: string;
  details: string;
}

const NAKSHATRA_NAMES_RU: Record<string, string> = {
  Ashwini: 'Ашвини', Bharani: 'Бхарани', Krittika: 'Криттика',
  Rohini: 'Рохини', Mrigashira: 'Мригашира', Ardra: 'Ардра',
  Punarvasu: 'Пунарвасу', Pushya: 'Пушья', Ashlesha: 'Ашлеша',
  Magha: 'Магха', 'Purva Phalguni': 'Пурва-Пхалгуни',
  'Uttara Phalguni': 'Уттара-Пхалгуни', Hasta: 'Хаста',
  Chitra: 'Читра', Swati: 'Свати', Vishakha: 'Вишакха',
  Anuradha: 'Анурадха', Jyeshtha: 'Джйештха', Mula: 'Мула',
  'Purva Ashadha': 'Пурва-Ашадха', 'Uttara Ashadha': 'Уттара-Ашадха',
  Shravana: 'Шравана', Dhanishta: 'Дхаништха', Shatabhisha: 'Шатабхиша',
  'Purva Bhadrapada': 'Пурва-Бхадрапада',
  'Uttara Bhadrapada': 'Уттара-Бхадрапада', Revati: 'Ревати',
};

export function PanchangWidget({ panchang, date, timezone }: PanchangWidgetProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const dateLabel = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const weekdayLabel = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    weekday: 'long',
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  const nakshatra = NAKSHATRAS[panchang.nakshatra.index];
  const nakshatraName = NAKSHATRA_NAMES_RU[panchang.nakshatra.name] ?? panchang.nakshatra.name;
  const nakshatraLord = nakshatra?.lord ? getPlanetName(nakshatra.lord) : 'не определён';
  const tithiPhase = panchang.tithi.index < 15 ? 'растущей' : 'убывающей';
  const tithiMeaning = panchang.tithi.meaning.toLowerCase();

  const items: PanchangItem[] = [
    {
      id: 'tithi',
      term: 'tithi',
      icon: '🌒',
      title: 'Титхи — лунный день',
      question: 'Какой сейчас лунный день?',
      value: panchang.tithi.name,
      summary: `Показывает, какая часть лунного месяца идёт сейчас. Сегодня — ${tithiPhase} Луны.`,
      meaningLabel: 'Символический смысл',
      meaning: tithiMeaning,
      details: 'Титхи рассчитывают по угловому расстоянию между Солнцем и Луной. В лунном месяце 30 титхи: 15 приходятся на период растущей Луны и 15 — на период убывающей. Экадаши — одиннадцатый титхи каждой половины месяца; в традиции его связывают с постом и духовными практиками.',
    },
    {
      id: 'nakshatra',
      term: 'nakshatra',
      icon: '🐎',
      title: 'Накшатра — путь Луны среди звёзд',
      question: 'В каком участке звёздного пути находится Луна?',
      value: nakshatraName,
      summary: 'Показывает, в каком из 27 участков лунного пути находится Луна.',
      meaningLabel: 'Планета-управитель',
      meaning: nakshatraLord,
      details: 'В Джйотиш путь Луны по небу делят на 27 участков — накшатр. Луна проходит через них последовательно; обычно одна накшатра занимает около суток. Название и управитель накшатры используют как символические ориентиры, а не как предсказание конкретных событий.',
    },
    {
      id: 'yoga',
      term: 'yoga',
      icon: '⚡',
      title: 'Йога — сочетание Солнца и Луны',
      question: 'Какой символический фон связывают с их сочетанием?',
      value: panchang.yoga.name,
      summary: 'Это отдельный календарный показатель, который рассчитывают по положениям Солнца и Луны.',
      meaningLabel: 'Символический смысл',
      meaning: panchang.yoga.meaning.toLowerCase(),
      details: 'Йогу Панчанга рассчитывают по сумме эклиптических долгот Солнца и Луны. В традиционной системе выделяют 27 йог. Здесь слово «йога» не означает физические упражнения; это название календарного показателя.',
    },
    {
      id: 'karana',
      term: 'karana',
      icon: '🗣️',
      title: 'Карана — половина титхи',
      question: 'Какая половина лунного дня идёт сейчас?',
      value: panchang.karana.name,
      summary: 'Каждый титхи делится на две части, и каждая такая часть называется караной.',
      meaningLabel: 'Традиционный ориентир',
      meaning: panchang.karana.quality.toLowerCase(),
      details: 'Карана — половина титхи. Поэтому в пределах одного титхи последовательно проходят две караны. В Панчанге используют 11 названий каран: часть повторяется в цикле, а несколько встречаются один раз в лунном месяце. Вишти традиционно советуют учитывать при выборе времени для некоторых начинаний, но это не делает весь день плохим и не запрещает обычные дела.',
    },
    {
      id: 'vara',
      term: 'vara',
      icon: '🌞',
      title: 'Вара — день недели',
      question: 'Какой сегодня день недели и какая планета ему соответствует?',
      value: panchang.vara.name,
      summary: `В традиции Джйотиш каждому дню недели соответствует планета: сегодня — ${panchang.vara.planet}.`,
      meaningLabel: 'Традиционная тема',
      meaning: panchang.vara.quality.toLowerCase(),
      details: 'Вара — это день недели в индийском календаре. Каждому из семи дней традиционно соответствует одна из семи планет. Для пятницы это Венера, которую связывают с любовью, красотой и гармонией.',
    },
  ];

  const additionalThemes = [
    { icon: '⚡', label: `Йога ${panchang.yoga.name}`, value: panchang.yoga.meaning.toLowerCase() },
    { icon: '💗', label: panchang.vara.name, value: panchang.vara.quality.toLowerCase() },
    { icon: '🌙', label: `Накшатра ${nakshatraName}`, value: `управитель — ${nakshatraLord}` },
  ];

  return (
    <section
      className="rounded-3xl p-5 sm:p-8 space-y-6"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)',
      }}
      aria-labelledby="panchang-title"
    >
      <header>
        <h2 id="panchang-title" className="text-2xl font-semibold">Панчанг</h2>
        <p className="mt-1 text-xl font-semibold capitalize">{dateLabel}</p>
        <p className="mt-1 text-sm font-medium capitalize opacity-70">{weekdayLabel}</p>
        <p className="mt-3 text-sm leading-relaxed opacity-70">
          Панчанг — традиционный индийский календарь. Он описывает день с помощью пяти показателей.
        </p>
        <p className="mt-2 text-xs opacity-60">Расчёт на {timeLabel} · местное время выбранного места</p>
      </header>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5" aria-labelledby="panchang-day-theme">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Общий смысл дня</p>
        <h3 id="panchang-day-theme" className="mt-2 text-2xl font-semibold">{panchang.tithi.meaning}</h3>
        <p className="mt-2 text-sm leading-relaxed opacity-80">
          В традиционной символике этот титхи связывают с темой «{tithiMeaning}». Это один из ориентиров Панчанга, а не характеристика всех событий дня.
        </p>

        <div className="mt-4">
          <h4 className="text-sm font-semibold">Дополнительные оттенки</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {additionalThemes.map((theme) => (
              <div key={theme.label} className="rounded-xl border border-border bg-background/50 p-3">
                <p className="text-sm font-medium">{theme.icon} {theme.label}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-70">{theme.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-background/60 p-4">
          <h4 className="font-semibold">Как использовать эту информацию?</h4>
          <p className="mt-1 text-sm leading-relaxed">
            Выбери одно-два посильных дела. Например, удели время спокойным практикам, отдыху или тому, что помогает навести порядок в мыслях. Учитывай свои планы и реальные обстоятельства.
          </p>
        </div>
        <p className="mt-3 text-xs leading-relaxed opacity-65">
          Это символическая трактовка традиции Джйотиш, а не обещание события, оценка дня или запрет на действия.
        </p>
      </section>

      <section aria-labelledby="panchang-five-parts">
        <div className="mb-3">
          <h3 id="panchang-five-parts" className="text-lg font-semibold">Из чего складывается Панчанг?</h3>
          <p className="mt-1 text-sm opacity-70">Пять частей отвечают на пять разных вопросов. Нажми на карточку, чтобы узнать подробнее.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const isExpanded = expanded === item.id;
            return (
              <article
                key={item.id}
                className={`rounded-2xl border p-4 transition-colors ${isExpanded ? 'border-primary/50 bg-secondary/50' : 'border-border'} ${index === 4 ? 'sm:col-span-2' : ''}`}
              >
                <button
                  type="button"
                  className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`panchang-details-${item.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-semibold">
                        {index + 1}. {item.title}
                        <TermTooltip term={item.term} />
                      </span>
                      <span className="mt-1 block text-sm opacity-70">{item.question}</span>
                      <span className="mt-3 block text-lg font-semibold">{item.value}</span>
                      <span className="mt-1 block text-sm leading-relaxed opacity-75">{item.summary}</span>
                    </span>
                    <span className="shrink-0 pt-1 opacity-55" aria-hidden="true">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div id={`panchang-details-${item.id}`} className="mt-4 space-y-3 border-t border-border pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-55">Что это значит?</p>
                      <p className="mt-1 text-sm leading-relaxed">{item.details}</p>
                    </div>
                    <div className="rounded-xl bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-55">{item.meaningLabel}</p>
                      <p className="mt-1 text-sm">{item.meaning}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border p-5" aria-labelledby="panchang-cheatsheet">
        <h3 id="panchang-cheatsheet" className="font-semibold">Пять частей — пять вопросов</h3>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li><strong>Титхи:</strong> какой сейчас лунный день?</li>
          <li><strong>Накшатра:</strong> где находится Луна на звёздном пути?</li>
          <li><strong>Йога:</strong> какой фон связывают с сочетанием Солнца и Луны?</li>
          <li><strong>Карана:</strong> какая половина титхи идёт?</li>
          <li className="sm:col-span-2"><strong>Вара:</strong> какой сегодня день недели и какая планета ему соответствует?</li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed opacity-65">
          Запомни: титхи — это лунный день, а карана — его половина. Остальные три показателя описывают другие стороны календарного дня.
        </p>
      </section>

      <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm leading-relaxed opacity-80">
            <p>
              Панчанг используют в традиции Джйотиш как один из ориентиров при выборе времени для дел. Например, Пурниму (полнолуние) связывают с завершением, а Экадаши — с постом и духовными практиками.
            </p>
            <p className="mt-2 text-xs opacity-75">
              Значения титхи, накшатры, йоги и караны могут меняться в течение суток. Сейчас приложение показывает расчёт на указанное местное время; точные интервалы смены этих показателей пока не отображаются. Панчанг — культурная традиция, а не научно подтверждённый способ предсказывать результат.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
