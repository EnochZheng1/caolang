import { TokenType } from "../lexer/token.js";

export enum Precedence {
  NONE = 0,
  ASSIGNMENT = 1,   // =
  OR = 2,            // 或者
  AND = 3,           // 并且
  EQUALITY = 4,      // == !=
  COMPARISON = 5,    // < > <= >=
  ADDITION = 6,      // + -
  MULTIPLY = 7,      // * / %
  UNARY = 8,         // 非 -
  CALL = 9,          // () [] .
}

export function getInfixPrecedence(type: TokenType): Precedence {
  switch (type) {
    case TokenType.ASSIGN:
    case TokenType.PLUS_ASSIGN:
    case TokenType.MINUS_ASSIGN:
    case TokenType.STAR_ASSIGN:
    case TokenType.SLASH_ASSIGN:
      return Precedence.ASSIGNMENT;
    case TokenType.HUO_ZHE:
      return Precedence.OR;
    case TokenType.BING_QIE:
      return Precedence.AND;
    case TokenType.EQUAL:
    case TokenType.NOT_EQUAL:
      return Precedence.EQUALITY;
    case TokenType.LESS:
    case TokenType.GREATER:
    case TokenType.LESS_EQUAL:
    case TokenType.GREATER_EQUAL:
      return Precedence.COMPARISON;
    case TokenType.PLUS:
    case TokenType.MINUS:
      return Precedence.ADDITION;
    case TokenType.STAR:
    case TokenType.SLASH:
    case TokenType.PERCENT:
      return Precedence.MULTIPLY;
    case TokenType.LEFT_PAREN:
    case TokenType.LEFT_BRACKET:
    case TokenType.DOT:
      return Precedence.CALL;
    default:
      return Precedence.NONE;
  }
}
