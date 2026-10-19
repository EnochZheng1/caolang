#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Parser } from "./parser/index.js";
import { Interpreter } from "./interpreter/index.js";
import { Lexer } from "./lexer/index.js";
import { formatError, CaoError } from "./errors/index.js";
import { nodeModuleLoader } from "./node-loader.js";
import { startRepl } from "./repl.js";
import type { EasterEggOptions } from "./interpreter/easter-eggs.js";

const rawArgs = process.argv.slice(2);

// Parse flags
const flags = new Set(rawArgs.filter((a) => a.startsWith("--")));
const args = rawArgs.filter((a) => !a.startsWith("--"));
const command = args[0];

function printUsage(): void {
  console.log(`
草语言 (CaoLang) v0.2.0 — 一个基于梗的中文编程语言

用法:
  cao run <文件.cao>      执行一个 .cao 文件
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

function runFile(filepath: string): void {
  const { source, filename } = readSource(filepath);
  const eggs = getEasterEggs(source);

  // Strip 严厉 directive before parsing
  let parseSource = source;
  const firstCodeLine = source.split("\n").find((l) => l.trim() && !l.trim().startsWith("//"));
  if (firstCodeLine?.trim() === "严厉") {
    parseSource = source.replace(/^([^\n]*\n)*?严厉\s*\n?/, (match) =>
      "\n".repeat((match.match(/\n/g) || []).length),
    );
  }

  try {
    const parser = Parser.fromSource(parseSource);
    const program = parser.parse();
    const interpreter = new Interpreter({ easterEggs: eggs, modules: nodeModuleLoader });
    interpreter.run(program, source, filename);
  } catch (e) {
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
  runFile(file);
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
  runFile(command);
} else {
  console.error(`不认识这个命令: ${command}`);
  printUsage();
  process.exit(1);
}
