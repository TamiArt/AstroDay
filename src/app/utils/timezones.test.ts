import assert from 'node:assert/strict';
import { createDateInTimezone, getTimezoneOffset } from './timezones';

function assertIso(date: Date, expected: string, message: string) {
  assert.equal(Number.isNaN(date.getTime()), false, `${message}: expected valid Date`);
  assert.equal(date.toISOString(), expected, message);
}

// Stable winter offset.
assertIso(
  createDateInTimezone('2024-01-15', '12:00', 'Europe/London'),
  '2024-01-15T12:00:00.000Z',
  'London winter civil time'
);

// Stable summer DST offset.
assertIso(
  createDateInTimezone('2024-07-15', '12:00', 'Europe/London'),
  '2024-07-15T11:00:00.000Z',
  'London summer civil time'
);

// Spring-forward gap: 01:30 did not exist in London on this date.
const nonexistent = createDateInTimezone('2024-03-31', '01:30', 'Europe/London');
assert.equal(Number.isNaN(nonexistent.getTime()), true, 'nonexistent DST civil time must be rejected');

// Fall-back overlap: choose the earlier occurrence deterministically.
assertIso(
  createDateInTimezone('2024-10-27', '01:30', 'Europe/London'),
  '2024-10-27T00:30:00.000Z',
  'ambiguous DST civil time uses earlier occurrence'
);

// Historical DST rules must be applied using the IANA zone, not a present-day offset.
assertIso(
  createDateInTimezone('2021-03-28', '03:30', 'Europe/Paris'),
  '2021-03-28T01:30:00.000Z',
  'Paris time after the spring-forward transition'
);
assert.equal(
  Number.isNaN(createDateInTimezone('2021-03-28', '02:30', 'Europe/Paris').getTime()),
  true,
  'Paris spring-forward gap must reject nonexistent local time'
);
assertIso(
  createDateInTimezone('2021-10-31', '02:30', 'Europe/Paris'),
  '2021-10-31T00:30:00.000Z',
  'Paris fall-back overlap uses earlier occurrence'
);

// Civil dates must reject impossible calendar dates and malformed time input.
assert.equal(Number.isNaN(createDateInTimezone('2024-02-30', '12:00', 'Europe/Paris').getTime()), true);
assert.equal(Number.isNaN(createDateInTimezone('2024-02-29', '24:00', 'Europe/Paris').getTime()), true);

// Half-hour zones must continue to work even though longitude fallback is whole-hour only.
assertIso(
  createDateInTimezone('2024-07-15', '12:00', 'Asia/Kolkata'),
  '2024-07-15T06:30:00.000Z',
  'Kolkata half-hour timezone'
);

assert.equal(getTimezoneOffset('Asia/Kolkata', new Date('2024-07-15T06:30:00.000Z')), 330);

console.log('Timezone regression tests passed');
