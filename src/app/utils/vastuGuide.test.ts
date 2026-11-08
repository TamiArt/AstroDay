import assert from 'node:assert/strict';
import { getVastuMoneyFocus, VASTU_ACTION_PLANS, VASTU_DIRECTIONS, VASTU_GOALS, VASTU_GRID_ORDER, VASTU_MONEY_FOCUS, VASTU_REMEDIES } from './vastuGuide';

assert.equal(VASTU_DIRECTIONS.length, 9, 'Vastu guide must describe all nine sectors');
assert.equal(new Set(VASTU_DIRECTIONS.map((zone) => zone.id)).size, 9, 'Vastu sector IDs must be unique');
assert.deepEqual(
  VASTU_GRID_ORDER,
  ['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'],
  'Compass grid must place north at the top and east on the right',
);
assert.deepEqual(
  [...VASTU_GRID_ORDER].sort(),
  VASTU_DIRECTIONS.map((zone) => zone.id).sort(),
  'Compass grid must contain every Vastu sector exactly once',
);

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

assert.ok(VASTU_ACTION_PLANS.length >= 10, 'Each life area must have a practical action plan');
assert.equal(
  new Set(VASTU_ACTION_PLANS.map((action) => action.id)).size,
  VASTU_ACTION_PLANS.length,
  'Vastu action IDs must be unique',
);

for (const goal of VASTU_GOALS) {
  const actions = VASTU_ACTION_PLANS.filter((action) => action.goal === goal.id);
  assert.ok(actions.length >= 3, `Goal ${goal.id} must have at least three actionable steps`);
  for (const action of actions) {
    assert.ok(action.label.trim(), `Action label is required for ${action.id}`);
  }
}

assert.equal(VASTU_REMEDIES.length, 4, 'Exactly four remedy categories must be available');
assert.equal(new Set(VASTU_REMEDIES.map((item) => item.id)).size, 4, 'Remedy categories must be unique');
assert.equal(VASTU_MONEY_FOCUS.length, 3, 'Money focus must offer stable income, skills and networking directions');
for (const focus of VASTU_MONEY_FOCUS) {
  assert.ok(VASTU_DIRECTIONS.some((zone) => zone.id === focus.direction), `Unknown money direction: ${focus.direction}`);
  assert.equal(getVastuMoneyFocus(focus.id).id, focus.id);
}

console.log('Vastu guide content tests passed');
