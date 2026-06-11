// [КОМПОНЕНТ] Заголовок дня с уровнем энергии
import { Sparkles } from 'lucide-react';
import { PanchangData } from '../../utils/panchang';

interface DayHeadlineProps {
  tithi: PanchangData['tithi'];
  moonSign: string;
  energyLevel: number; // 0-100
}

export function DayHeadline({ tithi, moonSign, energyLevel }: DayHeadlineProps) {
  // Map energy level (0-100) to display categories
  const getEnergyCategory = (level: number): { color: string; label: string; icon: number } => {
    if (level < 40) return { color: '#ef4444', label: 'Время для отдыха', icon: 1 };
    if (level < 70) return { color: '#fbbf24', label: 'Умеренная энергия', icon: 2 };
    return { color: '#10b981', label: 'Высокий потенциал', icon: 3 };
  };

  const energy = getEnergyCategory(energyLevel);

  const moonSignQualities: Record<string, string> = {
    Aries: 'быстрым решениям и смелым шагам',
    Taurus: 'практичным делам и финансовой устойчивости',
    Gemini: 'общению, обучению и гибким договорённостям',
    Cancer: 'заботе о близких и домашним вопросам',
    Leo: 'творчеству, самопрезентации и лидерству',
    Virgo: 'порядку, здоровью и точной работе',
    Libra: 'переговорам, партнёрству и эстетике',
    Scorpio: 'глубокой концентрации и внутренней честности',
    Sagittarius: 'обучению, путешествиям и расширению горизонтов',
    Capricorn: 'структуре, дисциплине и карьерным задачам',
    Aquarius: 'новым идеям, командам и технологиям',
    Pisces: 'интуиции, отдыху и творческому потоку'
  };

  const title = energyLevel >= 70
    ? 'День активного потенциала'
    : energyLevel >= 40
      ? 'День мягкого продвижения'
      : 'День восстановления и тишины';
  const moonSignQuality = moonSignQualities[moonSign] || 'бережному выбору дел';

  return (
    <div
      className="rounded-3xl p-8"
      style={{
        background: 'linear-gradient(135deg, var(--glass-bg), rgba(167, 139, 250, 0.1))',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="p-3 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${energy.color}, ${energy.color}88)`,
            boxShadow: `0 4px 16px ${energy.color}40`
          }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="mb-2">{title}</h2>
          <p className="opacity-80 leading-relaxed">
            Сегодня {tithi.name} — {tithi.meaning.toLowerCase()}.
            Луна в {moonSign}, что благоприятствует {moonSignQuality}.
          </p>
        </div>
      </div>

      <div
        className="p-4 rounded-2xl flex items-center gap-4"
        style={{ background: 'var(--secondary)' }}
      >
        <div className="flex-1">
          <p className="mb-1 opacity-70">Энергия дня</p>
          <p>{energy.label}</p>
        </div>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: energy.color,
            boxShadow: `0 4px 16px ${energy.color}40`
          }}
        >
          <span className="text-white text-2xl">{energy.icon}</span>
        </div>
      </div>
    </div>
  );
}
