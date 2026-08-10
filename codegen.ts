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
  documents: [
    'src/**/*.graphql',
    'src/**/*.{ts,tsx}',
    // Our own output embeds every operation as a `gql` template; without this it
    // would be read back in as a duplicate of each source document.
    '!src/graphql/__generated__/**',
  ],
  generates: {
    'src/graphql/__generated__/types.ts': {
      // Operation types plus a TypedDocumentNode per operation. Apollo Client
      // v4's own hooks infer result and variable types straight off those
      // documents — `useQuery(ElementDetailDocument, ...)` — so there are no
      // generated hooks and nothing to hand-patch after a regen.
      //
      // Deliberately NOT using typescript-react-apollo (its generated hooks are
      // Apollo v3-shaped and it peers at graphql <=16) or the `typescript`
      // plugin (typescript-operations already emits the schema types our
      // operations use; running both emits each one twice).
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        // Keep documents as readable SDL template literals rather than inlining
        // a parsed AST, so the generated file stays diffable.
        documentMode: 'graphQLTag',
        documentNodeImport: '@apollo/client#TypedDocumentNode',
        gqlImport: '@apollo/client#gql',
        // Note: these types carry no `__typename` (the plugin only emits it for
        // selections that ask for it). Apollo still adds it on the wire and
        // keys its cache off it — that's runtime behaviour, unaffected here.
        scalars: {
          // Map GraphQL scalars to TS types as you add them in the schema.
          // All three arrive over the wire as ISO8601 strings; without this the
          // plugin types them `unknown`, which no call site can use.
          Date: 'string',
          Time: 'string',
          DateTime: 'string',
        },
      },
    },
  },
};

export default config;
