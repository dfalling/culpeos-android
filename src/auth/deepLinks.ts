import {makeVar, useReactiveVar} from '@apollo/client';
import {useEffect} from 'react';
import {Linking} from 'react-native';

// App Links from confirmation / password-reset emails. Android opens these
// in our app once /.well-known/assetlinks.json on the server lists our APK
// signing fingerprint. The matching intent filters live in AndroidManifest.xml.
//
// We capture the parsed token into a reactive var; the UI that actually
// consumes it (confirm screen, reset-password screen) doesn't exist yet,
// but this ensures the token survives across navigation once those screens
// are added.

export type PendingDeepLink =
  | {kind: 'confirm'; token: string}
  | {kind: 'reset_password'; token: string};

const pendingDeepLinkVar = makeVar<PendingDeepLink | null>(null);

const CONFIRM_RE = /\/users\/confirm\/([^/?#]+)/;
const RESET_RE = /\/users\/reset_password\/([^/?#]+)/;

function parseDeepLink(url: string): PendingDeepLink | null {
  const confirm = CONFIRM_RE.exec(url);
  if (confirm) return {kind: 'confirm', token: decodeURIComponent(confirm[1])};
  const reset = RESET_RE.exec(url);
  if (reset)
    return {kind: 'reset_password', token: decodeURIComponent(reset[1])};
  return null;
}

export function consumePendingDeepLink(): PendingDeepLink | null {
  const current = pendingDeepLinkVar();
  if (current) pendingDeepLinkVar(null);
  return current;
}

export function usePendingDeepLink(): PendingDeepLink | null {
  return useReactiveVar(pendingDeepLinkVar);
}

/**
 * Mount once at the root of the app. Captures both the cold-start URL and
 * any warm URLs delivered while the app is running.
 */
export function useDeepLinkListener(): void {
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (!url) return;
      const parsed = parseDeepLink(url);
      if (parsed) pendingDeepLinkVar(parsed);
    });

    const sub = Linking.addEventListener('url', ({url}) => {
      const parsed = parseDeepLink(url);
      if (parsed) pendingDeepLinkVar(parsed);
    });

    return () => sub.remove();
  }, []);
}
