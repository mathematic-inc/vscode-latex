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

import { spawnSync } from "node:child_process";
import { platform } from "node:os";
import { isAbsolute, join, normalize } from "node:path";
import {
  type DocumentFormattingEditProvider,
  type FormattingOptions,
  Range,
  type TextDocument,
  TextEdit,
  window as Window,
} from "vscode";
import { ConfigResolver } from "./config_resolver";
import { ExecutableResolver } from "./executable_resolver";
import { getConfig } from "./utils";

const MAX_RANGE = new Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);

const DEPENDENCIES = ["YAML::Tiny", "File::HomeDir", "Unicode::GCString"];

export class LaTeXDocumentFormatter implements DocumentFormattingEditProvider {
  private static EXECUTABLE = "latexindent";
  private static CONFIG = "linter.config";
  private static CONFIG_NAMES = [
    "localSettings.yaml",
    "latexindent.yaml",
    ".localSettings.yaml",
    ".latexindent.yaml",
    /** '.localSettings', '.latexindent' */
  ];

  readonly #configResolver: ConfigResolver;
  readonly #executableResolver: ExecutableResolver;

  constructor() {
    this.#configResolver = new ConfigResolver(
      LaTeXDocumentFormatter.CONFIG,
      LaTeXDocumentFormatter.CONFIG_NAMES
    );
    const paths = new Set<string>();
    try {
      const { stdout } = spawnSync("kpsewhich", ["--var-value", "TEXMFDIST"], {
        encoding: "utf-8",
      });
      paths.add(join(normalize(stdout.trim()), "scripts", "latexindent"));
    } catch {
      // kpsewhich not available; skip adding the path
    }
    this.#executableResolver = new ExecutableResolver(
      LaTeXDocumentFormatter.EXECUTABLE,
      new Set(platform() === "win32" ? [".exe", ".pl"] : [".pl"]),
      paths
    );
  }

  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions
  ): Promise<TextEdit[]> {
    let exec = getConfig<string>("formatter.path");
    if (exec) {
      const path = ExecutableResolver.findExecutableInPath(exec);
      if (!path) {
        await Window.showErrorMessage(
          `Specified path ${exec} could not be found${
            isAbsolute(exec) ? " in any opened workspace folder" : ""
          }.`
        );
        return [];
      }
      exec = path;
    } else {
      exec = this.#executableResolver.findExecutable();
      if (!exec) {
        await Window.showErrorMessage(
          `${LaTeXDocumentFormatter.EXECUTABLE} could not be found.`
        );
        return [];
      }
    }

    const config = await this.#configResolver.findConfig(document);
    const { output, error } = this.execute(document, exec, options, config);
    if (error) {
      if (error.message.includes("Can't locate")) {
        if (
          await Window.showErrorMessage(error.message, {
            title: "Install dependencies",
          })
        ) {
          for (const dependency of DEPENDENCIES) {
            const { stdout, stderr, error, status } = spawnSync(
              "cpanm",
              [dependency],
              { encoding: "utf-8", input: "yes\n" }
            );
            const message = ((error?.message ?? stderr) || stdout).trim();
            if (status !== 0) {
              await Window.showErrorMessage(
                `Could not install ${dependency}: ${message}`
              );
              break;
            }
          }
        }
      } else {
        await Window.showErrorMessage(error.message);
      }
      return [];
    }
    if (!output) {
      return [];
    }

    return [TextEdit.replace(document.validateRange(MAX_RANGE), output)];
  }

  private execute(
    document: TextDocument,
    exec: string,
    options: FormattingOptions,
    configFilePath?: string
  ) {
    const args = ["-g", "/dev/null", "-m"];
    if (configFilePath) {
      args.push("-l", configFilePath);
    } else {
      const indentOptions = {
        defaultIndent: new Array(options.insertSpaces ? options.tabSize : 1)
          .fill(options.insertSpaces ? " " : "\t")
          .join(""),
        textWrapOptions: {
          columns: getConfig<number>("formatter.columnLimit"),
        },
      };
      args.push(
        "-y",
        `defaultIndent:'${indentOptions.defaultIndent}',` +
          `modifyLineBreaks:textWrapOptions:columns:${indentOptions.textWrapOptions.columns}`
      );
    }
    args.push("-");

    const {
      stdout: output,
      stderr,
      error,
    } = spawnSync(exec, args, {
      encoding: "utf-8",
      input: document.getText(),
      timeout: getConfig<number>("formatter.timeout"),
    });
    return { output, error: error ?? (stderr && new Error(stderr)) };
  }
}
