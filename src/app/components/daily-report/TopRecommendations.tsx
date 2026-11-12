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
      title: `Символическая связь ${aspect.planet1} и ${aspect.planet2}`,
      text: `${aspect.description}. В традиционной трактовке такой аспект связывают с более согласованным взаимодействием тем. Это повод обдумать подход, а не обещание лёгкого результата.`
    };
  }

  if (aspect.type === 'square' || aspect.type === 'opposition') {
    return {
      title: `Возможное напряжение между ${aspect.planet1} и ${aspect.planet2}`,
      text: `${aspect.description}. В традиционной трактовке аспект связывают с необходимостью согласовать разные интересы. Ориентируйтесь на реальные обстоятельства и проверяйте факты.`
    };
  }

  return {
    title: `Связь ${aspect.planet1} и ${aspect.planet2}`,
    text: `${aspect.description}. Эту символическую трактовку можно использовать как повод выбрать один понятный приоритет.`
  };
}

function getYogaRecommendation(yoga: PanchangData['yoga'], tithi: PanchangData['tithi'], planetaryHour: string) {
  if (difficultYogas.includes(yoga.name)) {
    return {
      title: 'Традиционная трактовка йоги дня',
      text: `${yoga.name} традиционно связывают с темой "${yoga.meaning.toLowerCase()}". Планетарный час ${planetaryHour} — дополнительный календарный ориентир, а не оценка исхода решения.`
    };
  }

  if (supportiveYogas.includes(yoga.name)) {
    return {
      title: 'Традиционная трактовка йоги дня',
      text: `${yoga.name} в традиции связывают с более созидательным настроем; это не гарантирует результат. ${tithi.name} добавляет тему: ${tithi.meaning.toLowerCase()}. Сделайте один конкретный шаг.`
    };
  }

  return {
    title: 'Держите день простым и последовательным',
    text: `${tithi.name}: ${tithi.meaning.toLowerCase()}. Час ${planetaryHour} указывает на планетарный час в традиционной системе; он не определяет, как вам следует поступать.`
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
      <h3 className="mb-2">Идеи для внимания на сегодня</h3><p className="mb-6 text-sm text-gray-600">Это подсказки на основе традиционной астрологической модели, а не обязательные указания. Проверяйте их по своим обстоятельствам.</p>

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
