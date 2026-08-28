/**
 * @format
 */

import {mapUrl} from '../src/map/mapLink';

test('a location with nothing to point at gets no link', () => {
  expect(mapUrl(null)).toBeNull();
  expect(mapUrl(undefined)).toBeNull();
  expect(mapUrl({})).toBeNull();
  expect(mapUrl({address: '   '})).toBeNull();
});

test('coordinates drop a pin labelled with the address', () => {
  expect(
    mapUrl({address: 'Plaça de Catalunya', latitude: 41.3874, longitude: 2.17}),
  ).toBe('geo:41.3874,2.17?q=41.3874%2C2.17(Pla%C3%A7a%20de%20Catalunya)');
});

test('coordinates alone still point somewhere', () => {
  expect(mapUrl({latitude: 41.3874, longitude: 2.17})).toBe(
    'geo:41.3874,2.17?q=41.3874%2C2.17',
  );
});

test('an address without coordinates is left for the map app to geocode', () => {
  expect(mapUrl({address: '10 Downing St, London'})).toBe(
    'geo:0,0?q=10%20Downing%20St%2C%20London',
  );
});

test('half a coordinate pair is no coordinate pair', () => {
  expect(mapUrl({address: 'Somewhere', latitude: 41.3874})).toBe(
    'geo:0,0?q=Somewhere',
  );
  expect(
    mapUrl({address: 'Somewhere', latitude: Number.NaN, longitude: 2.17}),
  ).toBe('geo:0,0?q=Somewhere');
});

test('a null island location is a real place, not a missing one', () => {
  expect(mapUrl({latitude: 0, longitude: 0})).toBe('geo:0,0?q=0%2C0');
});
