import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("nested LaTeX scopes delegate to embedded weave grammars", async () => {
  const grammar = await readFile("syntax/LaTeX.tmLanguage.json", "utf8");

  assert.match(grammar, /"\$base"/v);
  assert.doesNotMatch(grammar, /"\$self"/v);
});
