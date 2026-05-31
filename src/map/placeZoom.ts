// Map a Google place's `types` to a camera zoom level so that a country zooms
// out wide and a city zooms in closer. Places come back from `placeSearch` with
// REGIONS granularity, so the relevant types are country / admin areas /
// localities. First match wins; anything unrecognized gets a middle zoom.
const ZOOM_BY_TYPE: ReadonlyArray<[string, number]> = [
  ['country', 4],
  ['administrative_area_level_1', 6],
  ['administrative_area_level_2', 8],
  ['locality', 11],
  ['postal_town', 11],
];

const DEFAULT_ZOOM = 9;

export function zoomForPlaceTypes(
  types: ReadonlyArray<string> | null | undefined,
): number {
  if (!types) return DEFAULT_ZOOM;
  for (const [type, zoom] of ZOOM_BY_TYPE) {
    if (types.includes(type)) return zoom;
  }
  return DEFAULT_ZOOM;
}
