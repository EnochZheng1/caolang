import { Parser } from "@caolang/parser/index.js";
import { Interpreter } from "@caolang/interpreter/index.js";
import { describeError } from "@caolang/errors/index.js";

export interface RunOptions {
  socialCredit?: boolean;
  mode996?: boolean;
  strict?: boolean;
}

export interface RunResult {
  output: string[];
  error: string | null;
  time: number;
}

export function runCode(source: string, options: RunOptions = {}): RunResult {
  const output: string[] = [];
  let error: string | null = null;
  const start = performance.now();

  try {
    const parser = Parser.fromSource(source);
    const program = parser.parse();
    const interpreter = new Interpreter({
      output: (text: string) => output.push(text),
      easterEggs: {
        socialCredit: options.socialCredit,
        mode996: options.mode996,
        strict: options.strict,
      },
    });
    interpreter.run(program, source);
  } catch (e) {
    error = describeError(e);
  }

  const time = performance.now() - start;
  return { output, error, time };
}
