# Culpeos (Android)

Android-only React Native app, distributed via GitHub Releases for installation through
[Obtainium](https://github.com/ImranR98/Obtainium). Targets GrapheneOS and stock Android;
intentionally avoids Google Play Services, Firebase, and Play Integrity.

Connects to an Elixir/Phoenix GraphQL API. Types and hooks are code-generated from the
schema with [`graphql-codegen`](https://the-guild.dev/graphql/codegen) + Apollo Client.

## Stack

- React Native 0.85 (bare, TypeScript, no Expo)
- Apollo Client 3 + `@apollo/client`
- `@graphql-codegen/cli` with `typescript`, `typescript-operations`, `typescript-react-apollo`
- Package manager: **bun** (lockfile: `bun.lock`). Node is still required at runtime — Metro and Gradle's react.gradle plugin invoke `node` directly.
- Linter + formatter: **biome** (`biome.json`) — single tool, replaces eslint + prettier
- Toolchain pinned via [mise](https://mise.jdx.dev) (`mise.toml`): Node 22, Bun 1.2, JDK 17 (Zulu)
- Application ID: `com.culpeos.app`
- minSdk 26 / targetSdk 36

## First-time setup on a fresh machine

These steps take you from `git clone` to a running app. Do them once per machine.

### 1. Install mise

mise pins the Node, Bun, and JDK versions this project uses. Without it, you'd be
matching versions by hand.

- **macOS**: `brew install mise`
- **Linux**: see [mise.jdx.dev/getting-started.html](https://mise.jdx.dev/getting-started.html)

Then activate it in your shell. For zsh, add to `~/.zshrc`:

```sh
eval "$(mise activate zsh)"
```

For bash, swap `zsh` → `bash` and add to `~/.bashrc`. Restart your shell.

### 2. Clone and install JS dependencies

```sh
git clone https://github.com/dfalling/culpeos-android.git
cd culpeos-android
mise trust   # one-time, approves the mise.toml in this repo
mise install # installs the pinned Node 22 + Bun 1.2 + Zulu JDK 17
bun install  # installs JS deps from bun.lock
```

mise's shell hooks set `JAVA_HOME` and put the pinned tools on `PATH` whenever you
`cd` into this directory. No `nvm use` or `jenv` required.

### 3. Install Android Studio and the SDK

Download Android Studio: [developer.android.com/studio](https://developer.android.com/studio).

Open it, then go to **Settings → Languages & Frameworks → Android SDK** (or
**Tools → SDK Manager** from the welcome screen).

**SDK Platforms** tab — check:
- **Android 16.0 ("Baklava") — API 36** (matches `compileSdk` / `targetSdk`)

**SDK Tools** tab — check:
- **Android SDK Build-Tools 36.0.0**
- **Android SDK Command-line Tools (latest)**
- **Android SDK Platform-Tools**
- **NDK (Side by side) → 27.1.12297006** (must match `ndkVersion` in `android/build.gradle`)
- **CMake** (latest)

Click **Apply** — downloads ~3–5 GB. Note the **Android SDK Location** at the top
of the SDK Manager; you'll need it in the next step.

Default locations:
- macOS: `~/Library/Android/sdk`
- Linux: `~/Android/Sdk`
- Windows: `%LOCALAPPDATA%\Android\Sdk`

### 4. Tell Gradle where the SDK lives

Create `android/local.properties` (machine-specific, gitignored):

```
sdk.dir=/Users/YOU/Library/Android/sdk
```

(Use forward slashes even on Windows.)

Optionally also export `ANDROID_HOME` so `adb` and `emulator` work from any shell:

```sh
# in ~/.zshrc or ~/.bashrc
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

### 5. Set up something to run on

**Option A — Android emulator (recommended for first run):**

In Android Studio: **Tools → Device Manager → Create Device**.

- Hardware: Pixel 7 (or similar)
- System image: **Baklava (API 36)** — pick `arm64-v8a` on Apple Silicon, `x86_64` on Intel/AMD64
- `google_apis` is fine. `google_apis_playstore` works too but pulls in Play Services we don't use.

Launch the emulator from Device Manager.

**Option B — physical device:**

1. On the phone: enable **Settings → About → Build number** (tap 7×) to unlock Developer Options.
2. In **Developer Options**, enable **USB debugging**.
3. Plug in via USB, accept the trust prompt.
4. Verify: `adb devices` should list your device.

### 6. Run the app

Two terminals, both in this folder:

```sh
# terminal 1
bun start          # Metro bundler

# terminal 2
bun run android    # build debug APK, install, launch on device/emulator
```

First Gradle build takes 3–5 min (downloads AGP, Kotlin, RN native libs).
Subsequent builds are 10–30s.

You'll see the default React Native welcome screen. The Apollo client is wired in
but no queries are firing yet.

## Day-to-day development

```sh
bun start            # Metro bundler (keep running)
bun run android      # rebuild + reinstall
bun run lint         # biome check (lint + format)
bun run lint:fix     # biome check --write (autofix)
bun run format       # biome format --write
bun run test
bunx tsc --noEmit    # typecheck
```

Reload the app on device with `R` twice (emulator) or shake (physical device).

## GraphQL codegen

Queries/mutations live alongside the code they're used in (`src/**/*.graphql`).
The schema itself is **not** committed — this is a public repo, so we don't
leak full introspection. Pass a path or URL as a positional arg:

```sh
# dump SDL locally (gitignored) and point codegen at it:
bunx get-graphql-schema http://localhost:4000/api/graphql > schema.graphql
bun run codegen ./schema.graphql

# or hit the running endpoint directly:
bun run codegen http://localhost:4000/api/graphql
```

Output: `src/graphql/__generated__/types.ts` — committed to the repo. CI
doesn't run codegen (no schema in CI), so remember to regenerate and commit
after editing a `.graphql` file.

Example of using a generated hook:

```tsx
import { usePingQuery } from './src/graphql/__generated__/types';

function Ping() {
  const { data, loading } = usePingQuery();
  if (loading) return <Text>…</Text>;
  return <Text>{data?.ping}</Text>;
}
```

## Releasing (signed APK to GitHub Releases)

The `Release APK` workflow (`.github/workflows/release.yml`) builds a signed APK on
every `v*` tag and attaches it to a GitHub Release. It also runs on `workflow_dispatch`
for test builds (uploaded as a workflow artifact only — no release created).

### One-time: generate the upload keystore

```sh
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias culpeos-upload \
  -keyalg RSA -keysize 4096 -validity 36500
```

Store this file somewhere safe (password manager, 1Password vault). **Do not commit it.**
If you ever lose it, you cannot ship updates to existing installs — every user has to
uninstall and reinstall. Back it up the same way you'd back up an SSH key.

Base64-encode it for the GitHub secret (macOS):

```sh
base64 -i release.keystore | pbcopy
```

On Linux: `base64 -w0 release.keystore | xclip -selection clipboard`.

### One-time: configure GitHub Actions secrets

In the repo on github.com: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret                        | Value                                      |
| ----------------------------- | ------------------------------------------ |
| `ANDROID_KEYSTORE_BASE64`     | base64 of `release.keystore`               |
| `ANDROID_KEYSTORE_PASSWORD`   | the keystore password                      |
| `ANDROID_KEY_ALIAS`           | `culpeos-upload`                           |
| `ANDROID_KEY_PASSWORD`        | the key password                           |

### Each release

```sh
git tag v0.1.0
git push origin v0.1.0
```

Workflow steps:
- `versionName` is taken from the tag (`v0.1.0` → `0.1.0`).
- `versionCode` is the total commit count (`git rev-list --count HEAD`), which is monotonic.
- APK is attached as `culpeos-<version>.apk` to a new GitHub Release.

### Local signed builds (optional smoke-test)

```sh
RELEASE_STORE_FILE=/path/to/release.keystore \
RELEASE_STORE_PASSWORD=... \
RELEASE_KEY_ALIAS=culpeos-upload \
RELEASE_KEY_PASSWORD=... \
RELEASE_VERSION_NAME=0.1.0 \
RELEASE_VERSION_CODE=42 \
(cd android && ./gradlew assembleRelease)
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.

If you skip those env vars, `assembleRelease` falls back to the debug keystore so the
build still completes — useful for catching native compile errors without keystore setup.

## Installing on a device via Obtainium

[Obtainium](https://github.com/ImranR98/Obtainium) tracks GitHub Releases and installs
APKs directly. On the phone:

1. Install Obtainium (from F-Droid, GitHub, or via Obtainium-installing-itself).
2. Tap **Add app**.
3. URL: `https://github.com/dfalling/culpeos-android`
4. Source: **GitHub**.
5. Obtainium picks up new `v*` releases automatically and offers updates.

On GrapheneOS: the app is built without Google Play Services and does not require
sandboxed Play Services to install or run.

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`:
- **`js` job**: `bun install` → `tsc --noEmit` → biome (lint + format) → jest.
- **`android` job**: JDK 17 + Gradle → `./gradlew assembleDebug`.

Both run in parallel.

## Repo layout

```
android/                       Native Android project (Gradle, Kotlin entrypoints)
  app/build.gradle             namespace, signing, version injection
  app/src/main/java/com/culpeos/app/   MainActivity, MainApplication
  app/debug.keystore           Committed debug keystore (used by debug builds)
src/graphql/
  client.ts                    Apollo Client setup
  queries/*.graphql            Operations
  __generated__/types.ts       Codegen output (committed)
codegen.ts                     graphql-codegen config (schema path passed as arg)
App.tsx                        Root component, wraps ApolloProvider
biome.json                     Biome lint + format config
mise.toml                      Toolchain versions (Node, Bun, JDK)
bun.lock                       JS dep lockfile
.github/workflows/ci.yml       PR + main: JS checks + assembleDebug
.github/workflows/release.yml  Tag v* → signed APK → GitHub Release
```

## Troubleshooting

**`SDK location not found`** — `android/local.properties` is missing or `sdk.dir`
points to the wrong place. See step 4 of first-time setup.

**`NDK at … did not have a source.properties file`** — wrong NDK installed. Install
exactly `27.1.12297006` via SDK Manager → SDK Tools → NDK (Side by side).

**Metro bundle fails to load on device** — `adb reverse tcp:8081 tcp:8081` should run
automatically via `bun run android`. For Wi-Fi-debugged physical devices, shake the
device → **Dev Settings → Debug server host & port for device** → `<your-computer-ip>:8081`.

**Emulator is slow** — Apple Silicon Mac with an `x86_64` image; switch to `arm64-v8a`.

**`mise: command not found` after install** — you didn't add `eval "$(mise activate zsh)"`
to `~/.zshrc`, or didn't restart your shell.

**`bun: command not found` in this directory** — `mise install` hasn't run yet, or
mise isn't activated in your shell.

**Gradle complains about Java version** — confirm `mise current` shows
`java zulu-17.50.x`. If it shows a different JDK, mise isn't active in your shell.
