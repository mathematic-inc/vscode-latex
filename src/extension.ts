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

import { createScope } from "effection";
import { Disposable, type ExtensionContext, languages } from "vscode";

import { Formatter } from "./formatter";
import { Linter } from "./linter";
import { registerLinter } from "./register_linter";

const LATEX = {
  scheme: "file",
  language: "latex",
};

export function activate(context: ExtensionContext) {
  const [scope, destroy] = createScope();
  const linter = new Linter();
  scope.run(() => registerLinter(LATEX, (document) => linter.lint(document)));
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(LATEX, new Formatter(scope)),
    new Disposable(() => {
      void destroy();
    }),
  );
}
