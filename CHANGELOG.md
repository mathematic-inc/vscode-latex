# Change Log

All notable changes to the "vscode-latex" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.1.0](https://github.com/mathematic-inc/vscode-latex/compare/v2.0.2...v2.1.0) (2026-09-01)


### Features

* Add tex-fmt formatter support ([#29](https://github.com/mathematic-inc/vscode-latex/issues/29)) ([3d343a1](https://github.com/mathematic-inc/vscode-latex/commit/3d343a1041036bd075aba77761e547d0aa972814))
* Install missing TeX tools on demand ([#26](https://github.com/mathematic-inc/vscode-latex/issues/26)) ([f705fa4](https://github.com/mathematic-inc/vscode-latex/commit/f705fa4d08f0a9c26c30781b200e0cafbebe9f1d))


### Bug Fixes

* Recognize weave chunks in nested LaTeX scopes ([#24](https://github.com/mathematic-inc/vscode-latex/issues/24)) ([d766a9d](https://github.com/mathematic-inc/vscode-latex/commit/d766a9d1c042b4021678c990e671f540fd527472))

## [2.0.2](https://github.com/mathematic-inc/vscode-latex/compare/v2.0.1...v2.0.2) (2026-08-30)


### Bug Fixes

* Handle multiline executable locator output ([#21](https://github.com/mathematic-inc/vscode-latex/issues/21)) ([662de87](https://github.com/mathematic-inc/vscode-latex/commit/662de87e70c99ee891c5e3c2c294ad6d312b5b69))

## [2.0.1](https://github.com/mathematic-inc/vscode-latex/compare/v2.0.0...v2.0.1) (2026-08-27)


### Bug Fixes

* Repair extension publication ([0948e0b](https://github.com/mathematic-inc/vscode-latex/commit/0948e0be377d50c4cc626d1080608e2710b5db03))

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
