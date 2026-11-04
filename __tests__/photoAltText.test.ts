import {changedAltText} from '../src/photos/photoAltText';

const photo = (id: string, description: string, type: 'S3' | 'UNSPLASH') => ({
  id,
  thumbnail: `${id}.jpg`,
  description,
  type,
});

describe('changedAltText', () => {
  test('returns only uploaded photos whose alt text changed', () => {
    const photos = [
      photo('a', 'Front door', 'S3'),
      photo('b', 'unchanged', 'S3'),
      photo('c', 'edited but from Unsplash', 'UNSPLASH'),
    ];
    const saved = {a: '', b: 'unchanged', c: 'Photo by Jane'};
    expect(changedAltText(photos, saved).map(p => p.id)).toEqual(['a']);
  });

  test('treats a photo with no saved alt text as changed', () => {
    expect(changedAltText([photo('new', 'x', 'S3')], {})).toHaveLength(1);
  });
});
