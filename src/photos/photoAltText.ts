import {useMutation} from '@apollo/client/react';
import {useCallback} from 'react';
import {UpdateElementPhotoDocument} from '../graphql/__generated__/types';
import {type EditablePhoto, isAltTextEditable} from './PhotoGridEditor';

/** Alt text as last saved, by photo id. */
export type SavedAltText = Record<string, string>;

/** The photos whose (editable) alt text differs from what was last saved. */
export function changedAltText(
  photos: EditablePhoto[],
  saved: SavedAltText,
): EditablePhoto[] {
  return photos.filter(
    photo => isAltTextEditable(photo) && photo.description !== saved[photo.id],
  );
}

/**
 * Saves edited alt text for an element's photos. It's a mutation per photo,
 * separate from updateElement (which takes photo ids only), and the photo
 * must already be on the element — so call it after updateElement.
 *
 * Records each saved description in `saved`, so a retry after a partial
 * failure only resends what's still unsaved. Resolves true if all saved.
 */
export function useSaveElementAltText(): (
  elementId: string,
  photos: EditablePhoto[],
  saved: SavedAltText,
) => Promise<boolean> {
  const [updateElementPhoto] = useMutation(UpdateElementPhotoDocument);

  return useCallback(
    async (elementId, photos, saved) => {
      const results = await Promise.allSettled(
        changedAltText(photos, saved).map(async photo => {
          await updateElementPhoto({
            variables: {
              input: {
                elementId,
                photoId: photo.id,
                description: photo.description,
              },
            },
          });
          saved[photo.id] = photo.description;
        }),
      );
      return results.every(result => result.status === 'fulfilled');
    },
    [updateElementPhoto],
  );
}
