// [КОМПОНЕНТ] Четыре коротких практических ориентира на день
import { Check, AlertCircle, Eye, Sparkles } from 'lucide-react';
import { PanchangData } from '../../utils/panchang';
import { Aspect } from '../../utils/astrology';
import { PersonalRecommendationResult } from '../../utils/personalRecommendations';
import { GlassCard } from '../common/GlassCard';

interface TopRecommendationsProps {
  tithi: PanchangData['tithi'];
  yoga: PanchangData['yoga'];
  planetaryHour: string;
  topAspect: Aspect | null;
  personalRecommendation: PersonalRecommendationResult;
}

export function TopRecommendations({ personalRecommendation }: TopRecommendationsProps) {
  const cards = [
    {
      icon: Check,
      title: 'Что можно сделать',
      text: personalRecommendation.mainRecommendation,
    },
    {
      icon: AlertCircle,
      title: 'С чем лучше не спешить',
      text: personalRecommendation.avoidRecommendation,
    },
    {
      icon: Eye,
      title: 'На что обратить внимание',
      text: 'Проверьте сроки, детали и договорённости. Важные решения сверяйте с фактами и реальными обстоятельствами.',
    },
    {
      icon: Sparkles,
      title: 'Небольшая практика',
      text: personalRecommendation.microUpaya.action,
    },
  ];

  return (
    <GlassCard>
      <h3 className="mb-2 font-semibold">Подсказки на сегодня</h3>
      <p className="mb-4 text-sm opacity-65">Это необязательные идеи, а не правила. Выбирайте то, что подходит вашим обстоятельствам.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl border border-border p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-70" />
            <div>
              <p className="mb-1 text-sm font-semibold">{title}</p>
              <p className="text-sm leading-relaxed opacity-80">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
