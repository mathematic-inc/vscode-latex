# Visual Studio Code LaTeX

LaTeX language support for Visual Studio Code.

## Features

- Formatting with column wrapping.
  - Works with remote and unsaved files as well.
  - Allows custom configurations. See [Formatter Configuration Resolution](#formatter-configuration-resolution) and [Extension Settings](#extension-settings).
- (La)TeX syntax highlighting.
- LaTeX snippets.

## Purpose

This extension is intended for users accustomed to the typical developer workflow and desire nothing more than a source code editor for (La)TeX. In particular, this extension does not seek to provide full-fledged IDE capabilities such as compilation and viewing. Users looking for these capabilities should use a proper TeX IDE or use [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).

## Requirements

- [latexindent.pl](https://github.com/cmhughes/latexindent.pl): A `perl` script for formatting LaTeX.
  - Comes with most `TeX` distributions (look for the `latexindent` package)

## Extension Settings

- `latex.columnLimit`: Sets the column limit for a given line. A column limit of `0` means that there is no column limit.
  - Default is `80`.
  - This is ignored if a configuration file is found in some parent of the file.
- `latex.formatterConfig`: Absolute path to the configuration file for the formatter. Must end in `.yaml`.
  - Default behavior is to search the directory (or parents) of the file (or the workspace) till a configuration is found. See [Formatter Configuration Resolution](#formatter-configuration-resolution).

## Formatter Configuration Resolution

> **Warning.** Since we don't parse the formatter configuration file (this creates some overhead), we don't know what options are ahead of time so we ignore all options if a formatter configuration is found. In particular, the `columnLimit` option and VS Code's tab size/"indent or spaces" options are ignored if a formatter configuration is found.

Configuration files for the formatter are resolved through this extension rather than through the formatter (the latter doesn't have a good resolution algorithm, but ours is a superset of theirs). In accordance with the resolution algorithm of the formatter, the configuration file names have the following priority:

1. localSettings.yaml
2. latexindent.yaml
3. .localSettings.yaml
4. .latexindent.yaml

If a configuration file is not found within the directory of the current file, the resolution will be as follows:

- Search the parent of the file.
- Search the parent of the ... of the parent of the file until we are at the root.

Note the workspace is also searched at some point with the above resolution.

## Known Limitations

- Formatting large files (> your RAM) is not possible because VS Code doesn't allow streaming formatting. (But why would your TeX file be that large?)
- The formatter (for some reason) only takes files ending in `.yaml`.
- For caching, if the formatter configuration is suddenly lower in priority than a new configuration (according to [Formatter Configuration Resolution](#formatter-configuration-resolution)), then the new configuration file may not be noticed. In this case, reload the window.

## Special Thanks

The syntax is provided by [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).
