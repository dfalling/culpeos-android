// The Apollo client lives in src/auth/authClient.ts because its link chain
// is auth-aware (token attachment, proactive refresh, rotation, error
// handling). This file re-exports it so existing call sites keep working.
export {apolloClient} from '../auth/authClient';
