import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { CompileResult } from "./codegen.js";
import { createRuntime } from "./runtime.js";
import { installCanvas } from "../stdlib/canvas.js";
import { showSavedImage } from "../stdlib/save-image.js";

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

/**
 * A single self-contained HTML page: runtime + 画布 + the program. Open it in
 * a browser, put it on any static host, or send it to a friend.
 */
export function buildWebPage(result: CompileResult, title: string): string {
  if (result.npm.length > 0) {
    throw new Error(`网页版拿不了 npm 包：${result.npm.join("、")}`);
  }
  const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  // Keep "</script>" inside the program's strings from ending the script tag
  const script = (js: string) => js.replace(/<\/(script)/gi, "<\\/$1");
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<!-- 由草语言编译生成 — compiled from CaoLang (草语言) -->
<style>
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  canvas { display: block; width: 100vw; height: 100vh; object-fit: contain; image-rendering: pixelated; outline: none;
           touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  #rotate { display: none; position: fixed; top: 8px; left: 0; right: 0; text-align: center; color: #fff;
            font: bold 14px sans-serif; opacity: 0.8; pointer-events: none; }
  @media (orientation: portrait) and (pointer: coarse) { #rotate { display: block; } }
  #log { position: fixed; left: 8px; bottom: 8px; max-height: 30vh; overflow: auto; color: #3f3;
         font: 12px/1.5 ui-monospace, monospace; white-space: pre-wrap; pointer-events: none; }
  #log .err { color: #f55; }
</style>
</head>
<body>
<canvas id="stage" tabindex="0"></canvas>
<div id="log"></div>
<div id="rotate">📱 横过来玩更爽</div>
<script type="module">
var __name = (target) => target;
const createRuntime = ${script(createRuntime.toString())};
const installCanvas = ${script(installCanvas.toString())};
const showSavedImage = ${script(showSavedImage.toString())};
const log = document.getElementById("log");
const say = (text, cls) => {
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = text;
  log.appendChild(line);
};
const $ = createRuntime({
  output: (text) => { console.log(text); say(text); },
  onError: (e) => say("错误！" + $.toCaoError(e).message, "err"),
});
const canvas = document.getElementById("stage");
installCanvas($, {
  canvas,
  createCanvas: (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }),
  window,
  now: () => performance.now(),
  createAudioContext: () => new AudioContext(),
  onOpen: () => canvas.focus(),
  touchDevice: navigator.maxTouchPoints > 0,
  saveImage: showSavedImage,
});
try {
(function ($, $npm) {
${script(result.code)}
})($, {});
} catch (e) {
  say("错误！" + $.toCaoError(e).message, "err");
}
</script>
</body>
</html>
`;
}
