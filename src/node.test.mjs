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

import assert from "node:assert/strict";

import { run } from "effection";
import { test } from "vitest";

import { execFile } from "./node";

test("executes files asynchronously with standard input", async () => {
  const { stdout } = await run(() =>
    execFile(
      process.execPath,
      ["--input-type=module", "--eval", "process.stdin.pipe(process.stdout)"],
      { input: "LaTeX" },
    ),
  );
  assert.equal(stdout, "LaTeX");
});
