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

import { X_OK } from "node:constants";
import { accessSync } from "node:fs";

export function findExecutable(output: string) {
  return output
    .split(/\r?\n/v)
    .map((file) => file.trim())
    .find((file) => file.length > 0 && isExecutable(file));
}

export function isExecutable(file: string) {
  try {
    accessSync(file, X_OK);
    return true;
  } catch {
    return false;
  }
}

export function getTexPackageManagers(packageName: string) {
  return [
    ["tlmgr", ["install", packageName]],
    ["miktex", ["packages", "install", packageName]],
    ["mpm", [`--install=${packageName}`]],
  ] as const;
}
