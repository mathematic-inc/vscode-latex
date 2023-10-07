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
import { existsSync } from "fs";
import { platform } from "os";
import { join } from "path";
import { Cache } from "./cache";

export class ExecutableResolver {
  #cache = new Cache<{ exec?: string }>();

  constructor(
    private readonly name: string,
    private readonly extensions: Set<string>,
    private readonly paths: Set<string> = new Set()
  ) {}

  public findExecutable() {
    return this.resolveExecutable(this.name);
  }

  private resolveExecutable(name: string): string | undefined {
    let exec = this.#cache.get("exec");
    if (exec && existsSync(exec)) {
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

    for (const extension of ["", ...this.extensions]) {
      const filename = `${name}${extension}`;
      for (const path of this.paths) {
        exec = join(path, filename).trim();
        if (existsSync(exec)) {
          this.#cache.set("exec", exec);
          return exec;
        }
      }
      const { status, stdout } = spawnSync(which, [filename], {
        encoding: "utf-8",
      });
      if (status === 0) {
        exec = stdout.trim();
        if (exec) {
          this.#cache.set("exec", exec);
          return exec;
        }
      }
    }

    return;
  }
}
