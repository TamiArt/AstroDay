import { useMemo, useState, type FormEvent } from 'react';
import { calculateNatalChart } from '../../utils/astrology';
import { createDateInTimezone } from '../../utils/timezones';
import { analyzeLifeAreas, getSynastryAspects } from '../../utils/lifePathAnalysis';
import { isValidCoordinates, isValidIanaTimezone } from '../../utils/locationValidation';
import { deletePartnerProfile, loadPartnerProfile, savePartnerProfile, type PartnerBirthProfile } from '../../utils/storage';
import type { NatalChart } from '../../utils/astrology';
import { geocodePlace, type GeocodingResult } from '../../utils/geocoding';
import { GlassCard } from '../common/GlassCard';

interface LifePathAnalysisTabProps {
  natalChart: NatalChart;
}

const EMPTY_PARTNER: PartnerBirthProfile = {
  name: '',
  birthDate: '',
  birthTime: '12:00',
  birthPlace: '',
  latitude: 0,
  longitude: 0,
  timezone: 'Europe/Moscow',
};

export function LifePathAnalysisTab({ natalChart }: LifePathAnalysisTabProps) {
  const [partner, setPartner] = useState<PartnerBirthProfile>(() => loadPartnerProfile() ?? EMPTY_PARTNER);
  const [partnerChart, setPartnerChart] = useState<NatalChart | null>(null);
  const [partnerError, setPartnerError] = useState('');
  const [partnerNotice, setPartnerNotice] = useState('');
  const [placeResults, setPlaceResults] = useState<GeocodingResult[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const areas = useMemo(() => analyzeLifeAreas(natalChart), [natalChart]);
  const synastry = useMemo(
    () => partnerChart ? getSynastryAspects(natalChart, partnerChart) : [],
    [natalChart, partnerChart],
  );

  const updatePartner = (field: keyof PartnerBirthProfile, value: string) => {
    setPartner((current) => ({
      ...current,
      [field]: field === 'latitude' || field === 'longitude' ? Number(value) : value,
    }));
    setPartnerChart(null);
    setPartnerNotice('');
  };

  const searchPartnerPlace = async () => {
    if (!partner.birthPlace.trim()) {
      setPartnerError('Сначала введите город рождения партнёра.');
      return;
    }
    setIsSearchingPlace(true);
    setPartnerError('');
    try {
      const results = await geocodePlace(partner.birthPlace);
      setPlaceResults(results);
    } catch (error) {
      setPartnerError(error instanceof Error ? error.message : 'Не удалось найти место рождения.');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const selectPartnerPlace = (place: GeocodingResult) => {
    setPartner((current) => ({ ...current, birthPlace: place.displayName, latitude: place.latitude, longitude: place.longitude, timezone: place.timezone }));
    setPlaceResults([]);
    setPartnerChart(null);
    setPartnerNotice('Координаты и часовой пояс места рождения подставлены.');
  };

  const analyzePartner = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPartnerError('');
    setPartnerNotice('');
    if (!partner.name.trim() || !partner.birthDate || !partner.birthTime || !partner.birthPlace.trim()) {
      setPartnerError('Заполните имя, дату, время и место рождения партнёра.');
      return;
    }
    if (!isValidCoordinates(partner.latitude, partner.longitude) || (partner.latitude === 0 && partner.longitude === 0)) {
      setPartnerError('Проверьте координаты места рождения: широта от −90 до 90, долгота от −180 до 180.');
      return;
    }
    if (!isValidIanaTimezone(partner.timezone)) {
      setPartnerError('Укажите корректный часовой пояс IANA, например Europe/Moscow или Asia/Kolkata.');
      return;
    }
    try {
      const birthDate = createDateInTimezone(partner.birthDate, partner.birthTime, partner.timezone);
      const chart = calculateNatalChart(birthDate, partner.latitude, partner.longitude);
      savePartnerProfile(partner);
      setPartnerChart(chart);
      setPartnerNotice('Карта партнёра рассчитана и сохранена в этом браузере.');
    } catch (error) {
      setPartnerError(error instanceof Error ? error.message : 'Не удалось рассчитать карту партнёра.');
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-primary">Анализ жизненных сфер</p>
          <h2 className="text-2xl font-semibold">Деньги, карьера, развитие и отношения</h2>
          <p className="text-sm opacity-75">
            Раздел показывает, какие дома и планеты традиционно рассматриваются в джйотиш при разборе разных сфер.
            Это символическая интерпретация натальной карты, а не финансовый прогноз, диагноз или гарантия событий.
          </p>
        </div>
      </GlassCard>

      {areas.map((area) => (
        <GlassCard key={area.id}>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{area.title}</h3>
            <div className="flex flex-wrap gap-2">
              {area.houses.map((house) => (
                <span key={house} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">{house}-й дом</span>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-4">
                <h4 className="font-semibold text-sm mb-2">Что показывает карта</h4>
                <ul className="space-y-2">
                  {area.houseNotes.map((note) => <li key={note} className="text-sm opacity-80">{note}</li>)}
                </ul>
                {area.planetNotes.length > 0 && (
                  <p className="text-xs opacity-65 mt-3">Планетные положения: {area.planetNotes.join(' · ')}</p>
                )}
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <h4 className="font-semibold text-sm mb-2">Практический фокус</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {area.practicalFocus.map((item) => <li key={item} className="text-sm opacity-80">{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}

      <GlassCard>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-primary">Совместный разбор</p>
            <h2 className="text-2xl font-semibold mt-2">Карта партнёра — мужа или жены</h2>
            <p className="text-sm opacity-75 mt-2">
              Добавьте данные рождения партнёра, чтобы построить вторую карту и посмотреть межкартные аспекты.
              Для точного расчёта домов нужны точное время, координаты и часовой пояс места рождения.
            </p>
          </div>

          <form onSubmit={analyzePartner} className="grid gap-3 md:grid-cols-2">
            <label className="text-sm space-y-1">
              <span>Имя партнёра</span>
              <input className="w-full rounded-xl border border-border bg-background p-3" value={partner.name} onChange={(event) => updatePartner('name', event.target.value)} />
            </label>
            <div className="text-sm space-y-1">
              <span>Место рождения</span>
              <input className="w-full rounded-xl border border-border bg-background p-3" value={partner.birthPlace} onChange={(event) => { updatePartner('birthPlace', event.target.value); setPlaceResults([]); }} placeholder="Город, страна" />
              <button type="button" onClick={searchPartnerPlace} disabled={isSearchingPlace} className="mt-2 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-50">{isSearchingPlace ? 'Ищем место…' : 'Найти координаты и часовой пояс'}</button>
            </div>
            <label className="text-sm space-y-1">
              <span>Дата рождения</span>
              <input type="date" className="w-full rounded-xl border border-border bg-background p-3" value={partner.birthDate} onChange={(event) => updatePartner('birthDate', event.target.value)} />
            </label>
            <label className="text-sm space-y-1">
              <span>Время рождения</span>
              <input type="time" className="w-full rounded-xl border border-border bg-background p-3" value={partner.birthTime} onChange={(event) => updatePartner('birthTime', event.target.value)} />
              <span className="block text-xs opacity-60">Если точное время неизвестно, 12:00 даст только приблизительную карту: Лагна и дома могут быть неверны.</span>
            </label>
            <label className="text-sm space-y-1">
              <span>Широта</span>
              <input type="number" step="any" className="w-full rounded-xl border border-border bg-background p-3" value={partner.latitude} onChange={(event) => updatePartner('latitude', event.target.value)} />
            </label>
            <label className="text-sm space-y-1">
              <span>Долгота</span>
              <input type="number" step="any" className="w-full rounded-xl border border-border bg-background p-3" value={partner.longitude} onChange={(event) => updatePartner('longitude', event.target.value)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <span>Часовой пояс места рождения (IANA)</span>
              <input className="w-full rounded-xl border border-border bg-background p-3" value={partner.timezone} onChange={(event) => updatePartner('timezone', event.target.value)} placeholder="Europe/Moscow" />
            </label>
            {placeResults.length > 0 && (
              <div className="md:col-span-2 rounded-xl border border-border p-3 space-y-2">
                <p className="text-sm font-semibold">Выберите правильное место рождения:</p>
                {placeResults.map((place) => (
                  <button key={`${place.latitude}-${place.longitude}-${place.displayName}`} type="button" onClick={() => selectPartnerPlace(place)} className="block w-full rounded-lg bg-secondary p-2 text-left text-xs hover:bg-primary/10">{place.displayName}</button>
                ))}
              </div>
            )}
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Рассчитать карту партнёра</button>
              <button type="button" onClick={() => { deletePartnerProfile(); setPartner(EMPTY_PARTNER); setPartnerChart(null); setPlaceResults([]); setPartnerNotice('Сохранённая карта партнёра удалена.'); setPartnerError(''); }} className="rounded-xl border border-border px-4 py-3 text-sm">Удалить сохранённые данные партнёра</button>
              {partnerNotice && <span className="text-sm text-green-700">{partnerNotice}</span>}
              {partnerError && <span role="alert" className="text-sm text-red-600">{partnerError}</span>}
            </div>
          </form>

          {partnerChart && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="font-semibold">Сопоставление карт: {partner.name}</h3>
              <p className="text-sm opacity-75">
                Ниже показаны найденные угловые связи между планетами двух карт. Это не рейтинг совместимости
                и не вывод о том, должны ли люди быть вместе.
              </p>
              {synastry.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {synastry.map((aspect) => (
                    <div key={`${aspect.firstPlanet}-${aspect.secondPlanet}-${aspect.aspect}`} className="rounded-xl bg-secondary p-3 text-sm">
                      <span className="font-semibold">{aspect.firstPlanet} — {aspect.secondPlanet}</span>
                      <span className="block opacity-75 mt-1">{aspect.aspect}, орбис {aspect.orb.toFixed(1)}°</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm opacity-70">В выбранном наборе планет точных основных аспектов в заданных орбисах не найдено.</p>}
              <p className="text-xs opacity-60">Карта партнёра сохранена локально. Данные можно удалить через очистку данных дома.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
