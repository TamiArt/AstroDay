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
      description: panchang.tithi.meaning,
      details: 'Титхи — это лунный день, который измеряет угол между Солнцем и Луной. Всего 30 титхи в лунном месяце. Каждая несёт свою энергию.'
    },
    {
      id: 'nakshatra',
      term: 'nakshatra' as AstrologyTermId,
      icon: '🐎',
      title: 'Накшатра',
      value: nakshatra?.name || '',
      tooltip: 'Что это?',
      description: `Управитель: ${nakshatra?.lord}. Божество: ${nakshatra?.deity}`,
      details: 'Накшатра — это одно из 27 лунных созвездий. Луна проходит через каждую накшатру примерно за сутки. Накшатры влияют на качество времени и события.'
    },
    {
      id: 'yoga',
      term: 'yoga' as AstrologyTermId,
      icon: '⚡️',
      title: 'Йога',
      value: panchang.yoga.name,
      tooltip: 'Что это?',
      description: panchang.yoga.meaning,
      details: 'Йога рассчитывается из суммы долгот Солнца и Луны. Всего 27 йог, каждая влияет на результаты действий.'
    },
    {
      id: 'karana',
      term: 'karana' as AstrologyTermId,
      icon: '🗣',
      title: 'Карана',
      value: panchang.karana.name,
      tooltip: 'Что это?',
      description: panchang.karana.quality,
      details: 'Карана — половина титхи. Всего 11 каран, которые повторяются циклически. Карана влияет на коммуникацию и краткосрочные дела.'
    },
    {
      id: 'vara',
      term: 'vara' as AstrologyTermId,
      icon: '🌞',
      title: 'Вара (День недели)',
      value: panchang.vara.name,
      tooltip: 'Что это?',
      description: `${panchang.vara.planet}: ${panchang.vara.quality}`,
      details: 'Вара — день недели. Каждый день управляется планетой, которая окрашивает его своими качествами.'
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
        <h2 className="mb-2">Панчанг на сегодня</h2>
        <p className="opacity-70">
          Пять элементов ведического календаря, которые влияют на качество дня
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
                    <button
                      className="p-1 rounded-lg hover:bg-secondary transition-colors"
                      title={item.tooltip}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <TermTooltip term={item.term} />
                    </button>
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
            Панчанг помогает выбрать благоприятное время для важных дел. Например, Пурнима (полнолуние)
            хороша для завершения проектов, а Экадаши — для медитации и духовных практик.
          </p>
        </div>
      </div>
    </div>
  );
}
