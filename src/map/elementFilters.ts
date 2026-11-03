import type {ElementsQueryVariables} from '../graphql/__generated__/types';

/** A three-way filter over a boolean: either side, or no filter at all. */
export type TriState = 'all' | 'yes' | 'no';

/**
 * Everything that narrows the elements shown on the map, mirroring the web
 * filter panel's controls that the GraphQL API can express. Facets narrow each
 * other; within the label facet every label must match (ALL), so each label
 * you add narrows further.
 *
 * The map area isn't here: the map is always bounded by its viewport (or, for
 * a trip, fitted to it), so it's inherent rather than a toggle.
 */
export type ElementFilters = {
  /** Free text matched against name, description and labels. '' = none. */
  search: string;
  labels: readonly string[];
  trip: {id: string; name: string; icon: string} | null;
  /** `yes` = scheduled only, `no` = unscheduled only. */
  scheduled: TriState;
  /** `yes` = done, `no` = to do. */
  completed: TriState;
  /** Show deleted elements instead of live ones. */
  deleted: boolean;
};

export const EMPTY_FILTERS: ElementFilters = {
  search: '',
  labels: [],
  trip: null,
  scheduled: 'all',
  completed: 'all',
  deleted: false,
};

type FilterVariables = Pick<
  ElementsQueryVariables,
  'labels' | 'labelsMatch' | 'search' | 'hasSchedule' | 'completed' | 'deleted'
>;

const triStateValue = (state: TriState): boolean | undefined =>
  state === 'all' ? undefined : state === 'yes';

/**
 * Query variables for every filter except the trip, which picks the query's
 * mode (trip vs. viewport bounds) and is applied by the caller. Inactive
 * filters are omitted, so with none set the query is the plain bounds query.
 */
export function filterVariables(filters: ElementFilters): FilterVariables {
  const vars: FilterVariables = {};
  const search = filters.search.trim();
  if (search) vars.search = search;
  if (filters.labels.length > 0) {
    vars.labels = [...filters.labels];
    vars.labelsMatch = 'ALL';
  }
  const hasSchedule = triStateValue(filters.scheduled);
  if (hasSchedule !== undefined) vars.hasSchedule = hasSchedule;
  const completed = triStateValue(filters.completed);
  if (completed !== undefined) vars.completed = completed;
  if (filters.deleted) vars.deleted = true;
  return vars;
}

/**
 * A stable key for the server-side filter set. Elements accumulated across
 * viewport fetches are only valid for the filters they were fetched with, so
 * the map starts a fresh set whenever this changes.
 */
export function filterKey(filters: ElementFilters): string {
  const vars = filterVariables(filters);
  return JSON.stringify([
    filters.trip?.id ?? null,
    vars.search ?? null,
    vars.labels ? [...vars.labels].sort() : null,
    vars.hasSchedule ?? null,
    vars.completed ?? null,
    vars.deleted ?? false,
  ]);
}

/** How many filters are active, for the filter button's badge. */
export function activeFilterCount(filters: ElementFilters): number {
  return (
    (filters.search.trim() ? 1 : 0) +
    filters.labels.length +
    (filters.trip ? 1 : 0) +
    (filters.scheduled === 'all' ? 0 : 1) +
    (filters.completed === 'all' ? 0 : 1) +
    (filters.deleted ? 1 : 0)
  );
}

/** Adds `label` if absent, removes it if present. */
export function toggleLabel(
  filters: ElementFilters,
  label: string,
): ElementFilters {
  return {
    ...filters,
    labels: filters.labels.includes(label)
      ? filters.labels.filter(l => l !== label)
      : [...filters.labels, label],
  };
}

/**
 * Labels to offer in the filter sheet: every label seen on a loaded element,
 * plus any selected label (which may no longer appear on anything loaded),
 * sorted case-insensitively.
 */
export function labelOptions(
  seen: Iterable<string>,
  selected: readonly string[],
): string[] {
  return Array.from(new Set([...seen, ...selected])).sort((a, b) =>
    a.localeCompare(b, undefined, {sensitivity: 'base'}),
  );
}
