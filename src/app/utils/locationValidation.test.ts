import assert from 'node:assert/strict';
import {
  isValidCoordinates,
  isValidIanaTimezone,
  isValidLatitude,
  isValidLongitude,
} from './locationValidation';

assert.equal(isValidLatitude(90), true);
assert.equal(isValidLatitude(-90), true);
assert.equal(isValidLatitude(90.0001), false);
assert.equal(isValidLongitude(180), true);
assert.equal(isValidLongitude(-180), true);
assert.equal(isValidLongitude(-180.0001), false);
assert.equal(isValidCoordinates(55.7558, 37.6173), true);
assert.equal(isValidCoordinates(Number.NaN, 37.6173), false);

assert.equal(isValidIanaTimezone('Europe/London'), true);
assert.equal(isValidIanaTimezone('Asia/Kolkata'), true);
assert.equal(isValidIanaTimezone('  Europe/Moscow  '), true);
assert.equal(isValidIanaTimezone('Not/A_Timezone'), false);
assert.equal(isValidIanaTimezone(''), false);

console.log('locationValidation tests passed');
