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
import { join, normalize } from "node:path";

import type { Operation } from "effection";
import { type FormattingOptions, type TextDocument, window } from "vscode";

import { ConfigResolver, getConfig } from "./config";
import { getErrorMessage } from "./executable";
import { ExecutableResolver } from "./executable_resolver";
import { execFile } from "./node";
import { fromThenable } from "./vscode";

const CONFIG = new ConfigResolver("formatter.config", [
  "localSettings.yaml",
  "latexindent.yaml",
  ".localSettings.yaml",
  ".latexindent.yaml",
]);
const DEPENDENCIES = ["YAML::Tiny", "File::HomeDir", "Unicode::GCString"] as const;
const INSTALL_DEPENDENCIES = "Install dependencies";

export function* findConfig(document: TextDocument): Operation<string | undefined> {
  return yield* CONFIG.findConfig(document);
}

export function* createResolver(): Operation<ExecutableResolver> {
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
    "latexindent",
    platform() === "win32" ? [".exe", ".pl"] : [".pl"],
    paths,
  );
}

export function* format(
  input: string,
  executable: string,
  cwd: string,
  options: FormattingOptions,
  config?: string,
): Operation<string> {
  const args = ["-g", devNull, "-m"];
  if (config) {
    args.push("-l", config);
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

export function* handleError(error: unknown): Operation<void> {
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
