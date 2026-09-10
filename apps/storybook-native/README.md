# storybook-native

On-device Storybook for the React Native components in `packages/uikit-native`. Runs only as a **development build** (Expo Dev Client) — it will not work in Expo Go, because it relies on native modules that aren't bundled into the Expo Go binary (AsyncStorage 3.x, Reanimated on the new architecture, bottom-sheet, SVG, etc.).

## Requirements

- Node.js, npm
- iOS: Xcode + CocoaPods (`sudo gem install cocoapods` or via Homebrew)
- Android: Android Studio with `ANDROID_HOME` configured

## First run

```bash
npm install
npm run ios       # or: npm run android
```

`expo run:ios` will automatically run `prebuild` (generating the `ios/` folder), install Pods, compile the native app, install the dev client on the simulator, and start Metro.

## Subsequent runs

If the app is already installed on the simulator, you only need Metro:

```bash
npm run start
```

The `--dev-client` flag is already set in the script, so Metro will wait for a dev-client connection instead of Expo Go.

## When to rebuild the native app

Re-run `npm run ios` / `npm run android` whenever you:

- change native dependencies (add/remove/upgrade an RN module in `package.json`);
- change `app.json` or any config plugin settings (`plugins`, `ios`, `android`);
- suspect the `ios/` or `android/` folders are stale — in that case run `npm run prebuild:clean` first, then `npm run ios`.

If you only changed JS/TS/CSS, `npm run start` is enough.

## Scripts

| Script                       | What it does                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run ios`                | `expo run:ios` — prebuild (if needed) + native build + install on simulator + Metro               |
| `npm run android`            | same, for Android                                                                                 |
| `npm run start`              | `expo start --dev-client` — Metro only, for a simulator that already has the dev client installed |
| `npm run prebuild`           | `expo prebuild` — regenerate `ios/` and `android/`                                                |
| `npm run prebuild:clean`     | same, but with `--clean` (wipe and recreate from scratch)                                         |
| `npm run storybook-generate` | manually regenerate `storybook.requires.ts` (normally done automatically by `withStorybook`)      |
