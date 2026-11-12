import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { PanchangData } from '../utils/panchang';
import { NAKSHATRAS } from '../utils/astrology';
import { TermTooltip } from './common/TermTooltip';
import type { AstrologyTermId } from '../utils/astrologyTerms';

interface PanchangWidgetProps {
  panchang: PanchangData;
}

export function PanchangWidget({ panchang }: PanchangWidgetProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const nakshatra = NAKSHATRAS[panchang.nakshatra.index];

  const items = [
    {
      id: 'tithi',
      term: 'tithi' as AstrologyTermId,
      icon: '🌒',
      title: 'Титхи',
      value: panchang.tithi.name,
      tooltip: 'Что это?',
      description: `Традиционная трактовка: ${panchang.tithi.meaning.toLowerCase()}.`,
      details: 'Титхи — это лунный день, который рассчитывают по угловому расстоянию между Солнцем и Луной. В лунном месяце 30 титхи. В традиции Джйотиш их используют как один из символических ориентиров календарного дня.'
    },
    {
      id: 'nakshatra',
      term: 'nakshatra' as AstrologyTermId,
      icon: '🐎',
      title: 'Накшатра',
      value: nakshatra?.name || '',
      tooltip: 'Что это?',
      description: `Планета-управитель: ${nakshatra?.lord}. Связанное божество в традиции: ${nakshatra?.deity}.`,
      details: 'Накшатра — один из 27 участков звёздного круга, через которые проходит Луна. Луна обычно находится в одном таком участке около суток. В Джйотиш накшатру используют для символического описания дня; она не предсказывает конкретные события.'
    },
    {
      id: 'yoga',
      term: 'yoga' as AstrologyTermId,
      icon: '⚡️',
      title: 'Йога',
      value: panchang.yoga.name,
      tooltip: 'Что это?',
      description: `Традиционная трактовка: ${panchang.yoga.meaning.toLowerCase()}.`,
      details: 'Йогу дня рассчитывают по сумме долгот Солнца и Луны. В панчанге выделяют 27 йог. Это традиционная характеристика календарного дня, а не гарантия успеха или неудачи дела.'
    },
    {
      id: 'karana',
      term: 'karana' as AstrologyTermId,
      icon: '🗣',
      title: 'Карана',
      value: panchang.karana.name,
      tooltip: 'Что это?',
      description: `Традиционная трактовка: ${panchang.karana.quality.toLowerCase()}.`,
      details: 'Карана — половина лунного дня (титхи). В календаре используются 11 видов каран, часть из которых повторяется циклически. В традиции это дополнительный символический ориентир для оценки дня.'
    },
    {
      id: 'vara',
      term: 'vara' as AstrologyTermId,
      icon: '🌞',
      title: 'Вара (День недели)',
      value: panchang.vara.name,
      tooltip: 'Что это?',
      description: `Планета дня — ${panchang.vara.planet}. Традиционная тема: ${panchang.vara.quality.toLowerCase()}.`,
      details: 'Вара — день недели в индийском календаре. Каждому дню традиционно сопоставляют планету. Это общий календарный символ, а не описание характера конкретного человека.'
    }
  ];

  return (
    <div
      className="rounded-3xl p-8"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
      }}
    >
      <div className="mb-6">
        <h2 className="mb-2">Панчанг <TermTooltip term="panchang" /> на сегодня</h2>
        <p className="opacity-70">
          Пять элементов индийского календаря. В Джйотиш их используют для традиционного символического описания дня.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl border border-border hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            style={{
              background: expanded === item.id ? 'var(--secondary)' : 'transparent'
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3>{item.title}</h3>
                    <TermTooltip term={item.term} label={item.tooltip} />
                  </div>
                  <p className="opacity-90 mb-2">{item.value}</p>
                  <p className="opacity-70">{item.description}</p>

                  {expanded === item.id && (
                    <div className="mt-4 p-4 rounded-xl bg-background/50 border border-border animate-in fade-in duration-300">
                      <p className="opacity-80 leading-relaxed">{item.details}</p>
                    </div>
                  )}
                </div>
              </div>

              {expanded === item.id ? (
                <ChevronUp className="w-5 h-5 opacity-50 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 opacity-50 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
        <div className="flex gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="opacity-80 leading-relaxed">
            Панчанг используют в традиции Джйотиш как один из ориентиров при выборе времени для дел. Например, Пурниму (полнолуние) связывают с завершением, а Экадаши — с постом и духовными практиками. Это культурная традиция, а не научно подтверждённый способ предсказать результат.
          </p>
        </div>
      </div>
    </div>
  );
}
