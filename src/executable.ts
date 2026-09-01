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
import { platform } from "node:os";

import type { Operation } from "effection";

import { access } from "./node";

export function* findExecutable(output: string): Operation<string | undefined> {
  for (const line of output.split(/\r?\n/v)) {
    const file = line.trim();
    if (file && (yield* isExecutable(file))) {
      return file;
    }
  }
  return;
}

export function* isExecutable(file: string): Operation<boolean> {
  try {
    yield* access(file, X_OK);
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

export function getExecutableInvocation(
  executable: string,
  args: readonly string[],
  currentPlatform = platform(),
  commandShell = process.env["ComSpec"] ?? "cmd.exe",
): readonly [string, readonly string[]] {
  if (currentPlatform === "win32" && /\.(?:bat|cmd)$/iv.test(executable)) {
    return [commandShell, ["/d", "/c", `"${executable}"`, ...args]];
  }
  return [executable, args];
}

export function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "stderr" in error &&
    typeof error.stderr === "string" &&
    error.stderr.trim()
  ) {
    return error.stderr.trim();
  }
  return error instanceof Error ? error.message : String(error);
}
