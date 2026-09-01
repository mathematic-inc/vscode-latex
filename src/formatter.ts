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

import { dirname } from "node:path";

import type { Operation, Scope } from "effection";
import {
  type CancellationToken,
  type DocumentFormattingEditProvider,
  type FormattingOptions,
  Range,
  type TextDocument,
  TextEdit,
  window,
} from "vscode";

import { getConfig } from "./config";
import { getErrorMessage } from "./executable";
import type { ExecutableResolver } from "./executable_resolver";
import * as latexindent from "./latexindent";
import * as texFmt from "./tex_fmt";
import { fromThenable, withCancellation } from "./vscode";

type FormatterProgram = "latexindent" | "tex-fmt";

export class Formatter implements DocumentFormattingEditProvider {
  readonly #scope: Scope;
  #latexindent: ExecutableResolver | undefined;
  #texFmt: ExecutableResolver | undefined;

  constructor(scope: Scope) {
    this.#scope = scope;
  }

  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ): Thenable<TextEdit[]> {
    return this.#scope.run(() => withCancellation(token, this.#format(document, options), []));
  }

  *#format(document: TextDocument, options: FormattingOptions): Operation<TextEdit[]> {
    const program = getConfig<FormatterProgram>("formatter.program", "latexindent");
    const executableResolver = yield* this.#getExecutableResolver(program);
    const executable = yield* executableResolver.resolve(getConfig("formatter.path", ""));
    if (!executable) {
      return [];
    }

    const implementation = program === "tex-fmt" ? texFmt : latexindent;
    const config = yield* implementation.findConfig(document);
    const input = document.getText();
    let output: string;
    try {
      const cwd = dirname(document.uri.fsPath);
      output = yield* implementation.format(input, executable, cwd, options, config);
    } catch (error) {
      if (program === "latexindent") {
        yield* latexindent.handleError(error);
      } else {
        yield* fromThenable(window.showErrorMessage(getErrorMessage(error)));
      }
      return [];
    }

    if (!output || output === input) {
      return [];
    }

    return [
      TextEdit.replace(
        new Range(document.positionAt(0), document.positionAt(input.length)),
        output,
      ),
    ];
  }

  *#getExecutableResolver(program: FormatterProgram): Operation<ExecutableResolver> {
    if (program === "tex-fmt") {
      this.#texFmt ??= texFmt.createResolver();
      return this.#texFmt;
    }
    this.#latexindent ??= yield* latexindent.createResolver();
    return this.#latexindent;
  }
}
