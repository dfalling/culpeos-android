import type {CodegenConfig} from '@graphql-codegen/cli';

// Schema is not committed (public repo). Pass a local SDL path as the last arg:
//   bun run codegen ./schema.graphql
const schema = process.argv.find(
  (a, i) => i > 1 && !a.startsWith('-') && process.argv[i - 1] !== '--config',
);
if (!schema) {
  throw new Error('Usage: bun run codegen <path-to-schema.graphql>');
}

const config: CodegenConfig = {
  overwrite: true,
  schema,
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
