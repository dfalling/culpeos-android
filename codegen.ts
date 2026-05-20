import type {CodegenConfig} from '@graphql-codegen/cli';

// Point `schema` at your Phoenix GraphQL endpoint or a local SDL file.
// For early development we use a checked-in placeholder schema. Once the
// Phoenix API is reachable, swap this for the URL form, e.g.
//   schema: { 'http://localhost:4000/api/graphql': { headers: {} } }
const config: CodegenConfig = {
  overwrite: true,
  schema: 'schema.graphql',
  documents: ['src/**/*.graphql', 'src/**/*.{ts,tsx}'],
  generates: {
    'src/graphql/__generated__/types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        reactApolloVersion: 3,
        scalars: {
          // Map GraphQL scalars to TS types as you add them in the schema.
          // ID: 'string',
          // DateTime: 'string',
        },
      },
    },
  },
};

export default config;
