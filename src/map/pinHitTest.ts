/**
 * Which map pin a tap landed on.
 *
 * Pins are symbols in the map style, and MapLibre reports a press on their layer
 * by handing us every feature rendered within a 44pt box around the touch
 * (`MLRNMapView.onMapClick`, `MLRNPressableSource.DEFAULT_HITBOX`). That box is
 * deliberately bigger than a pin, and a pin's queryable area is its whole image
 * — shadow padding included — so a tap near two pins routinely comes back with
 * both, in an order MapLibre doesn't define. Taking the first feature therefore
 * gives the tap to an arbitrary one of them: often a neighbour a pin's width
 * away, or one buried under the pin actually being aimed at.
 *
 * So the candidates get measured here instead, against where the pins are really
 * drawn: the one whose outline the touch is inside wins, and where two overlap,
 * the one drawn on top. Pins the touch only came *near* stay eligible — it has
 * to land somewhere — so an isolated pin is as forgiving to hit as it ever was;
 * it just can't beat a pin the touch is actually on.
 *
 * Coordinates are in points with y downwards: the space shared by a press
 * event's `point` and `MapRef.project()`. A pin's position is its tip — the
 * coordinate it marks — since that is what the symbol layer anchors.
 */

import {PIN_DIAGONAL, PIN_SELECTED_SCALE, PIN_SIZE} from './PinIcon';

/** A point in view coordinates: `[x, y]`, as MapLibre reports and projects. */
export type ViewPoint = readonly [x: number, y: number];

/** A pin to measure a tap against: where its tip is drawn, and how big it is. */
export type PinTarget = {
  id: string;
  /** The pin's tip, in view points. */
  point: ViewPoint;
  /** Selected pins are drawn larger, so they cover more ground. */
  selected?: boolean;
};

/** Radius of the pin's round part. */
const BODY_RADIUS = PIN_SIZE / 2;

/**
 * How far the round part's centre sits above the tip — the distance from the
 * square's centre to the corner that became the tip.
 */
const BODY_RISE = PIN_DIAGONAL / 2;

/**
 * Distance in points from `tap` to a pin's drawn outline; 0 anywhere inside it.
 *
 * The pin is a square with three corners rounded by half its side, rotated so
 * the fourth points down, which makes it exactly the convex hull of a circle and
 * that point: all three arcs share the square's centre (the rounding radius is
 * also the distance from there to each side), and the two sides meeting at the
 * tip are tangents to that circle. Inside the pin is therefore inside the round
 * part, or inside the wedge those two tangents cut off down to the tip.
 */
export function distanceToPin(tap: ViewPoint, pin: PinTarget): number {
  const scale = pin.selected ? PIN_SELECTED_SCALE : 1;
  const radius = BODY_RADIUS * scale;
  const rise = BODY_RISE * scale;
  // Measured from the round part's centre: along the pin's axis towards the tip,
  // and across it — unsigned, since the pin is symmetrical about that axis.
  const along = tap[1] - (pin.point[1] - rise);
  const across = Math.abs(tap[0] - pin.point[0]);

  const fromCentre = Math.hypot(along, across);
  if (fromCentre <= radius) return 0;

  // Where a side leaves the round part, touching it: this far along the axis and
  // that far across it. For these proportions that lands at 45°.
  const tangentAlong = (radius * radius) / rise;
  const tangentAcross = Math.sqrt(
    radius * radius - tangentAlong * tangentAlong,
  );

  // Below that the pin tapers along a straight side to nothing at the tip.
  if (along > tangentAlong && along < rise) {
    const halfWidth = (tangentAcross * (rise - along)) / (rise - tangentAlong);
    if (across <= halfWidth) return 0;
  }

  // Outside, then, and the nearest part of the outline is the round part or the
  // side. Which one is decided by the line from the centre through the touching
  // point, which — the side being a tangent — is where the side's own end is.
  if (across * tangentAlong >= along * tangentAcross)
    return fromCentre - radius;
  return distanceToSide(along, across, tangentAlong, tangentAcross, rise);
}

/**
 * Distance from an outside point to the pin's side: the straight run from where
 * it leaves the round part down to the tip, in the same along/across
 * coordinates. Points past the tip end up measured against the tip itself.
 */
function distanceToSide(
  along: number,
  across: number,
  tangentAlong: number,
  tangentAcross: number,
  rise: number,
): number {
  const runAlong = rise - tangentAlong;
  const runAcross = -tangentAcross;
  const runLength = runAlong * runAlong + runAcross * runAcross;
  const fraction =
    ((along - tangentAlong) * runAlong + (across - tangentAcross) * runAcross) /
    runLength;
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.hypot(
    along - (tangentAlong + clamped * runAlong),
    across - (tangentAcross + clamped * runAcross),
  );
}

/**
 * The pin `tap` belongs to, or null if there were no candidates at all.
 *
 * `pins` is ordered back-to-front, as they are drawn, so that when a touch is
 * inside more than one pin the one on top takes it; otherwise the nearest pin
 * does.
 */
export function pickPinAtPoint(
  tap: ViewPoint,
  pins: readonly PinTarget[],
): string | null {
  let pickedId: string | null = null;
  let pickedDistance = Number.POSITIVE_INFINITY;
  for (const pin of pins) {
    const distance = distanceToPin(tap, pin);
    // Ties go to the later pin, which is the one drawn over the others — the
    // only one of them the tap could have been aimed at.
    if (distance <= pickedDistance) {
      pickedId = pin.id;
      pickedDistance = distance;
    }
  }
  return pickedId;
}

/**
 * Sort key that stacks a pin at `latitude`, for the symbol layer's
 * `symbol-sort-key` and for ordering tap candidates the same way.
 *
 * Symbols with a higher key draw later, so southern pins overlap the ones behind
 * (north of) them, the way pins stack on any map. Latitude rather than screen
 * position because a sort key can't depend on the camera: rotate the map far
 * enough and the stacking reads upside down, but it stays *defined*, which is
 * what lets a tap prefer the pin you can actually see.
 */
export function pinSortKey(latitude: number): number {
  return -latitude;
}

/**
 * Sort key for the selected pin, which grows and so is drawn above every other
 * pin rather than in latitude order (the web app gets this from `z-index` on
 * `.marker-highlighted`). Clear of any {@link pinSortKey}, whose keys are
 * latitudes.
 */
export const SELECTED_PIN_SORT_KEY = 1000;

/** The pin press candidates from a layer press, ordered back-to-front. */
function pinCandidates(
  features: readonly GeoJSON.Feature[],
  selectedId: string | null,
): {id: string; lngLat: [number, number]; selected: boolean}[] {
  const byId = new Map<
    string,
    {id: string; lngLat: [number, number]; selected: boolean; sortKey: number}
  >();
  for (const feature of features) {
    const id = feature.properties?.elementId;
    // A pin split across two tiles can be reported twice; it's one pin.
    if (typeof id !== 'string' || byId.has(id)) continue;
    if (feature.geometry?.type !== 'Point') continue;
    const [longitude, latitude] = feature.geometry.coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') continue;
    const selected = id === selectedId;
    byId.set(id, {
      id,
      lngLat: [longitude, latitude],
      selected,
      sortKey: selected ? SELECTED_PIN_SORT_KEY : pinSortKey(latitude),
    });
  }
  return Array.from(byId.values()).sort((a, b) => a.sortKey - b.sortKey);
}

/**
 * The pin a layer press belongs to, or null if the press carried no pin at all.
 *
 * `project` places each candidate on screen, so the measuring happens against
 * the pins as drawn under the current camera. A press with a single candidate
 * skips that round trip: with nothing to choose between, MapLibre's generous
 * hitbox is doing no harm.
 */
export async function pressedPinId(
  press: {features: readonly GeoJSON.Feature[]; point: ViewPoint},
  options: {
    selectedId: string | null;
    project: (lngLat: [number, number]) => Promise<ViewPoint>;
  },
): Promise<string | null> {
  const candidates = pinCandidates(press.features, options.selectedId);
  if (candidates.length <= 1) return candidates[0]?.id ?? null;

  // Projecting them together keeps every pin measured against the same frame,
  // and resolves in candidate order.
  const points = await Promise.all(
    candidates.map(candidate => options.project(candidate.lngLat)),
  );
  return pickPinAtPoint(
    press.point,
    candidates.map((candidate, index) => ({
      id: candidate.id,
      point: points[index],
      selected: candidate.selected,
    })),
  );
}
