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

import { run, sleep } from "effection";
import { test } from "vitest";

import { withCancellation } from "./vscode";

test("cancellation wins and tears down the pending operation", async () => {
  let cancel;
  let stopped = false;
  const token = {
    isCancellationRequested: false,
    onCancellationRequested(listener) {
      cancel = listener;
      return { dispose() {} };
    },
  };

  function* pending() {
    try {
      yield* sleep(60_000);
    } finally {
      stopped = true;
    }
  }

  const task = run(() => withCancellation(token, pending(), "cancelled"));
  await Promise.resolve();
  cancel();

  assert.equal(await task, "cancelled");
  assert.equal(stopped, true);
});
