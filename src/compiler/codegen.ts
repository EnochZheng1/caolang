import {
  Program, Statement, Expression, BlockStatement, FunctionDeclaration,
} from "../parser/ast.js";
import { Parser } from "../parser/parser.js";
import { CaoError } from "../errors/error-types.js";
import { suggest } from "../errors/suggest.js";
import { SourceLocation } from "../utils/source-location.js";
import { ModuleLoader } from "../interpreter/modules.js";
import { countReturns } from "../interpreter/easter-eggs.js";
import { createRuntime } from "./runtime.js";

export interface CompileOptions {
  /** Path of the main file (used to resolve 拿来吧你 and in error messages). */
  filename?: string;
  /** Source of the main file, for error messages. */
  source?: string;
  /** Lets 拿来吧你 bundle other .cao files. Without it, imports fail at runtime. */
  modules?: ModuleLoader;
  easterEggs?: { socialCredit?: boolean; mode996?: boolean };
  /** Builtins a host library will add at runtime (e.g. CANVAS_BUILTINS). */
  extraBuiltins?: readonly string[];
}

export interface MappedLocation {
  file: number;
  line: number;
  column: number;
}

export interface CompileResult {
  /** Body of a function taking ($, $npm): the runtime and preloaded npm modules. */
  code: string;
  /** Generated line (1-based) → CaoLang source position. */
  lineMap: Array<MappedLocation | undefined>;
  /** Module index → file. Index 0 is the main program. */
  files: Array<{ name: string; path: string | null; source: string }>;
  /** npm / node specifiers that must be provided in $npm. */
  npm: string[];
}

const BUILTINS = new Set(Object.keys(createRuntime({ output: () => {} }).builtins));
const IMPORT_NAME = "拿来吧你";

// Names a CaoLang identifier can't use as-is in JS. CaoLang identifiers never
// contain "$", so a "$" suffix can't collide with anything the user wrote.
const RESERVED = new Set(
  ("break case catch class const continue debugger default delete do else enum export extends false " +
    "finally for function if import in instanceof new null return super switch this throw true try " +
    "typeof var void while with yield let static implements interface package private protected " +
    "public await async arguments eval undefined NaN Infinity __name")
    .split(" "),
);

const BINARY_HELPERS: Record<string, string> = {
  "+": "add", "-": "sub", "*": "mul", "/": "div", "%": "mod",
  "<": "lt", ">": "gt", "<=": "le", ">=": "ge",
};

const LOC_MARK = "\u0000";

// ---- Scopes ----

class FunctionContext {
  temps = 0;
  loopDepth = 0;
}

class Scope {
  /** CaoLang name → JS name, for everything declared anywhere in this block. */
  names = new Map<string, string>();
  /** Names whose declaration has been emitted (later 搞个 become assignments). */
  declared = new Set<string>();

  constructor(public parent: Scope | null, public fn: FunctionContext) {}

  lookup(name: string, skip?: Scope): string | undefined {
    if (this !== skip) {
      const js = this.names.get(name);
      if (js !== undefined) return js;
    }
    return this.parent?.lookup(name, skip);
  }

  visibleNames(into = new Set<string>()): Set<string> {
    for (const name of this.names.keys()) into.add(name);
    return this.parent ? this.parent.visibleNames(into) : into;
  }

  hasJsName(js: string): boolean {
    for (const v of this.names.values()) if (v === js) return true;
    return this.parent?.hasJsName(js) ?? false;
  }
}

// ---- Compiler ----

export function compile(program: Program, options: CompileOptions = {}): CompileResult {
  return new Compiler(options).compileAll(program);
}

class Compiler {
  private files: Array<{ name: string; source: string; path: string | null }> = [];
  private fileIndex = new Map<string, number>();
  private npm: string[] = [];
  private uid = 0;
  private currentFile = 0;
  /** While compiling `搞个 x = …`, references to x skip the scope being declared into. */
  private initializing: { name: string; scope: Scope } | null = null;
  private builtins: Set<string>;

  constructor(private options: CompileOptions) {
    this.builtins = new Set([...BUILTINS, ...(options.extraBuiltins ?? [])]);
  }

  compileAll(main: Program): CompileResult {
    const mainPath = this.options.filename ?? null;
    this.files.push({ name: baseName(mainPath ?? "main.cao"), source: this.options.source ?? "", path: mainPath });
    if (mainPath) this.fileIndex.set(mainPath, 0);

    const moduleCodes: string[] = [this.compileModule(main, 0)];
    // Imported files are discovered while compiling; keep going until all are done
    for (let i = 1; i < this.files.length; i++) {
      const file = this.files[i];
      let program: Program;
      try {
        program = Parser.fromSource(file.source).parse();
      } catch (e) {
        if (e instanceof CaoError && !e.filename) {
          e.filename = file.path ?? undefined;
          e.source = file.source;
        }
        throw e;
      }
      moduleCodes.push(this.compileModule(program, i));
    }

    const names = this.files.map((f) => f.name);
    const body = [
      `"use strict";`,
      `const $b = $.builtins;`,
      `$.defineModules(${JSON.stringify(names)}, [`,
      ...moduleCodes.map((c) => c + ","),
      `]);`,
      `$.require(0);`,
    ].join("\n");

    // Strip location markers, recording which CaoLang line each JS line came from
    const lineMap: Array<MappedLocation | undefined> = [undefined];
    const lines = body.split("\n").map((line) => {
      if (line.startsWith(LOC_MARK)) {
        const end = line.indexOf(LOC_MARK, 1);
        const [file, l, c] = line.slice(1, end).split(":").map(Number);
        lineMap.push({ file, line: l, column: c });
        return line.slice(end + 1);
      }
      lineMap.push(undefined);
      return line;
    });

    return {
      code: lines.join("\n"),
      lineMap,
      files: this.files,
      npm: this.npm,
    };
  }

  private compileModule(program: Program, fileIdx: number): string {
    this.currentFile = fileIdx;
    const fn = new FunctionContext();
    const scope = new Scope(null, fn);
    const body = this.compileStatements(program.body, scope);
    return [`function ($exports) {`, ...indent(this.tempDecl(fn)), ...indent(body), `}`].join("\n");
  }

  // ---- Statements ----

  /** Compile a block's statements in `scope`, after registering its declarations. */
  private compileStatements(statements: Statement[], scope: Scope): string[] {
    for (const stmt of statements) {
      const decl = stmt.type === "ExportStatement" ? stmt.declaration : stmt;
      if (decl.type === "FunctionDeclaration") this.register(scope, decl.name);
      if (decl.type === "VariableDeclaration") {
        // `搞个 x = x + 1` reads an outer x, so the inner one needs its own JS name
        this.register(scope, decl.name, false, referencesName(decl.initializer, decl.name));
      }
    }
    return statements.flatMap((stmt) => this.compileStatement(stmt, scope));
  }

  /** Give `name` a JS name in `scope` (a fresh one if it must not shadow an outer one). */
  private register(scope: Scope, name: string, prebound = false, unique = false): string {
    let js = scope.names.get(name);
    if (js === undefined) {
      js = mangle(name);
      if (unique && scope.parent?.hasJsName(js)) js = `${js}$${++this.uid}`;
      scope.names.set(name, js);
    }
    if (prebound) scope.declared.add(name);
    return js;
  }

  private compileBlock(block: BlockStatement, scope: Scope): string[] {
    return this.compileStatements(block.body, new Scope(scope, scope.fn));
  }

  private compileStatement(stmt: Statement, scope: Scope): string[] {
    const lines = this.compileStatementInner(stmt, scope);
    // Tag the first line with where it came from, for error messages
    if (lines.length > 0 && !lines[0].startsWith(LOC_MARK)) {
      lines[0] = this.mark(stmt.loc) + lines[0];
    }
    return lines;
  }

  private compileStatementInner(stmt: Statement, scope: Scope): string[] {
    switch (stmt.type) {
      case "VariableDeclaration": {
        this.initializing = scope.declared.has(stmt.name) ? null : { name: stmt.name, scope };
        const value = this.expr(stmt.initializer, scope);
        this.initializing = null;
        return [this.declare(scope, stmt.name, value)];
      }

      case "FunctionDeclaration":
        return this.compileFunctionDeclaration(stmt, scope);

      case "ExportStatement": {
        const lines = this.compileStatementInner(stmt.declaration, scope);
        const js = scope.lookup(stmt.declaration.name)!;
        return [...lines, `$exports[${JSON.stringify(stmt.declaration.name)}] = ${js};`];
      }

      case "BlockStatement":
        return ["{", ...indent(this.compileBlock(stmt, scope)), "}"];

      case "IfStatement": {
        const lines = [`if (${this.condition(stmt.condition, scope)}) {`, ...indent(this.compileBlock(stmt.consequent, scope))];
        let alt = stmt.alternate;
        while (alt) {
          if (alt.type === "IfStatement") {
            lines.push(`} else if (${this.condition(alt.condition, scope)}) {`, ...indent(this.compileBlock(alt.consequent, scope)));
            alt = alt.alternate;
          } else {
            lines.push("} else {", ...indent(this.compileBlock(alt, scope)));
            alt = null;
          }
        }
        lines.push("}");
        return lines;
      }

      case "WhileStatement": {
        const cond = this.condition(stmt.condition, scope);
        scope.fn.loopDepth++;
        const body = this.compileBlock(stmt.body, scope);
        scope.fn.loopDepth--;
        const death = this.options.easterEggs?.mode996 ? ["$.check996();"] : [];
        return [`while (${cond}) {`, ...indent([...death, ...body]), "}"];
      }

      case "ForEachStatement": {
        const n = ++this.uid;
        const [keys, vals, i] = [`$k${n}`, `$v${n}`, `$i${n}`];
        const iterable = this.expr(stmt.iterable, scope);

        // Loop variables live in the body's scope, as in the interpreter
        const bodyScope = new Scope(scope, scope.fn);
        const valueJs = this.register(bodyScope, stmt.valueName, true);
        const keyJs = stmt.keyName ? this.register(bodyScope, stmt.keyName, true) : null;
        scope.fn.loopDepth++;
        const body = this.compileStatements(stmt.body.body, bodyScope);
        scope.fn.loopDepth--;

        return [
          "{",
          `  const [${keys}, ${vals}] = $.items(${iterable}, ${keyJs !== null});`,
          `  for (let ${i} = 0; ${i} < ${vals}.length; ${i}++) {`,
          `    let ${valueJs} = ${vals}[${i}];`,
          ...(keyJs ? [`    let ${keyJs} = ${keys} === null ? ${i} : ${keys}[${i}];`] : []),
          ...indent(indent(body)),
          "  }",
          "}",
        ];
      }

      case "ReturnStatement":
        return [stmt.value ? `return ${this.expr(stmt.value, scope)};` : "return null;"];

      case "BreakStatement":
        return [scope.fn.loopDepth > 0 ? "break;" : "$.strayLoop();"];

      case "ContinueStatement":
        return [scope.fn.loopDepth > 0 ? "continue;" : "$.strayLoop();"];

      case "PassStatement":
        return ["/* 摆烂 */"];

      case "ThrowStatement":
        return [`throw $.raise(${this.expr(stmt.value, scope)});`];

      case "TryCatchStatement": {
        const err = `$e${++this.uid}`;
        const catchScope = new Scope(scope, scope.fn);
        const bind = stmt.catchParam
          ? [`let ${this.register(catchScope, stmt.catchParam, true)} = $.caught(${err});`]
          : [];
        return [
          "try {",
          ...indent(this.compileBlock(stmt.tryBlock, scope)),
          `} catch (${err}) {`,
          ...indent([...bind, ...this.compileStatements(stmt.catchBlock.body, catchScope)]),
          "}",
        ];
      }

      case "ExpressionStatement": {
        const code = this.expr(stmt.expression, scope);
        // A statement starting with { would be read as a block
        return [code.startsWith("{") ? `(${code});` : `${code};`];
      }
    }
  }

  private declare(scope: Scope, name: string, value: string): string {
    const js = this.register(scope, name);
    if (scope.declared.has(name)) return `${js} = ${value};`;
    scope.declared.add(name);
    return `let ${js} = ${value};`;
  }

  private compileFunctionDeclaration(stmt: FunctionDeclaration, scope: Scope): string[] {
    const lines: string[] = [];
    if (this.options.easterEggs?.socialCredit) {
      const returns = countReturns(stmt.body);
      if (returns > 5) lines.push(`$.socialCredit(${JSON.stringify(stmt.name)}, ${returns});`);
    }
    const fn = this.functionCode(stmt.name, stmt.params, stmt.body, scope);
    lines.push(...this.declare(scope, stmt.name, fn).split("\n"));
    return lines;
  }

  /** function (params) { arity check; temps; body } */
  private functionCode(name: string, params: string[], body: BlockStatement, scope: Scope): string {
    const fn = new FunctionContext();
    const fnScope = new Scope(scope, fn);
    const jsParams = params.map((p) => this.register(fnScope, p, true));
    const savedInit = this.initializing;
    this.initializing = null;
    const bodyLines = this.compileStatements(body.body, fnScope);
    this.initializing = savedInit;
    const check = `if (arguments.length !== ${params.length}) $.arity(${JSON.stringify(name)}, ${params.length}, arguments.length);`;
    return [
      `function (${jsParams.join(", ")}) {`,
      ...indent([this.mark(body.loc) + check, ...this.tempDecl(fn), ...bodyLines]),
      "}",
    ].join("\n");
  }

  private tempDecl(fn: FunctionContext): string[] {
    if (fn.temps === 0) return [];
    return [`let ${Array.from({ length: fn.temps }, (_, i) => `$t${i + 1}`).join(", ")};`];
  }

  // ---- Expressions ----

  /** A condition for if/while: skip the truthiness check when it's already a boolean. */
  private condition(expr: Expression, scope: Scope): string {
    const code = this.expr(expr, scope);
    return isBoolean(expr) ? code : `$.truthy(${code})`;
  }

  private expr(expr: Expression, scope: Scope): string {
    switch (expr.type) {
      case "NumericLiteral":
        return String(expr.value);
      case "StringLiteral":
        return JSON.stringify(expr.value);
      case "BooleanLiteral":
        return String(expr.value);
      case "NullLiteral":
        return "null";
      case "ArrayLiteral":
        return `[${expr.elements.map((e) => this.expr(e, scope)).join(", ")}]`;
      case "ObjectLiteral": {
        const entries = expr.entries.map(({ key, value }) => {
          // A literal __proto__ key would set the prototype; a computed one doesn't
          const k = key === "__proto__" ? `["__proto__"]` : JSON.stringify(key);
          return `${k}: ${this.expr(value, scope)}`;
        });
        return `{ __proto__: null${entries.map((e) => ", " + e).join("")} }`;
      }
      case "FunctionExpression":
        return `(${this.functionCode("", expr.params, expr.body, scope)})`;
      case "Identifier":
        return this.identifier(expr.name, scope);
      case "AssignmentExpression":
        return this.assignment(expr, scope);
      case "BinaryExpression": {
        const left = this.expr(expr.left, scope);
        const right = this.expr(expr.right, scope);
        if (expr.operator === "==") return `$.eq(${left}, ${right})`;
        if (expr.operator === "!=") return `!$.eq(${left}, ${right})`;
        return `$.${BINARY_HELPERS[expr.operator]}(${left}, ${right})`;
      }
      case "LogicalExpression": {
        const left = this.expr(expr.left, scope);
        const right = this.expr(expr.right, scope);
        if (isBoolean(expr.left)) {
          return `(${left} ${expr.operator === "并且" ? "&&" : "||"} ${right})`;
        }
        // Return the operand itself (like JS), but with CaoLang truthiness
        const t = `$t${++scope.fn.temps}`;
        return expr.operator === "并且"
          ? `(${t} = ${left}, $.truthy(${t}) ? ${right} : ${t})`
          : `(${t} = ${left}, $.truthy(${t}) ? ${t} : ${right})`;
      }
      case "UnaryExpression": {
        if (expr.operator === "-" && expr.operand.type === "NumericLiteral") return `(-${expr.operand.value})`;
        const operand = this.expr(expr.operand, scope);
        if (expr.operator === "-") return `$.neg(${operand})`;
        return isBoolean(expr.operand) ? `!(${operand})` : `!$.truthy(${operand})`;
      }
      case "CallExpression":
        return this.call(expr, scope);
      case "IndexExpression":
        return `$.index(${this.expr(expr.object, scope)}, ${this.expr(expr.index, scope)})`;
      case "MemberExpression":
        return `$.get(${this.expr(expr.object, scope)}, ${JSON.stringify(expr.property)})`;
    }
  }

  /** JS for a name, or undefined if it isn't declared anywhere visible. */
  private resolve(name: string, scope: Scope): string | undefined {
    const skip = this.initializing?.name === name ? this.initializing.scope : undefined;
    const js = scope.lookup(name, skip);
    if (js !== undefined) return js;
    if (this.builtins.has(name)) return `$b[${JSON.stringify(name)}]`;
    return undefined;
  }

  private identifier(name: string, scope: Scope): string {
    const js = this.resolve(name, scope);
    if (js !== undefined) return js;
    if (name === IMPORT_NAME) return `$.dynamicImport()`;
    return `$.undef(${JSON.stringify(name)}, ${JSON.stringify(this.guess(name, scope))})`;
  }

  private guess(name: string, scope: Scope): string | null {
    return suggest(name, [...scope.visibleNames(), ...this.builtins]);
  }

  private assignment(expr: Extract<Expression, { type: "AssignmentExpression" }>, scope: Scope): string {
    const value = this.expr(expr.value, scope);
    const op = expr.operator === "=" ? null : expr.operator[0];
    const target = expr.target;

    if (target.type === "Identifier") {
      const js = this.resolve(target.name, scope);
      if (js === undefined) {
        return `$.undef(${JSON.stringify(target.name)}, ${JSON.stringify(this.guess(target.name, scope))}, true)`;
      }
      return op ? `(${js} = $.${BINARY_HELPERS[op]}(${js}, ${value}))` : `(${js} = ${value})`;
    }

    const object = this.expr(target.object, scope);
    if (target.type === "IndexExpression") {
      const index = this.expr(target.index, scope);
      return op
        ? `$.compoundIndex(${object}, ${index}, "${op}", ${value})`
        : `$.setIndex(${object}, ${index}, ${value})`;
    }
    const key = JSON.stringify(target.property);
    return op
      ? `$.compoundMember(${object}, ${key}, "${op}", ${value})`
      : `$.setMember(${object}, ${key}, ${value})`;
  }

  private call(expr: Extract<Expression, { type: "CallExpression" }>, scope: Scope): string {
    const callee = expr.callee;
    const args = expr.arguments.map((a) => this.expr(a, scope));

    // 拿来吧你（"./file"）: resolved and bundled at compile time
    if (callee.type === "Identifier" && callee.name === IMPORT_NAME && this.resolve(IMPORT_NAME, scope) === undefined) {
      const spec = expr.arguments[0];
      if (expr.arguments.length !== 1 || spec.type !== "StringLiteral") return `$.dynamicImport()`;
      return this.importModule(spec.value);
    }

    // x.f（a）: a function stored on x, otherwise f（x，a）
    if (callee.type === "MemberExpression") {
      const fallback = this.resolve(callee.property, scope) ?? "undefined";
      return `$.callMethod(${this.expr(callee.object, scope)}, ${JSON.stringify(callee.property)}, ${fallback}, [${args.join(", ")}])`;
    }

    return `${this.expr(callee, scope)}(${args.join(", ")})`;
  }

  private importModule(spec: string): string {
    if (spec.startsWith("npm:") || spec.startsWith("node:")) {
      const name = spec.startsWith("npm:") ? spec.slice(4) : spec;
      if (!this.npm.includes(name)) this.npm.push(name);
      return `$.interop($npm[${JSON.stringify(name)}])`;
    }

    const loader = this.options.modules;
    if (!loader) return `$.noLoader()`;
    const from = this.files[this.currentFile].path;
    const path = loader.resolve(spec, from);

    let idx = this.fileIndex.get(path);
    if (idx === undefined) {
      let source: string;
      try {
        source = loader.read(path);
      } catch {
        return `$.missingModule(${JSON.stringify(spec)})`;
      }
      idx = this.files.length;
      this.files.push({ name: baseName(path), source, path });
      this.fileIndex.set(path, idx);
    }
    return `$.require(${idx})`;
  }

  private mark(loc: SourceLocation): string {
    return `${LOC_MARK}${this.currentFile}:${loc.line}:${loc.column}${LOC_MARK}`;
  }
}

// ---- Helpers ----

/** Expressions that always produce a JS boolean, so no truthiness check is needed. */
function isBoolean(expr: Expression): boolean {
  switch (expr.type) {
    case "BooleanLiteral":
      return true;
    case "BinaryExpression":
      return ["==", "!=", "<", ">", "<=", ">="].includes(expr.operator);
    case "UnaryExpression":
      return expr.operator === "非";
    case "LogicalExpression":
      return isBoolean(expr.left) && isBoolean(expr.right);
    default:
      return false;
  }
}

/** Does `expr` read `name` directly (not inside a nested function)? */
function referencesName(expr: Expression, name: string): boolean {
  const walk = (e: Expression): boolean => {
    switch (e.type) {
      case "Identifier": return e.name === name;
      case "ArrayLiteral": return e.elements.some(walk);
      case "ObjectLiteral": return e.entries.some((entry) => walk(entry.value));
      case "BinaryExpression":
      case "LogicalExpression": return walk(e.left) || walk(e.right);
      case "UnaryExpression": return walk(e.operand);
      case "AssignmentExpression": return walk(e.target) || walk(e.value);
      case "CallExpression": return walk(e.callee) || e.arguments.some(walk);
      case "IndexExpression": return walk(e.object) || walk(e.index);
      case "MemberExpression": return walk(e.object);
      default: return false;
    }
  };
  return walk(expr);
}

function mangle(name: string): string {
  return RESERVED.has(name) ? `${name}$` : name;
}

/** Indent each line, keeping any location marker at the very start. */
function indent(lines: string[]): string[] {
  return lines.flatMap((block) =>
    block.split("\n").map((line) => {
      if (line.startsWith(LOC_MARK)) {
        const end = line.indexOf(LOC_MARK, 1);
        return line.slice(0, end + 1) + "  " + line.slice(end + 1);
      }
      return "  " + line;
    }),
  );
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}
