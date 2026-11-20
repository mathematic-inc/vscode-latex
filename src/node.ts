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

import { execFile as execFileCallback } from "node:child_process";
import type { Stats } from "node:fs";
import { access as accessPromise, stat as statPromise } from "node:fs/promises";

import { type Operation, until, useAbortSignal } from "effection";

type ExecFileOptions = Readonly<{ cwd?: string; input?: string; timeout?: number }>;

type ExecFileOutput = { stdout: string; stderr: string };

export function* execFile(
  executable: string,
  args: readonly string[],
  options: ExecFileOptions = {},
): Operation<ExecFileOutput> {
  const { input, ...execOptions } = options;
  const signal = yield* useAbortSignal();
  return yield* until(
    new Promise<ExecFileOutput>((resolve, reject) => {
      const child = execFileCallback(
        executable,
        args,
        { windowsHide: true, ...execOptions, encoding: "utf8", signal },
        (error: Error | null, stdout: string, stderr: string) => {
          if (error === null) {
            resolve({ stdout, stderr });
          } else {
            // The callers read the output of a failed run from the error.
            reject(Object.assign(error, { stdout, stderr }));
          }
        },
      );
      child.stdin?.end(input);
    }),
  );
}

export function* access(path: string, mode?: number): Operation<void> {
  yield* until(accessPromise(path, mode));
}

export function* stat(path: string): Operation<Stats> {
  return yield* until(statPromise(path));
}
