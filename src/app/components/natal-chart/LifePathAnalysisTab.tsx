import { useMemo } from 'react';
import type { NatalChart } from '../../utils/astrology';
import { analyzeLifeAreas } from '../../utils/lifePathAnalysis';
import { GlassCard } from '../common/GlassCard';

interface LifePathAnalysisTabProps {
  natalChart: NatalChart;
}

const PLANET_NAMES: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mars: 'Марс', Mercury: 'Меркурий',
  Jupiter: 'Юпитер', Venus: 'Венера', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

function AreaDetails({ area }: { area: ReturnType<typeof analyzeLifeAreas>[number] }) {
  return (
    <details className="rounded-xl border border-gray-200 bg-white/80 p-4">
      <summary className="cursor-pointer list-none font-semibold text-gray-900">
        {area.title} · дома {area.houses.join(', ')}
        <span className="ml-2 text-xs font-normal text-purple-700">Показать основания</span>
      </summary>
      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Что видно в расчёте</h4>
          <ul className="mt-2 space-y-1.5">
            {area.houseNotes.map((note) => <li key={note} className="text-sm text-gray-600">{note}</li>)}
          </ul>
          {area.planetNotes.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Планеты в рассматриваемых домах: {area.planetNotes.map((note) => {
                const [name, ...rest] = note.split(':');
                return `${PLANET_NAMES[name] ?? name}:${rest.join(':')}`;
              }).join(' · ')}
            </p>
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Практический фокус</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {area.practicalFocus.map((item) => <li key={item} className="text-sm text-gray-600">{item}</li>)}
          </ul>
        </div>
      </div>
    </details>
  );
}

export function LifePathAnalysisTab({ natalChart }: LifePathAnalysisTabProps) {
  const areas = useMemo(() => analyzeLifeAreas(natalChart), [natalChart]);
  const money = areas.filter((area) => area.id === 'money' || area.id === 'career');
  const relationships = areas.find((area) => area.id === 'relationships');

  return (
    <div className="space-y-5">
      <GlassCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Персональный тематический разбор</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Деньги и отношения</h2>
        <p className="mt-2 text-sm text-gray-600">
          Здесь собраны только две темы: материальная реализация и партнёрство.
          Сначала — короткий ориентир, расчётные положения и подробные основания — ниже.
        </p>
      </GlassCard>

      <GlassCard>
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Финансы и профессиональная реализация</h3>
            <p className="mt-1 text-sm text-gray-600">
              Для этой темы рассматриваются личные ресурсы, работа, карьера и доходы.
              В традиционной схеме важны 2-й, 6-й, 10-й и 11-й дома; 5-й и 9-й могут дополнять разбор, если есть подтверждённые связи.
            </p>
          </div>
          {money.map((area) => <AreaDetails key={area.id} area={area} />)}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Любовь и партнёрство</h3>
            <p className="mt-1 text-sm text-gray-600">
              В разборе учитываются темы романтических чувств, партнёрства, доверия и семьи.
              Основные ориентиры — 5-й и 7-й дома, а также Венера, Юпитер и управитель 7-го дома.
            </p>
          </div>
          {relationships
            ? <AreaDetails area={relationships} />
            : <p className="text-sm text-gray-600">Недостаточно расчётных данных для персонального разбора отношений.</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-base font-semibold text-gray-900">Главное об интерпретации</h3>
        <p className="mt-1 text-sm text-gray-600">
          Положения планет и домов — расчётные факты. Их значения относятся к символической традиции Джйотиш:
          они не гарантируют богатство, брак или конкретные события и не заменяют финансовые, медицинские или юридические рекомендации.
        </p>
      </GlassCard>
    </div>
  );
}
