import {
  Program, Statement, Expression, AssignmentExpression,
} from "../parser/ast.js";
import { Parser } from "../parser/parser.js";
import { Environment } from "./environment.js";
import {
  CaoValue, CaoBuiltin, CaoDict, CallContext, ModuleInfo, CAO_NULL, ANONYMOUS, TYPE_NAMES,
  caoNumber, caoString, caoBoolean, caoArray, caoDict,
  displayValue, isTruthy, isEqual, chars,
} from "./values.js";
import { registerBuiltins, OutputFn } from "./builtins.js";
import { ModuleLoader } from "./modules.js";
import { CaoError } from "../errors/error-types.js";
import { suggest } from "../errors/suggest.js";
import { SourceLocation } from "../utils/source-location.js";
import {
  EasterEggOptions, checkSocialCredit, countReturns,
  is996Hours, check996Death, throw996Death,
  checkStrictMode, formatStrictViolation,
} from "./easter-eggs.js";

// ---- Control Flow Signals ----

class ReturnSignal {
  constructor(public value: CaoValue) {}
}

class BreakSignal {
  constructor(public loc: SourceLocation) {}
}
class ContinueSignal {
  constructor(public loc: SourceLocation) {}
}

function strayLoopSignal(signal: BreakSignal | ContinueSignal): CaoRuntimeError {
  return new CaoRuntimeError("不在卷里润什么润？润和继续卷只能在循环里用", undefined, signal.loc);
}

// ---- CaoLang Runtime Error ----

export class CaoRuntimeError extends CaoError {
  constructor(message: string, public caoValue?: CaoValue, loc?: SourceLocation) {
    super("运行时错误", message, loc);
    this.name = "CaoRuntimeError";
  }
}

const IMPORT_NAME = "拿来吧你";

// ---- Interpreter ----

export class Interpreter implements CallContext {
  private globalEnv: Environment;
  private callDepth: number = 0;
  private maxCallDepth: number = 1000;
  private output: OutputFn;
  private easterEggs: EasterEggOptions;
  private modules: ModuleLoader | null;
  private moduleCache: Map<string, CaoDict> = new Map();
  private loadingModules: string[] = [];
  /** Exports of the module currently executing (上交 adds to it). */
  private currentExports: Map<string, CaoValue> | null = null;
  /** File currently executing; functions remember it for error reporting. */
  private currentModule: ModuleInfo = { filename: null, source: undefined };

  constructor(options?: {
    output?: OutputFn;
    maxCallDepth?: number;
    easterEggs?: EasterEggOptions;
    modules?: ModuleLoader;
  }) {
    this.output = options?.output ?? ((text) => console.log(text));
    this.maxCallDepth = options?.maxCallDepth ?? 1000;
    this.easterEggs = options?.easterEggs ?? {};
    this.modules = options?.modules ?? null;
    this.globalEnv = new Environment();
    registerBuiltins(this.globalEnv, this.output);
  }

  run(program: Program, source?: string, filename?: string): CaoValue {
    // 严厉 (Strict) Mode: check for ASCII punctuation
    if (this.easterEggs.strict && source) {
      const violations = checkStrictMode(source);
      if (violations.length > 0) {
        throw new CaoRuntimeError(formatStrictViolation(violations));
      }
    }
    // The main program runs directly in the global scope so the REPL keeps
    // its variables between lines.
    this.globalEnv.define(IMPORT_NAME, this.makeImporter(filename ?? null));
    this.currentModule = { filename: filename ?? null, source };
    // Track the main file too, so importing it back is reported as 套娃
    if (filename) this.loadingModules.push(filename);
    try {
      return this.runTopLevel(program, this.globalEnv);
    } finally {
      if (filename) this.loadingModules.pop();
    }
  }

  /** Call any CaoLang callable. Builtins use this to call user functions. */
  call(callee: CaoValue, args: CaoValue[]): CaoValue {
    if (callee.type === "builtin") {
      checkArity(callee, args.length);
      try {
        return callee.call(args, this);
      } catch (e) {
        // Builtins throw plain Errors; make them catchable by 真香/草
        if (e instanceof Error && !(e instanceof CaoError)) {
          throw new CaoRuntimeError(e.message);
        }
        throw e;
      }
    }

    if (callee.type === "function") {
      if (args.length !== callee.params.length) {
        throw new CaoRuntimeError(
          `参数数量不对，「${callee.name}」需要${callee.params.length}个，你给了${args.length}个，搞什么飞机`,
        );
      }
      if (this.callDepth >= this.maxCallDepth) {
        throw new CaoRuntimeError("卷太狠了，栈都溢出了");
      }

      const callEnv = new Environment(callee.closure);
      for (let i = 0; i < callee.params.length; i++) {
        callEnv.define(callee.params[i], args[i]);
      }

      this.callDepth++;
      try {
        this.execBlock(callee.body.body, callEnv);
      } catch (e) {
        if (e instanceof ReturnSignal) return e.value;
        let error = e;
        if (e instanceof BreakSignal || e instanceof ContinueSignal) error = strayLoopSignal(e);
        // The JS stack can run out before maxCallDepth does
        if (e instanceof RangeError) error = new CaoRuntimeError("卷太狠了，栈都溢出了");
        // The error happened in this function's body, so it belongs to its file
        if (error instanceof CaoError && !error.filename && callee.module?.filename) {
          error.filename = callee.module.filename;
          error.source = callee.module.source;
        }
        throw error;
      } finally {
        this.callDepth--;
      }
      return CAO_NULL;
    }

    throw new CaoRuntimeError(`这玩意儿不能被调用: ${displayValue(callee)}（${TYPE_NAMES[callee.type]}）`);
  }

  // ---- Modules ----

  private runTopLevel(program: Program, env: Environment): CaoValue {
    try {
      return this.execBlock(program.body, env);
    } catch (e) {
      // A top-level 栓Q just ends the file early
      if (e instanceof ReturnSignal) return e.value;
      if (e instanceof BreakSignal || e instanceof ContinueSignal) throw strayLoopSignal(e);
      throw e;
    }
  }

  /** Build the 拿来吧你 builtin for code living in `fromFile`. */
  private makeImporter(fromFile: string | null): CaoBuiltin {
    return {
      type: "builtin",
      name: IMPORT_NAME,
      arity: 1,
      call: (args) => {
        const spec = args[0];
        if (spec.type !== "string") {
          throw new CaoRuntimeError("类型不对啊兄弟，别乱搞：拿来吧你 要一个文件路径字符串");
        }
        return this.importModule(spec.value, fromFile);
      },
    };
  }

  private importModule(specifier: string, fromFile: string | null): CaoDict {
    if (specifier.startsWith("npm:") || specifier.startsWith("node:")) {
      throw new CaoRuntimeError("解释器拿不了 npm 包，去掉 --解释 用编译模式跑");
    }
    if (!this.modules) {
      throw new CaoRuntimeError("拿来吧你……拿了个寂寞：这个环境不支持引入文件");
    }
    const path = this.modules.resolve(specifier, fromFile);

    const cached = this.moduleCache.get(path);
    if (cached) return cached;

    if (this.loadingModules.includes(path)) {
      const cycle = [...this.loadingModules.slice(this.loadingModules.indexOf(path)), path];
      throw new CaoRuntimeError(`套娃了兄弟：${cycle.map(baseName).join(" → ")}`);
    }

    let source: string;
    try {
      source = this.modules.read(path);
    } catch {
      throw new CaoRuntimeError(`拿来吧你……拿了个寂寞：找不到文件「${specifier}」`);
    }

    const exports = new Map<string, CaoValue>();
    const moduleEnv = new Environment(this.globalEnv);
    moduleEnv.define(IMPORT_NAME, this.makeImporter(path));

    const savedExports = this.currentExports;
    const savedModule = this.currentModule;
    this.loadingModules.push(path);
    this.currentExports = exports;
    this.currentModule = { filename: path, source };
    try {
      const program = Parser.fromSource(source).parse();
      this.runTopLevel(program, moduleEnv);
    } catch (e) {
      // Remember where the error happened so it can be shown with the right file
      if (e instanceof CaoError && !e.filename) {
        e.filename = path;
        e.source = source;
      }
      throw e;
    } finally {
      this.currentExports = savedExports;
      this.currentModule = savedModule;
      this.loadingModules.pop();
    }

    const moduleValue = caoDict(exports);
    this.moduleCache.set(path, moduleValue);
    return moduleValue;
  }

  // ---- Statements ----

  private execBlock(statements: Statement[], env: Environment): CaoValue {
    let result: CaoValue = CAO_NULL;
    for (const stmt of statements) {
      result = this.execStatement(stmt, env);
    }
    return result;
  }

  private execStatement(stmt: Statement, env: Environment): CaoValue {
    try {
      return this.execStatementInner(stmt, env);
    } catch (e) {
      // Errors without a more precise position get the statement's
      if (e instanceof CaoError && !e.loc) e.loc = stmt.loc;
      throw e;
    }
  }

  private execStatementInner(stmt: Statement, env: Environment): CaoValue {
    switch (stmt.type) {
      case "VariableDeclaration":
        return this.execVariableDeclaration(stmt, env);
      case "FunctionDeclaration":
        return this.execFunctionDeclaration(stmt, env);
      case "BlockStatement":
        return this.execBlock(stmt.body, new Environment(env));
      case "IfStatement":
        return this.execIfStatement(stmt, env);
      case "WhileStatement":
        return this.execWhileStatement(stmt, env);
      case "ForEachStatement":
        return this.execForEachStatement(stmt, env);
      case "ExportStatement":
        return this.execExportStatement(stmt, env);
      case "ReturnStatement": {
        const value = stmt.value ? this.evalExpr(stmt.value, env) : CAO_NULL;
        throw new ReturnSignal(value);
      }
      case "BreakStatement":
        throw new BreakSignal(stmt.loc);
      case "ContinueStatement":
        throw new ContinueSignal(stmt.loc);
      case "PassStatement":
        return CAO_NULL;
      case "ThrowStatement":
        return this.execThrowStatement(stmt, env);
      case "TryCatchStatement":
        return this.execTryCatch(stmt, env);
      case "ExpressionStatement":
        return this.evalExpr(stmt.expression, env);
      default:
        throw new CaoRuntimeError(`未知的语句类型`);
    }
  }

  private execVariableDeclaration(
    stmt: Extract<Statement, { type: "VariableDeclaration" }>,
    env: Environment,
  ): CaoValue {
    const value = this.evalExpr(stmt.initializer, env);
    env.define(stmt.name, value);
    return CAO_NULL;
  }

  private execFunctionDeclaration(
    stmt: Extract<Statement, { type: "FunctionDeclaration" }>,
    env: Environment,
  ): CaoValue {
    // Social Credit System: check return count
    if (this.easterEggs.socialCredit) {
      const returns = countReturns(stmt.body);
      checkSocialCredit(stmt.name, returns, this.output);
    }

    const fn: CaoValue = {
      type: "function",
      name: stmt.name,
      params: stmt.params,
      body: stmt.body,
      closure: env,
      module: this.currentModule,
    };
    env.define(stmt.name, fn);
    return CAO_NULL;
  }

  private execExportStatement(
    stmt: Extract<Statement, { type: "ExportStatement" }>,
    env: Environment,
  ): CaoValue {
    this.execStatement(stmt.declaration, env);
    // Exports in the main program have nowhere to go, which is fine
    this.currentExports?.set(stmt.declaration.name, env.get(stmt.declaration.name));
    return CAO_NULL;
  }

  private execIfStatement(
    stmt: Extract<Statement, { type: "IfStatement" }>,
    env: Environment,
  ): CaoValue {
    const condition = this.evalExpr(stmt.condition, env);
    if (isTruthy(condition)) {
      return this.execBlock(stmt.consequent.body, new Environment(env));
    } else if (stmt.alternate) {
      if (stmt.alternate.type === "IfStatement") {
        return this.execIfStatement(stmt.alternate, env);
      }
      return this.execBlock(stmt.alternate.body, new Environment(env));
    }
    return CAO_NULL;
  }

  private execWhileStatement(
    stmt: Extract<Statement, { type: "WhileStatement" }>,
    env: Environment,
  ): CaoValue {
    const in996 = this.easterEggs.mode996 && is996Hours();
    while (isTruthy(this.evalExpr(stmt.condition, env))) {
      // 996 Mode: 1% chance of 猝死 during late-night loops
      if (in996 && check996Death()) {
        throw996Death();
      }
      try {
        this.execBlock(stmt.body.body, new Environment(env));
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof ContinueSignal) continue;
        throw e;
      }
    }
    return CAO_NULL;
  }

  private execForEachStatement(
    stmt: Extract<Statement, { type: "ForEachStatement" }>,
    env: Environment,
  ): CaoValue {
    const iterable = this.evalExpr(stmt.iterable, env);
    let pairs: Array<[CaoValue, CaoValue]>;

    // Snapshot first, so changing the collection inside the loop is safe
    switch (iterable.type) {
      case "array":
        pairs = iterable.elements.map((v, i) => [caoNumber(i), v]);
        break;
      case "string":
        pairs = chars(iterable.value).map((c, i) => [caoNumber(i), caoString(c)]);
        break;
      case "dict":
        // One name: iterate keys. Two names: key and value.
        pairs = [...iterable.entries].map(([k, v]) =>
          stmt.keyName ? [caoString(k), v] : [caoString(k), caoString(k)],
        );
        break;
      default:
        throw new CaoRuntimeError(
          `盘不动：${TYPE_NAMES[iterable.type]}不能盘，只能盘数组、字符串和字典`,
          undefined,
          stmt.iterable.loc,
        );
    }

    for (const [key, value] of pairs) {
      const loopEnv = new Environment(env);
      if (stmt.keyName) loopEnv.define(stmt.keyName, key);
      loopEnv.define(stmt.valueName, value);
      try {
        this.execBlock(stmt.body.body, loopEnv);
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof ContinueSignal) continue;
        throw e;
      }
    }
    return CAO_NULL;
  }

  private execThrowStatement(
    stmt: Extract<Statement, { type: "ThrowStatement" }>,
    env: Environment,
  ): never {
    const value = this.evalExpr(stmt.value, env);
    throw new CaoRuntimeError(displayValue(value), value, stmt.loc);
  }

  private execTryCatch(
    stmt: Extract<Statement, { type: "TryCatchStatement" }>,
    env: Environment,
  ): CaoValue {
    try {
      return this.execBlock(stmt.tryBlock.body, new Environment(env));
    } catch (e) {
      // Only catch CaoLang errors (user-level errors), not signals
      if (e instanceof CaoError) {
        const catchEnv = new Environment(env);
        if (stmt.catchParam) {
          const value = e instanceof CaoRuntimeError && e.caoValue ? e.caoValue : caoString(e.message);
          catchEnv.define(stmt.catchParam, value);
        }
        return this.execBlock(stmt.catchBlock.body, catchEnv);
      }
      throw e; // Re-throw signals and internal errors
    }
  }

  // ---- Expression Evaluation ----

  private evalExpr(expr: Expression, env: Environment): CaoValue {
    switch (expr.type) {
      case "NumericLiteral":
        return caoNumber(expr.value);
      case "StringLiteral":
        return caoString(expr.value);
      case "BooleanLiteral":
        return caoBoolean(expr.value);
      case "NullLiteral":
        return CAO_NULL;
      case "ArrayLiteral":
        return caoArray(expr.elements.map((e) => this.evalExpr(e, env)));
      case "ObjectLiteral": {
        const entries = new Map<string, CaoValue>();
        for (const entry of expr.entries) {
          entries.set(entry.key, this.evalExpr(entry.value, env));
        }
        return caoDict(entries);
      }
      case "FunctionExpression":
        return {
          type: "function", name: ANONYMOUS, params: expr.params, body: expr.body,
          closure: env, module: this.currentModule,
        };
      case "Identifier":
        return this.lookupVariable(expr.name, env, expr.loc);
      case "AssignmentExpression":
        return this.evalAssignment(expr, env);
      case "BinaryExpression":
        return this.evalBinary(expr, env);
      case "LogicalExpression":
        return this.evalLogical(expr, env);
      case "UnaryExpression":
        return this.evalUnary(expr, env);
      case "CallExpression":
        return this.evalCall(expr, env);
      case "IndexExpression":
        return this.getIndex(this.evalExpr(expr.object, env), this.evalExpr(expr.index, env), expr.loc);
      case "MemberExpression":
        return this.getMember(this.evalExpr(expr.object, env), expr.property, expr.loc);
      default:
        throw new CaoRuntimeError(`未知的表达式类型`);
    }
  }

  private lookupVariable(name: string, env: Environment, loc: SourceLocation): CaoValue {
    const value = env.lookup(name);
    if (value !== undefined) return value;
    throw new CaoRuntimeError(this.unknownNameMessage(name, env), undefined, loc);
  }

  private unknownNameMessage(name: string, env: Environment): string {
    const guess = suggest(name, env.names());
    return guess
      ? `这谁啊，不认识: ${name} —— 你是不是想说「${guess}」？`
      : `这谁啊，不认识: ${name}`;
  }

  private evalAssignment(expr: AssignmentExpression, env: Environment): CaoValue {
    const target = expr.target;

    if (target.type === "Identifier") {
      if (env.lookup(target.name) === undefined) {
        throw new CaoRuntimeError(
          `${this.unknownNameMessage(target.name, env)}（新变量要先「搞个」）`,
          undefined,
          target.loc,
        );
      }
      const value = this.applyAssignOp(expr, () => env.get(target.name), env);
      env.set(target.name, value);
      return value;
    }

    if (target.type === "IndexExpression") {
      const object = this.evalExpr(target.object, env);
      const index = this.evalExpr(target.index, env);
      const value = this.applyAssignOp(expr, () => this.getIndex(object, index, target.loc), env);
      this.setIndex(object, index, value, target.loc);
      return value;
    }

    // MemberExpression
    const object = this.evalExpr(target.object, env);
    const value = this.applyAssignOp(expr, () => this.getMember(object, target.property, target.loc), env);
    if (object.type !== "dict") {
      throw new CaoRuntimeError(
        `类型不对啊兄弟，别乱搞：只能给字典加属性，${TYPE_NAMES[object.type]}不行`,
        undefined,
        target.loc,
      );
    }
    object.entries.set(target.property, value);
    return value;
  }

  /** Evaluate the right-hand side, combining with the current value for += etc. */
  private applyAssignOp(expr: AssignmentExpression, current: () => CaoValue, env: Environment): CaoValue {
    if (expr.operator === "=") return this.evalExpr(expr.value, env);
    const left = current();
    const right = this.evalExpr(expr.value, env);
    return this.binaryOp(expr.operator[0], left, right, expr.loc);
  }

  private evalBinary(
    expr: Extract<Expression, { type: "BinaryExpression" }>,
    env: Environment,
  ): CaoValue {
    const left = this.evalExpr(expr.left, env);
    const right = this.evalExpr(expr.right, env);
    return this.binaryOp(expr.operator, left, right, expr.loc);
  }

  private binaryOp(operator: string, left: CaoValue, right: CaoValue, loc: SourceLocation): CaoValue {
    // String concatenation
    if (operator === "+" && (left.type === "string" || right.type === "string")) {
      return caoString(displayValue(left) + displayValue(right));
    }

    // Numeric operations
    if (left.type === "number" && right.type === "number") {
      switch (operator) {
        case "+": return caoNumber(left.value + right.value);
        case "-": return caoNumber(left.value - right.value);
        case "*": return caoNumber(left.value * right.value);
        case "/":
          if (right.value === 0) {
            throw new CaoRuntimeError("除以零？脑子瓦特了？", undefined, loc);
          }
          return caoNumber(left.value / right.value);
        case "%":
          if (right.value === 0) {
            throw new CaoRuntimeError("除以零？脑子瓦特了？", undefined, loc);
          }
          return caoNumber(left.value % right.value);
        case "<": return caoBoolean(left.value < right.value);
        case ">": return caoBoolean(left.value > right.value);
        case "<=": return caoBoolean(left.value <= right.value);
        case ">=": return caoBoolean(left.value >= right.value);
      }
    }

    // Array concatenation
    if (operator === "+" && left.type === "array" && right.type === "array") {
      return caoArray([...left.elements, ...right.elements]);
    }

    // Equality (works on all types)
    if (operator === "==") return caoBoolean(isEqual(left, right));
    if (operator === "!=") return caoBoolean(!isEqual(left, right));

    // String comparison
    if (left.type === "string" && right.type === "string") {
      switch (operator) {
        case "<": return caoBoolean(left.value < right.value);
        case ">": return caoBoolean(left.value > right.value);
        case "<=": return caoBoolean(left.value <= right.value);
        case ">=": return caoBoolean(left.value >= right.value);
      }
    }

    throw new CaoRuntimeError(
      `类型不对啊兄弟，别乱搞：不能对 ${TYPE_NAMES[left.type]}「${displayValue(left)}」和 ${TYPE_NAMES[right.type]}「${displayValue(right)}」执行 '${operator}'`,
      undefined,
      loc,
    );
  }

  private evalLogical(
    expr: Extract<Expression, { type: "LogicalExpression" }>,
    env: Environment,
  ): CaoValue {
    const left = this.evalExpr(expr.left, env);
    if (expr.operator === "或者") {
      return isTruthy(left) ? left : this.evalExpr(expr.right, env);
    }
    // 并且
    return isTruthy(left) ? this.evalExpr(expr.right, env) : left;
  }

  private evalUnary(
    expr: Extract<Expression, { type: "UnaryExpression" }>,
    env: Environment,
  ): CaoValue {
    const operand = this.evalExpr(expr.operand, env);
    if (expr.operator === "非") {
      return caoBoolean(!isTruthy(operand));
    }
    if (expr.operator === "-") {
      if (operand.type !== "number") {
        throw new CaoRuntimeError("类型不对啊兄弟，别乱搞：负号只能用在数字上", undefined, expr.loc);
      }
      return caoNumber(-operand.value);
    }
    throw new CaoRuntimeError(`未知的一元运算符: ${expr.operator}`);
  }

  private evalCall(
    expr: Extract<Expression, { type: "CallExpression" }>,
    env: Environment,
  ): CaoValue {
    let callee: CaoValue;
    let args: CaoValue[];

    if (expr.callee.type === "MemberExpression") {
      // x.f（a） — call a function stored in dict x, otherwise sugar for f（x，a）
      const object = this.evalExpr(expr.callee.object, env);
      const name = expr.callee.property;
      const own = object.type === "dict" ? object.entries.get(name) : undefined;
      args = expr.arguments.map((a) => this.evalExpr(a, env));
      if (own !== undefined) {
        callee = own;
      } else {
        const fn = env.lookup(name);
        if (fn === undefined) {
          throw new CaoRuntimeError(this.unknownNameMessage(name, env), undefined, expr.callee.loc);
        }
        callee = fn;
        args.unshift(object);
      }
    } else {
      callee = this.evalExpr(expr.callee, env);
      args = expr.arguments.map((a) => this.evalExpr(a, env));
    }

    try {
      return this.call(callee, args);
    } catch (e) {
      if (e instanceof CaoError && !e.loc) e.loc = expr.loc;
      throw e;
    }
  }

  private getIndex(object: CaoValue, index: CaoValue, loc: SourceLocation): CaoValue {
    if (object.type === "array" && index.type === "number") {
      const idx = Math.floor(index.value);
      if (idx < 0 || idx >= object.elements.length) {
        throw new CaoRuntimeError(`越界了兄弟，别越线：下标 ${idx}，但只有 ${object.elements.length} 个`, undefined, loc);
      }
      return object.elements[idx];
    }

    if (object.type === "string" && index.type === "number") {
      const idx = Math.floor(index.value);
      const cs = chars(object.value);
      if (idx < 0 || idx >= cs.length) {
        throw new CaoRuntimeError(`越界了兄弟，别越线：下标 ${idx}，但只有 ${cs.length} 个字`, undefined, loc);
      }
      return caoString(cs[idx]);
    }

    if (object.type === "dict") {
      return object.entries.get(dictKey(index, loc)) ?? CAO_NULL;
    }

    if (object.type === "null") {
      throw new CaoRuntimeError("对着虚无取下标？你在凝视深渊", undefined, loc);
    }

    throw new CaoRuntimeError(
      `类型不对啊兄弟，别乱搞：${TYPE_NAMES[object.type]}不能用下标`,
      undefined,
      loc,
    );
  }

  private setIndex(object: CaoValue, index: CaoValue, value: CaoValue, loc: SourceLocation): void {
    if (object.type === "array" && index.type === "number") {
      const idx = Math.floor(index.value);
      if (idx < 0 || idx >= object.elements.length) {
        throw new CaoRuntimeError(`越界了兄弟，别越线：下标 ${idx}，但只有 ${object.elements.length} 个`, undefined, loc);
      }
      object.elements[idx] = value;
      return;
    }
    if (object.type === "dict") {
      object.entries.set(dictKey(index, loc), value);
      return;
    }
    if (object.type === "string") {
      throw new CaoRuntimeError("字符串改不了，想改就重新搞个", undefined, loc);
    }
    throw new CaoRuntimeError(`类型不对啊兄弟，别乱搞：${TYPE_NAMES[object.type]}不能用下标赋值`, undefined, loc);
  }

  private getMember(object: CaoValue, property: string, loc: SourceLocation): CaoValue {
    if (object.type === "dict") {
      return object.entries.get(property) ?? CAO_NULL;
    }
    if (object.type === "null") {
      throw new CaoRuntimeError(`对着虚无读「${property}」？你在凝视深渊`, undefined, loc);
    }
    throw new CaoRuntimeError(
      `${TYPE_NAMES[object.type]}没有属性「${property}」，想调用函数的话写 .${property}（）`,
      undefined,
      loc,
    );
  }
}

// ---- Helpers ----

function checkArity(fn: CaoBuiltin, count: number): void {
  if (fn.arity === null) return;
  const [min, max] = typeof fn.arity === "number" ? [fn.arity, fn.arity] : fn.arity;
  if (count < min || count > max) {
    const need = min === max ? `${min}` : `${min}到${max}`;
    throw new CaoRuntimeError(`参数数量不对，「${fn.name}」需要${need}个，你给了${count}个，搞什么飞机`);
  }
}

function dictKey(index: CaoValue, loc: SourceLocation): string {
  if (index.type === "string") return index.value;
  if (index.type === "number") return String(index.value);
  throw new CaoRuntimeError(
    `类型不对啊兄弟，别乱搞：字典的键只能是字符串或数字，不能是${TYPE_NAMES[index.type]}`,
    undefined,
    loc,
  );
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}
