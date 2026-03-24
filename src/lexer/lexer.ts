import { Token, TokenType } from "./token.js";
import { SourceLocation, loc } from "../utils/source-location.js";
import { isIdentStart, isIdentChar, isDigit, isWhitespace } from "../utils/unicode.js";
import { normalizePunct, PUNCT_TOKENS, isChinesePunct } from "./punctuation.js";
import { KEYWORDS_BY_LENGTH } from "./keywords.js";

export class Lexer {
  private source: string;
  private chars: string[];       // Array of code points (handles surrogate pairs)
  private pos: number = 0;       // Index into chars[]
  private line: number = 1;
  private column: number = 1;
  private offset: number = 0;    // Byte offset in original source

  constructor(source: string) {
    this.source = source;
    // Spread into array of full Unicode characters (not UTF-16 code units)
    this.chars = [...source];
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.chars.length) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push(this.makeToken(TokenType.EOF, ""));
    return tokens;
  }

  private nextToken(): Token | null {
    const ch = this.chars[this.pos];
    const cp = ch.codePointAt(0)!;

    // Skip whitespace (but track newlines)
    if (isWhitespace(cp)) {
      if (cp === 0x0a) { // newline
        const token = this.makeToken(TokenType.NEWLINE, "\n");
        this.advance();
        return token;
      }
      // Skip carriage return before newline
      if (cp === 0x0d) {
        this.advance();
        if (this.pos < this.chars.length && this.chars[this.pos] === "\n") {
          const token = this.makeToken(TokenType.NEWLINE, "\n");
          this.advance();
          return token;
        }
        return this.makeToken(TokenType.NEWLINE, "\n");
      }
      this.advance();
      return null; // Skip other whitespace
    }

    // Comments: // single-line
    if (ch === "/" && this.pos + 1 < this.chars.length && this.chars[this.pos + 1] === "/") {
      this.skipLineComment();
      return null;
    }

    // Comments: /* block */
    if (ch === "/" && this.pos + 1 < this.chars.length && this.chars[this.pos + 1] === "*") {
      this.skipBlockComment();
      return null;
    }

    // String literals: "..." or "..." or '...'
    if (ch === '"' || ch === "'" || ch === "\u201C") {
      return this.readString();
    }

    // Number literals
    if (isDigit(cp)) {
      return this.readNumber();
    }

    // Chinese punctuation → normalize and handle
    if (isChinesePunct(ch)) {
      const normalized = normalizePunct(ch);
      const tokenType = PUNCT_TOKENS[normalized];
      if (tokenType) {
        const token = this.makeToken(tokenType, ch);
        this.advance();
        return token;
      }
    }

    // Multi-character operators
    if (ch === "=") {
      if (this.peek(1) === "=") {
        const token = this.makeToken(TokenType.EQUAL, "==");
        this.advance();
        this.advance();
        return token;
      }
      const token = this.makeToken(TokenType.ASSIGN, "=");
      this.advance();
      return token;
    }

    if (ch === "!") {
      if (this.peek(1) === "=") {
        const token = this.makeToken(TokenType.NOT_EQUAL, "!=");
        this.advance();
        this.advance();
        return token;
      }
      // Standalone ! is not used in CaoLang; use 非 instead
      throw this.error(`啊？这写的什么玩意儿：意外的字符 '!'，想用"非"来取反吗？`);
    }

    if (ch === "<") {
      if (this.peek(1) === "=") {
        const token = this.makeToken(TokenType.LESS_EQUAL, "<=");
        this.advance();
        this.advance();
        return token;
      }
      const token = this.makeToken(TokenType.LESS, "<");
      this.advance();
      return token;
    }

    if (ch === ">") {
      if (this.peek(1) === "=") {
        const token = this.makeToken(TokenType.GREATER_EQUAL, ">=");
        this.advance();
        this.advance();
        return token;
      }
      const token = this.makeToken(TokenType.GREATER, ">");
      this.advance();
      return token;
    }

    // Single-char ASCII punctuation/operators
    const punctType = PUNCT_TOKENS[ch];
    if (punctType) {
      const token = this.makeToken(punctType, ch);
      this.advance();
      return token;
    }

    // Identifiers and keywords
    if (isIdentStart(cp)) {
      return this.readIdentOrKeyword();
    }

    throw this.error(`啊？这写的什么玩意儿：不认识这个字符 '${ch}'`);
  }

  /**
   * Read an identifier, using greedy keyword prefix matching.
   * After consuming a maximal run of identifier characters,
   * check if any keyword is a prefix. If so, emit the keyword
   * and push back the remaining characters.
   */
  private readIdentOrKeyword(): Token {
    const startLoc = this.currentLoc();
    const startPos = this.pos;
    let value = "";

    // Consume a maximal run of identifier characters
    while (this.pos < this.chars.length) {
      const ch = this.chars[this.pos];
      const cp = ch.codePointAt(0)!;
      if (isIdentChar(cp)) {
        value += ch;
        this.advance();
      } else {
        break;
      }
    }

    // Greedy keyword prefix matching: check longest keywords first
    for (const [keyword, tokenType] of KEYWORDS_BY_LENGTH) {
      if (value.startsWith(keyword)) {
        // If the keyword IS the entire value, just return the keyword token
        if (value.length === keyword.length) {
          return { type: tokenType, value: keyword, loc: startLoc };
        }
        // Otherwise, we need to "push back" the non-keyword suffix.
        // Reset position to after the keyword.
        const suffixLen = [...value.slice(keyword.length)].length;
        this.pos -= suffixLen;
        // Recalculate line/column for the pushed-back chars
        this.recalcPosition();
        return { type: tokenType, value: keyword, loc: startLoc };
      }
    }

    // No keyword match → it's a plain identifier
    return { type: TokenType.IDENTIFIER, value, loc: startLoc };
  }

  private readString(): Token {
    const startLoc = this.currentLoc();
    const openChar = this.chars[this.pos];
    // Determine the closing character
    const closeChar = openChar === "\u201C" ? "\u201D" : openChar; // " closes with "
    this.advance(); // skip opening quote

    let value = "";
    while (this.pos < this.chars.length) {
      const ch = this.chars[this.pos];

      if (ch === closeChar) {
        this.advance(); // skip closing quote
        return { type: TokenType.STRING, value, loc: startLoc };
      }

      // Escape sequences
      if (ch === "\\") {
        this.advance();
        if (this.pos >= this.chars.length) {
          throw this.errorAt(startLoc, `字符串没写完就跑了，引号呢？`);
        }
        const escaped = this.chars[this.pos];
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "r": value += "\r"; break;
          case "\\": value += "\\"; break;
          case "'": value += "'"; break;
          case '"': value += '"'; break;
          case "\u201C": value += "\u201C"; break;
          case "\u201D": value += "\u201D"; break;
          default: value += escaped;
        }
        this.advance();
        continue;
      }

      value += ch;
      this.advance();
    }

    throw this.errorAt(startLoc, `字符串没写完就跑了，引号呢？`);
  }

  private readNumber(): Token {
    const startLoc = this.currentLoc();
    let value = "";

    // Integer part
    while (this.pos < this.chars.length && isDigit(this.chars[this.pos].codePointAt(0)!)) {
      value += this.chars[this.pos];
      this.advance();
    }

    // Decimal part
    if (this.pos < this.chars.length && this.chars[this.pos] === ".") {
      // Check that next char is a digit (not just a trailing dot)
      if (this.pos + 1 < this.chars.length && isDigit(this.chars[this.pos + 1].codePointAt(0)!)) {
        value += ".";
        this.advance(); // skip the dot
        while (this.pos < this.chars.length && isDigit(this.chars[this.pos].codePointAt(0)!)) {
          value += this.chars[this.pos];
          this.advance();
        }
      }
    }

    return { type: TokenType.NUMBER, value, loc: startLoc };
  }

  private skipLineComment(): void {
    // Skip the //
    this.advance();
    this.advance();
    while (this.pos < this.chars.length && this.chars[this.pos] !== "\n") {
      this.advance();
    }
    // Don't consume the newline — let the main loop handle it
  }

  private skipBlockComment(): void {
    const startLoc = this.currentLoc();
    // Skip the /*
    this.advance();
    this.advance();
    while (this.pos < this.chars.length) {
      if (this.chars[this.pos] === "*" && this.peek(1) === "/") {
        this.advance(); // skip *
        this.advance(); // skip /
        return;
      }
      this.advance();
    }
    throw this.errorAt(startLoc, `块注释没关上，你是不是忘了 */？`);
  }

  private advance(): void {
    if (this.pos < this.chars.length) {
      const ch = this.chars[this.pos];
      if (ch === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.offset += ch.length; // UTF-16 code units
      this.pos++;
    }
  }

  private peek(offset: number): string | null {
    const idx = this.pos + offset;
    if (idx < this.chars.length) {
      return this.chars[idx];
    }
    return null;
  }

  private currentLoc(): SourceLocation {
    return loc(this.line, this.column, this.offset);
  }

  private makeToken(type: TokenType, value: string): Token {
    return { type, value, loc: this.currentLoc() };
  }

  /**
   * Recalculate line/column/offset from scratch up to current pos.
   * Used after "pushing back" characters during keyword matching.
   */
  private recalcPosition(): void {
    this.line = 1;
    this.column = 1;
    this.offset = 0;
    for (let i = 0; i < this.pos; i++) {
      const ch = this.chars[i];
      if (ch === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.offset += ch.length;
    }
  }

  private error(message: string): Error {
    return new Error(`[${this.line}:${this.column}] ${message}`);
  }

  private errorAt(loc: SourceLocation, message: string): Error {
    return new Error(`[${loc.line}:${loc.column}] ${message}`);
  }
}
