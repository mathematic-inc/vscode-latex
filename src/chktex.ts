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

const OUTPUT_LINE = /^([^:]+):([^:]+):(\d+):(\d+):(\d+):(.*)$/v;

export function parseChkTexOutputLine(line: string) {
  const match = OUTPUT_LINE.exec(line);
  if (!match) {
    return;
  }
  return {
    severity: match[1]!,
    code: match[2]!,
    line: Number(match[3]),
    column: Number(match[4]),
    length: Number(match[5]),
    message: match[6]!,
  };
}

export function getChkTexDiagnosticOutput(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === 2 || error.code === 3) &&
    "stdout" in error &&
    typeof error.stdout === "string"
  ) {
    return error.stdout;
  }
  return;
}
