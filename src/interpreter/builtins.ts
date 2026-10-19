import {
  CaoValue, CaoBuiltin, CaoArray, CaoDict, CallContext, CAO_NULL, TYPE_NAMES,
  caoNumber, caoString, caoBoolean, caoArray,
  displayValue, isTruthy, isEqual, chars,
} from "./values.js";
import { Environment } from "./environment.js";

export type OutputFn = (text: string) => void;

// ---- Argument helpers ----

function typeError(message: string): Error {
  return new Error(`类型不对啊兄弟，别乱搞：${message}`);
}

function expectArray(fn: string, val: CaoValue): CaoArray {
  if (val.type !== "array") throw typeError(`${fn}要一个数组，你给了${TYPE_NAMES[val.type]}`);
  return val;
}

function expectString(fn: string, val: CaoValue): string {
  if (val.type !== "string") throw typeError(`${fn}要一个字符串，你给了${TYPE_NAMES[val.type]}`);
  return val.value;
}

function expectNumber(fn: string, val: CaoValue): number {
  if (val.type !== "number") throw typeError(`${fn}要一个数字，你给了${TYPE_NAMES[val.type]}`);
  return val.value;
}

function expectDict(fn: string, val: CaoValue): CaoDict {
  if (val.type !== "dict") throw typeError(`${fn}要一个字典，你给了${TYPE_NAMES[val.type]}`);
  return val;
}

function expectCallable(fn: string, val: CaoValue): CaoValue {
  if (val.type !== "function" && val.type !== "builtin") {
    throw typeError(`${fn}要一个函数，你给了${TYPE_NAMES[val.type]}`);
  }
  return val;
}

/**
 * Call a callback with as many of (element, index) as it accepts,
 * so both 整活（x） and 整活（x，i） work with 映射/过滤/….
 */
function callWithIndex(ctx: CallContext, fn: CaoValue, value: CaoValue, index: number): CaoValue {
  const args = fn.type === "function" && fn.params.length >= 2 ? [value, caoNumber(index)] : [value];
  return ctx.call(fn, args);
}

function compareValues(a: CaoValue, b: CaoValue): number {
  if (a.type === "number" && b.type === "number") return a.value - b.value;
  if (a.type === "string" && b.type === "string") return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
  throw typeError(`排序只会比较数字和数字、字符串和字符串，${TYPE_NAMES[a.type]}和${TYPE_NAMES[b.type]}比不了`);
}

// ---- Builtins ----

export function registerBuiltins(env: Environment, output: OutputFn): void {
  const builtins: CaoBuiltin[] = [
    // ---- 基础 Basics ----
    {
      type: "builtin",
      name: "喊话",
      arity: null, // variadic
      call: (args) => {
        const text = args.map((a) => displayValue(a)).join(" ");
        output(text);
        return CAO_NULL;
      },
    },
    {
      type: "builtin",
      name: "类型",
      arity: 1,
      call: (args) => caoString(TYPE_NAMES[args[0].type]),
    },
    {
      type: "builtin",
      name: "长度",
      arity: 1,
      call: (args) => {
        const val = args[0];
        if (val.type === "string") return caoNumber(chars(val.value).length);
        if (val.type === "array") return caoNumber(val.elements.length);
        if (val.type === "dict") return caoNumber(val.entries.size);
        throw typeError("长度只能用在字符串、数组和字典上");
      },
    },
    {
      type: "builtin",
      name: "数字化",
      arity: 1,
      call: (args) => {
        const val = args[0];
        if (val.type === "number") return val;
        const str = expectString("数字化", val);
        const num = Number(str);
        if (str.trim() === "" || isNaN(num)) {
          throw new Error(`这玩意儿转不了数字: "${str}"`);
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

    // ---- 数组 Arrays ----
    {
      type: "builtin",
      name: "推入",
      arity: 2,
      call: (args) => {
        const arr = expectArray("推入", args[0]);
        arr.elements.push(args[1]);
        return arr;
      },
    },
    {
      type: "builtin",
      name: "弹出",
      arity: 1,
      call: (args) => {
        const arr = expectArray("弹出", args[0]);
        if (arr.elements.length === 0) {
          throw new Error("数组都空了还弹什么弹");
        }
        return arr.elements.pop()!;
      },
    },
    {
      type: "builtin",
      name: "切片",
      arity: [2, 3],
      call: (args) => {
        const val = args[0];
        const start = expectNumber("切片", args[1]);
        const end = args[2] === undefined ? undefined : expectNumber("切片", args[2]);
        if (val.type === "string") {
          return caoString(chars(val.value).slice(start, end).join(""));
        }
        if (val.type === "array") {
          return caoArray(val.elements.slice(start, end));
        }
        throw typeError("切片只能用在字符串和数组上");
      },
    },
    {
      type: "builtin",
      name: "范围",
      arity: [1, 3],
      call: (args) => {
        // 范围（n） → 0..n-1；范围（a，b） → a..b-1；范围（a，b，步长）
        const nums = args.map((a) => expectNumber("范围", a));
        const [start, end, step] = nums.length === 1 ? [0, nums[0], 1] : [nums[0], nums[1], nums[2] ?? 1];
        if (step === 0) throw new Error("步长是0？原地踏步卷到天荒地老是吧");
        const out: CaoValue[] = [];
        for (let i = start; step > 0 ? i < end : i > end; i += step) {
          out.push(caoNumber(i));
          if (out.length > 10_000_000) throw new Error("范围太大了，内存要被你卷爆了");
        }
        return caoArray(out);
      },
    },
    {
      type: "builtin",
      name: "映射",
      arity: 2,
      call: (args, ctx) => {
        const arr = expectArray("映射", args[0]);
        const fn = expectCallable("映射", args[1]);
        return caoArray(arr.elements.map((v, i) => callWithIndex(ctx, fn, v, i)));
      },
    },
    {
      type: "builtin",
      name: "过滤",
      arity: 2,
      call: (args, ctx) => {
        const arr = expectArray("过滤", args[0]);
        const fn = expectCallable("过滤", args[1]);
        return caoArray(arr.elements.filter((v, i) => isTruthy(callWithIndex(ctx, fn, v, i))));
      },
    },
    {
      // 内卷：把一整个数组卷成一个值（reduce）
      type: "builtin",
      name: "内卷",
      arity: [2, 3],
      call: (args, ctx) => {
        const arr = expectArray("内卷", args[0]);
        const fn = expectCallable("内卷", args[1]);
        let items = arr.elements;
        let acc: CaoValue;
        if (args.length === 3) {
          acc = args[2];
        } else {
          if (items.length === 0) throw new Error("空数组卷不起来，给个初始值吧");
          acc = items[0];
          items = items.slice(1);
        }
        for (const item of items) acc = ctx.call(fn, [acc, item]);
        return acc;
      },
    },
    {
      type: "builtin",
      name: "找找",
      arity: 2,
      call: (args, ctx) => {
        const arr = expectArray("找找", args[0]);
        const fn = expectCallable("找找", args[1]);
        const found = arr.elements.find((v, i) => isTruthy(callWithIndex(ctx, fn, v, i)));
        return found ?? CAO_NULL;
      },
    },
    {
      type: "builtin",
      name: "排序",
      arity: [1, 2],
      call: (args, ctx) => {
        // Returns a new array; with a function, it compares two items like JS sort
        const arr = expectArray("排序", args[0]);
        const fn = args[1] ? expectCallable("排序", args[1]) : null;
        const sorted = [...arr.elements].sort((a, b) =>
          fn ? expectNumber("排序的比较函数结果", ctx.call(fn, [a, b])) : compareValues(a, b),
        );
        return caoArray(sorted);
      },
    },
    {
      type: "builtin",
      name: "反转",
      arity: 1,
      call: (args) => {
        const val = args[0];
        if (val.type === "string") return caoString(chars(val.value).reverse().join(""));
        return caoArray([...expectArray("反转", val).elements].reverse());
      },
    },
    {
      // 躺平：把嵌套数组压平一层（flatten）
      type: "builtin",
      name: "躺平",
      arity: 1,
      call: (args) => {
        const arr = expectArray("躺平", args[0]);
        return caoArray(arr.elements.flatMap((v) => (v.type === "array" ? v.elements : [v])));
      },
    },
    {
      type: "builtin",
      name: "去重",
      arity: 1,
      call: (args) => {
        const arr = expectArray("去重", args[0]);
        const out: CaoValue[] = [];
        for (const v of arr.elements) {
          if (!out.some((u) => isEqual(u, v))) out.push(v);
        }
        return caoArray(out);
      },
    },
    {
      type: "builtin",
      name: "包含",
      arity: 2,
      call: (args) => {
        const [container, item] = args;
        if (container.type === "array") return caoBoolean(container.elements.some((v) => isEqual(v, item)));
        if (container.type === "string") return caoBoolean(container.value.includes(expectString("包含", item)));
        if (container.type === "dict") return caoBoolean(container.entries.has(displayValue(item)));
        throw typeError("包含只能用在数组、字符串和字典上");
      },
    },
    {
      type: "builtin",
      name: "查找",
      arity: 2,
      call: (args) => {
        // Index of the first match, or -1
        const [container, item] = args;
        if (container.type === "array") return caoNumber(container.elements.findIndex((v) => isEqual(v, item)));
        const str = expectString("查找", container);
        const idx = str.indexOf(expectString("查找", item));
        return caoNumber(idx < 0 ? -1 : chars(str.slice(0, idx)).length);
      },
    },
    {
      type: "builtin",
      name: "随便挑",
      arity: 1,
      call: (args) => {
        const arr = expectArray("随便挑", args[0]);
        if (arr.elements.length === 0) throw new Error("空数组让我挑啥？挑个寂寞");
        return arr.elements[Math.floor(Math.random() * arr.elements.length)];
      },
    },
    {
      type: "builtin",
      name: "洗牌",
      arity: 1,
      call: (args) => {
        const out = [...expectArray("洗牌", args[0]).elements];
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return caoArray(out);
      },
    },

    // ---- 字符串 Strings ----
    {
      type: "builtin",
      name: "分割",
      arity: [1, 2],
      call: (args) => {
        const str = expectString("分割", args[0]);
        const sep = args[1] === undefined ? "" : expectString("分割", args[1]);
        const parts = sep === "" ? chars(str) : str.split(sep);
        return caoArray(parts.map(caoString));
      },
    },
    {
      type: "builtin",
      name: "拼接",
      arity: [1, 2],
      call: (args) => {
        const arr = expectArray("拼接", args[0]);
        const sep = args[1] === undefined ? "" : expectString("拼接", args[1]);
        return caoString(arr.elements.map((v) => displayValue(v)).join(sep));
      },
    },
    {
      type: "builtin",
      name: "替换",
      arity: 3,
      call: (args) => {
        const str = expectString("替换", args[0]);
        return caoString(str.split(expectString("替换", args[1])).join(expectString("替换", args[2])));
      },
    },
    {
      type: "builtin",
      name: "去空格",
      arity: 1,
      call: (args) => caoString(expectString("去空格", args[0]).trim()),
    },
    {
      type: "builtin",
      name: "大写",
      arity: 1,
      call: (args) => caoString(expectString("大写", args[0]).toUpperCase()),
    },
    {
      type: "builtin",
      name: "小写",
      arity: 1,
      call: (args) => caoString(expectString("小写", args[0]).toLowerCase()),
    },
    {
      type: "builtin",
      name: "开头是",
      arity: 2,
      call: (args) => caoBoolean(expectString("开头是", args[0]).startsWith(expectString("开头是", args[1]))),
    },
    {
      type: "builtin",
      name: "结尾是",
      arity: 2,
      call: (args) => caoBoolean(expectString("结尾是", args[0]).endsWith(expectString("结尾是", args[1]))),
    },
    {
      type: "builtin",
      name: "重复",
      arity: 2,
      call: (args) => {
        const times = expectNumber("重复", args[1]);
        if (times < 0) throw new Error("重复负数次？时光倒流是吧");
        return caoString(expectString("重复", args[0]).repeat(times));
      },
    },

    // ---- 字典 Dicts ----
    {
      type: "builtin",
      name: "键们",
      arity: 1,
      call: (args) => caoArray([...expectDict("键们", args[0]).entries.keys()].map(caoString)),
    },
    {
      type: "builtin",
      name: "值们",
      arity: 1,
      call: (args) => caoArray([...expectDict("值们", args[0]).entries.values()]),
    },
    {
      type: "builtin",
      name: "删掉",
      arity: 2,
      call: (args) => {
        const dict = expectDict("删掉", args[0]);
        const key = displayValue(args[1]);
        const old = dict.entries.get(key) ?? CAO_NULL;
        dict.entries.delete(key);
        return old;
      },
    },

    // ---- 数学 Math ----
    {
      type: "builtin",
      name: "取整",
      arity: 1,
      call: (args) => caoNumber(Math.floor(expectNumber("取整", args[0]))),
    },
    {
      type: "builtin",
      name: "四舍五入",
      arity: 1,
      call: (args) => caoNumber(Math.round(expectNumber("四舍五入", args[0]))),
    },
    {
      type: "builtin",
      name: "绝对值",
      arity: 1,
      call: (args) => caoNumber(Math.abs(expectNumber("绝对值", args[0]))),
    },
    {
      type: "builtin",
      name: "开方",
      arity: 1,
      call: (args) => {
        const n = expectNumber("开方", args[0]);
        if (n < 0) throw new Error("负数开方？这里不讲虚数，讲虚无");
        return caoNumber(Math.sqrt(n));
      },
    },
    {
      type: "builtin",
      name: "次方",
      arity: 2,
      call: (args) => caoNumber(Math.pow(expectNumber("次方", args[0]), expectNumber("次方", args[1]))),
    },
    {
      type: "builtin",
      name: "最大",
      arity: null,
      call: (args) => {
        const nums = (args.length === 1 && args[0].type === "array" ? args[0].elements : args)
          .map((a) => expectNumber("最大", a));
        if (nums.length === 0) throw new Error("啥都没有，最大个寂寞");
        return caoNumber(Math.max(...nums));
      },
    },
    {
      type: "builtin",
      name: "最小",
      arity: null,
      call: (args) => {
        const nums = (args.length === 1 && args[0].type === "array" ? args[0].elements : args)
          .map((a) => expectNumber("最小", a));
        if (nums.length === 0) throw new Error("啥都没有，最小个寂寞");
        return caoNumber(Math.min(...nums));
      },
    },
    {
      type: "builtin",
      name: "正弦",
      arity: 1,
      call: (args) => caoNumber(Math.sin(expectNumber("正弦", args[0]))),
    },
    {
      type: "builtin",
      name: "余弦",
      arity: 1,
      call: (args) => caoNumber(Math.cos(expectNumber("余弦", args[0]))),
    },
    {
      type: "builtin",
      name: "正切",
      arity: 1,
      call: (args) => caoNumber(Math.tan(expectNumber("正切", args[0]))),
    },
    {
      // 反正切（y，x） is atan2
      type: "builtin",
      name: "反正切",
      arity: [1, 2],
      call: (args) => {
        const y = expectNumber("反正切", args[0]);
        return caoNumber(args.length === 1 ? Math.atan(y) : Math.atan2(y, expectNumber("反正切", args[1])));
      },
    },
    {
      type: "builtin",
      name: "随机整数",
      arity: 2,
      call: (args) => {
        // Inclusive on both ends: 随机整数（1，6） is a die roll
        const lo = Math.ceil(expectNumber("随机整数", args[0]));
        const hi = Math.floor(expectNumber("随机整数", args[1]));
        if (hi < lo) throw new Error("最小值比最大值还大，你这范围不讲武德");
        return caoNumber(lo + Math.floor(Math.random() * (hi - lo + 1)));
      },
    },
  ];

  for (const builtin of builtins) {
    env.define(builtin.name, builtin);
  }
  env.define("圆周率", caoNumber(Math.PI));
}
