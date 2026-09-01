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

import { dirname, isAbsolute, join } from "node:path";

import type { Operation } from "effection";
import { type TextDocument, workspace } from "vscode";

import { stat } from "./node";

export function getConfig<T>(section: string, defaultValue: T) {
  return workspace.getConfiguration("latex").get(section, defaultValue);
}

export class ConfigResolver {
  readonly #configKey: string;
  readonly #possibleNames: readonly string[];

  constructor(configKey: string, possibleNames: readonly string[]) {
    this.#configKey = configKey;
    this.#possibleNames = possibleNames;
  }

  *findConfig(document: TextDocument): Operation<string | undefined> {
    const config = getConfig(this.#configKey, "");
    if (!config) {
      return yield* this.#resolveConfig(document);
    }
    if (!isAbsolute(config)) {
      const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
      return workspaceFolder
        ? join(workspaceFolder.uri.fsPath, config)
        : join(dirname(document.uri.fsPath), config);
    }
    return config;
  }

  *#resolveConfig(document: TextDocument): Operation<string | undefined> {
    let directory = dirname(document.uri.fsPath);
    while (true) {
      for (const name of this.#possibleNames) {
        const config = join(directory, name);
        if (yield* isFile(config)) {
          return config;
        }
      }

      const parent = dirname(directory);
      if (parent === directory) {
        return;
      }
      directory = parent;
    }
  }
}

function* isFile(path: string): Operation<boolean> {
  try {
    return (yield* stat(path)).isFile();
  } catch {
    return false;
  }
}
