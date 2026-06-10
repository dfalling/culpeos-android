import {makeVar} from '@apollo/client';
import {useReactiveVar} from '@apollo/client/react';
import {useEffect} from 'react';
import {Linking} from 'react-native';

// Content shared into the app from another app's share sheet. The native side
// (MainActivity) rewrites an ACTION_SEND text payload into a
// `culpeos://share?content=<percent-encoded>` deep link, which the React Native
// Linking layer surfaces here — both as the cold-start URL and as warm `url`
// events. We capture the raw shared text into a reactive var; the navigation
// root consumes it and routes to the ImportShare screen, which hands the messy
// string to the backend's importShare mutation for parsing.

const pendingShareVar = makeVar<string | null>(null);

const SHARE_RE = /^culpeos:\/\/share\?content=(.*)$/;

function parseShareLink(url: string): string | null {
  const match = SHARE_RE.exec(url);
  if (!match) return null;
  const content = decodeURIComponent(match[1]).trim();
  return content ? content : null;
}

/** Read and clear the pending shared content (consume-once). */
export function consumePendingShare(): string | null {
  const current = pendingShareVar();
  if (current) pendingShareVar(null);
  return current;
}

export function usePendingShare(): string | null {
  return useReactiveVar(pendingShareVar);
}

/**
 * Mount once at the root of the app. Captures both the cold-start share (the
 * app was launched by the share) and warm shares (delivered while running).
 */
export function useShareListener(): void {
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (!url) return;
      const content = parseShareLink(url);
      if (content) pendingShareVar(content);
    });

    const sub = Linking.addEventListener('url', ({url}) => {
      const content = parseShareLink(url);
      if (content) pendingShareVar(content);
    });

    return () => sub.remove();
  }, []);
}
