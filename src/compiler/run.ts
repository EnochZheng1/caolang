import { Parser } from "../parser/parser.js";
import { CaoRuntimeError } from "../interpreter/interpreter.js";
import { checkStrictMode, formatStrictViolation } from "../interpreter/easter-eggs.js";
import { compile, CompileOptions, CompileResult } from "./codegen.js";
import { createRuntime } from "./runtime.js";

export interface RunCompiledOptions extends CompileOptions {
  output?: (text: string) => void;
  easterEggs?: { socialCredit?: boolean; mode996?: boolean; strict?: boolean };
  /** Preloaded npm/node modules, keyed by specifier (see CompileResult.npm). */
  npm?: Record<string, unknown>;
}

/** Parse and compile CaoLang source (applying 严厉 mode first). */
export function compileSource(source: string, options: RunCompiledOptions = {}): CompileResult {
  if (options.easterEggs?.strict) {
    const violations = checkStrictMode(source);
    if (violations.length > 0) throw new CaoRuntimeError(formatStrictViolation(violations));
  }
  const program = Parser.fromSource(source).parse();
  return compile(program, { ...options, source: options.source ?? source });
}

/** Compile and run source. Any npm modules it imports must be in options.npm. */
export function runCompiled(source: string, options: RunCompiledOptions = {}): void {
  execute(compileSource(source, options), options);
}

/** Run already-compiled code, turning anything it throws into a located CaoRuntimeError. */
export function execute(result: CompileResult, options: RunCompiledOptions = {}): void {
  const missing = result.npm.filter((name) => !(name in (options.npm ?? {})));
  if (missing.length > 0) {
    throw new CaoRuntimeError(`拿来吧你……拿了个寂寞：没有加载 ${missing.join("、")}`);
  }

  const $ = createRuntime({ output: options.output ?? ((text) => console.log(text)) });
  const fn = new Function("$", "$npm", result.code);
  const savedLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = Math.max(savedLimit, 50);
  try {
    fn($, options.npm ?? {});
  } catch (e) {
    const err = $.toCaoError(e);
    const located = new CaoRuntimeError(err.message, err.caoValue);
    const where = locate(e, result);
    if (where) {
      const file = result.files[where.file];
      located.loc = { line: where.line, column: where.column, offset: 0 };
      located.source = file.source;
      // The main file's name is the caller's to show; imported files are named here
      if (where.file > 0) located.filename = file.path ?? file.name;
    }
    throw located;
  } finally {
    Error.stackTraceLimit = savedLimit;
  }
}

// How many lines `new Function` puts before the body (2 in V8)
const LINE_OFFSET = (() => {
  const stack = new Function("return new Error().stack")() as string | undefined;
  const m = stack && /<anonymous>:(\d+):\d+/.exec(stack);
  return m ? Number(m[1]) - 1 : 2;
})();

/** Find the innermost compiled-code frame in an error's stack and map it to source. */
function locate(e: unknown, result: CompileResult) {
  const stack = e instanceof Error ? e.stack : undefined;
  if (!stack) return undefined;
  for (const m of stack.matchAll(/<anonymous>:(\d+):\d+/g)) {
    const line = Number(m[1]) - LINE_OFFSET;
    // Walk up to the nearest line that came from a CaoLang statement
    for (let l = line; l >= 1; l--) {
      const loc = result.lineMap[l];
      if (loc) return loc;
    }
  }
  return undefined;
}
