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

import {
  execFile as execFileCallback,
  type ExecFileOptions as NodeExecFileOptions,
} from "node:child_process";
import type { PathLike, Stats } from "node:fs";
import { access as accessPromise, stat as statPromise } from "node:fs/promises";
import { promisify } from "node:util";

import { type Operation, until, useAbortSignal } from "effection";

const execFilePromise = promisify(execFileCallback);

type ExecFileOptions = Omit<NodeExecFileOptions, "signal"> & { input?: string };

export function* execFile(
  executable: string,
  args: readonly string[],
  options: ExecFileOptions = {},
): Operation<{ stdout: string; stderr: string }> {
  const { input, ...execOptions } = options;
  const signal = yield* useAbortSignal();
  const execution = execFilePromise(executable, args, {
    windowsHide: true,
    ...execOptions,
    encoding: "utf8",
    signal,
  });
  execution.child.stdin?.end(input);
  return yield* until(execution);
}

export function* access(path: PathLike, mode?: number): Operation<void> {
  yield* until(accessPromise(path, mode));
}

export function* stat(path: PathLike): Operation<Stats> {
  return yield* until(statPromise(path));
}
