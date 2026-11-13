const {
  PINNED,
  bundledRendererVersion,
} = require('../scripts/react-renderer-version');

// A mismatch here doesn't fail any other test (Jest renders with
// react-test-renderer, not react-native's renderer), but it crashes the app at
// launch. Fix with `node scripts/react-renderer-version.js --write && bun install`.
test.each(PINNED)('%s matches the renderer bundled in react-native', name => {
  expect(require(`${name}/package.json`).version).toBe(
    bundledRendererVersion(),
  );
});
