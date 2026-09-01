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

import { platform } from "node:os";

import type { Operation } from "effection";
import type { FormattingOptions, TextDocument } from "vscode";

import { ConfigResolver, getConfig } from "./config";
import { ExecutableResolver } from "./executable_resolver";
import { execFile } from "./node";

const CONFIG = new ConfigResolver("formatter.config", ["tex-fmt.toml"]);

export function* findConfig(document: TextDocument): Operation<string | undefined> {
  return yield* CONFIG.findConfig(document);
}

export function createResolver(): ExecutableResolver {
  return new ExecutableResolver(
    "tex-fmt",
    platform() === "win32" ? [".exe"] : [],
    [],
    "latex-formatter",
  );
}

export function* format(
  input: string,
  executable: string,
  cwd: string,
  options: FormattingOptions,
  config?: string,
): Operation<string> {
  const args = ["--stdin"];
  if (config) {
    args.push("--config", config);
  } else {
    const columnLimit = getConfig<number>("formatter.columnLimit", 80);
    args.push(columnLimit === 0 ? "--nowrap" : "--wraplen");
    if (columnLimit !== 0) {
      args.push(String(columnLimit));
    }
    args.push("--tabsize", String(options.tabSize));
    if (!options.insertSpaces) {
      args.push("--usetabs");
    }
  }

  const endsWithNewline = /\r?\n$/v.test(input);
  const { stdout } = yield* execFile(executable, args, {
    cwd,
    input: endsWithNewline ? input : `${input}\n`,
    timeout: getConfig("formatter.timeout", 10_000),
  });
  return endsWithNewline ? stdout : stdout.replace(/\r?\n$/v, "");
}
