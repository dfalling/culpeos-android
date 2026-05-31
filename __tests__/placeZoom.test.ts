/**
 * @format
 */

import {zoomForPlaceTypes} from '../src/map/placeZoom';

test('countries zoom out wide', () => {
  expect(zoomForPlaceTypes(['country', 'political'])).toBe(4);
});

test('cities zoom in closer', () => {
  expect(zoomForPlaceTypes(['locality', 'political'])).toBe(11);
});

test('first matching type wins (country over locality)', () => {
  expect(zoomForPlaceTypes(['country', 'locality'])).toBe(4);
});

test('unknown and empty types fall back to the default zoom', () => {
  expect(zoomForPlaceTypes(['establishment'])).toBe(9);
  expect(zoomForPlaceTypes([])).toBe(9);
  expect(zoomForPlaceTypes(null)).toBe(9);
});
