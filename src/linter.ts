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

import { platform } from "node:os";
import { dirname } from "node:path";

import type { Operation } from "effection";
import { Diagnostic, DiagnosticSeverity, Position, Range, type TextDocument, window } from "vscode";

import { getChkTexDiagnosticOutput, parseChkTexOutputLine } from "./chktex";
import { ConfigResolver, getConfig } from "./config";
import { getErrorMessage } from "./executable";
import { ExecutableResolver } from "./executable_resolver";
import { execFile } from "./node";
import { fromThenable } from "./vscode";

const DIAGNOSTIC_SEVERITY = new Map([
  ["Error", DiagnosticSeverity.Error],
  ["Warning", DiagnosticSeverity.Warning],
  ["Message", DiagnosticSeverity.Information],
]);
const EXECUTABLE = "chktex";

export class Linter {
  readonly #configResolver = new ConfigResolver("linter.config", [".chktexrc", "chktexrc"]);
  readonly #executableResolver = new ExecutableResolver(
    EXECUTABLE,
    platform() === "win32" ? [".exe"] : [],
  );

  *lint(document: TextDocument): Operation<readonly Diagnostic[]> {
    const executable = yield* this.#executableResolver.resolve(getConfig("linter.path", ""));
    if (!executable) {
      return [];
    }

    const config = yield* this.#configResolver.findConfig(document);
    let output: string;
    try {
      output = yield* this.#execute(
        document.getText(),
        executable,
        dirname(document.uri.fsPath),
        config,
      );
    } catch (error) {
      const diagnosticOutput = getChkTexDiagnosticOutput(error);
      if (!diagnosticOutput) {
        yield* fromThenable(window.showErrorMessage(getErrorMessage(error)));
        return [];
      }
      output = diagnosticOutput;
    }
    if (!output) {
      return [];
    }

    return this.#parseLintOutput(document, output);
  }

  *#execute(input: string, executable: string, cwd: string, config?: string): Operation<string> {
    const args: string[] = [];

    if (config) {
      args.push("-l", config);
    }

    args.push("-f", "%k:%n:%l:%c:%d:%m\n", "-q", "-I");

    const { stdout } = yield* execFile(executable, args, {
      cwd,
      input,
      timeout: getConfig("linter.timeout", 10_000),
    });
    return stdout;
  }

  #parseLintOutput(document: TextDocument, output: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    for (const line of output.trim().split(/\r?\n/v)) {
      const lintEntry = parseChkTexOutputLine(line);
      if (!lintEntry) {
        continue;
      }

      const start = new Position(lintEntry.line - 1, lintEntry.column - 1);
      const end = document.positionAt(document.offsetAt(start) + lintEntry.length);
      const diagnostic = new Diagnostic(
        new Range(start, end),
        lintEntry.message,
        DIAGNOSTIC_SEVERITY.get(lintEntry.severity) ?? DiagnosticSeverity.Warning,
      );
      diagnostic.code = lintEntry.code;
      diagnostic.source = EXECUTABLE;
      diagnostics.push(diagnostic);
    }
    return diagnostics;
  }
}
