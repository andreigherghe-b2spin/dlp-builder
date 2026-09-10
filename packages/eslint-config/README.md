# @ui/eslint-config

Shared ESLint 9 flat-config presets for this monorepo. Private, not published.

| Export                | Use for                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| `./base`              | plain JS/TS, no type info (scripts, config files)                                    |
| `./base-type-checked` | type-aware TS (factory: `(tsconfigRootDir, project?)`)                               |
| `./react`             | React library packages (factory, extends `base-type-checked`)                        |
| `./native`            | React Native library packages (factory, extends `react` + `eslint-config-expo/flat`) |
| `./expo-app`          | Expo apps, non type-aware (extends `base` + `eslint-config-expo/flat`)               |
| `./storybook`         | Storybook (web) apps, non type-aware (extends `base` + `eslint-plugin-storybook`)    |

Factory presets take `import.meta.dirname` so `parserOptions.projectService` resolves relative to the consuming package, not this package.
