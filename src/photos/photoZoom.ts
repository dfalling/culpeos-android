/**
 * Geometry for the full-screen photo viewer's pinch/pan gestures.
 *
 * Kept as pure functions (no Animated, no React) so the transform math is
 * testable on its own and {@link PhotoViewer} only has to wire gestures to it.
 *
 * Coordinate system: the image is laid out centered in the container at its
 * `contain`-fitted size, then transformed as `translate(x, y) scale(scale)` —
 * i.e. translation is applied in unscaled container pixels, measured from the
 * container's center, and is *not* multiplied by the scale. Screen position of
 * an image-space point `p` (also measured from the image's center) is therefore
 *
 *   screen = containerCenter + {x, y} + p * scale
 */

export type Size = {width: number; height: number};

/** A photo's on-screen transform: uniform zoom plus a centered offset. */
export type Transform = {scale: number; x: number; y: number};

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

/** Zoom applied by a double tap, when not already zoomed in. */
export const DOUBLE_TAP_SCALE = 2.5;

export const IDENTITY: Transform = {scale: MIN_SCALE, x: 0, y: 0};

/** Movement (px) a one-finger drag must exceed before it counts as a gesture. */
export const DRAG_SLOP = 6;

/** Drag distance (px) past which releasing dismisses the viewer. */
const DISMISS_DISTANCE = 110;

/** Drag speed (px/ms) past which releasing dismisses, even if short. */
const DISMISS_VELOCITY = 0.7;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** The size a `contain`-fitted image renders at inside `container`. */
export function fitContain(image: Size, container: Size): Size {
  if (
    image.width <= 0 ||
    image.height <= 0 ||
    container.width <= 0 ||
    container.height <= 0
  ) {
    return {width: 0, height: 0};
  }
  const ratio = Math.min(
    container.width / image.width,
    container.height / image.height,
  );
  return {width: image.width * ratio, height: image.height * ratio};
}

export function clampScale(scale: number): number {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

/**
 * Pull a transform back so the zoomed image can't be dragged away from the
 * container edges. `fitted` is the image's size at scale 1. When the scaled
 * image is smaller than the container on an axis it is pinned to the center,
 * which is what snaps a photo back after a pinch out to 1x.
 */
export function clampTranslate(
  transform: Transform,
  fitted: Size,
  container: Size,
): Transform {
  const maxX = Math.max(
    0,
    (fitted.width * transform.scale - container.width) / 2,
  );
  const maxY = Math.max(
    0,
    (fitted.height * transform.scale - container.height) / 2,
  );
  // `|| 0` only normalizes the -0 that clamping against a zero bound yields.
  return {
    scale: transform.scale,
    x: clamp(transform.x, -maxX, maxX) || 0,
    y: clamp(transform.y, -maxY, maxY) || 0,
  };
}

/**
 * Rescale to `nextScale` while keeping whatever image point sits under `focus`
 * pinned there, so a pinch zooms around the fingers (and a double tap around
 * the tapped point) instead of around the image's center. `focus` is in
 * container coordinates, origin at its top-left.
 */
export function zoomAroundFocus(
  from: Transform,
  nextScale: number,
  focus: {x: number; y: number},
  container: Size,
): Transform {
  const scale = clampScale(nextScale);
  if (from.scale <= 0) return {scale, x: from.x, y: from.y};
  const focusX = focus.x - container.width / 2;
  const focusY = focus.y - container.height / 2;
  const ratio = scale / from.scale;
  return {
    scale,
    x: focusX - (focusX - from.x) * ratio,
    y: focusY - (focusY - from.y) * ratio,
  };
}

/** Distance between two active touches, for pinch tracking. */
export function touchDistance(
  a: {pageX: number; pageY: number},
  b: {pageX: number; pageY: number},
): number {
  return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
}

/** Midpoint of two active touches — the focal point of a pinch. */
export function touchMidpoint(
  a: {pageX: number; pageY: number},
  b: {pageX: number; pageY: number},
): {x: number; y: number} {
  return {x: (a.pageX + b.pageX) / 2, y: (a.pageY + b.pageY) / 2};
}

/**
 * Whether releasing a swipe-away drag should close the viewer: either it moved
 * far enough, or it was a deliberate flick in any direction.
 */
export function shouldDismiss(gesture: {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
}): boolean {
  const distance = Math.hypot(gesture.dx, gesture.dy);
  const velocity = Math.hypot(gesture.vx, gesture.vy);
  return (
    distance > DISMISS_DISTANCE ||
    (distance > DRAG_SLOP * 4 && velocity > DISMISS_VELOCITY)
  );
}

/**
 * Viewer opacity part-way through a swipe-away drag, so the photo visibly
 * lifts off the screen as it's dragged. Floors above 0 to keep it draggable
 * back to fully opaque.
 */
export function dismissOpacity(dx: number, dy: number): number {
  const distance = Math.hypot(dx, dy);
  return clamp(1 - distance / (DISMISS_DISTANCE * 2), 0.35, 1);
}
