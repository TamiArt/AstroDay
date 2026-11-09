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
assert.equal(same.kutas.find(item => item.id === 'tara')?.score, 0);
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


const directionalA = calculateAshtaKoota(
  { name: 'A', moonLongitude: 3 * 30 },
  { name: 'B', moonLongitude: 0 },
  { varnaRoleA: 'bride' },
);
const directionalB = calculateAshtaKoota(
  { name: 'A', moonLongitude: 3 * 30 },
  { name: 'B', moonLongitude: 0 },
  { varnaRoleA: 'groom' },
);
assert.notEqual(
  directionalA.kutas.find(item => item.id === 'varna')?.score,
  directionalB.kutas.find(item => item.id === 'varna')?.score,
);

const vashyaForward = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 120 },
  { varnaRoleA: 'bride' },
);
const vashyaReverse = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 120 },
  { varnaRoleA: 'groom' },
);
assert.equal(vashyaForward.kutas.find(item => item.id === 'vashya')?.score, 1.5);
assert.equal(vashyaReverse.kutas.find(item => item.id === 'vashya')?.score, 0);

const splitSigns = calculateAshtaKoota(
  { name: 'Sagittarius first half', moonLongitude: 250 },
  { name: 'Sagittarius second half', moonLongitude: 260 },
);
assert.ok(splitSigns.kutas.find(item => item.id === 'vashya')?.details.some(detail => detail.includes('Manava')));
assert.ok(splitSigns.kutas.find(item => item.id === 'vashya')?.details.some(detail => detail.includes('Chatushpada')));

const directionalGanaBride = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 13.34 },
  { varnaRoleA: 'bride' },
);
const directionalGanaGroom = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 13.34 },
  { varnaRoleA: 'groom' },
);
assert.equal(directionalGanaBride.kutas.find(item => item.id === 'gana')?.score, 6);
assert.equal(directionalGanaGroom.kutas.find(item => item.id === 'gana')?.score, 5);

const maitri = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 60 },
);
assert.equal(maitri.kutas.find(item => item.id === 'grahaMaitri')?.score, 0.5);

const bhakootCancellation = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 210 },
);
assert.equal(bhakootCancellation.kutas.find(item => item.id === 'bhakoot')?.score, 7);
assert.ok(bhakootCancellation.kutas.find(item => item.id === 'bhakoot')?.details.some(detail => detail.includes('общего управителя')));

const yoniFriendly = calculateAshtaKoota(
  { name: 'Horse', moonLongitude: 0 },
  { name: 'Elephant', moonLongitude: 13.34 },
);
assert.equal(yoniFriendly.kutas.find(item => item.id === 'yoni')?.score, 3);
const yoniEnemy = calculateAshtaKoota(
  { name: 'Horse', moonLongitude: 0 },
  { name: 'Buffalo', moonLongitude: 160 },
);
assert.equal(yoniEnemy.kutas.find(item => item.id === 'yoni')?.score, 0);
const yoniUnfriendly = calculateAshtaKoota(
  { name: 'Sheep', moonLongitude: 26.67 },
  { name: 'Rat', moonLongitude: 120 },
);
assert.equal(yoniUnfriendly.kutas.find(item => item.id === 'yoni')?.score, 1);

console.log('ashtaKoota.test.ts: all assertions passed');

const taraModulo = calculateAshtaKoota(
  { name: 'A', moonLongitude: 0 },
  { name: 'B', moonLongitude: 26 * (360 / 27) },
);
assert.equal(taraModulo.kutas.find(item => item.id === 'tara')?.score, 3);
assert.ok(taraModulo.kutas.find(item => item.id === 'tara')?.details.some(detail => detail.includes('номер Тары 9')));
