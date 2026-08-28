// Build the URL that hands an element's location to whatever map app the phone
// has. A `geo:` URI is deliberately vendor-neutral: Android resolves it through
// the system chooser, so Google Maps, Organic Maps, and anything else installed
// all get a turn, rather than us hard-coding one of them.

export type LinkableLocation = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function mapUrl(
  location: LinkableLocation | null | undefined,
): string | null {
  if (!location) return null;
  const address = location.address?.trim();
  const {latitude, longitude} = location;

  if (isCoordinate(latitude) && isCoordinate(longitude)) {
    // The coordinates ride along twice: bare in the scheme so an app that
    // ignores the query still lands in the right place, and inside `q` so the
    // ones that honour it drop a labelled pin instead of only centring there.
    const query = address
      ? `${latitude},${longitude}(${address})`
      : `${latitude},${longitude}`;
    return `geo:${latitude},${longitude}?q=${encodeURIComponent(query)}`;
  }

  // No coordinates — let the map app geocode the address itself. `0,0` is the
  // documented placeholder for a search-only geo URI.
  if (address) return `geo:0,0?q=${encodeURIComponent(address)}`;

  return null;
}

// Where to go when the phone has no app registered for `geo:` at all — a plain
// web map, which the browser can always take. Vendor-specific by necessity;
// it's the fallback, never the first choice.
export function webMapUrl(
  location: LinkableLocation | null | undefined,
): string | null {
  if (!location) return null;
  const address = location.address?.trim();
  const {latitude, longitude} = location;

  const query =
    isCoordinate(latitude) && isCoordinate(longitude)
      ? `${latitude},${longitude}`
      : address;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
