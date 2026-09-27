import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: "cjs",
  target: "es2024",
  external: ["vscode"],
  // tsup leaves `dependencies` external by default, but the VSIX ships
  // without node_modules, so runtime dependencies must be bundled.
  noExternal: ["effection"],
  outDir: "dist",
  clean: true,
  sourcemap: true,
});
