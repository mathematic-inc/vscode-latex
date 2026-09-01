import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: "cjs",
  target: "es2024",
  external: ["vscode"],
  outDir: "dist",
  clean: true,
  sourcemap: true,
});
