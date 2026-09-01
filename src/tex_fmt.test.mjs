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
import { beforeEach, test, vi } from "vitest";

const execFile = vi.hoisted(() => vi.fn());
const getConfig = vi.hoisted(() => vi.fn((_section, defaultValue) => defaultValue));
const ExecutableResolver = vi.hoisted(() => vi.fn());
vi.mock("node:os", () => ({ platform: () => "win32" }));
vi.mock("./node", () => ({ execFile }));
vi.mock("./config", () => ({
  ConfigResolver: class {},
  getConfig,
}));
vi.mock("./executable_resolver", () => ({ ExecutableResolver }));

const { createResolver, format } = await import("./tex_fmt");

beforeEach(() => {
  execFile.mockReset();
  ExecutableResolver.mockReset();
  getConfig.mockImplementation((_section, defaultValue) => defaultValue);
});

test("maps VS Code formatting options and preserves a missing final newline", async () => {
  getConfig.mockImplementation((section, defaultValue) =>
    section === "formatter.columnLimit" ? 0 : section === "formatter.timeout" ? 1234 : defaultValue,
  );
  execFile.mockImplementation(function* () {
    yield* [];
    return { stderr: "", stdout: "formatted\n" };
  });

  const output = await run(() =>
    format("input", "tex-fmt", "/document", { insertSpaces: false, tabSize: 4 }),
  );

  assert.equal(output, "formatted");
  assert.deepEqual(execFile.mock.calls, [
    [
      "tex-fmt",
      ["--stdin", "--nowrap", "--tabsize", "4", "--usetabs"],
      { cwd: "/document", input: "input\n", timeout: 1234 },
    ],
  ]);
});

test("resolves the Windows executable and installs its TeX package", () => {
  createResolver();
  assert.deepEqual(ExecutableResolver.mock.calls, [["tex-fmt", [".exe"], [], "latex-formatter"]]);
});

test("maps wrapping and space indentation", async () => {
  execFile.mockImplementation(function* () {
    yield* [];
    return { stderr: "", stdout: "formatted\n" };
  });

  await run(() => format("input\n", "tex-fmt", "/document", { insertSpaces: true, tabSize: 2 }));

  assert.deepEqual(execFile.mock.calls[0]?.[1], ["--stdin", "--wraplen", "80", "--tabsize", "2"]);
});

test("uses an explicit config without overriding it", async () => {
  execFile.mockImplementation(function* () {
    yield* [];
    return { stderr: "", stdout: "formatted\n" };
  });

  const output = await run(() =>
    format(
      "input\n",
      "tex-fmt",
      "/document",
      { insertSpaces: true, tabSize: 2 },
      "/document/tex-fmt.toml",
    ),
  );

  assert.equal(output, "formatted\n");
  assert.deepEqual(execFile.mock.calls[0]?.[1], ["--stdin", "--config", "/document/tex-fmt.toml"]);
});
