import { BlockStatement } from "../parser/ast.js";
import { Environment } from "./environment.js";

export interface CaoNumber {
  type: "number";
  value: number;
}

export interface CaoString {
  type: "string";
  value: string;
}

export interface CaoBoolean {
  type: "boolean";
  value: boolean;
}

export interface CaoNull {
  type: "null";
}

export interface CaoArray {
  type: "array";
  elements: CaoValue[];
}

export interface CaoDict {
  type: "dict";
  entries: Map<string, CaoValue>;
}

/** The file a piece of code came from, so errors can show the right source. */
export interface ModuleInfo {
  filename: string | null;
  source: string | undefined;
}

export interface CaoFunction {
  type: "function";
  name: string;
  params: string[];
  body: BlockStatement;
  closure: Environment;
  module?: ModuleInfo;
}

/** What a builtin can ask of the interpreter, e.g. calling a user function. */
export interface CallContext {
  call(fn: CaoValue, args: CaoValue[]): CaoValue;
}

export interface CaoBuiltin {
  type: "builtin";
  name: string;
  arity: number | [number, number] | null; // exact, [min, max], or null = variadic
  call: (args: CaoValue[], ctx: CallContext) => CaoValue;
}

export type CaoValue =
  | CaoNumber
  | CaoString
  | CaoBoolean
  | CaoNull
  | CaoArray
  | CaoDict
  | CaoFunction
  | CaoBuiltin;

/** Name given to anonymous functions. */
export const ANONYMOUS = "无名氏";

// ---- Constructors ----

export function caoNumber(value: number): CaoNumber {
  return { type: "number", value };
}

export function caoString(value: string): CaoString {
  return { type: "string", value };
}

export function caoBoolean(value: boolean): CaoBoolean {
  return { type: "boolean", value };
}

export const CAO_NULL: CaoNull = { type: "null" };

export function caoArray(elements: CaoValue[]): CaoArray {
  return { type: "array", elements };
}

export function caoDict(entries: Map<string, CaoValue> = new Map()): CaoDict {
  return { type: "dict", entries };
}

// ---- Display ----

export function displayValue(val: CaoValue, seen: Set<CaoValue> = new Set()): string {
  switch (val.type) {
    case "number":
      return String(val.value);
    case "string":
      return val.value;
    case "boolean":
      return val.value ? "确实" : "没有内味";
    case "null":
      return "虚无";
    case "array":
      if (seen.has(val)) return "[套娃]";
      seen.add(val);
      try {
        return `[${val.elements.map((e) => displayValue(e, seen)).join("，")}]`;
      } finally {
        seen.delete(val);
      }
    case "dict":
      if (seen.has(val)) return "「套娃」";
      seen.add(val);
      try {
        const parts = [...val.entries].map(([k, v]) => `${k}：${displayValue(v, seen)}`);
        return `「${parts.join("，")}」`;
      } finally {
        seen.delete(val);
      }
    case "function":
      return `<整活 ${val.name}>`;
    case "builtin":
      return `<内置 ${val.name}>`;
  }
}

// ---- Type names ----

export const TYPE_NAMES: Record<CaoValue["type"], string> = {
  number: "数字",
  string: "字符串",
  boolean: "布尔",
  null: "虚无",
  array: "数组",
  dict: "字典",
  function: "函数",
  builtin: "内置函数",
};

// ---- Truthiness ----

export function isTruthy(val: CaoValue): boolean {
  switch (val.type) {
    case "null":
      return false;
    case "boolean":
      return val.value;
    case "number":
      return val.value !== 0;
    case "string":
      return val.value.length > 0;
    case "array":
      return val.elements.length > 0;
    case "dict":
      return val.entries.size > 0;
    default:
      return true;
  }
}

// ---- Equality ----

/** Structural equality: [1，2] == [1，2] and 「a：1」 == 「a：1」 are both 确实. */
export function isEqual(a: CaoValue, b: CaoValue): boolean {
  if (a === b) return true;
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "number":
    case "string":
    case "boolean":
      return a.value === (b as typeof a).value;
    case "null":
      return true;
    case "array": {
      const other = (b as typeof a).elements;
      return a.elements.length === other.length && a.elements.every((e, i) => isEqual(e, other[i]));
    }
    case "dict": {
      const other = (b as typeof a).entries;
      if (a.entries.size !== other.size) return false;
      for (const [k, v] of a.entries) {
        const w = other.get(k);
        if (w === undefined || !isEqual(v, w)) return false;
      }
      return true;
    }
    default:
      return false; // Functions compare by reference (handled by a === b above)
  }
}

// ---- Strings ----

/** Split into full Unicode characters, so 长度（"😂"） is 1, not 2. */
export function chars(s: string): string[] {
  return [...s];
}
