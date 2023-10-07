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

import { spawnSync } from "child_process";
import { platform } from "os";
import {
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
  TextDocument,
  window as Window,
  workspace as Workspace,
} from "vscode";
import { ConfigResolver } from "./config_resolver";
import { ExecutableResolver } from "./executable_resolver";
import { DocumentLintingProvider } from "./types";
import { getConfig } from "./utils";
import { isAbsolute, join, normalize } from "path";
import { existsSync } from "fs";

const enum LintMessageSeverity {
  Error = "Error",
  Warning = "Warning",
  Info = "Message",
}

const LintMessageSeverityToDiagnosticSeverity = {
  [LintMessageSeverity.Error]: DiagnosticSeverity.Error,
  [LintMessageSeverity.Warning]: DiagnosticSeverity.Warning,
  [LintMessageSeverity.Info]: DiagnosticSeverity.Information,
};

export class LaTeXDocumentLinter implements DocumentLintingProvider {
  private static EXECUTABLE = "chktex";
  private static CONFIG = "linter.config";
  private static CONFIG_NAMES = [".chktexrc", "chktexrc"];

  #configResolver: ConfigResolver;
  #executableResolver: ExecutableResolver;

  constructor() {
    this.#configResolver = new ConfigResolver(
      LaTeXDocumentLinter.CONFIG,
      LaTeXDocumentLinter.CONFIG_NAMES
    );
    this.#executableResolver = new ExecutableResolver(
      LaTeXDocumentLinter.EXECUTABLE,
      new Set(platform() === "win32" ? [".exe"] : [])
    );
  }

  public async provideDocumentLintingDiagnostics(
    document: TextDocument
  ): Promise<readonly Diagnostic[]> {
    let exec = getConfig<string>("linter.path");
    if (exec) {
      exec = normalize(exec);
      if (!isAbsolute(exec)) {
        let found = false;
        for (const workspaceFolder of Workspace.workspaceFolders ?? []) {
          exec = join(workspaceFolder.uri.fsPath, exec);
          if (existsSync(exec)) {
            found = true;
            break;
          }
        }
        if (!found) {
          await Window.showErrorMessage(
            `Specified path ${exec} could not be found in any opened workspace folder.`
          );
          return [];
        }
      } else {
        if (!existsSync(exec)) {
          await Window.showErrorMessage(
            `Specified path ${exec} could not be found.`
          );
          return [];
        }
      }
    } else {
      exec = this.#executableResolver.findExecutable();
      if (!exec) {
        await Window.showErrorMessage(
          `${LaTeXDocumentLinter.EXECUTABLE} could not be found.`
        );
        return [];
      }
    }

    const config = await this.#configResolver.findConfig(document);
    const { output, error } = this.execute(document, exec, config);
    if (error) {
      await Window.showErrorMessage(error);
      return [];
    }
    if (!output) {
      return [];
    }

    return this.parseLintOutput(document, output);
  }

  private execute(document: TextDocument, exec: string, config?: string) {
    const args = [];

    if (config) {
      args.push("-l", config);
    }

    args.push("-f", "%k:%n:%l:%c:%d:%m\n");
    args.push("-q");
    args.push("-I");

    const { stdout: output, stderr: error } = spawnSync(exec, args, {
      encoding: "utf-8",
      input: document.getText(),
      timeout: getConfig<number>("linter.timeout"),
    });
    return { output: output.trim(), error };
  }

  private parseLintOutput(
    document: TextDocument,
    output: string
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    for (const lintEntry of output.trim().split("\n")) {
      const [severity, code, line, column, length, message] = lintEntry.split(
        ":",
        6
      );
      const start = new Position(+line - 1, +column - 1);
      const end = document.positionAt(document.offsetAt(start) + +length);
      diagnostics.push(
        new Diagnostic(
          new Range(start, end),
          `[${LaTeXDocumentLinter.EXECUTABLE}] ${code}: ${message}`,
          LintMessageSeverityToDiagnosticSeverity[
            severity as LintMessageSeverity
          ]
        )
      );
    }
    return diagnostics;
  }
}
