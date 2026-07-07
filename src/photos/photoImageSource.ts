import type {ImageURISource} from 'react-native';

// Wikimedia's User-Agent policy (https://meta.wikimedia.org/wiki/User-Agent_policy)
// rejects generic library User-Agents (e.g. the `okhttp/x.y` that React Native's
// native image loader sends on Android) with a 403, so `wikimedia`-type photos
// never render. Browsers send a full `Mozilla/...` UA, which is why the same
// photos load fine on web. Sending a descriptive UA satisfies the policy. It's
// harmless for our other photo hosts (S3/Cloudinary), so we apply it to all.
const USER_AGENT = 'Culpeos/0.0.1 (https://culpeos.com)';

// Builds an Image `source` for a photo URL with a User-Agent header attached.
//
// Must be a single-element array, not a plain `{uri, headers}` object: on
// Android, `Image`'s native-props translation (Libraries/Image/Image.android.js)
// only forwards `headers` to the native view when `source` resolves to an
// array — for a single object it drops them silently, so the request never
// carries the header and the fix above has no effect.
export function photoImageSource(uri: string): ImageURISource[] {
  return [{uri, headers: {'User-Agent': USER_AGENT}}];
}
