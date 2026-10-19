#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Parser } from "./parser/index.js";
import { Interpreter } from "./interpreter/index.js";
import { Lexer } from "./lexer/index.js";
import { formatError, CaoError } from "./errors/index.js";
import { nodeModuleLoader } from "./node-loader.js";
import { startRepl } from "./repl.js";
import { compileSource, execute } from "./compiler/index.js";
import { loadNpmModules, buildStandalone, buildWebPage } from "./compiler/node.js";
import { CANVAS_BUILTINS } from "./stdlib/index.js";
import type { EasterEggOptions } from "./interpreter/easter-eggs.js";

const rawArgs = process.argv.slice(2);

// Parse flags; "-o <file>" takes a value
const outIndex = rawArgs.findIndex((a) => a === "-o" || a === "--输出");
const outFile = outIndex >= 0 ? rawArgs[outIndex + 1] : undefined;
const positional = rawArgs.filter((_, i) => outIndex < 0 || (i !== outIndex && i !== outIndex + 1));
const flags = new Set(positional.filter((a) => a.startsWith("-")));
const args = positional.filter((a) => !a.startsWith("-"));
const command = args[0];

function printUsage(): void {
  console.log(`
草语言 (CaoLang) v0.2.0 — 一个基于梗的中文编程语言

用法:
  cao run <文件.cao>      执行一个 .cao 文件（编译成 JS 跑，快）
  cao build <文件.cao> [-o 输出.mjs]
                           编译成独立的 JS 文件，node 或浏览器都能跑
  cao build <文件.cao> --网页
                           编译成一个 HTML 网页（带画布，做游戏用）
  cao tokenize <文件.cao>  输出词法分析结果（调试用）
  cao parse <文件.cao>     输出语法树（调试用）
  cao repl                 启动交互式控制台
  cao                      启动交互式控制台（默认）
  cao --help               显示帮助
  cao --version            显示版本

彩蛋模式:
  --social-credit          启用社会信用系统（栓Q太多会被警告）
  --996                    启用996模式（深夜卷有猝死风险）
  --strict                 启用严厉模式（必须用中文标点）
  --全部彩蛋               启用所有彩蛋

其他:
  --解释 / --interp        用解释器跑（不编译，调试用）
`);
}

function getEasterEggs(source?: string): EasterEggOptions {
  const eggs: EasterEggOptions = {};

  if (flags.has("--social-credit") || flags.has("--全部彩蛋")) {
    eggs.socialCredit = true;
  }
  if (flags.has("--996") || flags.has("--全部彩蛋")) {
    eggs.mode996 = true;
  }
  if (flags.has("--strict") || flags.has("--全部彩蛋")) {
    eggs.strict = true;
  }

  // Detect 严厉 directive at top of source
  if (source) {
    const firstLine = source.split("\n").find((l) => l.trim() && !l.trim().startsWith("//"));
    if (firstLine?.trim() === "严厉") {
      eggs.strict = true;
    }
  }

  return eggs;
}

function readSource(filepath: string): { source: string; filename: string } {
  const resolved = resolve(filepath);
  try {
    const source = readFileSync(resolved, "utf-8");
    return { source, filename: resolved };
  } catch {
    console.error(`\x1b[31m错误！找不到文件: ${resolved}\x1b[0m`);
    process.exit(1);
  }
}

/** Blank out a leading 严厉 directive (keeping line numbers) so the parser doesn't see it. */
function stripStrictDirective(source: string): string {
  const firstCodeLine = source.split("\n").find((l) => l.trim() && !l.trim().startsWith("//"));
  if (firstCodeLine?.trim() !== "严厉") return source;
  return source.replace(/^([^\n]*\n)*?严厉\s*\n?/, (match) =>
    "\n".repeat((match.match(/\n/g) || []).length),
  );
}

function reportAndExit(e: unknown, source: string, filename: string): never {
  if (e instanceof CaoError) {
    // Errors from an imported file carry that file's name and source
    console.error(formatError(e.message, e.source ?? source, e.loc, e.filename ?? filename));
  } else if (e instanceof Error) {
    console.error(formatError(e.message, source, undefined, filename));
  } else {
    console.error(e);
  }
  process.exit(1);
}

async function runFile(filepath: string): Promise<void> {
  const { source, filename } = readSource(filepath);
  const eggs = getEasterEggs(source);
  const parseSource = stripStrictDirective(source);

  try {
    if (flags.has("--解释") || flags.has("--interp")) {
      const program = Parser.fromSource(parseSource).parse();
      const interpreter = new Interpreter({ easterEggs: eggs, modules: nodeModuleLoader });
      interpreter.run(program, source, filename);
      return;
    }
    const options = { easterEggs: eggs, modules: nodeModuleLoader, filename, source };
    const compiled = compileSource(parseSource, options);
    const npm = await loadNpmModules(compiled.npm, filename);
    execute(compiled, { ...options, npm });
  } catch (e) {
    reportAndExit(e, source, filename);
  }
}

function buildFile(filepath: string): void {
  const { source, filename } = readSource(filepath);
  const eggs = getEasterEggs(source);
  const web = flags.has("--网页") || flags.has("--web");
  const base = filepath.replace(/\.cao$/, "");
  const target = resolve(outFile ?? base + (web ? ".html" : ".mjs"));
  try {
    const compiled = compileSource(stripStrictDirective(source), {
      easterEggs: eggs, modules: nodeModuleLoader, filename, source,
      extraBuiltins: web ? CANVAS_BUILTINS : undefined,
    });
    const title = base.split(/[\\/]/).pop() ?? "草语言";
    writeFileSync(target, web ? buildWebPage(compiled, title) : buildStandalone(compiled));
  } catch (e) {
    reportAndExit(e, source, filename);
  }
  console.log(`编译好了 → ${target}`);
}

function tokenizeFile(filepath: string): void {
  const { source } = readSource(filepath);
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  for (const token of tokens) {
    console.log(
      `[${token.loc.line}:${token.loc.column}] ${token.type} ${JSON.stringify(token.value)}`,
    );
  }
}

function parseFile(filepath: string): void {
  const { source } = readSource(filepath);
  const parser = Parser.fromSource(source);
  const program = parser.parse();
  console.log(JSON.stringify(program, null, 2));
}

// ---- Main ----

if (flags.has("--help") || flags.has("-h")) {
  printUsage();
} else if (flags.has("--version") || flags.has("-v")) {
  console.log("草语言 (CaoLang) v0.2.0");
} else if (!command || command === "repl") {
  startRepl();
} else if (command === "run") {
  const file = args[1];
  if (!file) {
    console.error("错误！请指定要运行的文件，例如: cao run hello.cao");
    process.exit(1);
  }
  void runFile(file);
} else if (command === "build") {
  const file = args[1];
  if (!file) {
    console.error("错误！请指定要编译的文件，例如: cao build hello.cao");
    process.exit(1);
  }
  buildFile(file);
} else if (command === "tokenize") {
  const file = args[1];
  if (!file) {
    console.error("错误！请指定文件");
    process.exit(1);
  }
  tokenizeFile(file);
} else if (command === "parse") {
  const file = args[1];
  if (!file) {
    console.error("错误！请指定文件");
    process.exit(1);
  }
  parseFile(file);
} else if (command.endsWith(".cao")) {
  void runFile(command);
} else {
  console.error(`不认识这个命令: ${command}`);
  printUsage();
  process.exit(1);
}
