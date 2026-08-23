# Change Log

All notable changes to the "vscode-latex" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [3.0.0](https://github.com/mathematic-inc/vscode-latex/compare/v2.0.0...v3.0.0) (2026-08-23)


### ⚠ BREAKING CHANGES

* migrate toolchain from webpack/yarn/ESLint to tsup/pnpm/Biome ([#1](https://github.com/mathematic-inc/vscode-latex/issues/1))

### Features

* Migrate toolchain from webpack/yarn/ESLint to tsup/pnpm/Biome ([#1](https://github.com/mathematic-inc/vscode-latex/issues/1)) ([d9313e0](https://github.com/mathematic-inc/vscode-latex/commit/d9313e081670a67ce1f746cb29dbf58c0e45cf04))


### Bug Fixes

* Add submodules checkout in release workflow ([#3](https://github.com/mathematic-inc/vscode-latex/issues/3)) ([83753e4](https://github.com/mathematic-inc/vscode-latex/commit/83753e458e2bd8d02a99520ff2a5c6b39b57c1e9))
* Add submodules checkout in release workflow ([#4](https://github.com/mathematic-inc/vscode-latex/issues/4)) ([93b8f99](https://github.com/mathematic-inc/vscode-latex/commit/93b8f99e6eb693c5244b09c9d1c016ea6ca69fed))
* Resolve vsix glob pattern in publish step ([#5](https://github.com/mathematic-inc/vscode-latex/issues/5)) ([7f53169](https://github.com/mathematic-inc/vscode-latex/commit/7f53169370e24ceebce05aaeff6b2db0936df56d))

## [2.0.0](https://github.com/mathematic-inc/vscode-latex/compare/v1.3.0...v2.0.0) (2026-03-11)


### ⚠ BREAKING CHANGES

* migrate toolchain from webpack/yarn/ESLint to tsup/pnpm/Biome ([#1](https://github.com/mathematic-inc/vscode-latex/issues/1))

### Features

* Migrate toolchain from webpack/yarn/ESLint to tsup/pnpm/Biome ([#1](https://github.com/mathematic-inc/vscode-latex/issues/1)) ([b36777d](https://github.com/mathematic-inc/vscode-latex/commit/b36777dbee231cddc7b43796c374d25074a89c48))

## [1.2.0]

- Fix broken `chktex` configuration.

## [1.1.0]

- Fix VS Code error messages not displaying.

## [1.0.3]

- Updates `README.md`.

## [1.0.2]

- Disables `\input` parsing.

## [1.0.1]

- Updates `README.md`.

## [1.0.0]

- Adds linting!
- Renames `formatterConfig` to `formatter.config`.
- Renames `columnLimit` to `formatter.columnLimit`.
- Allows relative `formatter.config` options.

## [0.1.0]

- Adds `formatterConfig` option.

## [0.0.3]

- Adds icon.
- New display name.

## [0.0.2]

- Adds support for untrusted workspaces.

## [0.0.1]

- Initial release.
