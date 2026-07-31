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
