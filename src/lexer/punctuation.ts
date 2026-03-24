import { TokenType } from "./token.js";

/**
 * Normalize Chinese punctuation to canonical ASCII equivalents.
 * Returns the normalized character, or the original if no mapping exists.
 */
const PUNCT_MAP: Record<string, string> = {
  "\u300C": "{",  // 「 → {
  "\u300D": "}",  // 」 → }
  "\u300E": "{",  // 『 → {
  "\u300F": "}",  // 』 → }
  "\uFF08": "(",  // （ → (
  "\uFF09": ")",  // ） → )
  "\uFF0C": ",",  // ， → ,
  "\uFF1B": ";",  // ； → ;
  "\u3001": ",",  // 、 → , (Chinese enumeration comma)
};

export function normalizePunct(char: string): string {
  return PUNCT_MAP[char] ?? char;
}

/**
 * Map single-char punctuation to token types.
 */
export const PUNCT_TOKENS: Record<string, TokenType> = {
  "{": TokenType.LEFT_BRACE,
  "}": TokenType.RIGHT_BRACE,
  "(": TokenType.LEFT_PAREN,
  ")": TokenType.RIGHT_PAREN,
  ",": TokenType.COMMA,
  ";": TokenType.SEMICOLON,
  "[": TokenType.LEFT_BRACKET,
  "]": TokenType.RIGHT_BRACKET,
  "+": TokenType.PLUS,
  "-": TokenType.MINUS,
  "*": TokenType.STAR,
  "/": TokenType.SLASH,
  "%": TokenType.PERCENT,
};

/**
 * Check if a character is a Chinese punctuation that should be normalized.
 */
export function isChinesePunct(char: string): boolean {
  return char in PUNCT_MAP;
}
