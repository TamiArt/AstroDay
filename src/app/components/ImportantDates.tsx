import { useMemo } from 'react';
import { Calendar as CalendarIcon, Star, Moon, Sun } from 'lucide-react';
import { getImportantDates, ImportantDate } from '../utils/panchang';

export function ImportantDates() {
  const dates = useMemo(() => {
    return getImportantDates(new Date(), 30);
  }, []);

  const getIcon = (type: ImportantDate['type']) => {
    switch (type) {
      case 'Purnima':
        return <Moon className="w-5 h-5" fill="currentColor" />;
      case 'Amavasya':
        return <Moon className="w-5 h-5" />;
      case 'Ekadashi':
        return <Star className="w-5 h-5" />;
      case 'Eclipse':
        return <Sun className="w-5 h-5" />;
      case 'Sankranti':
        return <CalendarIcon className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getColor = (type: ImportantDate['type']) => {
    switch (type) {
      case 'Purnima':
        return 'var(--neon-yellow)';
      case 'Amavasya':
        return 'var(--neon-purple)';
      case 'Ekadashi':
        return 'var(--neon-blue)';
      case 'Eclipse':
        return 'var(--neon-pink)';
      case 'Sankranti':
        return 'var(--neon-green)';
      default:
        return 'var(--foreground)';
    }
  };

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
        <h3 className="mb-2">Календарь важных дат</h3>
        <p className="opacity-70">Значимые события джйотиш на ближайший месяц</p>
      </div>

      <div className="space-y-3">
        {dates.length === 0 && (
          <p className="text-center opacity-60 py-8">
            Нет особых событий в ближайшие 30 дней
          </p>
        )}

        {dates.map((date, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl border border-border hover:border-primary/50 transition-all cursor-pointer group"
            style={{ background: 'var(--secondary)/50' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl group-hover:scale-110 transition-transform"
                style={{ background: getColor(date.type) + '20', color: getColor(date.type) }}
              >
                {getIcon(date.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4>{date.name}</h4>
                  <span className="opacity-60">
                    {date.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="opacity-80 leading-relaxed">{date.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dates.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
          <p className="opacity-70">
            💡 Эти даты особенно благоприятны для духовных практик, медитации и внутренней работы.
          </p>
        </div>
      )}
    </div>
  );
}
