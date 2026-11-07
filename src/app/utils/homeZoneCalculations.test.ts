import assert from 'node:assert/strict';
import { getVastuZone } from './homeZoneCalculations';
import type { HomeRoomRect } from './storage';

function roomAt(x: number, y: number): HomeRoomRect {
  return {
    id: 'test-room',
    name: 'Test',
    x,
    y,
    width: 10,
    height: 10,
    baguaZone: 'center',
    vastuZone: 'center',
  };
}

const canvasWidth = 300;
const canvasHeight = 300;
const cases: Array<{ x: number; y: number; expected: string }> = [
  { x: 45, y: 45, expected: 'northwest' },
  { x: 145, y: 45, expected: 'north' },
  { x: 245, y: 45, expected: 'northeast' },
  { x: 45, y: 145, expected: 'west' },
  { x: 145, y: 145, expected: 'center' },
  { x: 245, y: 145, expected: 'east' },
  { x: 45, y: 245, expected: 'southwest' },
  { x: 145, y: 245, expected: 'south' },
  { x: 245, y: 245, expected: 'southeast' },
];

for (const item of cases) {
  assert.equal(
    getVastuZone(roomAt(item.x, item.y), canvasWidth, canvasHeight),
    item.expected,
    `Unexpected Vastu direction for point ${item.x}, ${item.y}`,
  );
}

console.log('Vastu floor plan direction tests passed');
