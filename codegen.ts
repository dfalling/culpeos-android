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
        // NOTE: @graphql-codegen/typescript-react-apollo has no Apollo Client
        // v4 support (latest is 4.x, still v3-oriented). After regenerating,
        // the output needs manual fixups to compile against @apollo/client v4:
        //   - `import * as Apollo from '@apollo/client'` -> '@apollo/client/react'
        //   - `Apollo.MutationFunction` -> `Apollo.useMutation.MutationFunction`
        //   - `Apollo.BaseMutationOptions` -> `Apollo.MutationHookOptions`
        //   - the generated *SuspenseQuery hooks need a "ts-ignore" directive (unused here)
        // Longer term, migrate to @graphql-codegen/client-preset.
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
