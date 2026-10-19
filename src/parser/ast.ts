import { SourceLocation } from "../utils/source-location.js";

// ---- Program ----
export interface Program {
  type: "Program";
  body: Statement[];
  loc: SourceLocation;
}

// ---- Statements ----
export interface VariableDeclaration {
  type: "VariableDeclaration";
  name: string;
  initializer: Expression;
  loc: SourceLocation;
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  name: string;
  params: string[];
  body: BlockStatement;
  loc: SourceLocation;
}

export interface BlockStatement {
  type: "BlockStatement";
  body: Statement[];
  loc: SourceLocation;
}

export interface IfStatement {
  type: "IfStatement";
  condition: Expression;
  consequent: BlockStatement;
  alternate: BlockStatement | IfStatement | null;
  loc: SourceLocation;
}

export interface WhileStatement {
  type: "WhileStatement";
  condition: Expression;
  body: BlockStatement;
  loc: SourceLocation;
}

export interface ReturnStatement {
  type: "ReturnStatement";
  value: Expression | null;
  loc: SourceLocation;
}

export interface BreakStatement {
  type: "BreakStatement";
  loc: SourceLocation;
}

export interface ContinueStatement {
  type: "ContinueStatement";
  loc: SourceLocation;
}

export interface PassStatement {
  type: "PassStatement";
  loc: SourceLocation;
}

export interface ThrowStatement {
  type: "ThrowStatement";
  value: Expression;
  loc: SourceLocation;
}

export interface TryCatchStatement {
  type: "TryCatchStatement";
  tryBlock: BlockStatement;
  catchParam: string | null;
  catchBlock: BlockStatement;
  loc: SourceLocation;
}

// 盘它（值：可迭代）「…」  or  盘它（键，值：可迭代）「…」
export interface ForEachStatement {
  type: "ForEachStatement";
  keyName: string | null;
  valueName: string;
  iterable: Expression;
  body: BlockStatement;
  loc: SourceLocation;
}

// 上交 搞个 … / 上交 整活 …
export interface ExportStatement {
  type: "ExportStatement";
  declaration: VariableDeclaration | FunctionDeclaration;
  loc: SourceLocation;
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: Expression;
  loc: SourceLocation;
}

// ---- Expressions ----
export interface Identifier {
  type: "Identifier";
  name: string;
  loc: SourceLocation;
}

export interface NumericLiteral {
  type: "NumericLiteral";
  value: number;
  loc: SourceLocation;
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
  loc: SourceLocation;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
  loc: SourceLocation;
}

export interface NullLiteral {
  type: "NullLiteral";
  loc: SourceLocation;
}

export interface ArrayLiteral {
  type: "ArrayLiteral";
  elements: Expression[];
  loc: SourceLocation;
}

export interface BinaryExpression {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
  loc: SourceLocation;
}

export interface LogicalExpression {
  type: "LogicalExpression";
  operator: "并且" | "或者";
  left: Expression;
  right: Expression;
  loc: SourceLocation;
}

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: "非" | "-";
  operand: Expression;
  loc: SourceLocation;
}

export interface ObjectLiteral {
  type: "ObjectLiteral";
  entries: Array<{ key: string; value: Expression }>;
  loc: SourceLocation;
}

// Anonymous 整活（params）「body」 used as a value
export interface FunctionExpression {
  type: "FunctionExpression";
  params: string[];
  body: BlockStatement;
  loc: SourceLocation;
}

export type AssignmentTarget = Identifier | IndexExpression | MemberExpression;

export interface AssignmentExpression {
  type: "AssignmentExpression";
  operator: "=" | "+=" | "-=" | "*=" | "/=";
  target: AssignmentTarget;
  value: Expression;
  loc: SourceLocation;
}

export interface CallExpression {
  type: "CallExpression";
  callee: Expression;
  arguments: Expression[];
  loc: SourceLocation;
}

export interface IndexExpression {
  type: "IndexExpression";
  object: Expression;
  index: Expression;
  loc: SourceLocation;
}

// object.property
export interface MemberExpression {
  type: "MemberExpression";
  object: Expression;
  property: string;
  loc: SourceLocation;
}

// ---- Union Types ----
export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | BlockStatement
  | IfStatement
  | WhileStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | PassStatement
  | ThrowStatement
  | TryCatchStatement
  | ForEachStatement
  | ExportStatement
  | ExpressionStatement;

export type Expression =
  | Identifier
  | NumericLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral
  | ObjectLiteral
  | FunctionExpression
  | BinaryExpression
  | LogicalExpression
  | UnaryExpression
  | AssignmentExpression
  | CallExpression
  | IndexExpression
  | MemberExpression;
