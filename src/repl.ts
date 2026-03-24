import { createInterface } from "node:readline";
import { Parser } from "./parser/index.js";
import { Interpreter } from "./interpreter/index.js";
import { displayValue, CAO_NULL } from "./interpreter/values.js";

export function startRepl(): void {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "草> ",
  });

  console.log("草语言 (CaoLang) v0.1.0 — 交互式控制台");
  console.log("输入代码开始整活，输入 .exit 退出\n");

  const interpreter = new Interpreter();

  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();

    if (input === ".exit" || input === "退出") {
      console.log("润了！👋");
      rl.close();
      return;
    }

    if (input === "") {
      rl.prompt();
      return;
    }

    try {
      const parser = Parser.fromSource(input);
      const program = parser.parse();
      const result = interpreter.run(program);

      // Show result of expression statements (not 虚无 unless explicit)
      if (
        program.body.length === 1 &&
        program.body[0].type === "ExpressionStatement" &&
        result.type !== "null"
      ) {
        console.log(`\x1b[36m${displayValue(result)}\x1b[0m`);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error(`\x1b[31m${e.message}\x1b[0m`);
      }
    }

    rl.prompt();
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
