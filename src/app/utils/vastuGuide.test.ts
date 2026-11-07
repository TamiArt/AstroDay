import assert from 'node:assert/strict';
import { VASTU_DIRECTIONS, VASTU_GOALS } from './vastuGuide';

assert.equal(VASTU_DIRECTIONS.length, 9, 'Vastu guide must describe all nine sectors');
assert.equal(new Set(VASTU_DIRECTIONS.map((zone) => zone.id)).size, 9, 'Vastu sector IDs must be unique');

for (const zone of VASTU_DIRECTIONS) {
  assert.ok(zone.direction.trim(), `Direction label is required for ${zone.id}`);
  assert.ok(zone.principle.trim(), `Traditional principle is required for ${zone.id}`);
  assert.ok(zone.practicalCheck.trim(), `Practical check is required for ${zone.id}`);
  assert.ok(zone.firstStep.trim(), `First step is required for ${zone.id}`);
  assert.ok(zone.goals.length > 0, `At least one goal is required for ${zone.id}`);
  for (const goal of zone.goals) {
    assert.ok(VASTU_GOALS.some((item) => item.id === goal), `Unknown goal ${goal} in ${zone.id}`);
  }
}

assert.deepEqual(
  VASTU_GOALS.map((goal) => goal.id).sort(),
  ['abundance', 'relationships', 'wellbeing'],
  'Guide must cover abundance, relationships and wellbeing',
);

console.log('Vastu guide content tests passed');
