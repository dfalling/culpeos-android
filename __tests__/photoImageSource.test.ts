/**
 * @format
 */

import {photoImageSource} from '../src/photos/photoImageSource';

// Must stay an array: Image.android.js only forwards `headers` to the
// native view when `source` resolves to an array, so a plain
// `{uri, headers}` object silently drops the header on Android.
test('returns a single-element array so Android forwards the headers', () => {
  const source = photoImageSource('https://example.com/photo.jpg');
  expect(Array.isArray(source)).toBe(true);
  expect(source).toHaveLength(1);
});

test('attaches a descriptive User-Agent header to the uri', () => {
  const [source] = photoImageSource('https://example.com/photo.jpg');
  expect(source.uri).toBe('https://example.com/photo.jpg');
  expect(source.headers?.['User-Agent']).toMatch(/^Culpeos\//);
});
