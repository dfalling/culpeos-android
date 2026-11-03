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
  toggleLabel,
} from '../src/map/elementFilters';
import {activeFilterPills} from '../src/map/filterPills';

const TRIP = {id: 't1', name: 'Lisbon', icon: '🇵🇹'};

const ALL_ON: ElementFilters = {
  search: '  tapas ',
  labels: ['food', 'bar'],
  trip: TRIP,
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
  });
});

test('a whitespace-only search is no filter', () => {
  const filters = {...EMPTY_FILTERS, search: '   '};
  expect(filterVariables(filters)).toEqual({});
  expect(activeFilterCount(filters)).toBe(0);
});

test('the trip is not a variable; it picks the query mode', () => {
  expect(filterVariables({...EMPTY_FILTERS, trip: TRIP})).toEqual({});
});

test('each label counts as its own filter', () => {
  expect(activeFilterCount(ALL_ON)).toBe(7);
});

test('the filter key ignores label order and search padding', () => {
  expect(filterKey({...ALL_ON, labels: ['bar', 'food'], search: 'tapas'})).toBe(
    filterKey(ALL_ON),
  );
});

test('the filter key changes with every filter', () => {
  const base = filterKey(EMPTY_FILTERS);
  const variants: ElementFilters[] = [
    {...EMPTY_FILTERS, search: 'x'},
    {...EMPTY_FILTERS, labels: ['x']},
    {...EMPTY_FILTERS, trip: TRIP},
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
    'trip',
    'search',
    'label:food',
    'label:bar',
    'scheduled',
    'completed',
    'deleted',
  ]);
  expect(pills[0]).toMatchObject({icon: '🇵🇹', title: 'Lisbon'});
  expect(pills[1].title).toBe('tapas');

  for (const pill of pills) pill.onClear();
  const cleared = onChange.mock.calls.map(([f]) => f as ElementFilters);
  expect(cleared[0]).toEqual({...ALL_ON, trip: null});
  expect(cleared[1]).toEqual({...ALL_ON, search: ''});
  expect(cleared[2]).toEqual({...ALL_ON, labels: ['bar']});
  expect(cleared[3]).toEqual({...ALL_ON, labels: ['food']});
  expect(cleared[4]).toEqual({...ALL_ON, scheduled: 'all'});
  expect(cleared[5]).toEqual({...ALL_ON, completed: 'all'});
  expect(cleared[6]).toEqual({...ALL_ON, deleted: false});
  for (const f of cleared) expect(activeFilterCount(f)).toBe(6);
});

test('no filters, no pills', () => {
  expect(activeFilterPills(EMPTY_FILTERS, jest.fn())).toEqual([]);
});
