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
import { isAbsolute, join, normalize } from "node:path";

import { type Operation, spawn, type Task, useScope } from "effection";
import { ProgressLocation, window, workspace } from "vscode";

import {
  findExecutable,
  getErrorMessage,
  getExecutableInvocation,
  getTexPackageManagers,
  isExecutable,
} from "./executable";
import { execFile } from "./node";
import { fromThenable, withCancellation } from "./vscode";

const INSTALL = "Install";

export class ExecutableResolver {
  readonly #extensions: readonly string[];
  readonly #name: string;
  readonly #paths: readonly string[];
  #executable: string | undefined;
  #installation: Task<string | undefined> | undefined;

  constructor(name: string, extensions: Iterable<string>, paths: Iterable<string> = []) {
    this.#name = name;
    this.#extensions = [...extensions];
    this.#paths = [...paths];
  }

  *resolve(configuredPath = ""): Operation<string | undefined> {
    if (!configuredPath) {
      return yield* this.#findOrInstall();
    }

    const executable = yield* ExecutableResolver.#findExecutableInPath(configuredPath);
    if (!executable) {
      yield* fromThenable(
        window.showErrorMessage(
          `Specified path ${configuredPath} could not be found${
            isAbsolute(configuredPath) ? "" : " in any opened workspace folder"
          }.`,
        ),
      );
    }
    return executable;
  }

  static *#findExecutableInPath(path: string): Operation<string | undefined> {
    let executable = normalize(path);
    if (isAbsolute(executable)) {
      if (!(yield* isExecutable(executable))) {
        return;
      }
    } else {
      let found = false;
      const relativePath = executable;
      for (const workspaceFolder of workspace.workspaceFolders ?? []) {
        executable = join(workspaceFolder.uri.fsPath, relativePath);
        if (yield* isExecutable(executable)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return;
      }
    }
    return executable;
  }

  *#findOrInstall(): Operation<string | undefined> {
    const executable = yield* this.#resolveExecutable();
    if (executable) {
      return executable;
    }

    const installation =
      this.#installation ?? (this.#installation = yield* spawn(() => this.#install()));
    try {
      return yield* installation;
    } finally {
      if (this.#installation === installation) {
        this.#installation = undefined;
      }
    }
  }

  *#install(): Operation<string | undefined> {
    if (
      (yield* fromThenable(
        window.showErrorMessage(`${this.#name} could not be found.`, INSTALL),
      )) !== INSTALL
    ) {
      return;
    }

    const scope = yield* useScope();
    const managerExtensions = platform() === "win32" ? [".exe", ".bat", ".cmd"] : [];
    for (const [name, args] of getTexPackageManagers(this.#name)) {
      const manager = yield* new ExecutableResolver(name, managerExtensions).#resolveExecutable();
      if (!manager) {
        continue;
      }
      const [command, commandArgs] = getExecutableInvocation(manager, args);
      try {
        const result = yield* fromThenable(
          window.withProgress(
            {
              cancellable: true,
              location: ProgressLocation.Notification,
              title: `Installing ${this.#name}`,
            },
            (_progress, token) =>
              scope.run(() => withCancellation(token, execFile(command, commandArgs), undefined)),
          ),
        );
        if (!result) {
          return;
        }
      } catch (error) {
        yield* fromThenable(
          window.showErrorMessage(`Could not install ${this.#name}: ${getErrorMessage(error)}`),
        );
        return;
      }

      const executable = yield* this.#resolveExecutable();
      if (!executable) {
        yield* fromThenable(
          window.showErrorMessage(
            `${this.#name} was installed but could not be found. Reload VS Code and try again.`,
          ),
        );
      }
      return executable;
    }

    yield* fromThenable(
      window.showErrorMessage(
        `Could not install ${this.#name}: no TeX Live or MiKTeX package manager was found.`,
      ),
    );
    return;
  }

  *#resolveExecutable(): Operation<string | undefined> {
    if (this.#executable && (yield* isExecutable(this.#executable))) {
      return this.#executable;
    }

    const which = platform() === "win32" ? "where" : "which";

    for (const extension of [...this.#extensions, ""]) {
      const filename = `${this.#name}${extension}`;
      for (const path of this.#paths) {
        const executable = join(path, filename).trim();
        if (yield* isExecutable(executable)) {
          this.#executable = executable;
          return executable;
        }
      }
      try {
        const { stdout } = yield* execFile(which, [filename]);
        const executable = yield* findExecutable(stdout);
        if (executable) {
          this.#executable = executable;
          return executable;
        }
      } catch {
        // Try the next extension.
      }
    }

    return;
  }
}
