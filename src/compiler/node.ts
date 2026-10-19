import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { CompileResult } from "./codegen.js";
import { createRuntime } from "./runtime.js";

/**
 * Import the npm/node modules a compiled program needs, resolving bare
 * package names from the program's own directory (its node_modules).
 */
export async function loadNpmModules(specs: string[], fromFile: string): Promise<Record<string, unknown>> {
  const require = createRequire(fromFile);
  const modules: Record<string, unknown> = {};
  for (const spec of specs) {
    let target = spec;
    if (!spec.startsWith("node:")) {
      try {
        target = pathToFileURL(require.resolve(spec)).href;
      } catch {
        // ESM-only packages may not resolve via require; let import() try
      }
    }
    try {
      modules[spec] = await import(target);
    } catch {
      throw new Error(`拿来吧你……拿了个寂寞：找不到包「${spec}」，先 npm install ${spec} 试试？`);
    }
  }
  return modules;
}

/**
 * A standalone ES module: the runtime, the program, and imports for any npm
 * packages. Runs with `node out.mjs`, or in a browser if it imports no packages.
 */
export function buildStandalone(result: CompileResult): string {
  const imports = result.npm.map((spec, i) => `import * as $npm${i} from ${JSON.stringify(spec)};`);
  const npmTable = result.npm.map((spec, i) => `${JSON.stringify(spec)}: $npm${i}`).join(", ");
  return [
    "// 由草语言编译生成 — compiled from CaoLang (草语言)",
    ...imports,
    // Dev builds of the runtime may reference esbuild's __name helper
    "var __name = (target) => target;",
    `const createRuntime = ${createRuntime.toString()};`,
    "const $ = createRuntime({ output: (text) => console.log(text) });",
    `const $npm = { ${npmTable} };`,
    "try {",
    "(function ($, $npm) {",
    result.code,
    "})($, $npm);",
    "} catch (e) {",
    '  console.error("错误！" + $.toCaoError(e).message);',
    '  if (typeof process !== "undefined") process.exitCode = 1;',
    "}",
    "",
  ].join("\n");
}
