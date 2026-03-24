import {
  Program, Statement, Expression, BlockStatement,
} from "../parser/ast.js";
import { Environment } from "./environment.js";
import {
  CaoValue, CAO_NULL,
  caoNumber, caoString, caoBoolean, caoArray,
  displayValue, isTruthy,
} from "./values.js";
import { registerBuiltins, OutputFn } from "./builtins.js";
import {
  EasterEggOptions, checkSocialCredit, countReturns,
  is996Hours, check996Death, throw996Death,
  checkStrictMode, formatStrictViolation,
} from "./easter-eggs.js";

// ---- Control Flow Signals ----

class ReturnSignal {
  constructor(public value: CaoValue) {}
}

class BreakSignal {}
class ContinueSignal {}

// ---- CaoLang Runtime Error ----

export class CaoRuntimeError extends Error {
  constructor(message: string, public caoValue?: CaoValue) {
    super(message);
    this.name = "CaoRuntimeError";
  }
}

// ---- Interpreter ----

export class Interpreter {
  private globalEnv: Environment;
  private callDepth: number = 0;
  private maxCallDepth: number = 1000;
  private output: OutputFn;
  private easterEggs: EasterEggOptions;

  constructor(options?: {
    output?: OutputFn;
    maxCallDepth?: number;
    easterEggs?: EasterEggOptions;
  }) {
    this.output = options?.output ?? ((text) => console.log(text));
    this.maxCallDepth = options?.maxCallDepth ?? 1000;
    this.easterEggs = options?.easterEggs ?? {};
    this.globalEnv = new Environment();
    registerBuiltins(this.globalEnv, this.output);
  }

  run(program: Program, source?: string): CaoValue {
    // 严厉 (Strict) Mode: check for ASCII punctuation
    if (this.easterEggs.strict && source) {
      const violations = checkStrictMode(source);
      if (violations.length > 0) {
        throw new CaoRuntimeError(formatStrictViolation(violations));
      }
    }
    return this.execBlock(program.body, this.globalEnv);
  }

  private execBlock(statements: Statement[], env: Environment): CaoValue {
    let result: CaoValue = CAO_NULL;
    for (const stmt of statements) {
      result = this.execStatement(stmt, env);
    }
    return result;
  }

  private execStatement(stmt: Statement, env: Environment): CaoValue {
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
      case "ReturnStatement": {
        const value = stmt.value ? this.evalExpr(stmt.value, env) : CAO_NULL;
        throw new ReturnSignal(value);
      }
      case "BreakStatement":
        throw new BreakSignal();
      case "ContinueStatement":
        throw new ContinueSignal();
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
    };
    env.define(stmt.name, fn);
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

  private execThrowStatement(
    stmt: Extract<Statement, { type: "ThrowStatement" }>,
    env: Environment,
  ): never {
    const value = this.evalExpr(stmt.value, env);
    throw new CaoRuntimeError(displayValue(value), value);
  }

  private execTryCatch(
    stmt: Extract<Statement, { type: "TryCatchStatement" }>,
    env: Environment,
  ): CaoValue {
    try {
      return this.execBlock(stmt.tryBlock.body, new Environment(env));
    } catch (e) {
      // Only catch CaoRuntimeError (user-level errors), not signals
      if (e instanceof CaoRuntimeError) {
        const catchEnv = new Environment(env);
        if (stmt.catchParam) {
          catchEnv.define(
            stmt.catchParam,
            e.caoValue ?? caoString(e.message),
          );
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
      case "Identifier":
        return env.get(expr.name);
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
        return this.evalIndex(expr, env);
      default:
        throw new CaoRuntimeError(`未知的表达式类型`);
    }
  }

  private evalAssignment(
    expr: Extract<Expression, { type: "AssignmentExpression" }>,
    env: Environment,
  ): CaoValue {
    const value = this.evalExpr(expr.value, env);
    env.set(expr.name, value);
    return value;
  }

  private evalBinary(
    expr: Extract<Expression, { type: "BinaryExpression" }>,
    env: Environment,
  ): CaoValue {
    const left = this.evalExpr(expr.left, env);
    const right = this.evalExpr(expr.right, env);

    // String concatenation
    if (expr.operator === "+" && (left.type === "string" || right.type === "string")) {
      return caoString(displayValue(left) + displayValue(right));
    }

    // Numeric operations
    if (left.type === "number" && right.type === "number") {
      switch (expr.operator) {
        case "+": return caoNumber(left.value + right.value);
        case "-": return caoNumber(left.value - right.value);
        case "*": return caoNumber(left.value * right.value);
        case "/":
          if (right.value === 0) {
            throw new CaoRuntimeError("除以零？脑子瓦特了？");
          }
          return caoNumber(left.value / right.value);
        case "%":
          if (right.value === 0) {
            throw new CaoRuntimeError("除以零？脑子瓦特了？");
          }
          return caoNumber(left.value % right.value);
        case "<": return caoBoolean(left.value < right.value);
        case ">": return caoBoolean(left.value > right.value);
        case "<=": return caoBoolean(left.value <= right.value);
        case ">=": return caoBoolean(left.value >= right.value);
      }
    }

    // Equality (works on all types)
    if (expr.operator === "==") return caoBoolean(this.isEqual(left, right));
    if (expr.operator === "!=") return caoBoolean(!this.isEqual(left, right));

    // String comparison
    if (left.type === "string" && right.type === "string") {
      switch (expr.operator) {
        case "<": return caoBoolean(left.value < right.value);
        case ">": return caoBoolean(left.value > right.value);
        case "<=": return caoBoolean(left.value <= right.value);
        case ">=": return caoBoolean(left.value >= right.value);
      }
    }

    throw new CaoRuntimeError(
      `类型不对啊兄弟，别乱搞：不能对 ${displayValue(left)} 和 ${displayValue(right)} 执行 '${expr.operator}'`,
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
        throw new CaoRuntimeError("类型不对啊兄弟，别乱搞：负号只能用在数字上");
      }
      return caoNumber(-operand.value);
    }
    throw new CaoRuntimeError(`未知的一元运算符: ${expr.operator}`);
  }

  private evalCall(
    expr: Extract<Expression, { type: "CallExpression" }>,
    env: Environment,
  ): CaoValue {
    const callee = this.evalExpr(expr.callee, env);
    const args = expr.arguments.map((a) => this.evalExpr(a, env));

    if (callee.type === "builtin") {
      if (callee.arity !== null && args.length !== callee.arity) {
        throw new CaoRuntimeError(
          `参数数量不对，需要${callee.arity}个，你给了${args.length}个，搞什么飞机`,
        );
      }
      return callee.call(args);
    }

    if (callee.type === "function") {
      if (args.length !== callee.params.length) {
        throw new CaoRuntimeError(
          `参数数量不对，需要${callee.params.length}个，你给了${args.length}个，搞什么飞机`,
        );
      }

      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth = 0;
        throw new CaoRuntimeError("卷太狠了，栈都溢出了");
      }

      const callEnv = new Environment(callee.closure);
      for (let i = 0; i < callee.params.length; i++) {
        callEnv.define(callee.params[i], args[i]);
      }

      try {
        this.execBlock(callee.body.body, callEnv);
      } catch (e) {
        if (e instanceof ReturnSignal) {
          this.callDepth--;
          return e.value;
        }
        this.callDepth--;
        throw e;
      }

      this.callDepth--;
      return CAO_NULL;
    }

    throw new CaoRuntimeError(`这玩意儿不能被调用: ${displayValue(callee)}`);
  }

  private evalIndex(
    expr: Extract<Expression, { type: "IndexExpression" }>,
    env: Environment,
  ): CaoValue {
    const object = this.evalExpr(expr.object, env);
    const index = this.evalExpr(expr.index, env);

    if (object.type === "array" && index.type === "number") {
      const idx = Math.floor(index.value);
      if (idx < 0 || idx >= object.elements.length) {
        throw new CaoRuntimeError("越界了兄弟，别越线");
      }
      return object.elements[idx];
    }

    if (object.type === "string" && index.type === "number") {
      const idx = Math.floor(index.value);
      const chars = [...object.value]; // Handle Unicode correctly
      if (idx < 0 || idx >= chars.length) {
        throw new CaoRuntimeError("越界了兄弟，别越线");
      }
      return caoString(chars[idx]);
    }

    throw new CaoRuntimeError("类型不对啊兄弟，别乱搞：只能对数组和字符串用下标");
  }

  private isEqual(a: CaoValue, b: CaoValue): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
      case "number": return a.value === (b as typeof a).value;
      case "string": return a.value === (b as typeof a).value;
      case "boolean": return a.value === (b as typeof a).value;
      case "null": return true;
      default: return a === b; // Reference equality for arrays/functions
    }
  }
}
