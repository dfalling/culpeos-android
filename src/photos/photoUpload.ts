import {useApolloClient} from '@apollo/client/react';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import {useCallback, useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  type CreatePhotoMutation,
  CreateUploadUrlDocument,
  type CreateUploadUrlQuery,
  type CreateUploadUrlQueryVariables,
  PhotoType,
  useCreatePhotoMutation,
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

/**
 * Open the system photo library and return the chosen image, or null if the
 * user backed out. Throws on a genuine picker error.
 */
async function pickPhoto(): Promise<PickedImage | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    // Full quality — we do our own downsampling so the output is predictable
    // and always JPEG, regardless of the source format (HEIC, PNG, …).
    quality: 1,
  });

  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(
      result.errorMessage ?? `Could not open photos (${result.errorCode}).`,
    );
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) return null;
  return {uri: asset.uri};
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
 * Drives the three-step photo flow: pick + downsample on-device, request a
 * signed URL, upload the bytes, then register the S3 photo. Returns the
 * created Photo, or null if the user cancelled the picker. The caller is
 * responsible for attaching the returned id to an element's photoIds.
 */
export function usePhotoUploader(): {
  pickAndUpload: () => Promise<UploadedPhoto | null>;
  uploading: boolean;
} {
  const client = useApolloClient();
  const [createPhoto] = useCreatePhotoMutation();
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = useCallback(async () => {
    const picked = await pickPhoto();
    if (!picked) return null;

    setUploading(true);
    try {
      const uri = await downsampleToLimit(picked);

      // Step 1: signed upload URL. no-cache so each upload gets a fresh URL.
      const {data: urlData} = await client.query<
        CreateUploadUrlQuery,
        CreateUploadUrlQueryVariables
      >({query: CreateUploadUrlDocument, fetchPolicy: 'no-cache'});
      if (!urlData) throw new Error('Failed to get a photo upload URL');
      const {url, key} = urlData.createUploadUrl;

      // Step 2: upload the bytes to S3.
      await putToSignedUrl(url, uri);

      // Step 3: register the uploaded object as a Photo.
      const {data: photoData} = await createPhoto({
        variables: {input: {type: PhotoType.S3, storageKey: key}},
      });
      const photo = photoData?.createPhoto;
      if (!photo) throw new Error('Photo could not be created.');
      return photo;
    } finally {
      setUploading(false);
    }
  }, [client, createPhoto]);

  return {pickAndUpload, uploading};
}
