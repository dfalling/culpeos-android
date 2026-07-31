/**
 * @format
 */

import {PIN_DIAGONAL, PIN_SELECTED_SCALE, PIN_SIZE} from '../src/map/PinIcon';
import {
  distanceToPin,
  pickPinAtPoint,
  pinSortKey,
  pressedPinId,
  type ViewPoint,
} from '../src/map/pinHitTest';

// A pin's tip, with its round part above it: centre one rise up, radius half a
// side across.
const TIP: ViewPoint = [100, 200];
const RISE = PIN_DIAGONAL / 2;
const RADIUS = PIN_SIZE / 2;
const CENTRE: ViewPoint = [TIP[0], TIP[1] - RISE];

const pin = (id: string, point: ViewPoint, selected = false) => ({
  id,
  point,
  selected,
});

test('the tip and the round part are inside the pin', () => {
  const target = pin('a', TIP);
  expect(distanceToPin(TIP, target)).toBeCloseTo(0);
  expect(distanceToPin(CENTRE, target)).toBe(0);
  // Just inside the round part's edge, in each direction from its centre.
  expect(distanceToPin([CENTRE[0] + RADIUS - 1, CENTRE[1]], target)).toBe(0);
  expect(distanceToPin([CENTRE[0] - RADIUS + 1, CENTRE[1]], target)).toBe(0);
  expect(distanceToPin([CENTRE[0], CENTRE[1] - RADIUS + 1], target)).toBe(0);
  // Halfway down to the tip, where the pin has narrowed to half its width.
  expect(
    distanceToPin([CENTRE[0] + RADIUS / 2, CENTRE[1] + RISE / 2], target),
  ).toBe(0);
});

test('beside the pin is outside it, by the distance to its outline', () => {
  const target = pin('a', TIP);
  // Straight out from the round part's centre: distance from the edge.
  expect(
    distanceToPin([CENTRE[0] + RADIUS + 10, CENTRE[1]], target),
  ).toBeCloseTo(10);
  expect(
    distanceToPin([CENTRE[0], CENTRE[1] - RADIUS - 5], target),
  ).toBeCloseTo(5);
  // Below the tip, where only the tip itself is near.
  expect(distanceToPin([TIP[0], TIP[1] + 7], target)).toBeCloseTo(7);
  // Level with the tip but off to the side: the pin has no width left there, so
  // the nearest of it is the side above, measured square to its 45° run.
  expect(distanceToPin([TIP[0] + 12, TIP[1]], target)).toBeCloseTo(
    12 * Math.SQRT1_2,
  );
});

test('the narrow part of the pin is narrow', () => {
  const target = pin('a', TIP);
  // The sides run down to the tip at 45°, so a quarter of the way above it the
  // pin is a quarter of its rise wide — much narrower than its round part.
  const depth = CENTRE[1] + RISE * 0.75;
  expect(distanceToPin([CENTRE[0] + RISE / 4 - 1, depth], target)).toBe(0);
  expect(distanceToPin([CENTRE[0] + RISE / 4 + 1, depth], target)).toBeCloseTo(
    Math.SQRT1_2,
  );
  // A point out at the round part's full width is well clear of it down here.
  expect(distanceToPin([CENTRE[0] + RADIUS, depth], target)).toBeGreaterThan(8);
});

test('a selected pin is bigger, so it reaches further', () => {
  const point: ViewPoint = [CENTRE[0] + RADIUS + 3, CENTRE[1]];
  expect(distanceToPin(point, pin('a', TIP))).toBeCloseTo(3);
  // Grown about the tip, so both its radius and its centre move outwards.
  const selected = pin('a', TIP, true);
  expect(distanceToPin(point, selected)).toBe(0);
  expect(
    distanceToPin([TIP[0], TIP[1] - RISE * PIN_SELECTED_SCALE], selected),
  ).toBe(0);
});

test('a tap picks the pin it is on, not a neighbouring one', () => {
  // Two pins a pin's width apart, with the tap on the right-hand one's body.
  const left = pin('left', [TIP[0] - PIN_SIZE, TIP[1]]);
  const right = pin('right', TIP);
  expect(pickPinAtPoint(CENTRE, [left, right])).toBe('right');
  expect(pickPinAtPoint(CENTRE, [right, left])).toBe('right');
  const leftCentre: ViewPoint = [CENTRE[0] - PIN_SIZE, CENTRE[1]];
  expect(pickPinAtPoint(leftCentre, [left, right])).toBe('left');
  expect(pickPinAtPoint(leftCentre, [right, left])).toBe('left');
});

test('a tap on stacked pins picks the one drawn on top', () => {
  // Overlapping: `front` is a few points below `back`, so it draws over it.
  const back = pin('back', TIP);
  const front = pin('front', [TIP[0] + 4, TIP[1] + 4]);
  expect(pickPinAtPoint(CENTRE, [back, front])).toBe('front');
  // Unless the tap is on a part of the buried pin the front one doesn't cover.
  const clearOfFront: ViewPoint = [CENTRE[0] - RADIUS - 2, CENTRE[1]];
  expect(pickPinAtPoint(clearOfFront, [back, front])).toBe('back');
});

test('a tap between pins goes to the nearest, so it is never dropped', () => {
  const left = pin('left', [TIP[0] - 90, TIP[1]]);
  const right = pin('right', TIP);
  const between: ViewPoint = [CENTRE[0] - 30, CENTRE[1]];
  expect(pickPinAtPoint(between, [left, right])).toBe('right');
  expect(pickPinAtPoint(between, [])).toBeNull();
});

test('pins stack from north to south, so the front pin is the lower one', () => {
  expect(pinSortKey(51.5)).toBeLessThan(pinSortKey(48.85));
});

const feature = (
  elementId: string,
  lngLat: [number, number],
): GeoJSON.Feature => ({
  type: 'Feature',
  geometry: {type: 'Point', coordinates: lngLat},
  properties: {elementId, sortKey: pinSortKey(lngLat[1])},
});

test('a press on one pin takes it without projecting anything', async () => {
  const project = jest.fn();
  await expect(
    pressedPinId(
      {features: [feature('only', [13.4, 52.5])], point: [0, 0]},
      {selectedId: null, project},
    ),
  ).resolves.toBe('only');
  expect(project).not.toHaveBeenCalled();
});

test('a press with no pins picks nothing', async () => {
  await expect(
    pressedPinId(
      {features: [], point: [0, 0]},
      {selectedId: null, project: jest.fn()},
    ),
  ).resolves.toBeNull();
});

test('a press on two pins measures where they are drawn', async () => {
  // Same latitudes as the projection below: `north` draws behind `south`, and
  // the tap is on the round part of `south`.
  const north = feature('north', [13.4, 52.52]);
  const south = feature('south', [13.4, 52.5]);
  const drawnAt: Record<string, ViewPoint> = {
    // Overlapping pins, the northern one a few points higher up the screen.
    north: [100, 194],
    south: TIP,
  };
  const project = jest.fn(async (lngLat: [number, number]) =>
    lngLat[1] === 52.52 ? drawnAt.north : drawnAt.south,
  );

  await expect(
    pressedPinId(
      {features: [north, south], point: CENTRE},
      {selectedId: null, project},
    ),
  ).resolves.toBe('south');
  expect(project).toHaveBeenCalledTimes(2);

  // A tap up beside the northern pin's body, clear of the southern one.
  await expect(
    pressedPinId(
      {features: [north, south], point: [100, 194 - RISE - RADIUS + 1]},
      {selectedId: null, project},
    ),
  ).resolves.toBe('north');
});

test('a pin reported twice is still one pin', async () => {
  const twice = feature('same', [13.4, 52.5]);
  const project = jest.fn();
  await expect(
    pressedPinId(
      {features: [twice, twice], point: [0, 0]},
      {selectedId: null, project},
    ),
  ).resolves.toBe('same');
  expect(project).not.toHaveBeenCalled();
});

test('features without a pin on them are ignored', async () => {
  const nameless: GeoJSON.Feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [13.4, 52.5]},
    properties: null,
  };
  const lineFeature: GeoJSON.Feature = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [13.4, 52.5],
        [13.5, 52.6],
      ],
    },
    properties: {elementId: 'a-line'},
  };
  await expect(
    pressedPinId(
      {features: [nameless, lineFeature], point: [0, 0]},
      {selectedId: null, project: jest.fn()},
    ),
  ).resolves.toBeNull();
});
