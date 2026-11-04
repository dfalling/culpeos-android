import {useApolloClient, useMutation} from '@apollo/client/react';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import {useCallback, useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  CreatePhotoDocument,
  type CreatePhotoMutation,
  CreateUploadUrlDocument,
} from '../graphql/__generated__/types';

// Server-side cap. We downsample on-device so the uploaded JPEG always lands
// under this — see downsampleToLimit.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Bounds for the resize loop. We start by capping the longest edge (most
// photos clear the size budget after this alone) and, if still too big, step
// both quality and dimensions down until the encoded file fits.
const INITIAL_MAX_DIMENSION = 2048;
const MIN_MAX_DIMENSION = 640;
const INITIAL_QUALITY = 80;
const MIN_QUALITY = 40;
const MAX_RESIZE_ATTEMPTS = 6;

const UPLOAD_MIME_TYPE = 'image/jpeg';

export type UploadedPhoto = CreatePhotoMutation['createPhoto'];

type PickedImage = {uri: string};

// The server allows 10 upload URLs a minute per user, so a bigger batch would
// fail part-way through.
export const MAX_PHOTOS_PER_PICK = 10;

/**
 * Open the system photo library and return the chosen images (up to `limit`),
 * or an empty list if the user backed out. Throws on a genuine picker error.
 */
async function pickPhotos(limit: number): Promise<PickedImage[]> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    // Full quality — we do our own downsampling so the output is predictable
    // and always JPEG, regardless of the source format (HEIC, PNG, …).
    quality: 1,
  });

  if (result.didCancel) return [];
  if (result.errorCode) {
    throw new Error(
      result.errorMessage ?? `Could not open photos (${result.errorCode}).`,
    );
  }

  return (result.assets ?? []).flatMap(asset =>
    asset.uri ? [{uri: asset.uri}] : [],
  );
}

/**
 * Re-encode the image to a JPEG that fits under MAX_UPLOAD_BYTES. Normalizing
 * to JPEG also sidesteps formats the server may not accept (e.g. HEIC). We
 * scale down rather than up (onlyScaleDown), so small images keep their
 * dimensions and only pay the re-encode.
 */
async function downsampleToLimit(image: PickedImage): Promise<string> {
  let maxDimension = INITIAL_MAX_DIMENSION;
  let quality = INITIAL_QUALITY;
  let smallest: {uri: string; size: number} | null = null;

  for (let attempt = 0; attempt < MAX_RESIZE_ATTEMPTS; attempt++) {
    const resized = await ImageResizer.createResizedImage(
      image.uri,
      maxDimension,
      maxDimension,
      'JPEG',
      quality,
      0,
      undefined,
      false,
      {mode: 'contain', onlyScaleDown: true},
    );

    if (resized.size <= MAX_UPLOAD_BYTES) return resized.uri;
    if (!smallest || resized.size < smallest.size) {
      smallest = {uri: resized.uri, size: resized.size};
    }

    quality = Math.max(MIN_QUALITY, quality - 15);
    maxDimension = Math.max(MIN_MAX_DIMENSION, Math.round(maxDimension * 0.8));
  }

  // Couldn't get under the cap within our attempts; upload the smallest we
  // produced and let the server reject it if it must.
  return smallest?.uri ?? image.uri;
}

/**
 * PUT the file bytes straight to the pre-signed S3 URL. We read the local file
 * into a Blob via fetch — React Native's networking resolves file:// URIs.
 */
async function putToSignedUrl(url: string, fileUri: string): Promise<void> {
  const local = await fetch(fileUri);
  const blob = await local.blob();
  const response = await fetch(url, {
    method: 'PUT',
    headers: {'Content-Type': UPLOAD_MIME_TYPE},
    body: blob,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (HTTP ${response.status}).`);
  }
}

/**
 * Drives the photo flow: pick (up to `limit` images) and downsample on-device,
 * then for each image request a signed URL, upload the bytes, and register the
 * S3 photo. Images upload one at a time and each is handed to `onUploaded` as
 * soon as it's ready, so they appear while the rest are still going. Resolves
 * with how many failed (0 if the user cancelled the picker). The caller is
 * responsible for attaching the photo ids to an element or trip.
 */
export function usePhotoUploader(): {
  pickAndUpload: (
    limit: number,
    onUploaded: (photo: UploadedPhoto) => void,
  ) => Promise<{failed: number}>;
  uploading: boolean;
} {
  const client = useApolloClient();
  const [createPhoto] = useMutation(CreatePhotoDocument);
  const [uploading, setUploading] = useState(false);

  const uploadOne = useCallback(
    async (picked: PickedImage): Promise<UploadedPhoto> => {
      const uri = await downsampleToLimit(picked);

      // Step 1: signed upload URL. no-cache so each upload gets a fresh URL.
      const {data: urlData} = await client.query({
        query: CreateUploadUrlDocument,
        fetchPolicy: 'no-cache',
      });
      if (!urlData) throw new Error('Failed to get a photo upload URL');
      const {url, key} = urlData.createUploadUrl;

      // Step 2: upload the bytes to S3.
      await putToSignedUrl(url, uri);

      // Step 3: register the uploaded object as a Photo.
      const {data: photoData} = await createPhoto({
        variables: {input: {type: 'S3', storageKey: key}},
      });
      const photo = photoData?.createPhoto;
      if (!photo) throw new Error('Photo could not be created.');
      return photo;
    },
    [client, createPhoto],
  );

  const pickAndUpload = useCallback(
    async (limit: number, onUploaded: (photo: UploadedPhoto) => void) => {
      const picked = await pickPhotos(limit);
      if (picked.length === 0) return {failed: 0};

      setUploading(true);
      let failed = 0;
      try {
        for (const image of picked) {
          try {
            onUploaded(await uploadOne(image));
          } catch {
            failed++;
          }
        }
      } finally {
        setUploading(false);
      }
      return {failed};
    },
    [uploadOne],
  );

  return {pickAndUpload, uploading};
}
