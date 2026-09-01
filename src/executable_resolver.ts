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

import { execFile as execFileCallback, spawnSync } from "node:child_process";
import { platform } from "node:os";
import { isAbsolute, join, normalize } from "node:path";
import { promisify } from "node:util";

import { ProgressLocation, window as Window, workspace as Workspace } from "vscode";

import { Cache } from "./cache";
import { findExecutable, getTexPackageManagers, isExecutable } from "./executable";

const execFile = promisify(execFileCallback);
const INSTALL = "Install";

export class ExecutableResolver {
  static findExecutableInPath(path: string): string | undefined {
    let executable = normalize(path);
    if (isAbsolute(executable)) {
      if (!isExecutable(executable)) {
        return;
      }
    } else {
      let found = false;
      for (const workspaceFolder of Workspace.workspaceFolders ?? []) {
        executable = join(workspaceFolder.uri.fsPath, executable);
        if (isExecutable(executable)) {
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

  readonly #cache = new Cache<{ exec?: string }>();
  readonly #name: string;
  readonly #extensions: Set<string>;
  readonly #paths: Set<string>;
  #installation: Promise<string | undefined> | undefined;

  constructor(name: string, extensions: Set<string>, paths: Set<string> = new Set()) {
    this.#name = name;
    this.#extensions = extensions;
    this.#paths = paths;
  }

  findExecutable() {
    return this.resolveExecutable(this.#name);
  }

  findOrInstall(): Promise<string | undefined> {
    const executable = this.findExecutable();
    if (executable) {
      return Promise.resolve(executable);
    }
    this.#installation ??= this.install().finally(() => {
      this.#installation = undefined;
    });
    return this.#installation;
  }

  private async install(): Promise<string | undefined> {
    if ((await Window.showErrorMessage(`${this.#name} could not be found.`, INSTALL)) !== INSTALL) {
      return;
    }

    const managerExtensions = new Set(platform() === "win32" ? [".exe", ".bat", ".cmd"] : []);
    for (const [name, args] of getTexPackageManagers(this.#name)) {
      const manager = new ExecutableResolver(name, managerExtensions).findExecutable();
      if (!manager) {
        continue;
      }
      try {
        await Window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: `Installing ${this.#name}`,
          },
          () => execFile(manager, args),
        );
      } catch (error) {
        await Window.showErrorMessage(
          `Could not install ${this.#name}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return;
      }

      const executable = this.findExecutable();
      if (!executable) {
        await Window.showErrorMessage(
          `${this.#name} was installed but could not be found. Reload VS Code and try again.`,
        );
      }
      return executable;
    }

    await Window.showErrorMessage(
      `Could not install ${this.#name}: no TeX Live or MiKTeX package manager was found.`,
    );
    return;
  }

  private resolveExecutable(name: string): string | undefined {
    let exec = this.#cache.get("exec");
    if (exec && isExecutable(exec)) {
      return exec;
    }

    let which: string;
    switch (platform()) {
      case "win32":
        which = "where";
        break;
      default:
        which = "which";
        break;
    }

    for (const extension of [...this.#extensions, ""]) {
      const filename = `${name}${extension}`;
      for (const path of this.#paths) {
        exec = join(path, filename).trim();
        if (isExecutable(exec)) {
          this.#cache.set("exec", exec);
          return exec;
        }
      }
      const { status, stdout } = spawnSync(which, [filename], {
        encoding: "utf-8",
      });
      if (status === 0) {
        exec = findExecutable(stdout);
        if (exec) {
          this.#cache.set("exec", exec);
          return exec;
        }
      }
    }

    return;
  }
}
