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

import { devNull, platform } from "node:os";
import { dirname, join, normalize } from "node:path";

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

import { ConfigResolver, getConfig } from "./config";
import { getErrorMessage } from "./executable";
import { ExecutableResolver } from "./executable_resolver";
import { execFile } from "./node";
import { fromThenable, withCancellation } from "./vscode";

const CONFIG_NAMES = [
  "localSettings.yaml",
  "latexindent.yaml",
  ".localSettings.yaml",
  ".latexindent.yaml",
];
const DEPENDENCIES = ["YAML::Tiny", "File::HomeDir", "Unicode::GCString"] as const;
const EXECUTABLE = "latexindent";
const INSTALL_DEPENDENCIES = "Install dependencies";

export class Formatter implements DocumentFormattingEditProvider {
  readonly #configResolver = new ConfigResolver("formatter.config", CONFIG_NAMES);
  readonly #scope: Scope;
  #executableResolver: ExecutableResolver | undefined;

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
    const executableResolver = yield* this.#getExecutableResolver();
    const executable = yield* executableResolver.resolve(getConfig("formatter.path", ""));
    if (!executable) {
      return [];
    }

    const config = yield* this.#configResolver.findConfig(document);
    const input = document.getText();
    let output: string;
    try {
      output = yield* this.#execute(
        input,
        executable,
        dirname(document.uri.fsPath),
        options,
        config,
      );
    } catch (error) {
      yield* this.#handleError(error);
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

  *#execute(
    input: string,
    executable: string,
    cwd: string,
    options: FormattingOptions,
    configFilePath?: string,
  ): Operation<string> {
    const args = ["-g", devNull, "-m"];
    if (configFilePath) {
      args.push("-l", configFilePath);
    } else {
      const defaultIndent = options.insertSpaces ? " ".repeat(options.tabSize) : "\t";
      args.push(
        "-y",
        `defaultIndent:'${defaultIndent}',` +
          `modifyLineBreaks:textWrapOptions:columns:${getConfig("formatter.columnLimit", 80)}`,
      );
    }
    args.push("-");

    const { stdout } = yield* execFile(executable, args, {
      cwd,
      input,
      timeout: getConfig("formatter.timeout", 10_000),
    });
    return stdout;
  }

  *#handleError(error: unknown): Operation<void> {
    const message = getErrorMessage(error);
    if (
      message.includes("Can't locate") &&
      (yield* fromThenable(window.showErrorMessage(message, INSTALL_DEPENDENCIES))) ===
        INSTALL_DEPENDENCIES
    ) {
      for (const dependency of DEPENDENCIES) {
        try {
          yield* execFile("cpanm", [dependency], { input: "yes\n" });
        } catch (dependencyError) {
          yield* fromThenable(
            window.showErrorMessage(
              `Could not install ${dependency}: ${getErrorMessage(dependencyError)}`,
            ),
          );
          return;
        }
      }
      return;
    }
    yield* fromThenable(window.showErrorMessage(message));
  }

  *#getExecutableResolver(): Operation<ExecutableResolver> {
    this.#executableResolver ??= yield* createExecutableResolver();
    return this.#executableResolver;
  }
}

function* createExecutableResolver(): Operation<ExecutableResolver> {
  const paths: string[] = [];
  try {
    const { stdout } = yield* execFile("kpsewhich", ["--var-value", "TEXMFDIST"], {
      timeout: 5000,
    });
    const texmfDistribution = stdout.trim();
    if (texmfDistribution) {
      paths.push(join(normalize(texmfDistribution), "scripts", "latexindent"));
    }
  } catch {
    // kpsewhich is optional; PATH lookup still runs.
  }
  return new ExecutableResolver(
    EXECUTABLE,
    platform() === "win32" ? [".exe", ".pl"] : [".pl"],
    paths,
  );
}
