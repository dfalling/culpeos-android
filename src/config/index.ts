// Environment configuration. `__DEV__` is true in Metro/debug builds and
// false in release builds, so dev defaults to localhost and release points
// at production.

type EnvConfig = {
  apiUrl: string;
  graphqlUrl: string;
};

const production: EnvConfig = {
  apiUrl: 'https://www.culpeos.com',
  graphqlUrl: 'https://www.culpeos.com/api/graphql',
};

const development: EnvConfig = {
  apiUrl: 'http://localhost:4000',
  graphqlUrl: 'http://localhost:4000/api/graphql',
};

export const config: EnvConfig = __DEV__ ? development : production;
