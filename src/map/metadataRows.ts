// Turn an element's parsed booking metadata (flight numbers, reservation codes,
// seats) into labelled rows, ready to render.
//
// This mirrors the web app's presentation so the same booking reads the same on
// both: the same row order, the same titles, and the same two judgement calls —
// `type` never gets a row of its own (it titles the number instead), and the
// raw `address` only appears when geocoding failed, since a geocoded one is
// already shown as the element's location.

import {type Strings, t} from '../i18n';

export type FormattableMetadata = {
  type?: string | null;
  number?: string | null;
  reservation?: string | null;
  seat?: string | null;
  paymentDetails?: string | null;
  address?: string | null;
  departureLocation?: string | null;
  arrivalLocation?: string | null;
};

export type MetadataRow = {
  /** Stable key for lists — the metadata field this row came from. */
  key: string;
  title: string;
  value: string;
  /** Somewhere to look the value up, when that's useful. */
  link: string | null;
};

// Fields we know how to present, in the order they read best.
const FIELDS = [
  'number',
  'departureLocation',
  'arrivalLocation',
  'reservation',
  'seat',
  'paymentDetails',
  'address',
] as const satisfies readonly (keyof FormattableMetadata)[];

// What a `number` is called depends on how you're travelling. Anything else
// (car, other, absent) keeps the generic title.
const NUMBER_TITLES = ['flight', 'train', 'bus', 'ferry'] as const;

export function metadataRows(
  metadata: FormattableMetadata | null | undefined,
  {hasLocation}: {hasLocation: boolean} = {hasLocation: false},
  strings: Strings['booking'] = t.booking,
): MetadataRow[] {
  if (!metadata) return [];

  const rows: MetadataRow[] = [];
  for (const field of FIELDS) {
    const value = metadata[field]?.trim();
    if (!value) continue;
    if (field === 'address' && hasLocation) continue;
    rows.push({
      key: field,
      title:
        field === 'number'
          ? numberTitle(metadata.type, strings)
          : strings[field],
      value,
      link:
        field === 'number'
          ? flightStatusLink(metadata.type, value, strings)
          : null,
    });
  }
  return rows;
}

function numberTitle(
  type: string | null | undefined,
  strings: Strings['booking'],
): string {
  const kind = NUMBER_TITLES.find(title => title === type?.toLowerCase());
  return kind ? strings[kind] : strings.number;
}

// A flight number is only worth tapping if it leads somewhere. Parsed numbers
// range from codes ("IB3216") to a spelled-out airline and number ("American
// Airlines 291"), so a status search handles both where a tracker URL wouldn't.
function flightStatusLink(
  type: string | null | undefined,
  value: string,
  strings: Strings['booking'],
): string | null {
  if (type?.toLowerCase() !== 'flight') return null;
  const query = encodeURIComponent(strings.flightStatusQuery(value));
  return `https://www.google.com/search?q=${query}`;
}
