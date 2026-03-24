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

export interface CaoFunction {
  type: "function";
  name: string;
  params: string[];
  body: BlockStatement;
  closure: Environment;
}

export interface CaoBuiltin {
  type: "builtin";
  name: string;
  arity: number | null; // null = variadic
  call: (args: CaoValue[]) => CaoValue;
}

export type CaoValue =
  | CaoNumber
  | CaoString
  | CaoBoolean
  | CaoNull
  | CaoArray
  | CaoFunction
  | CaoBuiltin;

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

// ---- Display ----

export function displayValue(val: CaoValue): string {
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
      return `[${val.elements.map(displayValue).join("，")}]`;
    case "function":
      return `<整活 ${val.name}>`;
    case "builtin":
      return `<内置 ${val.name}>`;
  }
}

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
    default:
      return true;
  }
}
