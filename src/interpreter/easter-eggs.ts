import { CaoRuntimeError } from "./interpreter.js";

export interface EasterEggOptions {
  socialCredit?: boolean;
  mode996?: boolean;
  strict?: boolean;
}

/**
 * Social Credit System: warn if a function has too many 栓Q (return) statements.
 * Called during function declaration analysis.
 */
export function checkSocialCredit(
  functionName: string,
  returnCount: number,
  output: (text: string) => void,
): void {
  if (returnCount > 5) {
    output(
      `⚠️ 社会信用警告：函数「${functionName}」里栓Q了${returnCount}次，你也太客气了吧！`,
    );
  }
}

/**
 * Social Credit delay: add penalty delay for over-polite functions.
 * Returns the delay in ms (0 if no penalty).
 */
export function socialCreditDelay(returnCount: number): number {
  if (returnCount > 5) {
    return (returnCount - 5) * 10;
  }
  return 0;
}

/**
 * 996 Mode: check if we're in "overtime hours" (9PM - 6AM).
 */
export function is996Hours(): boolean {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 6;
}

/**
 * 996 Mode: random chance of 猝死 (sudden death) during loops.
 * Returns true if the loop should "die".
 */
export function check996Death(): boolean {
  return Math.random() < 0.01; // 1% chance
}

/**
 * 996 Mode: throw sudden death error.
 */
export function throw996Death(): never {
  throw new CaoRuntimeError(
    "💀 猝死！你卷到猝死了！回去睡觉！\n（996模式：深夜写代码有1%概率猝死）",
  );
}

/**
 * Strict Mode (严厉): check source for ASCII punctuation.
 * Returns an array of violations.
 */
export function checkStrictMode(source: string): string[] {
  const violations: string[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments
    if (line.trimStart().startsWith("//")) continue;

    // Check for ASCII braces (not in strings)
    let inString = false;
    let stringChar = "";
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];

      // Track strings
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        continue;
      }
      if (inString && ch === stringChar && line[j - 1] !== "\\") {
        inString = false;
        continue;
      }
      if (inString) continue;

      // Check for ASCII punctuation that should be Chinese
      if (ch === "{" || ch === "}") {
        violations.push(`第${i + 1}行：发现 '${ch}'，请使用「」！`);
      }
      if (ch === "(" || ch === ")") {
        violations.push(`第${i + 1}行：发现 '${ch}'，请使用（）！`);
      }
      if (ch === ";") {
        violations.push(`第${i + 1}行：发现 ';'，请使用；或者直接不写！`);
      }
    }
  }

  return violations;
}

/**
 * Format strict mode error with lecture.
 */
export function formatStrictViolation(violations: string[]): string {
  const header = "🔴 文化自信！请使用中文标点！\n";
  const detail = violations.slice(0, 5).join("\n");
  const more = violations.length > 5
    ? `\n...还有${violations.length - 5}处不自信的地方`
    : "";
  return header + detail + more;
}

/**
 * Count 栓Q (return) statements in a function body (AST).
 */
export function countReturns(body: { body: Array<{ type: string }> }): number {
  let count = 0;
  function walk(stmts: Array<Record<string, unknown>>): void {
    for (const stmt of stmts) {
      if (stmt.type === "ReturnStatement") {
        count++;
      }
      // Recurse into blocks
      if (stmt.type === "BlockStatement" && Array.isArray(stmt.body)) {
        walk(stmt.body as Array<Record<string, unknown>>);
      }
      if (stmt.type === "IfStatement") {
        if (stmt.consequent && typeof stmt.consequent === "object" && "body" in stmt.consequent) {
          walk((stmt.consequent as { body: Array<Record<string, unknown>> }).body);
        }
        if (stmt.alternate && typeof stmt.alternate === "object") {
          if ("body" in stmt.alternate) {
            walk((stmt.alternate as { body: Array<Record<string, unknown>> }).body);
          } else if ("type" in stmt.alternate) {
            walk([stmt.alternate as Record<string, unknown>]);
          }
        }
      }
      if (stmt.type === "WhileStatement" && stmt.body && typeof stmt.body === "object" && "body" in stmt.body) {
        walk((stmt.body as { body: Array<Record<string, unknown>> }).body);
      }
      if (stmt.type === "TryCatchStatement") {
        if (stmt.tryBlock && typeof stmt.tryBlock === "object" && "body" in stmt.tryBlock) {
          walk((stmt.tryBlock as { body: Array<Record<string, unknown>> }).body);
        }
        if (stmt.catchBlock && typeof stmt.catchBlock === "object" && "body" in stmt.catchBlock) {
          walk((stmt.catchBlock as { body: Array<Record<string, unknown>> }).body);
        }
      }
    }
  }
  walk(body.body as Array<Record<string, unknown>>);
  return count;
}
