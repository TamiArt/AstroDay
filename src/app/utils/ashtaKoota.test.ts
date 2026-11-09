import assert from 'node:assert/strict';
import { calculateAshtaKoota } from './ashtaKoota';

const same = calculateAshtaKoota(
  { name: 'A', moonLongitude: 12 },
  { name: 'B', moonLongitude: 12 },
);
assert.equal(same.maxScore, 36);
assert.equal(same.kutas.length, 8);
assert.equal(same.kutas.reduce((sum, item) => sum + item.maxScore, 0), 36);
assert.equal(same.kutas.reduce((sum, item) => sum + item.score, 0), same.totalScore);
assert.equal(same.kutas.find(item => item.id === 'nadi')?.score, 0);
assert.equal(same.kutas.find(item => item.id === 'bhakoot')?.score, 7);
assert.equal(same.personA.nakshatra, same.personB.nakshatra);
assert.equal(same.personA.pada, same.personB.pada);

const differentNadi = calculateAshtaKoota(
  { name: 'A', moonLongitude: 1 },
  { name: 'B', moonLongitude: 15 },
);
assert.equal(differentNadi.kutas.find(item => item.id === 'nadi')?.score, 8);

const boundary = calculateAshtaKoota(
  { name: 'A', moonLongitude: 360 - 0.000001 },
  { name: 'B', moonLongitude: 0 },
);
assert.equal(boundary.personA.nakshatraIndex, 26);
assert.equal(boundary.personB.nakshatraIndex, 0);

assert.throws(
  () => calculateAshtaKoota({ name: '', moonLongitude: 10 }, { name: 'B', moonLongitude: 20 }),
  /укажите имя/,
);
assert.throws(
  () => calculateAshtaKoota({ name: 'A', moonLongitude: 360 }, { name: 'B', moonLongitude: 20 }),
  /диапазоне/,
);

console.log('ashtaKoota.test.ts: all assertions passed');
