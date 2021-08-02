// Copyright 2021 Mathematic, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {spawnSync} from 'child_process';
import {existsSync} from 'fs';
import {opendir} from 'fs/promises';
import {platform} from 'os';
import {dirname, join, parse} from 'path';
import {DocumentFormattingEditProvider, ExtensionContext, FormattingOptions, languages as Languages, Range, TextDocument, TextEdit, window, workspace as Workspace} from 'vscode';

const MAX_RANGE = new Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
const LATEX_MODE = {
  scheme: 'file',
  language: 'latex'
};
const POSSIBLE_CONFIG_NAMES = [
  'localSettings.yaml', 'latexindent.yaml', '.localSettings.yaml',
  '.latexindent.yaml', /** '.localSettings', '.latexindent' */
];

export function activate(context: ExtensionContext) {
  if (Workspace.isTrusted) {
    context.subscriptions.push(Languages.registerDocumentFormattingEditProvider(
        LATEX_MODE, new LaTeXDocumentFormatter()));
  }
}

export function deactivate() {}

class LaTeXDocumentFormatter implements DocumentFormattingEditProvider {
  private _cache: { configFilePath?: string } = {}

  public async provideDocumentFormattingEdits(
      document: TextDocument, options: FormattingOptions): Promise<TextEdit[]> {
    let formatterName = 'latexindent';
    let whichCmd: string;
    let fileExt: string;

    switch (platform()) {
      case 'win32':
        whichCmd = 'where';
        fileExt = '.exe';
        break;
      default:
        whichCmd = 'which';
        fileExt = '.pl';
        break;
    }

    let formatterCmd = this.findFormatter(whichCmd, formatterName, fileExt);
    if (!formatterCmd) {
      window.showErrorMessage('`latexindent` could not be found.');
      return [];
    }

    let configFilePath =
        Workspace.getConfiguration('latex').get<string>('formatterConfig');
    if (!configFilePath) {
      configFilePath = await this.findFormatterConfigPath(document);
    }

    const {formattedText, errorMsg} = await this.execFormatter(
        formatterCmd, document.getText(), options, configFilePath);
    if (errorMsg) {
      window.showErrorMessage(errorMsg);
      return [];
    }
    if (!formattedText) {
      return [];
    }

    return [TextEdit.replace(document.validateRange(MAX_RANGE), formattedText)];
  }

  private execFormatter(
      formatterCmd: string, text: string, options: FormattingOptions,
      configFilePath?: string) {
    const args = ['-g', '/dev/null', '-m'];
    if (configFilePath) {
      args.push('-l', configFilePath);
    } else {
      const indentOptions = {
        defaultIndent: Array(options.insertSpaces ? options.tabSize : 1)
                           .fill(options.insertSpaces ? ' ' : '\t')
                           .join(''),
        textWrapOptions: {
          columns:
              Workspace.getConfiguration('latex').get<number>('columnLimit'),
        },
      };
      args.push(
          '-y',
          `defaultIndent:'${indentOptions.defaultIndent}',` +
              `modifyLineBreaks:textWrapOptions:columns:${
                  indentOptions.textWrapOptions.columns}`);
    }
    args.push('-');

    const {stdout: formattedText, stderr: errorMsg} =
        spawnSync(formatterCmd, args, {encoding: 'utf-8', input: text});

    return {formattedText, errorMsg};
  }

  private async resolveFormatterConfigPath(dir: string) {
    let currDir;
    let currConfigNameIndex;
    let currConfigPath;
    for (let currParsedPath = parse(join(dir, 'not_real_file')), i = 0;
         currParsedPath.root !== currParsedPath.dir || i > 100;
         currParsedPath = parse(currParsedPath.dir), i++) {
      currDir = await opendir(currParsedPath.dir);
      for await (const dirent of currDir) {
        if (dirent.isFile()) {
          const idx = POSSIBLE_CONFIG_NAMES.indexOf(dirent.name)
          if (idx > -1 &&
              idx < (currConfigNameIndex || POSSIBLE_CONFIG_NAMES.length)) {
            currConfigNameIndex = idx;
            currConfigPath = join(currParsedPath.dir, dirent.name);
          }
        }
      }
      if (currConfigPath) break;
    }
    return currConfigPath;
  }

  private async findFormatterConfigPath(document: TextDocument) {
    if (this._cache.configFilePath) {
      if (existsSync(this._cache.configFilePath)) {
        return this._cache.configFilePath;
      }
    }
    let configFilePath =
        await this.resolveFormatterConfigPath(dirname(document.uri.fsPath));

    // Cache the config file path. We expect the config to change priority over
    // a 24 hour period.
    this._cache.configFilePath = configFilePath;
    setTimeout(() => {
      delete this._cache.configFilePath;
    }, 1000 * 60 * 60 * 24);

    return configFilePath;
  }

  private findFormatter(
      whichCmd: string, formatterName: string, fileExt: string) {
    let formatterCmd =
        spawnSync(whichCmd, [formatterName], {encoding: 'utf-8'}).stdout;
    if (formatterCmd) {
      return formatterCmd.trim();
    }
    formatterName += fileExt;
    formatterCmd =
        spawnSync(whichCmd, [formatterName], {encoding: 'utf-8'}).stdout;
    if (formatterCmd) {
      return formatterCmd.trim();
    }
  }
}
