import { describe, it, expect } from "vitest";
import { Lexer, TokenType } from "../../src/lexer/index.js";

function tokenTypes(source: string): TokenType[] {
  return new Lexer(source).tokenize().map((t) => t.type);
}

function tokenValues(source: string): string[] {
  return new Lexer(source).tokenize().map((t) => t.value);
}

describe("Lexer", () => {
  describe("keywords", () => {
    it("recognizes all meme keywords", () => {
      const source = "整活 栓Q 搞个 如果 啊这 卷 润 继续卷 摆烂 寄 真香 草 确实 没有内味 虚无 并且 或者 非";
      const types = tokenTypes(source);
      expect(types).toContain(TokenType.ZHENG_HUO);
      expect(types).toContain(TokenType.SHUAN_Q);
      expect(types).toContain(TokenType.GAO_GE);
      expect(types).toContain(TokenType.RU_GUO);
      expect(types).toContain(TokenType.A_ZHE);
      expect(types).toContain(TokenType.JUAN);
      expect(types).toContain(TokenType.RUN);
      expect(types).toContain(TokenType.JI_XU_JUAN);
      expect(types).toContain(TokenType.BAI_LAN);
      expect(types).toContain(TokenType.JI);
      expect(types).toContain(TokenType.ZHEN_XIANG);
      expect(types).toContain(TokenType.CAO);
      expect(types).toContain(TokenType.QUE_SHI);
      expect(types).toContain(TokenType.MEI_NEI_WEI);
      expect(types).toContain(TokenType.XU_WU);
      expect(types).toContain(TokenType.BING_QIE);
      expect(types).toContain(TokenType.HUO_ZHE);
      expect(types).toContain(TokenType.FEI);
    });

    it("greedy prefix matching: 搞个东西 → keyword + identifier", () => {
      const tokens = new Lexer("搞个东西").tokenize();
      expect(tokens[0].type).toBe(TokenType.GAO_GE);
      expect(tokens[0].value).toBe("搞个");
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe("东西");
    });

    it("greedy prefix matching: 继续卷 wins over 卷", () => {
      const tokens = new Lexer("继续卷").tokenize();
      expect(tokens[0].type).toBe(TokenType.JI_XU_JUAN);
      expect(tokens[0].value).toBe("继续卷");
    });

    it("栓Q is recognized as keyword (mixed CJK + ASCII)", () => {
      const tokens = new Lexer("栓Q").tokenize();
      expect(tokens[0].type).toBe(TokenType.SHUAN_Q);
    });

    it("没有内味 (4 chars) is recognized as a keyword", () => {
      const tokens = new Lexer("没有内味").tokenize();
      expect(tokens[0].type).toBe(TokenType.MEI_NEI_WEI);
    });
  });

  describe("punctuation normalization", () => {
    it("normalizes Chinese braces 「」 to LEFT/RIGHT_BRACE", () => {
      const types = tokenTypes("「」");
      expect(types[0]).toBe(TokenType.LEFT_BRACE);
      expect(types[1]).toBe(TokenType.RIGHT_BRACE);
    });

    it("normalizes 『』 to LEFT/RIGHT_BRACE", () => {
      const types = tokenTypes("『』");
      expect(types[0]).toBe(TokenType.LEFT_BRACE);
      expect(types[1]).toBe(TokenType.RIGHT_BRACE);
    });

    it("normalizes Chinese parens （） to LEFT/RIGHT_PAREN", () => {
      const types = tokenTypes("（）");
      expect(types[0]).toBe(TokenType.LEFT_PAREN);
      expect(types[1]).toBe(TokenType.RIGHT_PAREN);
    });

    it("normalizes Chinese comma ，", () => {
      const types = tokenTypes("，");
      expect(types[0]).toBe(TokenType.COMMA);
    });

    it("normalizes Chinese semicolon ；", () => {
      const types = tokenTypes("；");
      expect(types[0]).toBe(TokenType.SEMICOLON);
    });

    it("accepts ASCII punctuation too", () => {
      const types = tokenTypes("{}(),;");
      expect(types[0]).toBe(TokenType.LEFT_BRACE);
      expect(types[1]).toBe(TokenType.RIGHT_BRACE);
      expect(types[2]).toBe(TokenType.LEFT_PAREN);
      expect(types[3]).toBe(TokenType.RIGHT_PAREN);
      expect(types[4]).toBe(TokenType.COMMA);
      expect(types[5]).toBe(TokenType.SEMICOLON);
    });
  });

  describe("operators", () => {
    it("tokenizes arithmetic operators", () => {
      const types = tokenTypes("+ - * / %");
      expect(types).toContain(TokenType.PLUS);
      expect(types).toContain(TokenType.MINUS);
      expect(types).toContain(TokenType.STAR);
      expect(types).toContain(TokenType.SLASH);
      expect(types).toContain(TokenType.PERCENT);
    });

    it("tokenizes comparison operators", () => {
      const types = tokenTypes("== != < > <= >=");
      expect(types).toContain(TokenType.EQUAL);
      expect(types).toContain(TokenType.NOT_EQUAL);
      expect(types).toContain(TokenType.LESS);
      expect(types).toContain(TokenType.GREATER);
      expect(types).toContain(TokenType.LESS_EQUAL);
      expect(types).toContain(TokenType.GREATER_EQUAL);
    });

    it("tokenizes assignment", () => {
      const types = tokenTypes("=");
      expect(types[0]).toBe(TokenType.ASSIGN);
    });
  });

  describe("literals", () => {
    it("tokenizes integer numbers", () => {
      const tokens = new Lexer("42").tokenize();
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe("42");
    });

    it("tokenizes float numbers", () => {
      const tokens = new Lexer("3.14").tokenize();
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe("3.14");
    });

    it("tokenizes double-quoted strings", () => {
      const tokens = new Lexer('"你好世界"').tokenize();
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe("你好世界");
    });

    it("tokenizes single-quoted strings", () => {
      const tokens = new Lexer("'hello'").tokenize();
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe("hello");
    });

    it("tokenizes Chinese quoted strings \u201C\u201D", () => {
      const tokens = new Lexer("\u201C你好\u201D").tokenize();
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe("你好");
    });

    it("handles escape sequences in strings", () => {
      const tokens = new Lexer('"hello\\nworld"').tokenize();
      expect(tokens[0].value).toBe("hello\nworld");
    });
  });

  describe("identifiers", () => {
    it("tokenizes Chinese identifiers", () => {
      const tokens = new Lexer("变量名").tokenize();
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe("变量名");
    });

    it("tokenizes mixed Chinese/ASCII identifiers", () => {
      const tokens = new Lexer("myVar123").tokenize();
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe("myVar123");
    });

    it("tokenizes underscore identifiers", () => {
      const tokens = new Lexer("_test").tokenize();
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe("_test");
    });
  });

  describe("comments", () => {
    it("skips single-line comments", () => {
      const tokens = new Lexer("42 // 这是注释\n43").tokenize();
      const numbers = tokens.filter((t) => t.type === TokenType.NUMBER);
      expect(numbers).toHaveLength(2);
      expect(numbers[0].value).toBe("42");
      expect(numbers[1].value).toBe("43");
    });

    it("skips block comments", () => {
      const tokens = new Lexer("42 /* 块注释 */ 43").tokenize();
      const numbers = tokens.filter((t) => t.type === TokenType.NUMBER);
      expect(numbers).toHaveLength(2);
    });
  });

  describe("full program", () => {
    it("tokenizes fibonacci sample", () => {
      const source = `整活 斐波那契（n）「
  如果（n <= 1）「
    栓Q n
  」
  栓Q 斐波那契（n - 1） + 斐波那契（n - 2）
」`;
      const tokens = new Lexer(source).tokenize();
      // Should not throw and should have many tokens
      expect(tokens.length).toBeGreaterThan(20);
      // First token should be 整活 (function)
      expect(tokens[0].type).toBe(TokenType.ZHENG_HUO);
      // Should end with EOF
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });
  });

  describe("source locations", () => {
    it("tracks line and column", () => {
      const tokens = new Lexer("搞个 x = 42").tokenize();
      expect(tokens[0].loc.line).toBe(1);
      expect(tokens[0].loc.column).toBe(1);
    });

    it("tracks line numbers across newlines", () => {
      const source = "搞个 x = 1\n搞个 y = 2";
      const tokens = new Lexer(source).tokenize();
      const secondGaoGe = tokens.find(
        (t, i) => t.type === TokenType.GAO_GE && i > 0
      );
      expect(secondGaoGe?.loc.line).toBe(2);
    });
  });
});
