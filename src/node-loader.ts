import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ModuleLoader } from "./interpreter/modules.js";

/**
 * File-system module loader for the CLI and REPL.
 * 拿来吧你（"./工具"） resolves relative to the importing file and adds .cao if missing.
 */
export const nodeModuleLoader: ModuleLoader = {
  resolve(specifier, fromFile) {
    const base = fromFile ? dirname(fromFile) : process.cwd();
    const path = resolve(base, specifier);
    return path.endsWith(".cao") ? path : `${path}.cao`;
  },
  read(path) {
    return readFileSync(path, "utf-8");
  },
};
