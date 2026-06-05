import type {FetchResult, Operation} from '@apollo/client';
import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  makeVar,
  Observable,
} from '@apollo/client';
import {CombinedGraphQLErrors} from '@apollo/client/errors';
import {setContext} from '@apollo/client/link/context';
import {onError} from '@apollo/client/link/error';
import {useReactiveVar} from '@apollo/client/react';
import {config} from '../config';
import {
  type LoginMutation,
  LogoutDocument,
  type LogoutMutation,
  RenewTokenDocument,
  type RenewTokenMutation,
} from '../graphql/__generated__/types';
import {type AuthState, tokenStore} from './tokenStore';

// Error codes the server uses to communicate auth failures. See
// culpeos-auth-guide.md §5. Branch on these codes, never on message strings.
const TOKEN_REFRESH_CODES = new Set(['TOKEN_EXPIRED', 'UNAUTHENTICATED']);
const FORCE_LOGOUT_CODES = new Set([
  'TOKEN_REVOKED',
  'TOKEN_INVALID',
  'ACCOUNT_UNCONFIRMED',
]);
const SECURITY_WARNING_CODES = new Set(['TOKEN_REUSE_DETECTED']);

// UI subscribes to this to show a security toast / dialog after a reuse
// detection forces logout. Cleared once acknowledged.
const securityWarningVar = makeVar<string | null>(null);
export function useSecurityWarning(): string | null {
  return useReactiveVar(securityWarningVar);
}
export function clearSecurityWarning(): void {
  securityWarningVar(null);
}

// Single-flight: every caller awaits the same in-flight refresh.
let refreshPromise: Promise<AuthState | null> | null = null;

function authStateFromLoginToken(
  token: LoginMutation['login'] | RenewTokenMutation['renewToken'],
): AuthState {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAtMs: new Date(token.expiresAt).getTime(),
    user: token.user,
  };
}

/**
 * Single-flight refresh. Returns the new auth state, or null if the refresh
 * token was rejected (in which case the store has been cleared and the user
 * must log in again).
 */
function refreshAccessToken(): Promise<AuthState | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefresh(): Promise<AuthState | null> {
  const current = tokenStore.get();
  if (!current) return null;

  try {
    const result = await apolloClient.mutate<RenewTokenMutation>({
      mutation: RenewTokenDocument,
      variables: {input: {refreshToken: current.refreshToken}},
      // Don't read or write the cache for this housekeeping mutation.
      fetchPolicy: 'no-cache',
    });
    if (!result.data?.renewToken) {
      tokenStore.clear();
      return null;
    }
    const next = authStateFromLoginToken(result.data.renewToken);
    tokenStore.set(next);
    return next;
  } catch (err) {
    const code = extractAuthErrorCode(err);
    if (code && SECURITY_WARNING_CODES.has(code)) {
      tokenStore.clear();
      securityWarningVar(
        'We detected unusual activity on your account. Please log in again.',
      );
    } else if (
      code &&
      (FORCE_LOGOUT_CODES.has(code) || code === 'TOKEN_EXPIRED')
    ) {
      tokenStore.clear();
    } else {
      // Transient (network etc) — leave the stored tokens in place so a later
      // request can try again. The caller will surface the error.
      if (__DEV__) console.warn('[auth] renew transient error', err);
    }
    return null;
  }
}

function extractAuthErrorCode(err: unknown): string | undefined {
  // Apollo Client 4 wraps GraphQL errors thrown from an operation in a
  // CombinedGraphQLErrors instance, exposing them as an `errors` array.
  if (!CombinedGraphQLErrors.is(err)) return undefined;
  const code = err.errors[0]?.extensions?.code;
  return typeof code === 'string' ? code : undefined;
}

function isAuthHousekeepingOperation(operation: Operation): boolean {
  return (
    operation.operationName === 'RenewToken' ||
    operation.operationName === 'Login' ||
    operation.operationName === 'Logout'
  );
}

// 1. Attach Authorization header. Proactively refresh if the access token is
//    within REFRESH_LEAD_MS of expiry — skips housekeeping ops to avoid loops.
const authLink = setContext(async (request, prevContext) => {
  const headers = prevContext.headers ?? {};
  const operationName = request.operationName ?? '';
  const skip = operationName === 'RenewToken' || operationName === 'Login';

  let state = tokenStore.get();
  if (!skip && state && tokenStore.isAccessTokenExpiringSoon()) {
    await refreshAccessToken();
    state = tokenStore.get();
  }

  if (!state) return {headers};
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${state.accessToken}`,
    },
  };
});

// 2. Handle auth-related GraphQL error codes. On TOKEN_EXPIRED, refresh and
//    replay the original operation once. On TOKEN_REUSE_DETECTED / REVOKED /
//    INVALID, clear tokens (and optionally raise a security warning).
const errorLink = onError(({error, operation, forward}) => {
  if (!CombinedGraphQLErrors.is(error)) return;
  const graphQLErrors = error.errors;
  if (graphQLErrors.length === 0) return;
  const code = graphQLErrors[0]?.extensions?.code;
  if (typeof code !== 'string') return;

  if (isAuthHousekeepingOperation(operation)) {
    // Let the caller (login screen / refreshAccessToken / logout flow) see
    // the raw error. Don't loop trying to refresh a refresh.
    return;
  }

  if (SECURITY_WARNING_CODES.has(code)) {
    tokenStore.clear();
    securityWarningVar(
      'We detected unusual activity on your account. Please log in again.',
    );
    return;
  }

  if (FORCE_LOGOUT_CODES.has(code)) {
    tokenStore.clear();
    return;
  }

  if (TOKEN_REFRESH_CODES.has(code)) {
    // Refresh and replay. Returning an Observable signals onError to
    // subscribe to it instead of re-emitting the original error.
    return new Observable<FetchResult>(observer => {
      refreshAccessToken()
        .then(state => {
          if (!state) {
            // Refresh failed — surface the original error to the caller.
            observer.error(graphQLErrors[0]);
            return;
          }
          const sub = forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
          return () => sub.unsubscribe();
        })
        .catch(err => observer.error(err));
    });
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, new HttpLink({uri: config.graphqlUrl})]),
  cache: new InMemoryCache(),
});

/**
 * Best-effort server-side logout. Always clears local tokens regardless of
 * whether the server call succeeds — the user expects to be logged out.
 */
export async function logout(): Promise<void> {
  const current = tokenStore.get();
  if (current) {
    try {
      await apolloClient.mutate<LogoutMutation>({
        mutation: LogoutDocument,
        variables: {input: {refreshToken: current.refreshToken}},
        fetchPolicy: 'no-cache',
      });
    } catch (err) {
      if (__DEV__) console.warn('[auth] logout server call failed', err);
    }
  }
  tokenStore.clear();
  try {
    await apolloClient.clearStore();
  } catch {
    // ignore
  }
}

// Re-export so callers don't need to know about the link layout.
export {ApolloLink};
