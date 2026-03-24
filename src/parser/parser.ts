import { Token, TokenType } from "../lexer/token.js";
import { Lexer } from "../lexer/lexer.js";
import {
  Program, Statement, Expression, BlockStatement,
  VariableDeclaration, FunctionDeclaration, IfStatement,
  WhileStatement, ReturnStatement, BreakStatement,
  ContinueStatement, PassStatement, ThrowStatement,
  TryCatchStatement, ExpressionStatement,
  Identifier, NumericLiteral, StringLiteral,
  BooleanLiteral, NullLiteral, ArrayLiteral,
  BinaryExpression, LogicalExpression, UnaryExpression,
  AssignmentExpression, CallExpression, IndexExpression,
} from "./ast.js";
import { Precedence, getInfixPrecedence } from "./precedence.js";
import { SourceLocation } from "../utils/source-location.js";

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    // Filter out newlines for simpler parsing (semicolons optional, newlines ignored)
    this.tokens = tokens.filter((t) => t.type !== TokenType.NEWLINE);
  }

  static fromSource(source: string): Parser {
    const lexer = new Lexer(source);
    return new Parser(lexer.tokenize());
  }

  parse(): Program {
    const loc = this.current().loc;
    const body: Statement[] = [];

    while (!this.isAtEnd()) {
      this.skipSemicolons();
      if (this.isAtEnd()) break;
      body.push(this.parseStatement());
      this.skipSemicolons();
    }

    return { type: "Program", body, loc };
  }

  // ---- Statement Parsing ----

  private parseStatement(): Statement {
    const token = this.current();

    switch (token.type) {
      case TokenType.GAO_GE:
        return this.parseVariableDeclaration();
      case TokenType.ZHENG_HUO:
        return this.parseFunctionDeclaration();
      case TokenType.RU_GUO:
        return this.parseIfStatement();
      case TokenType.JUAN:
        return this.parseWhileStatement();
      case TokenType.SHUAN_Q:
        return this.parseReturnStatement();
      case TokenType.RUN:
        return this.parseBreakStatement();
      case TokenType.JI_XU_JUAN:
        return this.parseContinueStatement();
      case TokenType.BAI_LAN:
        return this.parsePassStatement();
      case TokenType.JI:
        return this.parseThrowStatement();
      case TokenType.ZHEN_XIANG:
        return this.parseTryCatchStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  // 搞个 name = expr
  private parseVariableDeclaration(): VariableDeclaration {
    const loc = this.current().loc;
    this.expect(TokenType.GAO_GE, "搞个");
    const name = this.expectIdentifier();
    this.expect(TokenType.ASSIGN, "=");
    const initializer = this.parseExpression();
    return { type: "VariableDeclaration", name, initializer, loc };
  }

  // 整活 name（params）「body」
  private parseFunctionDeclaration(): FunctionDeclaration {
    const loc = this.current().loc;
    this.expect(TokenType.ZHENG_HUO, "整活");
    const name = this.expectIdentifier();
    this.expect(TokenType.LEFT_PAREN, "(");
    const params = this.parseParamList();
    this.expect(TokenType.RIGHT_PAREN, ")");
    const body = this.parseBlock();
    return { type: "FunctionDeclaration", name, params, body, loc };
  }

  // 如果（condition）「body」啊这「body」
  private parseIfStatement(): IfStatement {
    const loc = this.current().loc;
    this.expect(TokenType.RU_GUO, "如果");
    this.expect(TokenType.LEFT_PAREN, "(");
    const condition = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, ")");
    const consequent = this.parseBlock();

    let alternate: BlockStatement | IfStatement | null = null;
    if (this.match(TokenType.A_ZHE)) {
      // 啊这 如果 → else if chain
      if (this.check(TokenType.RU_GUO)) {
        alternate = this.parseIfStatement();
      } else {
        alternate = this.parseBlock();
      }
    }

    return { type: "IfStatement", condition, consequent, alternate, loc };
  }

  // 卷（condition）「body」
  private parseWhileStatement(): WhileStatement {
    const loc = this.current().loc;
    this.expect(TokenType.JUAN, "卷");
    this.expect(TokenType.LEFT_PAREN, "(");
    const condition = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, ")");
    const body = this.parseBlock();
    return { type: "WhileStatement", condition, body, loc };
  }

  // 栓Q expr?
  private parseReturnStatement(): ReturnStatement {
    const loc = this.current().loc;
    this.expect(TokenType.SHUAN_Q, "栓Q");
    let value: Expression | null = null;
    // If next token is not a block closer or statement starter, parse the return value
    if (!this.isAtEnd() && !this.check(TokenType.RIGHT_BRACE) && !this.isStatementStart()) {
      value = this.parseExpression();
    }
    return { type: "ReturnStatement", value, loc };
  }

  // 润
  private parseBreakStatement(): BreakStatement {
    const loc = this.current().loc;
    this.expect(TokenType.RUN, "润");
    return { type: "BreakStatement", loc };
  }

  // 继续卷
  private parseContinueStatement(): ContinueStatement {
    const loc = this.current().loc;
    this.expect(TokenType.JI_XU_JUAN, "继续卷");
    return { type: "ContinueStatement", loc };
  }

  // 摆烂
  private parsePassStatement(): PassStatement {
    const loc = this.current().loc;
    this.expect(TokenType.BAI_LAN, "摆烂");
    return { type: "PassStatement", loc };
  }

  // 寄（expr）
  private parseThrowStatement(): ThrowStatement {
    const loc = this.current().loc;
    this.expect(TokenType.JI, "寄");
    this.expect(TokenType.LEFT_PAREN, "(");
    const value = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, ")");
    return { type: "ThrowStatement", value, loc };
  }

  // 真香「body」草（param）「body」  or  真香「body」草「body」
  private parseTryCatchStatement(): TryCatchStatement {
    const loc = this.current().loc;
    this.expect(TokenType.ZHEN_XIANG, "真香");
    const tryBlock = this.parseBlock();
    this.expect(TokenType.CAO, "草");

    let catchParam: string | null = null;
    // If next is ( then we have a catch parameter
    if (this.match(TokenType.LEFT_PAREN)) {
      catchParam = this.expectIdentifier();
      this.expect(TokenType.RIGHT_PAREN, ")");
    }

    const catchBlock = this.parseBlock();
    return { type: "TryCatchStatement", tryBlock, catchParam, catchBlock, loc };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const loc = this.current().loc;
    const expression = this.parseExpression();
    return { type: "ExpressionStatement", expression, loc };
  }

  // ---- Block Parsing ----

  // 「 statements 」  or  { statements }
  private parseBlock(): BlockStatement {
    const loc = this.current().loc;
    this.expect(TokenType.LEFT_BRACE, "{");
    const body: Statement[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      this.skipSemicolons();
      if (this.check(TokenType.RIGHT_BRACE)) break;
      body.push(this.parseStatement());
      this.skipSemicolons();
    }

    this.expect(TokenType.RIGHT_BRACE, "}");
    return { type: "BlockStatement", body, loc };
  }

  // ---- Expression Parsing (Pratt Parser) ----

  private parseExpression(minPrecedence: Precedence = Precedence.NONE): Expression {
    let left = this.parsePrefixExpression();

    while (!this.isAtEnd()) {
      const token = this.current();
      const precedence = getInfixPrecedence(token.type);
      if (precedence <= minPrecedence) break;

      left = this.parseInfixExpression(left, precedence);
    }

    return left;
  }

  private parsePrefixExpression(): Expression {
    const token = this.current();

    switch (token.type) {
      case TokenType.NUMBER:
        return this.parseNumber();
      case TokenType.STRING:
        return this.parseString();
      case TokenType.QUE_SHI:
        return this.parseBoolean(true);
      case TokenType.MEI_NEI_WEI:
        return this.parseBoolean(false);
      case TokenType.XU_WU:
        return this.parseNull();
      case TokenType.IDENTIFIER:
        return this.parseIdentifier();
      case TokenType.LEFT_PAREN:
        return this.parseGrouped();
      case TokenType.LEFT_BRACKET:
        return this.parseArrayLiteral();
      case TokenType.FEI:
        return this.parseUnary("非");
      case TokenType.MINUS:
        return this.parseUnary("-");
      default:
        throw this.error(`啊？这写的什么玩意儿：没想到会看到 '${token.value}'`);
    }
  }

  private parseInfixExpression(left: Expression, precedence: Precedence): Expression {
    const token = this.current();

    // Assignment: identifier = expr (right-associative)
    if (token.type === TokenType.ASSIGN) {
      if (left.type !== "Identifier") {
        throw this.errorAt(left.loc, "只能给变量赋值啊兄弟");
      }
      this.advance(); // skip =
      const value = this.parseExpression(Precedence.ASSIGNMENT);
      return {
        type: "AssignmentExpression",
        name: left.name,
        value,
        loc: left.loc,
      } as AssignmentExpression;
    }

    // Logical operators (short-circuit)
    if (token.type === TokenType.BING_QIE || token.type === TokenType.HUO_ZHE) {
      const op = token.value as "并且" | "或者";
      this.advance();
      const right = this.parseExpression(precedence);
      return {
        type: "LogicalExpression",
        operator: op,
        left,
        right,
        loc: left.loc,
      } as LogicalExpression;
    }

    // Function call: expr（args）
    if (token.type === TokenType.LEFT_PAREN) {
      return this.parseCallExpression(left);
    }

    // Index: expr[index]
    if (token.type === TokenType.LEFT_BRACKET) {
      return this.parseIndexExpression(left);
    }

    // Binary operators
    const operator = token.value;
    this.advance();
    const right = this.parseExpression(precedence);
    return {
      type: "BinaryExpression",
      operator,
      left,
      right,
      loc: left.loc,
    } as BinaryExpression;
  }

  // ---- Prefix Helpers ----

  private parseNumber(): NumericLiteral {
    const token = this.current();
    this.advance();
    return { type: "NumericLiteral", value: Number(token.value), loc: token.loc };
  }

  private parseString(): StringLiteral {
    const token = this.current();
    this.advance();
    return { type: "StringLiteral", value: token.value, loc: token.loc };
  }

  private parseBoolean(value: boolean): BooleanLiteral {
    const token = this.current();
    this.advance();
    return { type: "BooleanLiteral", value, loc: token.loc };
  }

  private parseNull(): NullLiteral {
    const token = this.current();
    this.advance();
    return { type: "NullLiteral", loc: token.loc };
  }

  private parseIdentifier(): Identifier {
    const token = this.current();
    this.advance();
    return { type: "Identifier", name: token.value, loc: token.loc };
  }

  private parseGrouped(): Expression {
    this.advance(); // skip (
    const expr = this.parseExpression();
    this.expect(TokenType.RIGHT_PAREN, ")");
    return expr;
  }

  private parseArrayLiteral(): ArrayLiteral {
    const loc = this.current().loc;
    this.advance(); // skip [
    const elements: Expression[] = [];

    while (!this.check(TokenType.RIGHT_BRACKET) && !this.isAtEnd()) {
      elements.push(this.parseExpression());
      if (!this.match(TokenType.COMMA)) break;
    }

    this.expect(TokenType.RIGHT_BRACKET, "]");
    return { type: "ArrayLiteral", elements, loc };
  }

  private parseUnary(operator: "非" | "-"): UnaryExpression {
    const loc = this.current().loc;
    this.advance(); // skip the operator
    const operand = this.parseExpression(Precedence.UNARY);
    return { type: "UnaryExpression", operator, operand, loc };
  }

  // ---- Infix Helpers ----

  private parseCallExpression(callee: Expression): CallExpression {
    const loc = callee.loc;
    this.advance(); // skip (
    const args: Expression[] = [];

    while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
      args.push(this.parseExpression());
      if (!this.match(TokenType.COMMA)) break;
    }

    this.expect(TokenType.RIGHT_PAREN, ")");
    return { type: "CallExpression", callee, arguments: args, loc };
  }

  private parseIndexExpression(object: Expression): IndexExpression {
    const loc = object.loc;
    this.advance(); // skip [
    const index = this.parseExpression();
    this.expect(TokenType.RIGHT_BRACKET, "]");
    return { type: "IndexExpression", object, index, loc };
  }

  // ---- Helpers ----

  private parseParamList(): string[] {
    const params: string[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      params.push(this.expectIdentifier());
      while (this.match(TokenType.COMMA)) {
        params.push(this.expectIdentifier());
      }
    }
    return params;
  }

  private expectIdentifier(): string {
    const token = this.current();
    if (token.type !== TokenType.IDENTIFIER) {
      throw this.error(`期望一个名字，但是看到了 '${token.value}'`);
    }
    this.advance();
    return token.value;
  }

  private expect(type: TokenType, hint: string): Token {
    const token = this.current();
    if (token.type !== type) {
      throw this.error(`期望 '${hint}'，但是看到了 '${token.value}'`);
    }
    this.advance();
    return token;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private advance(): void {
    if (!this.isAtEnd()) {
      this.pos++;
    }
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.tokens[this.pos].type === TokenType.EOF;
  }

  private skipSemicolons(): void {
    while (this.check(TokenType.SEMICOLON)) {
      this.advance();
    }
  }

  private isStatementStart(): boolean {
    const type = this.current().type;
    return (
      type === TokenType.GAO_GE ||
      type === TokenType.ZHENG_HUO ||
      type === TokenType.RU_GUO ||
      type === TokenType.JUAN ||
      type === TokenType.SHUAN_Q ||
      type === TokenType.RUN ||
      type === TokenType.JI_XU_JUAN ||
      type === TokenType.BAI_LAN ||
      type === TokenType.JI ||
      type === TokenType.ZHEN_XIANG
    );
  }

  private error(message: string): Error {
    const loc = this.current().loc;
    return new Error(`[${loc.line}:${loc.column}] ${message}`);
  }

  private errorAt(loc: SourceLocation, message: string): Error {
    return new Error(`[${loc.line}:${loc.column}] ${message}`);
  }
}
