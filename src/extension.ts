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

import { type ExtensionContext, languages as Languages } from "vscode";
import { LaTeXDocumentFormatter } from "./latex_document_formatter";
import { LaTeXDocumentLinter } from "./latex_document_linter";
import { registerDocumentLintingProvider } from "./register_document_linting_provider";

const LATEX_MODE = {
  scheme: "file",
  language: "latex",
};

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    Languages.registerDocumentFormattingEditProvider(
      LATEX_MODE,
      new LaTeXDocumentFormatter()
    )
  );
  context.subscriptions.push(
    registerDocumentLintingProvider(LATEX_MODE, [new LaTeXDocumentLinter()])
  );
}

export function deactivate() {
  // No cleanup needed
}
