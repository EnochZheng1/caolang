import type { Lesson, ValidationResult } from "./types.js";
import { runCode } from "../runner.js";
import type { RunOptions } from "../runner.js";

/**
 * Run user code with optional hidden test suite appended, then validate output.
 */
export function validateLesson(
  lesson: Lesson,
  userCode: string,
  options: RunOptions = {},
): { result: ReturnType<typeof runCode>; validation: ValidationResult } {
  // Append hidden test suite if present
  const fullCode = lesson.testSuite
    ? userCode + "\n" + lesson.testSuite
    : userCode;

  const result = runCode(fullCode, options);
  const validation = validateOutput(lesson, result.output, result.error);
  return { result, validation };
}

function validateOutput(
  lesson: Lesson,
  output: string[],
  error: string | null,
): ValidationResult {
  // Custom validator takes precedence
  if (lesson.validationMode === "custom" && lesson.customValidator) {
    return lesson.customValidator(output, error);
  }

  // Error = auto-fail
  if (error) {
    return { passed: false, message: `💥 代码报错了：${error}` };
  }

  switch (lesson.validationMode) {
    case "exact":
      return validateExact(lesson.expectedOutput, output);
    case "includes":
      return validateIncludes(lesson.expectedOutput, output);
    case "includes_any":
      return validateIncludesAny(lesson.expectedOutput, output);
    default:
      return { passed: false, message: "验证器坏了" };
  }
}

function validateExact(expected: string[], actual: string[]): ValidationResult {
  // Filter empty lines and trim
  const e = expected.map((s) => s.trim());
  const a = actual.map((s) => s.trim()).filter((s) => s !== "");

  if (a.length !== e.length) {
    return {
      passed: false,
      message: `❌ 期望 ${e.length} 行输出，但得到了 ${a.length} 行`,
    };
  }

  for (let i = 0; i < e.length; i++) {
    if (a[i] !== e[i]) {
      return {
        passed: false,
        message: `❌ 第 ${i + 1} 行：期望「${e[i]}」，得到「${a[i]}」`,
      };
    }
  }

  return { passed: true, message: "✅ 通过！整活成功！" };
}

function validateIncludes(expected: string[], actual: string[]): ValidationResult {
  let searchFrom = 0;
  for (const exp of expected) {
    let found = false;
    for (let i = searchFrom; i < actual.length; i++) {
      if (actual[i].includes(exp)) {
        found = true;
        searchFrom = i + 1;
        break;
      }
    }
    if (!found) {
      return {
        passed: false,
        message: `❌ 输出中没找到「${exp}」`,
      };
    }
  }
  return { passed: true, message: "✅ 通过！整活成功！" };
}

function validateIncludesAny(expected: string[], actual: string[]): ValidationResult {
  const joined = actual.join("\n");
  for (const exp of expected) {
    if (joined.includes(exp)) {
      return { passed: true, message: "✅ 通过！整活成功！" };
    }
  }
  return {
    passed: false,
    message: `❌ 输出中没找到期望的内容`,
  };
}
