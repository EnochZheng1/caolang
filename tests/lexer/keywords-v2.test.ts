import { describe, it, expect } from "vitest";
import { Lexer, TokenType } from "../../src/lexer/index.js";
import { CaoSyntaxError } from "../../src/errors/index.js";

function tokens(source: string) {
  return new Lexer(source).tokenize().filter((t) => t.type !== TokenType.EOF);
}

describe("Lexer v0.2", () => {
  it("lexes 盘它 and 上交 as keywords", () => {
    expect(tokens("盘它 上交").map((t) => t.type)).toEqual([TokenType.PAN_TA, TokenType.SHANG_JIAO]);
  });

  it("keeps words that start with a single-char keyword as identifiers", () => {
    for (const word of ["草莓", "非常", "卷子", "润色", "寄件人"]) {
      expect(tokens(word).map((t) => [t.type, t.value])).toEqual([[TokenType.IDENTIFIER, word]]);
    }
  });

  it("still splits a single-char keyword followed by another keyword", () => {
    expect(tokens("非确实").map((t) => t.type)).toEqual([TokenType.FEI, TokenType.QUE_SHI]);
  });

  it("lexes Chinese and ASCII colons, and dots", () => {
    expect(tokens("a：b:c.d").map((t) => t.type)).toEqual([
      TokenType.IDENTIFIER, TokenType.COLON, TokenType.IDENTIFIER, TokenType.COLON,
      TokenType.IDENTIFIER, TokenType.DOT, TokenType.IDENTIFIER,
    ]);
  });

  it("keeps decimals as numbers", () => {
    expect(tokens("3.14").map((t) => [t.type, t.value])).toEqual([[TokenType.NUMBER, "3.14"]]);
  });

  it("lexes compound assignment", () => {
    expect(tokens("+= -= *= /=").map((t) => t.type)).toEqual([
      TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN, TokenType.STAR_ASSIGN, TokenType.SLASH_ASSIGN,
    ]);
  });

  it("throws syntax errors with a location", () => {
    try {
      new Lexer('搞个 x = "没写完').tokenize();
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CaoSyntaxError);
      expect((e as CaoSyntaxError).loc).toMatchObject({ line: 1, column: 8 });
    }
  });
});
