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

import { test } from "vitest";

import { getChkTexDiagnosticOutput, parseChkTexOutputLine } from "./chktex";

test("parses ChkTeX output without truncating colons in messages", () => {
  assert.deepEqual(parseChkTexOutputLine("Warning:8:12:4:3:Use {x}: not x"), {
    severity: "Warning",
    code: "8",
    line: 12,
    column: 4,
    length: 3,
    message: "Use {x}: not x",
  });
});

test("accepts ChkTeX diagnostic exit statuses", () => {
  assert.equal(
    getChkTexDiagnosticOutput({ code: 2, stdout: "Warning:8:1:1:1:message" }),
    "Warning:8:1:1:1:message",
  );
  assert.equal(getChkTexDiagnosticOutput({ code: 1, stdout: "internal error" }), undefined);
});
