export { Lexer, TokenType } from "./lexer/index.js";
export type { Token } from "./lexer/index.js";
export { Parser } from "./parser/index.js";
export type { Program, Statement, Expression } from "./parser/index.js";
export { Interpreter, CaoRuntimeError } from "./interpreter/index.js";
export type { ModuleLoader } from "./interpreter/index.js";
export { CaoError, CaoSyntaxError, describeError, formatError } from "./errors/index.js";
export { compile, compileSource, runCompiled, execute, createRuntime } from "./compiler/index.js";
export type { CompileOptions, CompileResult, RunCompiledOptions } from "./compiler/index.js";

import { Parser } from "./parser/index.js";
import { Interpreter } from "./interpreter/index.js";

/**
 * Run CaoLang source code and return captured output lines.
 */
export function run(source: string, options?: { output?: (text: string) => void }): void {
  const parser = Parser.fromSource(source);
  const program = parser.parse();
  const interpreter = new Interpreter({ output: options?.output });
  interpreter.run(program);
}
