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
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { run } from "effection";
import { onTestFinished, test } from "vitest";

import { findExecutable, getExecutableInvocation, getTexPackageManagers } from "./executable";

test("returns the first executable from multiline locator output", async () => {
  const directory = mkdtempSync(join(tmpdir(), "vscode-latex-"));
  onTestFinished(() => rmSync(directory, { recursive: true }));

  const first = join(directory, "first");
  const second = join(directory, "second");
  for (const file of [first, second]) {
    writeFileSync(file, "");
    chmodSync(file, 0o755);
  }

  assert.equal(await run(() => findExecutable(`${first}\r\n${second}\r\n`)), first);
});

test("installs TeX packages with supported distribution managers", () => {
  assert.deepEqual(getTexPackageManagers("chktex"), [
    ["tlmgr", ["install", "chktex"]],
    ["miktex", ["packages", "install", "chktex"]],
    ["mpm", ["--install=chktex"]],
  ]);
  assert.deepEqual(getTexPackageManagers("latex-formatter"), [
    ["tlmgr", ["install", "latex-formatter"]],
    ["miktex", ["packages", "install", "latex-formatter"]],
    ["mpm", ["--install=latex-formatter"]],
  ]);
});

test("runs Windows batch package managers through cmd.exe", () => {
  assert.deepEqual(
    getExecutableInvocation(
      "C:\\Program Files\\TeX Live\\tlmgr.bat",
      ["install", "chktex"],
      "win32",
      "C:\\Windows\\System32\\cmd.exe",
    ),
    [
      "C:\\Windows\\System32\\cmd.exe",
      ["/d", "/c", '"C:\\Program Files\\TeX Live\\tlmgr.bat"', "install", "chktex"],
    ],
  );
});
