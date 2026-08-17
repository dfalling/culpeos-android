// Jest 30 note: @react-native/jest-preset 0.87 still declares jest-environment-node,
// babel-jest and @jest/create-cache-key-function at ^29.7.0. Its testEnvironment
// extends whichever jest-environment-node resolves next to the preset, so a v29
// environment gets paired with jest-runtime 30 and every suite dies on
// `this._moduleMocker.clearMocksOnScope is not a function`. The `overrides` block in
// package.json forces those three to v30; remove it once RN's preset targets jest 30.
module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // @react-navigation and react-native-screens ship ESM, and
  // react-native-view-shot resolves its "react-native" entry to TypeScript
  // source; all must be transpiled, so widen the preset's default allowlist.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-(screens|view-shot))/)',
  ],
};
