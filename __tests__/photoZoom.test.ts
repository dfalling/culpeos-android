/**
 * @format
 */

import {
  clampScale,
  clampTranslate,
  dismissOpacity,
  fitContain,
  IDENTITY,
  MAX_SCALE,
  shouldDismiss,
  touchDistance,
  touchMidpoint,
  zoomAroundFocus,
} from '../src/photos/photoZoom';

const CONTAINER = {width: 400, height: 800};

test('a landscape photo fits to the container width', () => {
  expect(fitContain({width: 1000, height: 500}, CONTAINER)).toEqual({
    width: 400,
    height: 200,
  });
});

test('a tall photo fits to the container height', () => {
  expect(fitContain({width: 500, height: 2000}, CONTAINER)).toEqual({
    width: 200,
    height: 800,
  });
});

test('unknown sizes fit to nothing rather than dividing by zero', () => {
  expect(fitContain({width: 0, height: 0}, CONTAINER)).toEqual({
    width: 0,
    height: 0,
  });
  expect(fitContain({width: 1000, height: 500}, {width: 0, height: 0})).toEqual(
    {width: 0, height: 0},
  );
});

test('scale is clamped to the zoom range', () => {
  expect(clampScale(0.2)).toBe(1);
  expect(clampScale(2)).toBe(2);
  expect(clampScale(99)).toBe(MAX_SCALE);
});

test('a photo that fits the container is pinned to the center', () => {
  const fitted = {width: 400, height: 200};
  expect(clampTranslate({scale: 1, x: 120, y: -80}, fitted, CONTAINER)).toEqual(
    {scale: 1, x: 0, y: 0},
  );
});

test('panning is bounded by the overhang on each axis', () => {
  const fitted = {width: 400, height: 200};
  // At 3x the photo is 1200x600: 800px wider than the container, so it pans
  // 400px either way, and still shorter than it, so it can't pan vertically.
  const clamped = clampTranslate(
    {scale: 3, x: 1000, y: 1000},
    fitted,
    CONTAINER,
  );
  expect(clamped).toEqual({scale: 3, x: 400, y: 0});
  expect(clampTranslate({scale: 3, x: -50, y: 0}, fitted, CONTAINER)).toEqual({
    scale: 3,
    x: -50,
    y: 0,
  });
});

test('zooming keeps the focal point under the fingers', () => {
  const fitted = {width: 400, height: 800};
  const focus = {x: 100, y: 200};
  const zoomed = zoomAroundFocus(IDENTITY, 2, focus, CONTAINER);

  // The image point under `focus` before the zoom must still be under it after.
  const pointAt = (t: {scale: number; x: number; y: number}) => ({
    x: (focus.x - CONTAINER.width / 2 - t.x) / t.scale,
    y: (focus.y - CONTAINER.height / 2 - t.y) / t.scale,
  });
  expect(pointAt(zoomed)).toEqual(pointAt(IDENTITY));
  // Zooming around a point left of and above center pushes the photo down-right.
  expect(zoomed.x).toBeGreaterThan(0);
  expect(zoomed.y).toBeGreaterThan(0);
  // ...but not so far that the photo pulls away from the container edge.
  expect(clampTranslate(zoomed, fitted, CONTAINER)).toEqual({
    scale: 2,
    x: 100,
    y: 200,
  });
});

test('zooming past the max stops at the max', () => {
  expect(zoomAroundFocus(IDENTITY, 20, {x: 200, y: 400}, CONTAINER).scale).toBe(
    MAX_SCALE,
  );
});

test('pinch distance and midpoint come from the two touches', () => {
  const a = {pageX: 100, pageY: 200};
  const b = {pageX: 140, pageY: 230};
  expect(touchDistance(a, b)).toBe(50);
  expect(touchMidpoint(a, b)).toEqual({x: 120, y: 215});
});

test('a long drag dismisses; a short slow one does not', () => {
  expect(shouldDismiss({dx: 0, dy: 200, vx: 0, vy: 0.1})).toBe(true);
  expect(shouldDismiss({dx: -180, dy: 0, vx: -0.1, vy: 0})).toBe(true);
  expect(shouldDismiss({dx: 0, dy: 40, vx: 0, vy: 0.1})).toBe(false);
});

test('a short flick dismisses in any direction', () => {
  expect(shouldDismiss({dx: 30, dy: 30, vx: 1.4, vy: 1.4})).toBe(true);
  // Too small to be a swipe at all — a jittery tap must not close the viewer.
  expect(shouldDismiss({dx: 2, dy: 2, vx: 3, vy: 3})).toBe(false);
});

test('dragging fades the viewer but never all the way out', () => {
  expect(dismissOpacity(0, 0)).toBe(1);
  expect(dismissOpacity(0, 110)).toBeCloseTo(0.5);
  expect(dismissOpacity(0, 5000)).toBe(0.35);
});
