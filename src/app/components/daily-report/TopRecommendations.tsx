// [КОМПОНЕНТ] Топ-3 рекомендации дня
import { Check, AlertCircle, Sparkles } from 'lucide-react';
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

const difficultYogas = ['Атиганда', 'Шула', 'Ганда', 'Вьягхата', 'Вьятипата', 'Вайдхрити'];
const supportiveYogas = ['Прити', 'Саубхагья', 'Шобхана', 'Сиддхи', 'Сиддха', 'Шубха'];

function getAspectRecommendation(aspect: Aspect | null) {
  if (!aspect) {
    return {
      title: 'Опирайтесь на ритм лунного дня',
      text: 'Сегодня лучше выбирать задачи по титхи и текущему уровню энергии, без лишнего давления на себя.'
    };
  }

  if (aspect.type === 'trine' || aspect.type === 'sextile') {
    return {
      title: `Используйте поддержку ${aspect.planet1} и ${aspect.planet2}`,
      text: `${aspect.description}. Это окно возможностей: запланируйте шаг, где нужна лёгкость, контакт или творческое решение.`
    };
  }

  if (aspect.type === 'square' || aspect.type === 'opposition') {
    return {
      title: `Снижайте напряжение ${aspect.planet1} и ${aspect.planet2}`,
      text: `${aspect.description}. Не форсируйте конфликтные темы: сначала структура, пауза и проверка фактов.`
    };
  }

  return {
    title: `Сфокусируйте энергию ${aspect.planet1} и ${aspect.planet2}`,
    text: `${aspect.description}. Хорошо работает одно ясное намерение вместо множества параллельных действий.`
  };
}

function getYogaRecommendation(yoga: PanchangData['yoga'], tithi: PanchangData['tithi'], planetaryHour: string) {
  if (difficultYogas.includes(yoga.name)) {
    return {
      title: 'Не принимайте решения на импульсе',
      text: `${yoga.name} несёт качество "${yoga.meaning.toLowerCase()}". В час ${planetaryHour} действуйте точечно: меньше обещаний, больше проверки деталей.`
    };
  }

  if (supportiveYogas.includes(yoga.name)) {
    return {
      title: 'Закрепите важное намерение действием',
      text: `${yoga.name} поддерживает результат. ${tithi.name} добавляет тему: ${tithi.meaning.toLowerCase()}. Сделайте один конкретный шаг.`
    };
  }

  return {
    title: 'Держите день простым и последовательным',
    text: `${tithi.name}: ${tithi.meaning.toLowerCase()}. Час ${planetaryHour} подсказывает, через какую энергию лучше действовать сейчас.`
  };
}

export function TopRecommendations({
  tithi,
  yoga,
  planetaryHour,
  topAspect,
  personalRecommendation
}: TopRecommendationsProps) {
  const aspectRecommendation = getAspectRecommendation(topAspect);
  const yogaRecommendation = getYogaRecommendation(yoga, tithi, planetaryHour);

  return (
    <GlassCard>
      <h3 className="mb-6">Топ-3 рекомендации</h3>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
          <div
            className="p-2 rounded-xl bg-green-500/20"
            style={{ color: 'var(--neon-green)' }}
          >
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="mb-1">{personalRecommendation.mainRecommendation}</p>
            <p className="opacity-70">
              {personalRecommendation.reasoning.slice(0, 2).join(' ')} {aspectRecommendation.text}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
          <div
            className="p-2 rounded-xl bg-yellow-500/20"
            style={{ color: 'var(--neon-yellow)' }}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="mb-1">{yogaRecommendation.title}</p>
            <p className="opacity-70">{personalRecommendation.avoidRecommendation}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
          <div
            className="p-2 rounded-xl bg-purple-500/20"
            style={{ color: 'var(--neon-purple)' }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="mb-1">Микро-упайя: {personalRecommendation.microUpaya.title}</p>
            <p className="opacity-70">{personalRecommendation.microUpaya.action}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
          <p className="mb-2">Почему именно так:</p>
          <ul className="space-y-1.5 opacity-75">
            {personalRecommendation.reasoning.slice(0, 4).map((reason) => (
              <li key={reason} className="text-sm">• {reason}</li>
            ))}
          </ul>
        </div>

        {personalRecommendation.precision.level !== 'high' && (
          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="mb-2">Точность данных:</p>
            <ul className="space-y-1.5 opacity-75">
              {personalRecommendation.precision.notes.map((note) => (
                <li key={note} className="text-sm">• {note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
