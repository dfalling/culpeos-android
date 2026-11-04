import {movePhoto} from '../src/photos/PhotoGridEditor';

describe('movePhoto', () => {
  const photos = ['a', 'b', 'c', 'd'];

  test('moves a photo earlier', () => {
    expect(movePhoto(photos, 2, -1)).toEqual(['a', 'c', 'b', 'd']);
  });

  test('moves a photo later', () => {
    expect(movePhoto(photos, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
  });

  test('clamps at the ends and returns the same list when nothing moves', () => {
    expect(movePhoto(photos, 0, -1)).toBe(photos);
    expect(movePhoto(photos, 3, 1)).toBe(photos);
    expect(movePhoto(photos, 1, 10)).toEqual(['a', 'c', 'd', 'b']);
  });

  test('does not mutate the input', () => {
    movePhoto(photos, 0, 2);
    expect(photos).toEqual(['a', 'b', 'c', 'd']);
  });
});
