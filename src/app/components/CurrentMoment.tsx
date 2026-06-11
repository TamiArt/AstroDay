import { useState, useEffect } from 'react';
import { Clock, Sparkles, RefreshCw } from 'lucide-react';
import { calculatePlanetaryHour } from '../utils/planetaryHours';
import { calculatePanchang } from '../utils/panchang';
import { Aspect, NatalChart, NAKSHATRAS } from '../utils/astrology';
import { generatePersonalRecommendations } from '../utils/personalRecommendations';
import { UserProfile } from '../utils/storage';
import { formatTime } from '../utils/dateUtils';

interface CurrentMomentProps {
  profile: UserProfile;
  natalChart: NatalChart;
  currentChart: NatalChart;
  aspects: Aspect[];
  latitude: number;
  longitude: number;
  timezone: string;
}

export function CurrentMoment({
  profile,
  natalChart,
  currentChart,
  aspects,
  latitude,
  longitude,
  timezone
}: CurrentMomentProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setIsRefreshing(true);
    setCurrentTime(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const planetaryHour = calculatePlanetaryHour(currentTime, latitude, longitude, timezone);
  const panchang = calculatePanchang(currentTime, { timezone });
  const nakshatra = NAKSHATRAS[panchang.nakshatra.index];
  const personalRecommendation = generatePersonalRecommendations({
    profile,
    date: currentTime,
    natalChart,
    currentChart,
    aspects,
    panchang,
    planetaryHour,
  });

  const planetaryHourInfo: Record<string, { energy: string; good: string; avoid: string; upaya: string }> = {
    Sun: {
      energy: 'Час Солнца: время для лидерства, инициативы и уверенности',
      good: 'Важные решения, публичные выступления, начало новых проектов',
      avoid: 'Конфликты с авторитетами, чрезмерное эго',
      upaya: 'Закройте глаза и представьте солнечный свет, наполняющий вас уверенностью'
    },
    Moon: {
      energy: 'Час Луны: время для эмоций, интуиции и заботы',
      good: 'Общение с близкими, творчество, забота о себе',
      avoid: 'Важные решения под влиянием эмоций',
      upaya: 'Выпейте стакан воды осознанно, почувствуйте, как она успокаивает'
    },
    Mars: {
      energy: 'Час Марса: время для действия, энергии и смелости',
      good: 'Физическая активность, решительные действия, спорт',
      avoid: 'Импульсивные решения, конфликты',
      upaya: 'Сделайте 10 приседаний или 5 отжиманий для канализации энергии'
    },
    Mercury: {
      energy: 'Час Меркурия: время для коммуникации, обучения и планирования',
      good: 'Переговоры, обучение, написание текстов, планирование',
      avoid: 'Рассеянность, многозадачность без фокуса',
      upaya: 'Запишите 3 главные мысли или задачи на сегодня'
    },
    Jupiter: {
      energy: 'Час Юпитера: время для роста, мудрости и оптимизма',
      good: 'Изучение нового, духовные практики, принятие важных решений',
      avoid: 'Чрезмерная самоуверенность, излишества',
      upaya: 'Сделайте что-то доброе для кого-то — даже маленький жест'
    },
    Venus: {
      energy: 'Час Венеры: время для красоты, любви и гармонии',
      good: 'Творчество, романтика, искусство, забота о внешности',
      avoid: 'Чрезмерные траты, поверхностные удовольствия',
      upaya: 'Послушайте любимую музыку 3-5 минут или добавьте красоту в пространство'
    },
    Saturn: {
      energy: 'Час Сатурна: время для дисциплины, ответственности и структуры',
      good: 'Завершение дел, планирование, работа над долгосрочными целями',
      avoid: 'Откладывание важных дел, лень',
      upaya: 'Завершите одну маленькую задачу, которую откладывали'
    }
  };

  const info = planetaryHourInfo[planetaryHour.planet] || planetaryHourInfo.Sun;
  const minutesUntilChange = Math.max(
    0,
    Math.floor((planetaryHour.end.getTime() - currentTime.getTime()) / 60000)
  );

  return (
    <div
      className="rounded-3xl p-8"
      style={{
        background: 'linear-gradient(135deg, var(--glass-bg), rgba(167, 139, 250, 0.1))',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))',
              boxShadow: '0 4px 16px rgba(167, 139, 250, 0.4)'
            }}
          >
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3>Что сейчас?</h3>
            <p className="opacity-70">
              {formatTime(currentTime, timezone)}
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          className={`p-3 rounded-xl hover:bg-secondary transition-all ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="Обновить"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Planetary Hour */}
        <div>
          <div
            className="p-5 rounded-2xl mb-3"
            style={{
              background: 'var(--secondary)',
              border: '1px solid var(--border)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4>{info.energy}</h4>
              <span
                className="px-3 py-1 rounded-full"
                style={{ background: 'var(--neon-purple)', color: 'white' }}
              >
                {minutesUntilChange} мин осталось
              </span>
            </div>
            <p className="text-sm opacity-70">
              {formatTime(planetaryHour.start, timezone)} - {formatTime(planetaryHour.end, timezone)}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <p className="mb-1 opacity-70">✅ Идеально для:</p>
              <p>{personalRecommendation.mainRecommendation}</p>
            </div>

            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <p className="mb-1 opacity-70">⚠️ Избегайте:</p>
              <p>{personalRecommendation.avoidRecommendation}</p>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
              <p className="mb-1 opacity-70">💫 Микро-упайя:</p>
              <p>{personalRecommendation.microUpaya.action}</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <h4 className="mb-3">Почему это персонально для вас</h4>
          <ul className="space-y-2 opacity-80">
            {personalRecommendation.reasoning.slice(0, 4).map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
          {planetaryHour.isFallback && (
            <p className="mt-3 text-sm opacity-60">
              Для этой широты восход/закат не найден, поэтому планетарные часы рассчитаны по равным гражданским интервалам.
            </p>
          )}
          {personalRecommendation.precision.level !== 'high' && (
            <div className="mt-3 text-sm opacity-70">
              {personalRecommendation.precision.notes.slice(0, 2).map((note) => (
                <p key={note}>• {note}</p>
              ))}
            </div>
          )}
        </div>

        {/* Current Nakshatra */}
        <div
          className="p-5 rounded-2xl"
          style={{
            background: 'var(--secondary)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--neon-yellow)' }} />
            <h4>Луна сейчас в {nakshatra?.name}</h4>
          </div>
          <p className="opacity-80 leading-relaxed">
            Управитель: {nakshatra?.lord}. Божество: {nakshatra?.deity}.
            Это влияет на эмоциональный фон и интуицию прямо сейчас.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/30">
        <p className="opacity-70">
          💡 Эти данные обновляются каждую минуту. Используйте их для выбора подходящего момента для действий.
        </p>
      </div>
    </div>
  );
}
