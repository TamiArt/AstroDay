import assert from 'node:assert/strict';
import { calculateNatalChart } from './astrology';
import { copyTextToClipboard } from './clipboard';
import { serializeNatalChart } from './natalChartExport';
import type { UserProfile } from './storage';

const birthDate = new Date('1990-06-15T07:19:25.000Z');
const chart = calculateNatalChart(birthDate, 28.6139, 77.209);
const profile: UserProfile = {
  name: 'PRIVATE_PROFILE_NAME',
  birthDate: '1990-06-15',
  birthTime: '12:49',
  birthPlace: 'New Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
  timezoneAccuracy: 'matched-region',
  timeUncertainty: 5,
  currentLocation: {
    place: 'PRIVATE_CURRENT_LOCATION',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
    lastUpdated: '2026-11-15T00:00:00.000Z',
  },
  relatives: [{
    id: 'private-relative-id',
    name: 'PRIVATE_RELATIVE_NAME',
    relationship: 'relative',
    birthDate: '1980-01-01',
    birthTime: '10:00',
    birthPlace: 'PRIVATE_RELATIVE_PLACE',
    latitude: 0,
    longitude: 0,
    livesNearby: false,
    includeInPredictions: false,
  }],
};

const text = serializeNatalChart(profile, chart);
assert.ok(text.startsWith('ДАННЫЕ НАТАЛЬНОЙ КАРТЫ ASTRODAY'));
assert.ok(text.includes('15.06.1990'));
assert.ok(text.includes('12:49'));
assert.ok(text.includes('New Delhi'));
assert.ok(text.includes('±5 мин'));
assert.ok(text.includes('Asia/Kolkata'));
assert.ok(text.includes('Lahiri'));
assert.ok(text.includes('Whole Sign'));
assert.ok(text.includes('Mean Node'));
assert.ok(text.includes('Момент расчёта (UTC): 1990-06-15T07:19:25.000Z'));
assert.ok(text.includes('Асцендент'));
assert.ok(text.includes('Солнце (Sun)'));
assert.ok(text.includes('Луна (Moon)'));
assert.ok(text.includes('Раху (восходящий лунный узел) (Rahu)'));
assert.ok(text.includes('Кету (нисходящий лунный узел) (Ketu)'));
for (let house = 1; house <= 12; house += 1) {
  assert.ok(text.includes(`${house}-й дом:`), `House ${house} must be exported`);
}
for (const planet of ['Солнце', 'Луна', 'Меркурий', 'Венера', 'Марс', 'Юпитер', 'Сатурн', 'Раху', 'Кету']) {
  assert.ok(text.includes(planet), `${planet} must be exported`);
}
assert.ok(!text.includes('PRIVATE_PROFILE_NAME'));
assert.ok(!text.includes('PRIVATE_CURRENT_LOCATION'));
assert.ok(!text.includes('PRIVATE_RELATIVE_NAME'));
assert.ok(!text.includes('PRIVATE_RELATIVE_PLACE'));
assert.ok(!text.includes('private-relative-id'));
assert.ok(!/undefined|null|\[object Object\]/.test(text));
assert.ok(text.includes('Натальные аспекты не включены в объект NatalChart'));

const approximateProfile = { ...profile, timeUncertainty: 0, timezoneAccuracy: 'estimated-longitude' as const };
const approximateText = serializeNatalChart(approximateProfile, chart);
assert.ok(approximateText.includes('Погрешность времени: ±0 мин'));
assert.ok(approximateText.includes('приближённо оценён по долготе'));
assert.ok(approximateText.includes('историческое смещение времени может отличаться'));

const missingProfile: UserProfile = {
  name: 'NOT_EXPORTED',
  birthDate: '',
  birthTime: '',
  birthPlace: '',
  latitude: Number.NaN,
  longitude: Number.NaN,
  timezone: '',
};
const incompleteText = serializeNatalChart(missingProfile, chart);
assert.ok(incompleteText.includes('Дата рождения: не указана'));
assert.ok(incompleteText.includes('Местное время рождения: не указано'));
assert.ok(incompleteText.includes('Место рождения: не указано'));
assert.ok(incompleteText.includes('Широта: не рассчитано'));
assert.ok(incompleteText.includes('Часовой пояс IANA: не указан'));
assert.ok(!incompleteText.includes('NOT_EXPORTED'));

let copiedText = '';
await copyTextToClipboard('clipboard success', {
  writeText: async (value) => { copiedText = value; },
}, () => false);
assert.equal(copiedText, 'clipboard success', 'Clipboard API should receive the text');

let fallbackText = '';
await copyTextToClipboard('fallback after rejection', {
  writeText: async () => { throw new Error('permission denied'); },
}, (value) => {
  fallbackText = value;
  return true;
});
assert.equal(fallbackText, 'fallback after rejection', 'Fallback should run when Clipboard API rejects');

let noApiFallbackText = '';
await copyTextToClipboard('fallback without API', undefined, (value) => {
  noApiFallbackText = value;
  return true;
});
assert.equal(noApiFallbackText, 'fallback without API', 'Fallback should run when Clipboard API is unavailable');

await assert.rejects(
  copyTextToClipboard('cannot copy', undefined, () => false),
  /не разрешил скопировать данные/,
  'Copying must fail clearly when both paths fail',
);
await assert.rejects(
  copyTextToClipboard('', undefined, () => true),
  /Нет данных для копирования/,
  'Empty content must not be reported as copied',
);

console.log('natal chart export and clipboard tests passed');
