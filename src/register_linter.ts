/*
 * Copyright 2021 Mathematic Inc
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

import { type Operation, sleep, suspend, type Task, useScope } from "effection";
import {
  type Diagnostic,
  Disposable,
  type DocumentSelector,
  languages,
  type TextDocument,
  window,
  workspace,
} from "vscode";

import { getConfig } from "./config";
import { getErrorMessage } from "./executable";
import { fromThenable } from "./vscode";

export function* registerLinter(
  selector: DocumentSelector,
  provideDiagnostics: (document: TextDocument) => Operation<readonly Diagnostic[]>,
): Operation<void> {
  const diagnosticCollection = languages.createDiagnosticCollection("latex");
  const scope = yield* useScope();
  let lint: Task<void> | undefined;

  const cancelPendingLint = () => {
    if (lint) {
      void lint.halt();
      lint = undefined;
    }
  };

  const scheduleLint = (document: TextDocument, delay: number) => {
    cancelPendingLint();
    if (!getConfig("linter.enabled", true)) {
      diagnosticCollection.clear();
      return;
    }
    if (!languages.match(selector, document)) {
      return;
    }

    lint = scope.run(function* () {
      try {
        yield* sleep(delay);
        const diagnostics = yield* provideDiagnostics(document);
        if (!document.isClosed) {
          diagnosticCollection.set(document.uri, diagnostics);
        }
      } catch (error) {
        yield* fromThenable(window.showErrorMessage(getErrorMessage(error)));
      }
    });
  };

  const lintActiveEditor = (delay: number) => {
    const editor = window.activeTextEditor;
    if (editor) {
      scheduleLint(editor.document, delay);
    } else {
      cancelPendingLint();
    }
  };

  const disposable = Disposable.from(
    diagnosticCollection,
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        scheduleLint(editor.document, 0);
      } else {
        cancelPendingLint();
      }
    }),
    workspace.onDidChangeTextDocument(({ contentChanges, document }) => {
      if (
        contentChanges.length > 0 &&
        window.activeTextEditor?.document.uri.toString() === document.uri.toString()
      ) {
        scheduleLint(document, getConfig("linter.delay", 1000));
      }
    }),
    workspace.onDidCloseTextDocument((document) => {
      diagnosticCollection.delete(document.uri);
    }),
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("latex.linter")) {
        if (getConfig("linter.enabled", true)) {
          lintActiveEditor(0);
        } else {
          cancelPendingLint();
          diagnosticCollection.clear();
        }
      }
    }),
  );

  lintActiveEditor(0);
  try {
    yield* suspend();
  } finally {
    cancelPendingLint();
    disposable.dispose();
  }
}
