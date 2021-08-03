/*
 * Copyright 2021 Mathematic, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Disposable, DocumentSelector, languages as Languages, TextDocument, window as Window, workspace as Workspace} from 'vscode';
import {DocumentLintingProvider} from './types';
import {getConfig} from './utils';

export function registerDocumentLintingProvider(
    selector: DocumentSelector, linters: readonly DocumentLintingProvider[]) {
  const runLinters = async (document: TextDocument) => {
    const diagnostics = [];
    for (const linter of linters) {
      diagnostics.push(
          ...await linter.provideDocumentLintingDiagnostics(document));
    }
    diagnosticCollection.set(document.uri, diagnostics);
  };

  let debounceTimer: NodeJS.Timeout|undefined;
  const runLintersWithDebounce = (document: TextDocument, force?: boolean) => {
    if (!getConfig('linter.enabled')) return;
    if (!Languages.match(selector, document)) return;
    if (force) return runLinters(document);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer =
        setTimeout(() => runLinters(document), getConfig('linter.delay'));
  };

  let activeEditor = Window.activeTextEditor;
  if (activeEditor) {
    runLintersWithDebounce(activeEditor.document, true);
  }

  const disposables: Disposable[] = [];

  const diagnosticCollection = Languages.createDiagnosticCollection('latex');
  disposables.push(diagnosticCollection);

  Window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor && Languages.match(selector, editor.document)) {
      if (debounceTimer) clearTimeout(debounceTimer);
      runLintersWithDebounce(editor.document);
    }
  }, undefined, disposables);

  Workspace.onDidChangeTextDocument(({document}) => {
    if (activeEditor && document === activeEditor.document) {
      runLintersWithDebounce(document);
    }
  }, undefined, disposables);

  return {
    dispose() {
      disposables.forEach((d) => d.dispose());
    }
  };
}
