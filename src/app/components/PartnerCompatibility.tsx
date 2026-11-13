import { useState, type FormEvent } from 'react';
import { calculatePlanetPosition, type NatalChart } from '../utils/astrology';
import { calculateAshtaKoota, type AshtaKootaResult } from '../utils/ashtaKoota';
import { createDateInTimezone } from '../utils/timezones';
import {
  deletePartnerProfile,
  loadPartnerProfile,
  savePartnerProfile,
  type PartnerBirthProfile,
} from '../utils/storage';
import { GlassCard } from './common/GlassCard';

interface PartnerCompatibilityProps {
  natalChart: NatalChart;
}

const EMPTY_PROFILE: PartnerBirthProfile = {
  name: '',
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  latitude: Number.NaN,
  longitude: Number.NaN,
  timezone: '',
};

const CLASSIFICATION: Record<AshtaKootaResult['classification'], string> = {
  excellent: 'Высокое традиционное соответствие',
  good: 'Хорошее традиционное соответствие',
  moderate: 'Умеренное традиционное соответствие',
  low: 'Низкий балл по выбранной системе',
};

const STATUS: Record<string, string> = {
  supportive: 'Поддерживающий показатель',
  mixed: 'Смешанный показатель',
  challenging: 'Зона внимания',
};

export function PartnerCompatibility({ natalChart }: PartnerCompatibilityProps) {
  const [profile, setProfile] = useState<PartnerBirthProfile>(() => loadPartnerProfile() ?? EMPTY_PROFILE);
  const [result, setResult] = useState<AshtaKootaResult | null>(null);
  const [varnaRoleA, setVarnaRoleA] = useState<'bride' | 'groom' | ''>('');
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof PartnerBirthProfile>(key: K, value: PartnerBirthProfile[K]) => {
    setProfile(current => ({ ...current, [key]: value }));
  };

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    try {
      if (!varnaRoleA) throw new Error('Выберите традиционные роли для направленных кут Варна, Вашьи и Ганы.');
      if (!profile.name.trim() || !profile.birthDate || !profile.birthTime || !profile.birthPlace.trim() || !profile.timezone.trim()) {
        throw new Error('Заполните имя, дату, время, место рождения и часовой пояс партнёра.');
      }
      if (!Number.isFinite(profile.latitude) || profile.latitude < -90 || profile.latitude > 90 ||
          !Number.isFinite(profile.longitude) || profile.longitude < -180 || profile.longitude > 180) {
        throw new Error('Координаты должны находиться в диапазонах широты −90…90 и долготы −180…180.');
      }
      const partnerDate = createDateInTimezone(profile.birthDate, profile.birthTime, profile.timezone);
      if (!Number.isFinite(partnerDate.getTime())) throw new Error('Не удалось определить дату рождения партнёра в указанном часовом поясе.');
      const moon = calculatePlanetPosition('Moon', partnerDate);
      const calculated = calculateAshtaKoota(
        { name: 'Вы', moonLongitude: natalChart.planets.Moon.siderealLon },
        { name: profile.name.trim(), moonLongitude: moon.siderealLon },
        { varnaRoleA },
      );
      savePartnerProfile(profile);
      setResult(calculated);
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : 'Не удалось рассчитать совместимость.');
    }
  };

  const clear = () => {
    deletePartnerProfile();
    setProfile(EMPTY_PROFILE);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Ашта-Кута — Гуна-милан</h2>
          <p className="mt-2 text-sm text-gray-600">
            Введите данные рождения второго человека. Этот расчёт сравнивает положение Луны в двух картах по традиционной системе Ашта-Кута. Он оценивает только восемь астрологических критериев, а не качество отношений, совместимость характеров или вероятность брака. Для определения накшатры и её четверти (пады) важны точные дата, время и часовой пояс рождения.
          </p>
        </div>
        <form onSubmit={calculate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">Имя партнёра
            <input required value={profile.name} onChange={event => update('name', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm">Место рождения
            <input required value={profile.birthPlace} onChange={event => update('birthPlace', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm">Дата рождения
            <input required type="date" value={profile.birthDate} onChange={event => update('birthDate', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm">Время рождения
            <input required type="time" value={profile.birthTime} onChange={event => update('birthTime', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm">Широта
            <input required type="number" step="any" value={Number.isFinite(profile.latitude) ? profile.latitude : ''} onChange={event => update('latitude', event.target.value === '' ? Number.NaN : Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm">Долгота
            <input required type="number" step="any" value={Number.isFinite(profile.longitude) ? profile.longitude : ''} onChange={event => update('longitude', event.target.value === '' ? Number.NaN : Number(event.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <label className="text-sm md:col-span-2">Традиционная роль для трёх правил, где сравнение зависит от порядка участников
            <select value={varnaRoleA} required onChange={event => setVarnaRoleA(event.target.value as 'bride' | 'groom' | '')} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
              <option value="">Выберите роль</option>
              <option value="bride">Пользователь — невеста, партнёр — жених</option>
              <option value="groom">Пользователь — жених, партнёр — невеста</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">Часовой пояс IANA (например, Europe/Moscow или Asia/Tbilisi)
            <input required value={profile.timezone} onChange={event => update('timezone', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button type="submit" className="rounded-xl bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700">Рассчитать 8 кут</button>
            <button type="button" onClick={clear} className="rounded-xl border border-gray-300 px-5 py-3 hover:bg-gray-50">Очистить данные партнёра</button>
          </div>
        </form>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </GlassCard>

      {result && (
        <>
          <GlassCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Баллы по восьми традиционным критериям</p>
                <p className="text-4xl font-bold text-purple-700">{result.totalScore}<span className="text-xl text-gray-500"> / 36</span></p>
                <p className="mt-1 font-medium">{CLASSIFICATION[result.classification]}</p>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-600">Категория показывает результат только внутри системы Ашта-Кута. Она не предсказывает, будут ли отношения счастливыми или долговечными: на это влияют реальные поступки, общение, ценности и обстоятельства пары.</p>
              </div>
              <div className="rounded-xl bg-purple-50 px-5 py-4 text-center">
                <p className="text-2xl font-semibold text-purple-700">{result.percentage}%</p>
                <p className="text-xs text-gray-600">от максимального балла</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[result.personA, result.personB].map((person, index) => (
                <div key={person.name + index} className="rounded-xl bg-gray-50 p-4">
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-sm text-gray-700">Лунный знак: {person.sign}</p>
                  <p className="text-sm text-gray-700">Накшатра: {person.nakshatra}, пада {person.pada}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 text-lg font-semibold">Разбор всех восьми кут</h3>
            <div className="space-y-4">
              {result.kutas.map((item, index) => (
                <section key={item.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{index + 1}. {item.name}</h4>
                      <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{item.score}<span className="text-sm font-normal text-gray-500"> / {item.maxScore}</span></p>
                      <p className="text-xs text-gray-500">{STATUS[item.status]}</p>
                    </div>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {item.details.map((detail, detailIndex) => <li key={detailIndex}>{detail}</li>)}
                  </ul>
                </section>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 font-semibold">Методика и ограничения</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
              {result.notes.map((note, index) => <li key={index}>{note}</li>)}
            </ul>
          </GlassCard>
        </>
      )}
    </div>
  );
}
