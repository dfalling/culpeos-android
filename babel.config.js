module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // graphql v17 ships .mjs using `export * as Kind from ...` (export-namespace-from).
  // The RN preset doesn't transform this, so release bundling fails without it.
  // Debug builds serve JS from Metro and skip bundling, so CI never hit this.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
