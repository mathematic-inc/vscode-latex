# Visual Studio Code LaTeX

LaTeX language support for Visual Studio Code.

> *IMPORTANT UPDATE* Please update to a version >= 1.2.0. This update is mandatory to use the linter.

## Features

- (La)TeX syntax highlighting.
- Formatting with column wrapping.
- Linting.
- LaTeX snippets.

Both linting and formatting work with remote and unsaved files. They can also be customized with their respective proprietary configurations. See [Configuration Files](#configuration-files) and [Extension Settings](#extension-settings).

## Purpose

This extension is intended for users accustomed to the typical developer workflow and desire nothing more than a source code editor for (La)TeX. In particular, this extension does not seek to provide full-fledged IDE capabilities such as compilation and viewing. Users looking for these capabilities should use a proper TeX IDE or use [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).

## Requirements

- [latexindent.pl](https://github.com/cmhughes/latexindent.pl): A `perl` script for formatting LaTeX.
- [ChkTeX](https://www.nongnu.org/chktex/): A LaTeX semantic checker; i.e. linter.

Both come with most `TeX` distributions (look for the `latexindent` and `chktex` package)

## Extension Settings

### Linter

- `latex.linter.enabled`: Enables the linter.
  - Default is `true`.
- `latex.linter.delay`: Duration (in ms) to delay linting during contiguous typing.
  - Default is `1000`.
- `latex.linter.config`: Absolute (or relative; see [Resolution Algorithm](#resolution-algorithm)) path to the configuration file for the linter.
  - Default behavior is to search the directory (or parents) of the file (or the workspace) till a configuration is found. See [Resolution Algorithm](#resolution-algorithm).

### Formatter

- `latex.formatter.columnLimit`: Sets the column limit for a given line. A column limit of `0` means that there is no column limit.
  - Default is `80`.
  - This is ignored if a configuration file is found in some parent of the file.
- `latex.formatter.config`: Absolute (or relative; see [Resolution Algorithm](#resolution-algorithm)) path to the configuration file for the formatter. Must end in `.yaml`.
  - Default behavior is to search the directory (or parents) of the file (or the workspace) till a configuration is found. See [Resolution Algorithm](#resolution-algorithm).

## Configuration Files

> **Warning.** Since we don't parse configuration files, we don't know what options exist ahead of time so we ignore all options if a configuration is found for a particular function. In particular, if a formatter configuration is found, the `formatter.columnLimit` option and VS Code's tab size/"indent or spaces" options are ignored.

Configuration files are resolved through this extension rather than through the formatter/linter. The resolution algorithm is a superset of theirs.

### Configuration File Names

#### Formatter

In accordance with the resolution algorithm of the formatter, the configuration file names have the following priority:

1. `localSettings.yaml`
2. `latexindent.yaml`
3. `.localSettings.yaml`
4. `.latexindent.yaml`

#### Linter

In accordance with the resolution algorithm of the linter, the configuration file names have the following priority:

1. `.chktexrc`
2. `chktexrc`

### Configuration Format

#### Formatter

The formatter configuration file is written in YAML. See [their documentation](https://ctan.mirrors.hoobly.com/support/latexindent/documentation/latexindent.pdf) for options.

#### Linter

The linter configuration file is written in their proprietary format. See [this example](https://github.com/sharelatex/chktex/blob/master/chktexrc) for inspiration.

> **Warning**. If `-v` is specified in the `CmdLine` option of the linter configuration, the linter will break since `-v` overrides the extension's custom `-f` formatting for lint messages.

### Resolution Algorithm

If a configuration file is not found within the directory of the current file, the resolution algorithm is as follows (in order):

- Search the parent of the file.
- Search the parent of the ... of the parent of the file until we are at the root.

Note the workspace is also searched at some point with the above resolution.

If a **relative** configuration file is provided through `latex.*.config`, the resolution algorithm is as follows (in order):

- Resolve the relative path against the workspace directory.
- Resolve the relative path against the directory of the current file.
  - This happens if the file does not belong to any workspace.

For example, if `latex.*.config` is `test/someconfig.yaml`, then if a file `F` is opened from some workspace `W`, then the extension will use `$(dirname W)/test/someconfig.yaml` as the configuration file. If a file is opened outside of the workspace, then the extension will use `$(dirname F)/test/someconfig.yaml`.

## Known Limitations

- Formatting/linting large files (> your RAM) is not possible because VS Code doesn't have a streaming API. (But why would your TeX file be that large?)
- The formatter (for some reason) only takes files ending in `.yaml`.
- For caching, if a configuration file is suddenly lower in priority than a new configuration (according to [Configuration File Names](#configuration-file-names)), then the new configuration file may not be noticed. In this case, reload the window.
- If `-v` is specified in the `CmdLine` option of the linter configuration, the linter will break since `-v` overrides the extension's custom `-f` formatting for lint messages.

## Special Thanks

The syntax is provided by [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).
