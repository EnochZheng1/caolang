/**
 * Runtime for compiled CaoLang.
 *
 * Compiled code uses native JS values so V8 can run it at full speed:
 *   数字 → number, 字符串 → string, 布尔 → boolean, 虚无 → null (or undefined),
 *   数组 → Array, 字典 → object (null prototype), 函数 → function.
 * Anything else coming from JS (npm) is treated as a 字典 for reading.
 *
 * IMPORTANT: createRuntime must stay completely self-contained — no imports,
 * no references to anything outside the function. `cao build` embeds it into
 * standalone output with Function.prototype.toString().
 */

export interface RuntimeHost {
  output: (text: string) => void;
  /** Errors thrown later from callbacks (e.g. a 一直卷 game loop). Without it they're rethrown. */
  onError?: (error: unknown) => void;
}

export interface CompiledError extends Error {
  isCao: true;
  caoValue?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export function createRuntime(host: RuntimeHost) {
  const output = host.output;

  class CaoError extends Error {
    isCao = true as const;
    caoValue: Any;
    constructor(message: string, caoValue?: Any) {
      super(message);
      this.name = "CaoRuntimeError";
      this.caoValue = caoValue;
    }
  }

  const fail = (message: string): never => {
    throw new CaoError(message);
  };

  // Things to undo when a program is stopped (game loops, event listeners…)
  const cleanups: Array<() => void> = [];
  const onCleanup = (fn: () => void): void => {
    cleanups.push(fn);
  };
  const stop = (): void => {
    while (cleanups.length) cleanups.pop()!();
  };

  /** Call a CaoLang callback from outside the program (a timer, an event), reporting errors. */
  const guard = (fn: Function, args: Any[]): Any => {
    try {
      return fn(...args);
    } catch (e) {
      stop();
      if (host.onError) host.onError(e);
      else throw e;
    }
  };

  const builtinSet = new WeakSet<Function>();

  // ---- Types & display ----

  const isArray = Array.isArray;
  const isDict = (x: Any): boolean => x !== null && typeof x === "object" && !isArray(x);

  const typeName = (x: Any): string => {
    if (x === null || x === undefined) return "虚无";
    switch (typeof x) {
      case "number": return "数字";
      case "string": return "字符串";
      case "boolean": return "布尔";
      case "function": return builtinSet.has(x) ? "内置函数" : "函数";
    }
    return isArray(x) ? "数组" : "字典";
  };

  const display = (x: Any, seen?: Set<Any>): string => {
    if (x === null || x === undefined) return "虚无";
    switch (typeof x) {
      case "string": return x;
      case "number": return String(x);
      case "boolean": return x ? "确实" : "没有内味";
      case "function":
        return builtinSet.has(x) ? `<内置 ${x.name}>` : `<整活 ${x.name || "无名氏"}>`;
      case "bigint": return String(x);
    }
    seen = seen ?? new Set();
    if (seen.has(x)) return isArray(x) ? "[套娃]" : "「套娃」";
    seen.add(x);
    try {
      if (isArray(x)) return `[${x.map((e: Any) => display(e, seen)).join("，")}]`;
      const parts = Object.keys(x).map((k) => `${k}：${display(x[k], seen)}`);
      return `「${parts.join("，")}」`;
    } finally {
      seen.delete(x);
    }
  };

  const truthy = (x: Any): boolean => {
    if (x === true) return true;
    if (x === false || x === null || x === undefined) return false;
    switch (typeof x) {
      case "number": return x !== 0;
      case "string": return x.length > 0;
    }
    if (isArray(x)) return x.length > 0;
    if (typeof x === "object") return Object.keys(x).length > 0;
    return true;
  };

  const eq = (a: Any, b: Any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return a == null && b == null;
    if (typeof a !== "object" || typeof b !== "object") return false;
    if (isArray(a)) {
      if (!isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
      return true;
    }
    if (isArray(b)) return false;
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    for (const k of ka) {
      if (!(k in b) || !eq(a[k], b[k])) return false;
    }
    return true;
  };

  // Strings are indexed by full characters (so "😂" is one). Cache the last
  // split, since loops tend to index the same string over and over.
  let lastString = "";
  let lastChars: string[] = [];
  const chars = (s: string): string[] => {
    if (s !== lastString) {
      lastString = s;
      lastChars = [...s];
    }
    return lastChars;
  };

  // ---- Operators ----

  const opError = (op: string, a: Any, b: Any): never =>
    fail(`类型不对啊兄弟，别乱搞：不能对 ${typeName(a)}「${display(a)}」和 ${typeName(b)}「${display(b)}」执行 '${op}'`);

  const add = (a: Any, b: Any): Any => {
    if (typeof a === "number" && typeof b === "number") return a + b;
    if (typeof a === "string" || typeof b === "string") return display(a) + display(b);
    if (isArray(a) && isArray(b)) return a.concat(b);
    return opError("+", a, b);
  };
  const sub = (a: Any, b: Any): Any =>
    typeof a === "number" && typeof b === "number" ? a - b : opError("-", a, b);
  const mul = (a: Any, b: Any): Any =>
    typeof a === "number" && typeof b === "number" ? a * b : opError("*", a, b);
  const div = (a: Any, b: Any): Any => {
    if (typeof a !== "number" || typeof b !== "number") return opError("/", a, b);
    if (b === 0) fail("除以零？脑子瓦特了？");
    return a / b;
  };
  const mod = (a: Any, b: Any): Any => {
    if (typeof a !== "number" || typeof b !== "number") return opError("%", a, b);
    if (b === 0) fail("除以零？脑子瓦特了？");
    return a % b;
  };
  const compare = (op: string, a: Any, b: Any): number => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
    return opError(op, a, b);
  };
  const lt = (a: Any, b: Any): boolean =>
    typeof a === "number" && typeof b === "number" ? a < b : compare("<", a, b) < 0;
  const gt = (a: Any, b: Any): boolean =>
    typeof a === "number" && typeof b === "number" ? a > b : compare(">", a, b) > 0;
  const le = (a: Any, b: Any): boolean =>
    typeof a === "number" && typeof b === "number" ? a <= b : compare("<=", a, b) <= 0;
  const ge = (a: Any, b: Any): boolean =>
    typeof a === "number" && typeof b === "number" ? a >= b : compare(">=", a, b) >= 0;
  const neg = (a: Any): Any =>
    typeof a === "number" ? -a : fail("类型不对啊兄弟，别乱搞：负号只能用在数字上");

  const arith: Record<string, (a: Any, b: Any) => Any> = { "+": add, "-": sub, "*": mul, "/": div };

  // ---- Member & index access ----

  const get = (o: Any, k: string): Any => {
    if (o !== null && (typeof o === "object" || typeof o === "function") && !isArray(o)) {
      const v = o[k];
      return v === undefined ? null : v;
    }
    if (o == null) return fail(`对着虚无读「${k}」？你在凝视深渊`);
    return fail(`${typeName(o)}没有属性「${k}」，想调用函数的话写 .${k}（）`);
  };

  const dictKey = (i: Any): string => {
    if (typeof i === "string") return i;
    if (typeof i === "number") return String(i);
    return fail(`类型不对啊兄弟，别乱搞：字典的键只能是字符串或数字，不能是${typeName(i)}`);
  };

  const index = (o: Any, i: Any): Any => {
    if (isArray(o) && typeof i === "number") {
      const idx = Math.floor(i);
      if (idx < 0 || idx >= o.length) fail(`越界了兄弟，别越线：下标 ${idx}，但只有 ${o.length} 个`);
      return o[idx];
    }
    if (typeof o === "string" && typeof i === "number") {
      const idx = Math.floor(i);
      const cs = chars(o);
      if (idx < 0 || idx >= cs.length) fail(`越界了兄弟，别越线：下标 ${idx}，但只有 ${cs.length} 个字`);
      return cs[idx];
    }
    if (isDict(o)) {
      const v = o[dictKey(i)];
      return v === undefined ? null : v;
    }
    if (o == null) return fail("对着虚无取下标？你在凝视深渊");
    return fail(`类型不对啊兄弟，别乱搞：${typeName(o)}不能用下标`);
  };

  const setIndex = (o: Any, i: Any, v: Any): Any => {
    if (isArray(o) && typeof i === "number") {
      const idx = Math.floor(i);
      if (idx < 0 || idx >= o.length) fail(`越界了兄弟，别越线：下标 ${idx}，但只有 ${o.length} 个`);
      return (o[idx] = v);
    }
    if (isDict(o)) return (o[dictKey(i)] = v);
    if (typeof o === "string") return fail("字符串改不了，想改就重新搞个");
    return fail(`类型不对啊兄弟，别乱搞：${typeName(o)}不能用下标赋值`);
  };

  const setMember = (o: Any, k: string, v: Any): Any => {
    if (isDict(o) || typeof o === "function") return (o[k] = v);
    return fail(`类型不对啊兄弟，别乱搞：只能给字典加属性，${typeName(o)}不行`);
  };

  const compoundIndex = (o: Any, i: Any, op: string, v: Any): Any => setIndex(o, i, arith[op](index(o, i), v));
  const compoundMember = (o: Any, k: string, op: string, v: Any): Any => setMember(o, k, arith[op](get(o, k), v));

  /**
   * x.f（args）: a function stored on x (dicts and JS objects) wins;
   * otherwise it's sugar for f（x，args）.
   */
  const callMethod = (o: Any, name: string, fallback: Any, args: Any[]): Any => {
    if (o !== null && (typeof o === "object" || typeof o === "function") && !isArray(o)) {
      const own = o[name];
      if (typeof own === "function") return own.apply(o, args);
      if (own !== undefined && own !== null) return fail(`这玩意儿不能被调用: ${display(own)}（${typeName(own)}）`);
    }
    if (fallback === undefined) return fail(`这谁啊，不认识: ${name}`);
    if (typeof fallback !== "function") return fail(`这玩意儿不能被调用: ${display(fallback)}（${typeName(fallback)}）`);
    return fallback(o, ...args);
  };

  /** Snapshot what 盘它 iterates: [keys or null (use the index), values]. */
  const items = (x: Any, twoNames: boolean): [Any[] | null, Any[]] => {
    if (isArray(x)) return [null, x.slice()];
    if (typeof x === "string") return [null, [...x]];
    if (isDict(x)) {
      const keys = Object.keys(x);
      return [keys, twoNames ? keys.map((k) => x[k]) : keys];
    }
    return fail(`盘不动：${typeName(x)}不能盘，只能盘数组、字符串和字典`);
  };

  // ---- Errors ----

  const raise = (v: Any): CaoError => new CaoError(display(v), v);

  const unmangle = (name: string): string => name.replace(/\$$/, "");

  /** Turn anything thrown (including JS engine errors) into a CaoLang error. */
  const toCaoError = (e: Any): CaoError => {
    if (e instanceof CaoError) return e;
    if (e instanceof RangeError && /call stack/i.test(e.message)) return new CaoError("卷太狠了，栈都溢出了");
    if (e instanceof ReferenceError) {
      const m = /^(?:Cannot access '([^']+)'|([^\s]+) is not defined)/.exec(e.message);
      if (m) return new CaoError(`这谁啊，不认识: ${unmangle(m[1] ?? m[2])}`);
    }
    if (e instanceof TypeError && /is not a function|is not a constructor/.test(e.message)) {
      return new CaoError("这玩意儿不能被调用");
    }
    const err = new CaoError(e instanceof Error ? e.message : display(e), e instanceof Error ? undefined : e);
    if (e instanceof Error) err.stack = e.stack;
    return err;
  };

  /** Value bound by 草（错误）. */
  const caught = (e: Any): Any => {
    const err = toCaoError(e);
    return err.caoValue !== undefined ? err.caoValue : err.message;
  };

  const arity = (name: string, need: number, got: number): never =>
    fail(`参数数量不对，「${name || "无名氏"}」需要${need}个，你给了${got}个，搞什么飞机`);

  const undef = (name: string, guess: string | null, assigning?: boolean): never =>
    fail(
      `这谁啊，不认识: ${name}${guess ? ` —— 你是不是想说「${guess}」？` : ""}${assigning ? "（新变量要先「搞个」）" : ""}`,
    );

  const strayLoop = (): never => fail("不在卷里润什么润？润和继续卷只能在循环里用");

  // ---- Easter eggs ----

  const socialCredit = (name: string, count: number): void => {
    output(`⚠️ 社会信用警告：函数「${name}」里栓Q了${count}次，你也太客气了吧！`);
  };

  const hour = new Date().getHours();
  const late = hour >= 21 || hour < 6;
  const check996 = (): void => {
    if (late && Math.random() < 0.01) {
      fail("💀 猝死！你卷到猝死了！回去睡觉！\n（996模式：深夜写代码有1%概率猝死）");
    }
  };

  // ---- Modules ----

  let moduleNames: string[] = [];
  let moduleFns: Array<(exports: Any) => void> = [];
  const moduleCache = new Map<number, Any>();
  const loading: number[] = [];

  const defineModules = (names: string[], fns: Array<(exports: Any) => void>): void => {
    moduleNames = names;
    moduleFns = fns;
  };

  const require = (i: number): Any => {
    const cached = moduleCache.get(i);
    if (cached) return cached;
    if (loading.includes(i)) {
      const cycle = [...loading.slice(loading.indexOf(i)), i].map((j) => moduleNames[j]);
      fail(`套娃了兄弟：${cycle.join(" → ")}`);
    }
    const exports = Object.create(null);
    loading.push(i);
    try {
      moduleFns[i](exports);
    } finally {
      loading.pop();
    }
    moduleCache.set(i, exports);
    return exports;
  };

  const noLoader = (): never => fail("拿来吧你……拿了个寂寞：这个环境不支持引入文件");
  const missingModule = (spec: string): never => fail(`拿来吧你……拿了个寂寞：找不到文件「${spec}」`);
  const dynamicImport = (): never => fail("拿来吧你 只能写死一个路径字符串，比如 拿来吧你（\"./工具\"）");

  /**
   * What 拿来吧你 returns for an imported JS module. For CommonJS that's the
   * real module.exports (Node only detects some of its names statically);
   * for ES modules, the namespace — or the default export if that's all there is.
   */
  const interop = (ns: Any): Any => {
    if (ns === null || typeof ns !== "object") return ns;
    if ("module.exports" in ns) return ns["module.exports"];
    const named = Object.keys(ns).filter((k) => k !== "default");
    const def = ns.default;
    const defIsContainer = def !== null && (typeof def === "object" || typeof def === "function");
    if (defIsContainer && named.every((k) => k in def)) return def;
    return named.length === 0 && def !== undefined ? def : ns;
  };

  // ---- Builtins ----

  const builtins: Record<string, Any> = Object.create(null);

  const def = (name: string, min: number, max: number, impl: (...args: Any[]) => Any): void => {
    const arityError = (n: number): never => {
      const need = min === max ? `${min}` : max === Infinity ? `至少${min}` : `${min}到${max}`;
      return fail(`参数数量不对，「${name}」需要${need}个，你给了${n}个，搞什么飞机`);
    };
    // Builtins are called per pixel in games, so avoid apply() when the
    // implementation takes its arguments as plain parameters (missing ones are undefined)
    const fn = impl.length === max && max <= 6
      ? function (a: Any, b: Any, c: Any, d: Any, e: Any, f: Any) {
        const n = arguments.length;
        if (n < min || n > max) arityError(n);
        return impl(a, b, c, d, e, f);
      }
      : function () {
        const n = arguments.length;
        if (n < min || n > max) arityError(n);
        // eslint-disable-next-line prefer-rest-params
        return impl.apply(null, arguments as unknown as Any[]);
      };
    Object.defineProperty(fn, "name", { value: name });
    builtinSet.add(fn);
    builtins[name] = fn;
  };

  const typeError = (message: string): never => fail(`类型不对啊兄弟，别乱搞：${message}`);
  const arr = (fn: string, v: Any): Any[] => (isArray(v) ? v : typeError(`${fn}要一个数组，你给了${typeName(v)}`));
  const str = (fn: string, v: Any): string =>
    typeof v === "string" ? v : typeError(`${fn}要一个字符串，你给了${typeName(v)}`);
  const num = (fn: string, v: Any): number =>
    typeof v === "number" ? v : typeError(`${fn}要一个数字，你给了${typeName(v)}`);
  const dict = (fn: string, v: Any): Any => (isDict(v) ? v : typeError(`${fn}要一个字典，你给了${typeName(v)}`));
  const callable = (fn: string, v: Any): Function =>
    typeof v === "function" ? v : typeError(`${fn}要一个函数，你给了${typeName(v)}`);
  // Callbacks that take two parameters also get the index
  const callIdx = (fn: Function, v: Any, i: number): Any => (fn.length >= 2 ? fn(v, i) : fn(v));
  const nul = (v: Any): Any => (v === undefined ? null : v);

  // 基础
  def("喊话", 0, Infinity, (...args) => {
    output(args.map((a) => display(a)).join(" "));
    return null;
  });
  def("类型", 1, 1, (v) => typeName(v));
  def("长度", 1, 1, (v) => {
    if (typeof v === "string") return chars(v).length;
    if (isArray(v)) return v.length;
    if (isDict(v)) return Object.keys(v).length;
    return typeError("长度只能用在字符串、数组和字典上");
  });
  def("数字化", 1, 1, (v) => {
    if (typeof v === "number") return v;
    const s = str("数字化", v);
    const n = Number(s);
    if (s.trim() === "" || isNaN(n)) fail(`这玩意儿转不了数字: "${s}"`);
    return n;
  });
  def("字符串化", 1, 1, (v) => display(v));
  def("随机", 0, 0, () => Math.random());
  def("时间戳", 0, 0, () => Date.now());

  // 数组
  def("推入", 2, 2, (a, v) => {
    arr("推入", a).push(v);
    return a;
  });
  def("弹出", 1, 1, (a) => {
    if (arr("弹出", a).length === 0) fail("数组都空了还弹什么弹");
    return a.pop();
  });
  def("切片", 2, 3, (v, start, end) => {
    num("切片", start);
    if (end !== undefined) num("切片", end);
    if (typeof v === "string") return [...v].slice(start, end).join("");
    if (isArray(v)) return v.slice(start, end);
    return typeError("切片只能用在字符串和数组上");
  });
  def("范围", 1, 3, (...args) => {
    const ns = args.map((a) => num("范围", a));
    const [start, end, step] = ns.length === 1 ? [0, ns[0], 1] : [ns[0], ns[1], ns[2] ?? 1];
    if (step === 0) fail("步长是0？原地踏步卷到天荒地老是吧");
    const out: number[] = [];
    for (let i = start; step > 0 ? i < end : i > end; i += step) {
      out.push(i);
      if (out.length > 10_000_000) fail("范围太大了，内存要被你卷爆了");
    }
    return out;
  });
  def("映射", 2, 2, (a, f) => {
    arr("映射", a);
    callable("映射", f);
    const out = new Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = callIdx(f, a[i], i);
    return out;
  });
  def("过滤", 2, 2, (a, f) => {
    arr("过滤", a);
    callable("过滤", f);
    const out = [];
    for (let i = 0; i < a.length; i++) if (truthy(callIdx(f, a[i], i))) out.push(a[i]);
    return out;
  });
  // 内卷：把一整个数组卷成一个值（reduce）
  def("内卷", 2, 3, (a, f, init) => {
    arr("内卷", a);
    callable("内卷", f);
    let i = 0;
    let acc = init;
    if (init === undefined) {
      if (a.length === 0) fail("空数组卷不起来，给个初始值吧");
      acc = a[0];
      i = 1;
    }
    for (; i < a.length; i++) acc = f(acc, a[i]);
    return acc;
  });
  def("找找", 2, 2, (a, f) => {
    arr("找找", a);
    callable("找找", f);
    for (let i = 0; i < a.length; i++) if (truthy(callIdx(f, a[i], i))) return a[i];
    return null;
  });
  def("排序", 1, 2, (a, f) => {
    arr("排序", a);
    if (f !== undefined) callable("排序", f);
    return a.slice().sort((x: Any, y: Any) => {
      if (f) return num("排序的比较函数结果", f(x, y));
      if (typeof x === "number" && typeof y === "number") return x - y;
      if (typeof x === "string" && typeof y === "string") return x < y ? -1 : x > y ? 1 : 0;
      return typeError(`排序只会比较数字和数字、字符串和字符串，${typeName(x)}和${typeName(y)}比不了`);
    });
  });
  def("反转", 1, 1, (v) => (typeof v === "string" ? [...v].reverse().join("") : arr("反转", v).slice().reverse()));
  // 躺平：把嵌套数组压平一层（flatten）
  def("躺平", 1, 1, (a) => arr("躺平", a).flatMap((v: Any) => (isArray(v) ? v : [v])));
  def("去重", 1, 1, (a) => {
    const out: Any[] = [];
    for (const v of arr("去重", a)) if (!out.some((u) => eq(u, v))) out.push(v);
    return out;
  });
  def("包含", 2, 2, (c, v) => {
    if (isArray(c)) return c.some((u: Any) => eq(u, v));
    if (typeof c === "string") return c.includes(str("包含", v));
    if (isDict(c)) return Object.prototype.hasOwnProperty.call(c, display(v));
    return typeError("包含只能用在数组、字符串和字典上");
  });
  def("查找", 2, 2, (c, v) => {
    if (isArray(c)) return c.findIndex((u: Any) => eq(u, v));
    const s = str("查找", c);
    const idx = s.indexOf(str("查找", v));
    return idx < 0 ? -1 : [...s.slice(0, idx)].length;
  });
  def("随便挑", 1, 1, (a) => {
    if (arr("随便挑", a).length === 0) fail("空数组让我挑啥？挑个寂寞");
    return a[Math.floor(Math.random() * a.length)];
  });
  def("洗牌", 1, 1, (a) => {
    const out = arr("洗牌", a).slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  });

  // 字符串
  def("分割", 1, 2, (s, sep) => {
    str("分割", s);
    const by = sep === undefined ? "" : str("分割", sep);
    return by === "" ? [...s] : s.split(by);
  });
  def("拼接", 1, 2, (a, sep) =>
    arr("拼接", a).map((v: Any) => display(v)).join(sep === undefined ? "" : str("拼接", sep)));
  def("替换", 3, 3, (s, from, to) => str("替换", s).split(str("替换", from)).join(str("替换", to)));
  def("去空格", 1, 1, (s) => str("去空格", s).trim());
  def("大写", 1, 1, (s) => str("大写", s).toUpperCase());
  def("小写", 1, 1, (s) => str("小写", s).toLowerCase());
  def("开头是", 2, 2, (s, p) => str("开头是", s).startsWith(str("开头是", p)));
  def("结尾是", 2, 2, (s, p) => str("结尾是", s).endsWith(str("结尾是", p)));
  def("重复", 2, 2, (s, n) => {
    if (num("重复", n) < 0) fail("重复负数次？时光倒流是吧");
    return str("重复", s).repeat(n);
  });

  // 字典
  def("键们", 1, 1, (d) => Object.keys(dict("键们", d)));
  def("值们", 1, 1, (d) => Object.keys(dict("值们", d)).map((k) => d[k]));
  def("删掉", 2, 2, (d, k) => {
    const key = display(k);
    const old = nul(dict("删掉", d)[key]);
    delete d[key];
    return old;
  });

  // 数学
  def("取整", 1, 1, (n) => Math.floor(num("取整", n)));
  def("四舍五入", 1, 1, (n) => Math.round(num("四舍五入", n)));
  def("绝对值", 1, 1, (n) => Math.abs(num("绝对值", n)));
  def("开方", 1, 1, (n) => {
    if (num("开方", n) < 0) fail("负数开方？这里不讲虚数，讲虚无");
    return Math.sqrt(n);
  });
  def("次方", 2, 2, (a, b) => Math.pow(num("次方", a), num("次方", b)));
  const extreme = (name: string, pick: (...n: number[]) => number) =>
    (...args: Any[]) => {
      const ns = (args.length === 1 && isArray(args[0]) ? args[0] : args).map((a: Any) => num(name, a));
      if (ns.length === 0) fail(`啥都没有，${name}个寂寞`);
      return pick(...ns);
    };
  def("最大", 0, Infinity, extreme("最大", Math.max));
  def("最小", 0, Infinity, extreme("最小", Math.min));
  def("正弦", 1, 1, (n) => Math.sin(num("正弦", n)));
  def("余弦", 1, 1, (n) => Math.cos(num("余弦", n)));
  def("正切", 1, 1, (n) => Math.tan(num("正切", n)));
  // 反正切（y，x） is atan2
  def("反正切", 1, 2, (y, x) => (x === undefined ? Math.atan(num("反正切", y)) : Math.atan2(num("反正切", y), num("反正切", x))));
  builtins["圆周率"] = Math.PI;
  def("随机整数", 2, 2, (a, b) => {
    const lo = Math.ceil(num("随机整数", a));
    const hi = Math.floor(num("随机整数", b));
    if (hi < lo) fail("最小值比最大值还大，你这范围不讲武德");
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  });

  return {
    CaoError, builtins, display, typeName, truthy, eq,
    add, sub, mul, div, mod, neg, lt, gt, le, ge,
    get, index, setIndex, setMember, compoundIndex, compoundMember, callMethod, items,
    raise, caught, toCaoError, arity, undef, strayLoop,
    socialCredit, check996, defineModules, require, interop, noLoader, missingModule, dynamicImport,
    // For libraries that add builtins (see stdlib/)
    def, fail, guard, onCleanup, stop, num, str,
  };
}

export type Runtime = ReturnType<typeof createRuntime>;
