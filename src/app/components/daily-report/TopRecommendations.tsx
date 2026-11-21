// [КОМПОНЕНТ] Четыре коротких практических ориентира на день
import { Check, AlertCircle, Ear, Eye, Sparkles } from 'lucide-react';
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
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="mb-1 font-semibold">Что можно сделать</p>
            <p className="text-sm leading-relaxed">{personalRecommendation.mainRecommendation}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="mb-1 font-semibold">Чего лучше не делать поспешно</p>
            <p className="text-sm leading-relaxed">{personalRecommendation.avoidRecommendation}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <Eye className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="mb-1 font-semibold">На что обратить внимание</p>
            <p className="text-sm leading-relaxed">Проверьте сроки, детали и договорённости. Если решение важное, не опирайтесь только на первое впечатление — соберите факты и спокойно сравните варианты.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
          <Ear className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="mb-1 font-semibold">К чему прислушаться</p>
            <p className="text-sm leading-relaxed">Замечайте своё самочувствие и уровень усталости. Если чувствуете напряжение, сделайте паузу и при необходимости уменьшите нагрузку — не нужно заставлять себя следовать прогнозу.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 opacity-70" />
          <div>
            <p className="mb-1 font-semibold">Небольшая практика</p>
            <p className="text-sm">{personalRecommendation.microUpaya.title}</p>
            <p className="mt-1 text-sm opacity-70">{personalRecommendation.microUpaya.action}</p>
            <p className="mt-2 text-xs opacity-60">Необязательная символическая практика — выполняйте её только если она вам подходит.</p>
          </div>
        </div>
        {personalRecommendation.precision.level !== 'high' && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-1 font-semibold">Насколько точны исходные данные</p>
            <ul className="space-y-1 text-sm opacity-75">
              {personalRecommendation.precision.notes.map((note) => <li key={note}>• {note}</li>)}
            </ul>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
