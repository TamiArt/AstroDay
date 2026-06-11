import type { Aspect } from './astrology';

export type DisplayAspectType = Exclude<Aspect['type'], 'special'>;
export type AspectNature = 'harmonious' | 'tense' | 'neutral';

export interface AspectVisual {
  name: string;
  symbol: string;
  nature: AspectNature;
  colorClass: string;
  description: string;
  marker: string;
}

const ASPECT_VISUALS: Record<DisplayAspectType, AspectVisual> = {
  conjunction: {
    name: 'Соединение',
    symbol: '☌',
    nature: 'neutral',
    colorClass: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Планеты работают как один узел. Результат зависит от их природы и домов.',
    marker: 'Нейтральный',
  },
  sextile: {
    name: 'Секстиль',
    symbol: '⚹',
    nature: 'harmonious',
    colorClass: 'text-green-600 bg-green-50 border-green-200',
    description: 'Мягкая возможность. Она раскрывается, когда вы делаете небольшой шаг.',
    marker: 'Поддержка',
  },
  square: {
    name: 'Квадрат',
    symbol: '□',
    nature: 'tense',
    colorClass: 'text-orange-600 bg-orange-50 border-orange-200',
    description: 'Напряжение и задача на рост. Требует дисциплины и честной реакции.',
    marker: 'Вызов',
  },
  trine: {
    name: 'Трин',
    symbol: '△',
    nature: 'harmonious',
    colorClass: 'text-green-600 bg-green-50 border-green-200',
    description: 'Естественная поддержка. Используйте её через конкретное действие.',
    marker: 'Поддержка',
  },
  opposition: {
    name: 'Оппозиция',
    symbol: '☍',
    nature: 'tense',
    colorClass: 'text-orange-600 bg-orange-50 border-orange-200',
    description: 'Две темы тянут в разные стороны. Нужен баланс и прямой диалог.',
    marker: 'Баланс',
  },
};

export function getAspectVisual(type: DisplayAspectType): AspectVisual {
  return ASPECT_VISUALS[type];
}

export function getEnergyVisual(level: number) {
  if (level >= 70) {
    return {
      label: 'Высокая энергия',
      description: 'Подходит для активных действий, переговоров и видимых решений.',
      color: 'var(--neon-green)',
    };
  }

  if (level >= 45) {
    return {
      label: 'Умеренная энергия',
      description: 'Лучше держать ровный темп и выбирать задачи с понятным результатом.',
      color: 'var(--neon-yellow)',
    };
  }

  return {
    label: 'Энергия восстановления',
    description: 'Снизьте нагрузку, завершайте старое и оставляйте время на отдых.',
    color: 'var(--neon-pink)',
  };
}
