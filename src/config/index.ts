// Environment configuration. `__DEV__` is true in Metro/debug builds and
// false in release builds, so dev defaults to the host machine (via the
// Android emulator's 10.0.2.2 loopback alias) and release points at
// production.

type EnvConfig = {
  apiUrl: string;
  graphqlUrl: string;
};

const production: EnvConfig = {
  apiUrl: 'https://www.culpeos.com',
  graphqlUrl: 'https://www.culpeos.com/graphql/v1',
};

const development: EnvConfig = {
  apiUrl: 'http://10.0.2.2:4000',
  graphqlUrl: 'http://10.0.2.2:4000/graphql/v1',
};

export const config: EnvConfig = __DEV__ ? development : production;
