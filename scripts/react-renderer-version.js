// react and react-test-renderer must exactly match the react-native-renderer
// that react-native bundles: React asserts the equality at launch and crashes
// on a mismatch. react-native only declares a loose peer range (e.g. ^19.3.0),
// so the bundled version isn't in any package metadata and Renovate can't
// resolve it. This reads it from the renderer source itself.
//
//   node scripts/react-renderer-version.js          print the bundled version
//   node scripts/react-renderer-version.js --write  pin react and
//                                                   react-test-renderer to it
//
// Renovate runs --write on every react-native update (`renovate:post-upgrade`
// in package.json, wired up in renovate.json's postUpgradeTasks), and
// __tests__/reactRendererVersion.test.js fails CI if the two ever drift.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PINNED = ['react', 'react-test-renderer'];

// Not require.resolve: react-native's "exports" map hides this deep path.
const RENDERER = path.join(
  ROOT,
  'node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-prod.js',
);

function bundledRendererVersion() {
  const source = fs.readFileSync(RENDERER, 'utf8');
  // The renderer reports itself to DevTools as `version: "19.3.0"`.
  const found = new Set(
    Array.from(source.matchAll(/\bversion: "([^"]+)"/g), m => m[1]),
  );
  if (found.size !== 1) {
    throw new Error(
      `Expected exactly one renderer version in ${RENDERER}, found: ${
        [...found].join(', ') || 'none'
      }`,
    );
  }
  return [...found][0];
}

function pinReactToRenderer() {
  const version = bundledRendererVersion();
  const file = path.join(ROOT, 'package.json');
  const before = fs.readFileSync(file, 'utf8');
  const pkg = JSON.parse(before);
  for (const name of PINNED) {
    const deps = [pkg.dependencies, pkg.devDependencies].find(
      d => d && name in d,
    );
    if (!deps) {
      throw new Error(`${name} is not a dependency in package.json`);
    }
    deps[name] = version;
  }
  const after = `${JSON.stringify(pkg, null, 2)}\n`;
  if (after !== before) {
    fs.writeFileSync(file, after);
  }
  console.log(`${PINNED.join(' and ')} pinned to ${version}`);
}

module.exports = {PINNED, bundledRendererVersion};

if (require.main === module) {
  if (process.argv.includes('--write')) {
    pinReactToRenderer();
  } else {
    console.log(bundledRendererVersion());
  }
}
