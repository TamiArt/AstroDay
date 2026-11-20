import { useMemo, useState } from 'react';
import type { NatalChart, PlanetPosition } from '../utils/astrology';
import { buildNatalChartFacts, NATAL_PLANET_KEYS } from '../utils/natalChartFacts';

interface PlanetsPositionTableProps {
  natalChart: NatalChart;
}

interface PlanetRow {
  key: string;
  name: string;
  position: PlanetPosition;
  house: number | null;
  dignityLabel: string | null;
  dignityNotApplicable: boolean;
}

const PLANET_NAMES_RU: Record<string, string> = {
  Sun: 'Солнце', Moon: 'Луна', Mercury: 'Меркурий', Venus: 'Венера',
  Mars: 'Марс', Jupiter: 'Юпитер', Saturn: 'Сатурн', Rahu: 'Раху', Ketu: 'Кету',
};

const SIGN_NAMES_RU: Record<string, string> = {
  Aries: 'Овен', Taurus: 'Телец', Gemini: 'Близнецы', Cancer: 'Рак',
  Leo: 'Лев', Virgo: 'Дева', Libra: 'Весы', Scorpio: 'Скорпион',
  Sagittarius: 'Стрелец', Capricorn: 'Козерог', Aquarius: 'Водолей', Pisces: 'Рыбы',
};

function formatDegrees(longitude: number): string {
  const normalized = ((longitude % 30) + 30) % 30;
  const degrees = Math.floor(normalized);
  const minutesFloat = (normalized - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.floor((minutesFloat - minutes) * 60);
  return degrees + '°' + String(minutes).padStart(2, '0') + '′' + String(seconds).padStart(2, '0') + '″';
}

export function PlanetsPositionTable({ natalChart }: PlanetsPositionTableProps) {
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const facts = useMemo(() => buildNatalChartFacts(natalChart), [natalChart]);

  const rows: PlanetRow[] = [
    {
      key: 'Asc',
      name: 'Асцендент',
      position: natalChart.ascendant,
      house: 1,
      dignityLabel: null,
      dignityNotApplicable: false,
    },
    ...NATAL_PLANET_KEYS.flatMap((key) => {
      const position = natalChart.planets[key];
      if (!position) return [];
      const fact = facts.planets[key];
      return [{
        key,
        name: PLANET_NAMES_RU[key],
        position,
        house: fact?.house ?? null,
        dignityLabel: fact?.dignity?.label ?? null,
        dignityNotApplicable: fact?.dataAvailability.dignity === 'not-applicable',
      }];
    }),
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Основные данные: планета, знак и дом. Нажмите на строку, чтобы увидеть расчётные подробности.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[26rem] border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-3 text-sm font-semibold text-gray-700">Планета</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-700">Знак</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-700">Дом</th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-700">Подробности</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expandedPlanet === row.key;
              return (
                <tr key={row.key} className="border-t border-gray-100">
                  <td colSpan={4} className="p-0">
                    <button
                      type="button"
                      className="grid w-full grid-cols-[minmax(7rem,1fr)_minmax(6rem,1fr)_3rem_6.5rem] items-center gap-2 px-3 py-3 text-left text-sm hover:bg-gray-50"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedPlanet(isExpanded ? null : row.key)}
                    >
                      <span className="font-medium text-gray-900">{row.name}</span>
                      <span className="text-gray-700">{SIGN_NAMES_RU[row.position.signName] ?? row.position.signName}</span>
                      <span className="text-center text-gray-700">{row.house ?? '—'}</span>
                      <span className="text-xs font-medium text-indigo-700">{isExpanded ? 'Скрыть ↑' : 'Подробнее ↓'}</span>
                    </button>
                    {isExpanded && (
                      <div className="grid gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-gray-500">Градусы внутри знака</p>
                          <p className="font-medium text-gray-800">{formatDegrees(row.position.siderealLon)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Накшатра</p>
                          <p className="font-medium text-gray-800">{row.position.nakshatraName || 'Не определена'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Пада — четверть накшатры</p>
                          <p className="font-medium text-gray-800">{row.position.pada || 'Не определена'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Точная сидерическая долгота</p>
                          <p className="font-medium text-gray-800">{row.position.siderealLon.toFixed(4)}°</p>
                        </div>
                        {row.dignityNotApplicable ? (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500">Достоинство</p>
                            <p className="font-medium text-gray-700">Для Раху и Кету оценка достоинства в используемой модели не применяется.</p>
                          </div>
                        ) : row.dignityLabel ? (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500">Достоинство</p>
                            <p className="font-medium text-gray-700">{row.dignityLabel}</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        Накшатра — один из 27 участков пути Луны; пада — одна из четырёх частей накшатры.
        Градусы показывают точное положение внутри знака. Эти параметры уточняют расчёт, но не являются оценками планеты.
      </p>
    </div>
  );
}
