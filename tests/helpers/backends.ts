import { Parser } from "../../src/parser/index.js";
import { Interpreter } from "../../src/interpreter/index.js";
import type { ModuleLoader } from "../../src/interpreter/index.js";
import { runCompiled } from "../../src/compiler/index.js";

export interface RunOptions {
  output: (text: string) => void;
  modules?: ModuleLoader;
  filename?: string;
  easterEggs?: { socialCredit?: boolean; strict?: boolean; mode996?: boolean };
}

export interface Backend {
  name: string;
  run(source: string, options: RunOptions): void;
}

/** Every behavior test runs on both the interpreter and the JS compiler. */
export const BACKENDS: Backend[] = [
  {
    name: "解释器 interpreter",
    run(source, options) {
      const interpreter = new Interpreter(options);
      interpreter.run(Parser.fromSource(source).parse(), source, options.filename);
    },
  },
  {
    name: "编译器 compiler",
    run(source, options) {
      runCompiled(source, options);
    },
  },
];
