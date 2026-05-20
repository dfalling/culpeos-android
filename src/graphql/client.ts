import {ApolloClient, HttpLink, InMemoryCache} from '@apollo/client';

// Phoenix GraphQL endpoint. Override at runtime once the backend is reachable;
// kept as a constant for now so the wiring is in place.
const GRAPHQL_URI = 'http://localhost:4000/api/graphql';

export const apolloClient = new ApolloClient({
  link: new HttpLink({uri: GRAPHQL_URI}),
  cache: new InMemoryCache(),
});
