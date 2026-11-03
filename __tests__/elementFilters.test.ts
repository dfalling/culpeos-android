/**
 * @format
 */

import {
  activeFilterCount,
  type ElementFilters,
  EMPTY_FILTERS,
  filterKey,
  filterVariables,
  labelOptions,
  setNotInTrip,
  toggleLabel,
  toggleTrip,
} from '../src/map/elementFilters';
import {activeFilterPills} from '../src/map/filterPills';

const TRIP = {id: 't1', name: 'Lisbon', icon: '🇵🇹'};
const TRIP2 = {id: 't2', name: 'Porto', icon: ''};

const ALL_ON: ElementFilters = {
  search: '  tapas ',
  labels: ['food', 'bar'],
  trips: [TRIP, TRIP2],
  notInTrip: false,
  shared: 'no',
  scheduled: 'no',
  completed: 'yes',
  deleted: true,
};

test('no filters adds no query variables', () => {
  expect(filterVariables(EMPTY_FILTERS)).toEqual({});
  expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
});

test('every active filter maps to its query variable', () => {
  expect(filterVariables(ALL_ON)).toEqual({
    search: 'tapas',
    labels: ['food', 'bar'],
    labelsMatch: 'ALL',
    hasSchedule: false,
    completed: true,
    deleted: true,
    shared: false,
  });
});

test('"not in a trip" maps to inTrip: false', () => {
  expect(filterVariables({...EMPTY_FILTERS, notInTrip: true})).toEqual({
    inTrip: false,
  });
  expect(activeFilterCount({...EMPTY_FILTERS, notInTrip: true})).toBe(1);
});

test('picked trips override "not in a trip"', () => {
  const filters = {...EMPTY_FILTERS, trips: [TRIP], notInTrip: true};
  expect(filterVariables(filters)).toEqual({});
  expect(activeFilterCount(filters)).toBe(1);
  expect(filterKey(filters)).toBe(filterKey({...filters, notInTrip: false}));
});

test('a whitespace-only search is no filter', () => {
  const filters = {...EMPTY_FILTERS, search: '   '};
  expect(filterVariables(filters)).toEqual({});
  expect(activeFilterCount(filters)).toBe(0);
});

test('trips are not a variable; they pick the query mode', () => {
  expect(filterVariables({...EMPTY_FILTERS, trips: [TRIP]})).toEqual({});
});

test('each label and each trip counts as its own filter', () => {
  expect(activeFilterCount(ALL_ON)).toBe(9);
});

test('the filter key ignores label and trip order and search padding', () => {
  expect(
    filterKey({
      ...ALL_ON,
      labels: ['bar', 'food'],
      trips: [TRIP2, TRIP],
      search: 'tapas',
    }),
  ).toBe(filterKey(ALL_ON));
});

test('the filter key changes with every filter', () => {
  const base = filterKey(EMPTY_FILTERS);
  const variants: ElementFilters[] = [
    {...EMPTY_FILTERS, search: 'x'},
    {...EMPTY_FILTERS, labels: ['x']},
    {...EMPTY_FILTERS, trips: [TRIP]},
    {...EMPTY_FILTERS, trips: [TRIP, TRIP2]},
    {...EMPTY_FILTERS, notInTrip: true},
    {...EMPTY_FILTERS, shared: 'yes'},
    {...EMPTY_FILTERS, shared: 'no'},
    {...EMPTY_FILTERS, scheduled: 'yes'},
    {...EMPTY_FILTERS, scheduled: 'no'},
    {...EMPTY_FILTERS, completed: 'yes'},
    {...EMPTY_FILTERS, completed: 'no'},
    {...EMPTY_FILTERS, deleted: true},
  ];
  const keys = variants.map(filterKey);
  expect(keys).not.toContain(base);
  expect(new Set(keys).size).toBe(keys.length);
});

test('toggleLabel adds and removes', () => {
  const on = toggleLabel(EMPTY_FILTERS, 'food');
  expect(on.labels).toEqual(['food']);
  expect(toggleLabel(on, 'food').labels).toEqual([]);
});

test('picking a trip turns off "not in a trip"; unpicking leaves it', () => {
  const loose = {...EMPTY_FILTERS, notInTrip: true};
  const picked = toggleTrip(loose, TRIP);
  expect(picked).toEqual({...EMPTY_FILTERS, trips: [TRIP], notInTrip: false});
  expect(toggleTrip(toggleTrip(picked, TRIP2), TRIP).trips).toEqual([TRIP2]);
});

test('"not in a trip" clears the picked trips', () => {
  const picked = {...EMPTY_FILTERS, trips: [TRIP, TRIP2]};
  expect(setNotInTrip(picked, true)).toEqual({
    ...EMPTY_FILTERS,
    notInTrip: true,
  });
  expect(setNotInTrip(picked, false)).toEqual(picked);
});

test('label options include selected labels and sort case-insensitively', () => {
  expect(labelOptions(['beach', 'Art', 'cafe'], ['zoo', 'cafe'])).toEqual([
    'Art',
    'beach',
    'cafe',
    'zoo',
  ]);
});

test('one pill per active filter, each clearing only itself', () => {
  const onChange = jest.fn();
  const pills = activeFilterPills(ALL_ON, onChange);
  expect(pills.map(p => p.key)).toEqual([
    'trip:t1',
    'trip:t2',
    'shared',
    'search',
    'label:food',
    'label:bar',
    'scheduled',
    'completed',
    'deleted',
  ]);
  expect(pills[0]).toMatchObject({icon: '🇵🇹', title: 'Lisbon'});
  // A trip without an emoji falls back to the generic trip glyph.
  expect(pills[1]).toMatchObject({icon: '🗺️', title: 'Porto'});
  expect(pills[2].title).toBe('Private');
  expect(pills[3].title).toBe('tapas');

  for (const pill of pills) pill.onClear();
  const cleared = onChange.mock.calls.map(([f]) => f as ElementFilters);
  expect(cleared).toEqual([
    {...ALL_ON, trips: [TRIP2]},
    {...ALL_ON, trips: [TRIP]},
    {...ALL_ON, shared: 'all'},
    {...ALL_ON, search: ''},
    {...ALL_ON, labels: ['bar']},
    {...ALL_ON, labels: ['food']},
    {...ALL_ON, scheduled: 'all'},
    {...ALL_ON, completed: 'all'},
    {...ALL_ON, deleted: false},
  ]);
  for (const f of cleared) expect(activeFilterCount(f)).toBe(8);
});

test('"not in a trip" gets a pill that clears it', () => {
  const onChange = jest.fn();
  const filters = {...EMPTY_FILTERS, notInTrip: true};
  const [pill] = activeFilterPills(filters, onChange);
  expect(pill).toMatchObject({key: 'notInTrip', title: 'Not in a trip'});
  pill.onClear();
  expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
});

test('no filters, no pills', () => {
  expect(activeFilterPills(EMPTY_FILTERS, jest.fn())).toEqual([]);
});
