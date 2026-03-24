import {
  CaoValue, CaoBuiltin, CAO_NULL,
  caoNumber, caoString, caoBoolean, caoArray,
  displayValue, isTruthy,
} from "./values.js";
import { Environment } from "./environment.js";

export type OutputFn = (text: string) => void;

export function registerBuiltins(env: Environment, output: OutputFn): void {
  const builtins: CaoBuiltin[] = [
    {
      type: "builtin",
      name: "喊话",
      arity: null, // variadic
      call: (args) => {
        const text = args.map(displayValue).join(" ");
        output(text);
        return CAO_NULL;
      },
    },
    {
      type: "builtin",
      name: "类型",
      arity: 1,
      call: (args) => {
        const val = args[0];
        const typeNames: Record<string, string> = {
          number: "数字",
          string: "字符串",
          boolean: "布尔",
          null: "虚无",
          array: "数组",
          function: "函数",
          builtin: "内置函数",
        };
        return caoString(typeNames[val.type] ?? val.type);
      },
    },
    {
      type: "builtin",
      name: "长度",
      arity: 1,
      call: (args) => {
        const val = args[0];
        if (val.type === "string") return caoNumber(val.value.length);
        if (val.type === "array") return caoNumber(val.elements.length);
        throw new Error("类型不对啊兄弟，别乱搞：长度只能用在字符串和数组上");
      },
    },
    {
      type: "builtin",
      name: "数字化",
      arity: 1,
      call: (args) => {
        const val = args[0];
        if (val.type !== "string") {
          throw new Error("类型不对啊兄弟，别乱搞：数字化需要字符串");
        }
        const num = Number(val.value);
        if (isNaN(num)) {
          throw new Error(`这玩意儿转不了数字: "${val.value}"`);
        }
        return caoNumber(num);
      },
    },
    {
      type: "builtin",
      name: "字符串化",
      arity: 1,
      call: (args) => caoString(displayValue(args[0])),
    },
    {
      type: "builtin",
      name: "推入",
      arity: 2,
      call: (args) => {
        const arr = args[0];
        if (arr.type !== "array") {
          throw new Error("类型不对啊兄弟，别乱搞：推入只能用在数组上");
        }
        arr.elements.push(args[1]);
        return arr;
      },
    },
    {
      type: "builtin",
      name: "弹出",
      arity: 1,
      call: (args) => {
        const arr = args[0];
        if (arr.type !== "array") {
          throw new Error("类型不对啊兄弟，别乱搞：弹出只能用在数组上");
        }
        if (arr.elements.length === 0) {
          throw new Error("数组都空了还弹什么弹");
        }
        return arr.elements.pop()!;
      },
    },
    {
      type: "builtin",
      name: "切片",
      arity: 3,
      call: (args) => {
        const val = args[0];
        const start = args[1];
        const end = args[2];
        if (start.type !== "number" || end.type !== "number") {
          throw new Error("类型不对啊兄弟，别乱搞：切片的起止要是数字");
        }
        if (val.type === "string") {
          return caoString(val.value.slice(start.value, end.value));
        }
        if (val.type === "array") {
          return caoArray(val.elements.slice(start.value, end.value));
        }
        throw new Error("类型不对啊兄弟，别乱搞：切片只能用在字符串和数组上");
      },
    },
    {
      type: "builtin",
      name: "随机",
      arity: 0,
      call: () => caoNumber(Math.random()),
    },
    {
      type: "builtin",
      name: "时间戳",
      arity: 0,
      call: () => caoNumber(Date.now()),
    },
  ];

  for (const builtin of builtins) {
    env.define(builtin.name, builtin);
  }
}
