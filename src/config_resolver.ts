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

import { existsSync } from "node:fs";
import { opendir } from "node:fs/promises";
import { dirname, isAbsolute, join, parse } from "node:path";
import { type TextDocument, workspace as Workspace } from "vscode";
import { Cache } from "./cache";
import { getConfig } from "./utils";

export class ConfigResolver {
  readonly #cache = new Cache<{ config?: string }>();
  readonly #configKey: string;
  readonly #possibleNames: string[];

  constructor(configKey: string, possibleNames: string[]) {
    this.#configKey = configKey;
    this.#possibleNames = possibleNames;
  }

  async findConfig(document: TextDocument) {
    const config = getConfig<string>(this.#configKey);
    if (!config) {
      return await this.resolveConfig(document);
    }
    if (!isAbsolute(config)) {
      const workspaceFolder = Workspace.getWorkspaceFolder(document.uri);
      return workspaceFolder
        ? join(workspaceFolder.uri.fsPath, config)
        : join(dirname(document.uri.fsPath), config);
    }
    return config;
  }

  private async resolveConfig(document: TextDocument) {
    let config = this.#cache.get("config");
    if (config && existsSync(config)) {
      return config;
    }

    let currDir: Awaited<ReturnType<typeof opendir>> | undefined;
    let currIndex: number | undefined;
    for (
      let currParsedPath = parse(document.uri.fsPath), i = 0;
      currParsedPath.root !== currParsedPath.dir || i > 100;
      currParsedPath = parse(currParsedPath.dir), i++
    ) {
      currDir = await opendir(currParsedPath.dir);
      for await (const dirent of currDir) {
        if (dirent.isFile()) {
          const idx = this.#possibleNames.indexOf(dirent.name);
          if (idx > -1 && idx < (currIndex ?? this.#possibleNames.length)) {
            currIndex = idx;
            config = join(currParsedPath.dir, dirent.name);
          }
        }
      }
      if (config) {
        break;
      }
    }

    this.#cache.set("config", config);
    return config;
  }
}
