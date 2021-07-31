# Visual Studio Code LaTeX

LaTeX language support for Visual Studio Code.

## Features

- Formatting with column wrapping.
- (La)TeX syntax highlighting.
- LaTeX snippets.

## Purpose

This extension is intended for users accustomed to the typical developer workflow and desire nothing more than a source code editor for (La)TeX. In particular, this extension does not seek to provide full-fledged IDE capabilities such as compilation and viewing. Users looking for these capabilities should use a proper TeX IDE or use [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).

## Requirements

- [latexindent.pl](https://github.com/cmhughes/latexindent.pl): A `perl` script for formatting LaTeX.
  - Comes with most `TeX` distributions (look for the `latexindent` package)

## Extension Settings

- `latex.columnLimit`: Sets the column limit for a given line. A column limit of `0` means that there is no column limit. Default is `80`.

## Coming at Some Point

- Setting the `latexindent` configuration file.

## Special Thanks

The syntax is provided by [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop).