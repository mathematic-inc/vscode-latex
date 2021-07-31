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
import {platform} from 'os';
import {DocumentFormattingEditProvider, ExtensionContext, FormattingOptions, languages as Languages, Range, TextDocument, TextEdit, window, workspace as Workspace,} from 'vscode';

const MAX_RANGE = new Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
const LATEX_MODE = {
  scheme: 'file',
  language: 'latex'
};

export function activate(context: ExtensionContext) {
  if (Workspace.isTrusted) {
    context.subscriptions.push(Languages.registerDocumentFormattingEditProvider(
        LATEX_MODE, new LaTeXDocumentFormatter()));
  }
}

export function deactivate() {}

class LaTeXDocumentFormatter implements DocumentFormattingEditProvider {
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

    const {formattedText, errorMsg} =
        await this.execFormatter(formatterCmd, document.getText(), options);
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
      formatterCmd: string, text: string, options: FormattingOptions) {
    const indentOptions = {
      defaultIndent: Array(options.insertSpaces ? options.tabSize : 1)
                         .fill(options.insertSpaces ? ' ' : '\t')
                         .join(''),
      textWrapOptions: {
        columns: Workspace.getConfiguration('latex').get<number>('columnLimit'),
      },
    };

    const {stdout: formattedText, stderr: errorMsg} = spawnSync(
        formatterCmd,
        [
          '-m',
          '-y',
          `defaultIndent:'${indentOptions.defaultIndent}',` +
              `modifyLineBreaks:textWrapOptions:columns:${
                  indentOptions.textWrapOptions.columns}`,
          '-g',
          '/dev/null',
          '-',
        ],
        {encoding: 'utf-8', input: text});

    return {formattedText, errorMsg};
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
