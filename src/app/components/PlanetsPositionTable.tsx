import { HouseCusp, NatalChart, PlanetPosition } from '../utils/astrology';
import { Info, ChevronDown, ChevronUp, Sparkles, MapPin, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, Fragment } from 'react';
import { getPlanetInterpretation } from '../utils/planetInterpretations';

interface PlanetsPositionTableProps {
  natalChart: NatalChart;
}

const PLANET_NAMES_RU: Record<string, { full: string; short: string }> = {
  Sun: { full: 'Солнце', short: 'Su' },
  Moon: { full: 'Луна', short: 'Mo' },
  Mercury: { full: 'Меркурий', short: 'Me' },
  Venus: { full: 'Венера', short: 'Ve' },
  Mars: { full: 'Марс', short: 'Ma' },
  Jupiter: { full: 'Юпитер', short: 'Jp' },
  Saturn: { full: 'Сатурн', short: 'Sa' },
  Rahu: { full: 'Раху', short: 'Ra' },
  Ketu: { full: 'Кету', short: 'Ke' },
  Asc: { full: 'Асцендент', short: 'Asc' },
};

const SIGN_NAMES_RU: Record<string, string> = {
  Aries: 'Овен',
  Taurus: 'Телец',
  Gemini: 'Близнецы',
  Cancer: 'Рак',
  Leo: 'Лев',
  Virgo: 'Дева',
  Libra: 'Весы',
  Scorpio: 'Скорпион',
  Sagittarius: 'Стрелец',
  Capricorn: 'Козерог',
  Aquarius: 'Водолей',
  Pisces: 'Рыбы',
};

const SIGN_NAMES_PREP_RU: Record<string, string> = {
  Aries: 'Овне',
  Taurus: 'Тельце',
  Gemini: 'Близнецах',
  Cancer: 'Раке',
  Leo: 'Льве',
  Virgo: 'Деве',
  Libra: 'Весах',
  Scorpio: 'Скорпионе',
  Sagittarius: 'Стрельце',
  Capricorn: 'Козероге',
  Aquarius: 'Водолее',
  Pisces: 'Рыбах',
};

function formatDegrees(longitude: number): string {
  const degrees = Math.floor(longitude % 30);
  const minutes = Math.floor(((longitude % 30) - degrees) * 60);
  const seconds = Math.floor((((longitude % 30) - degrees) * 60 - minutes) * 60);

  return `${degrees}°${minutes}'${seconds}"`;
}

function getPlanetHouse(planetLon: number, houses: HouseCusp[]): number {
  if (!houses || houses.length === 0) return 1;

  for (let i = 0; i < houses.length; i++) {
    const currentCusp = houses[i].cusp;
    const nextCusp = houses[(i + 1) % 12].cusp;

    let inHouse = false;
    if (nextCusp > currentCusp) {
      inHouse = planetLon >= currentCusp && planetLon < nextCusp;
    } else {
      inHouse = planetLon >= currentCusp || planetLon < nextCusp;
    }

    if (inHouse) return i + 1;
  }

  return 1;
}

export function PlanetsPositionTable({ natalChart }: PlanetsPositionTableProps) {
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);

  const planets: Array<{ name: string; position: PlanetPosition }> = [
    { name: 'Asc', position: natalChart.ascendant },
    ...Object.entries(natalChart.planets).map(([name, position]) => ({ name, position })),
  ];

  return (
    <div className="space-y-4">
      {/* Заголовок с пояснением */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <Info className="w-5 h-5 text-purple-600 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          <strong>Нажмите на любую планету,</strong> чтобы увидеть подробное объяснение на простом языке,
          что означает её положение в вашей натальной карте.
        </p>
      </div>

      {/* Таблица с расширяемыми строками */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Планета</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Знак</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Градусы</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Накшатра</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Дом</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Пада</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-10"></th>
            </tr>
          </thead>
          <tbody>
            {planets.map(({ name, position }) => {
              const house = getPlanetHouse(position.siderealLon, natalChart.houses || []);
              const isExpanded = expandedPlanet === name;
              const interpretation = getPlanetInterpretation(name, position.signName, house);

              return (
                <Fragment key={name}>
                  {/* Основная строка */}
                  <tr
                    className={`border-b transition-all cursor-pointer ${
                      isExpanded ? 'bg-purple-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedPlanet(isExpanded ? null : name)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{PLANET_NAMES_RU[name]?.full || name}</span>
                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {PLANET_NAMES_RU[name]?.short || name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                        {SIGN_NAMES_RU[position.signName] || position.signName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">
                      {formatDegrees(position.siderealLon)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {position.nakshatraName || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-semibold text-sm">
                        {house}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {position.pada || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-purple-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </td>
                  </tr>

                  {/* Расширенное описание */}
                  {isExpanded && (
                    <tr key={`${name}-detail`} className="bg-gradient-to-br from-purple-50 to-pink-50">
                      <td colSpan={7} className="px-6 py-6 border-b-2 border-purple-200">
                        <div className="space-y-6">
                          {/* Заголовок */}
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                              <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                {PLANET_NAMES_RU[name]?.full} в {SIGN_NAMES_PREP_RU[position.signName] || position.signName}, {house}-й дом
                              </h4>
                              <p className="text-sm text-gray-600">
                                Как это положение может проявляться в реальном поведении
                              </p>
                            </div>
                          </div>

                          {/* Блок 1: Знак (КАК проявляется) */}
                          {interpretation.sign && (
                            <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm">
                              <div className="flex items-start gap-3">
                                <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span>Суть: {SIGN_NAMES_RU[position.signName]}</span>
                                  </h5>

                                  <p className="text-sm text-gray-800 leading-relaxed mb-3">
                                    {interpretation.sign.essence}
                                  </p>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Поведенческие проявления */}
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Поведение:</div>
                                      <ul className="space-y-1">
                                        {interpretation.sign.characteristics.map((char, i) => (
                                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-purple-500 mt-1">•</span>
                                            <span>{char}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Сильные стороны */}
                                    <div>
                                      <div className="text-xs font-semibold text-green-600 uppercase mb-2 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Сильная сторона:
                                      </div>
                                      <ul className="space-y-1">
                                        {interpretation.sign.strengths.map((strength, i) => (
                                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-green-500 mt-1">✓</span>
                                            <span>{strength}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>

                                  {/* Вызовы */}
                                  {interpretation.sign.challenges.length > 0 && (
                                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                      <div className="text-xs font-semibold text-orange-700 uppercase mb-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Зона роста:
                                      </div>
                                      <ul className="space-y-1">
                                        {interpretation.sign.challenges.map((challenge, i) => (
                                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-orange-500 mt-1">⚠</span>
                                            <span>{challenge}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {interpretation.sign.practice && interpretation.sign.practice.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        Практика:
                                      </div>
                                      <ul className="space-y-1">
                                        {interpretation.sign.practice.map((step, i) => (
                                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-blue-500 mt-1">{i + 1}</span>
                                            <span>{step}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Блок 2: Дом (ГДЕ проявляется) */}
                          {interpretation.house && (
                            <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm">
                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-2">
                                    ГДЕ проявляется: {house}-й дом — {interpretation.house.lifeArea}
                                  </h5>

                                  <p className="text-sm text-gray-800 leading-relaxed mb-3">
                                    {interpretation.house.manifestation}
                                  </p>

                                  <div className="bg-purple-50 p-3 rounded-lg">
                                    <div className="text-xs font-semibold text-purple-700 uppercase mb-2">
                                      Где применить на практике:
                                    </div>
                                    <ul className="space-y-1">
                                      {interpretation.house.focus.map((item, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                          <span className="text-purple-500 mt-1">→</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Итоговое объяснение */}
                          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <div className="flex items-start gap-3">
                              <Info className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-2">Простыми словами:</h5>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  <strong>{PLANET_NAMES_RU[name]?.full}</strong> в знаке{' '}
                                  <strong>{SIGN_NAMES_RU[position.signName]}</strong> показывает не ярлык, а привычный способ действия.
                                  {interpretation.sign && (
                                    <>
                                      {' '}{interpretation.sign.characteristics[0]}
                                    </>
                                  )}
                                  {interpretation.house && (
                                    <>
                                      {' '}В <strong>{house}-м доме</strong> это чаще проявляется в сфере: {interpretation.house.lifeArea.toLowerCase()}.
                                      {' '}Практический вопрос: {interpretation.house.focus[0].toLowerCase()}.
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Легенда */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Знак зодиака (КАК)
          </h4>
          <p className="text-xs text-gray-600">
            Показывает стиль реакции. Например: когда нужно действовать, Марс в Овне начинает сразу, а Марс в Раке сначала защищает своих.
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            Дом (ГДЕ)
          </h4>
          <p className="text-xs text-gray-600">
            Показывает сферу, где это видно в жизни: 1-й дом — первое впечатление, 7-й — разговоры и договорённости один-на-один.
          </p>
        </div>
        <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
          <h4 className="font-semibold text-sm text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-600" />
            Накшатра
          </h4>
          <p className="text-xs text-gray-600">
            Лунная стоянка - более детальная характеристика. 27 накшатр делят зодиак на сектора по 13°20'.
          </p>
        </div>
      </div>
    </div>
  );
}
