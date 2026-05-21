import type {CodegenConfig} from '@graphql-codegen/cli';

// Schema is not committed (public repo — don't leak full introspection).
// Pass a path or URL as the last arg to `bun run codegen`:
//   bun run codegen ./schema.graphql
//   bun run codegen http://localhost:4000/api/graphql
const schema = process.argv.find(
  (a, i) => i > 1 && !a.startsWith('-') && process.argv[i - 1] !== '--config',
);
if (!schema) {
  throw new Error('Usage: bun run codegen <path-or-url-to-schema>');
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
