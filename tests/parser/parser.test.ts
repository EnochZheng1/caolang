import { describe, it, expect } from "vitest";
import { Parser } from "../../src/parser/index.js";

function parse(source: string) {
  return Parser.fromSource(source).parse();
}

describe("Parser", () => {
  describe("variable declarations", () => {
    it("parses 搞个 x = 42", () => {
      const program = parse("搞个 x = 42");
      expect(program.body).toHaveLength(1);
      const decl = program.body[0];
      expect(decl.type).toBe("VariableDeclaration");
      if (decl.type === "VariableDeclaration") {
        expect(decl.name).toBe("x");
        expect(decl.initializer.type).toBe("NumericLiteral");
      }
    });

    it("parses 搞个 名字 = \"张三\"", () => {
      const program = parse('搞个 名字 = "张三"');
      const decl = program.body[0];
      expect(decl.type).toBe("VariableDeclaration");
      if (decl.type === "VariableDeclaration") {
        expect(decl.name).toBe("名字");
        expect(decl.initializer.type).toBe("StringLiteral");
      }
    });
  });

  describe("function declarations", () => {
    it("parses 整活 foo（）「」", () => {
      const program = parse("整活 foo（）「」");
      expect(program.body).toHaveLength(1);
      const fn = program.body[0];
      expect(fn.type).toBe("FunctionDeclaration");
      if (fn.type === "FunctionDeclaration") {
        expect(fn.name).toBe("foo");
        expect(fn.params).toEqual([]);
      }
    });

    it("parses function with params", () => {
      const program = parse("整活 加法（a，b）「栓Q a + b」");
      const fn = program.body[0];
      expect(fn.type).toBe("FunctionDeclaration");
      if (fn.type === "FunctionDeclaration") {
        expect(fn.name).toBe("加法");
        expect(fn.params).toEqual(["a", "b"]);
      }
    });
  });

  describe("if/else statements", () => {
    it("parses 如果（condition）「body」", () => {
      const program = parse("如果（x > 5）「摆烂」");
      expect(program.body[0].type).toBe("IfStatement");
    });

    it("parses if/else", () => {
      const program = parse("如果（x > 5）「摆烂」啊这「摆烂」");
      const ifStmt = program.body[0];
      if (ifStmt.type === "IfStatement") {
        expect(ifStmt.alternate).not.toBeNull();
      }
    });

    it("parses else-if chain", () => {
      const program = parse("如果（x > 5）「摆烂」啊这 如果（x > 3）「摆烂」啊这「摆烂」");
      const ifStmt = program.body[0];
      if (ifStmt.type === "IfStatement") {
        expect(ifStmt.alternate?.type).toBe("IfStatement");
      }
    });
  });

  describe("while loops", () => {
    it("parses 卷（condition）「body」", () => {
      const program = parse("卷（确实）「摆烂」");
      expect(program.body[0].type).toBe("WhileStatement");
    });
  });

  describe("control flow", () => {
    it("parses 栓Q with value", () => {
      const program = parse("栓Q 42");
      expect(program.body[0].type).toBe("ReturnStatement");
      if (program.body[0].type === "ReturnStatement") {
        expect(program.body[0].value?.type).toBe("NumericLiteral");
      }
    });

    it("parses 润 (break)", () => {
      const program = parse("润");
      expect(program.body[0].type).toBe("BreakStatement");
    });

    it("parses 继续卷 (continue)", () => {
      const program = parse("继续卷");
      expect(program.body[0].type).toBe("ContinueStatement");
    });

    it("parses 摆烂 (pass)", () => {
      const program = parse("摆烂");
      expect(program.body[0].type).toBe("PassStatement");
    });
  });

  describe("throw and try-catch", () => {
    it("parses 寄（expr）", () => {
      const program = parse('寄（"出错了"）');
      expect(program.body[0].type).toBe("ThrowStatement");
    });

    it("parses 真香/草 with catch param", () => {
      const program = parse('真香「摆烂」草（错误）「摆烂」');
      const stmt = program.body[0];
      expect(stmt.type).toBe("TryCatchStatement");
      if (stmt.type === "TryCatchStatement") {
        expect(stmt.catchParam).toBe("错误");
      }
    });

    it("parses 真香/草 without catch param (摆烂 mode)", () => {
      const program = parse("真香「摆烂」草「摆烂」");
      const stmt = program.body[0];
      expect(stmt.type).toBe("TryCatchStatement");
      if (stmt.type === "TryCatchStatement") {
        expect(stmt.catchParam).toBeNull();
      }
    });
  });

  describe("expressions", () => {
    it("parses numeric literals", () => {
      const program = parse("42");
      expect(program.body[0].type).toBe("ExpressionStatement");
    });

    it("parses string literals", () => {
      const program = parse('"你好"');
      expect(program.body[0].type).toBe("ExpressionStatement");
    });

    it("parses boolean literals", () => {
      const trueProgram = parse("确实");
      const falseProgram = parse("没有内味");
      expect(trueProgram.body[0].type).toBe("ExpressionStatement");
      expect(falseProgram.body[0].type).toBe("ExpressionStatement");
    });

    it("parses null literal", () => {
      const program = parse("虚无");
      expect(program.body[0].type).toBe("ExpressionStatement");
    });

    it("parses binary expressions with correct precedence", () => {
      const program = parse("1 + 2 * 3");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        const expr = stmt.expression;
        // Should be 1 + (2 * 3), so top is +
        expect(expr.type).toBe("BinaryExpression");
        if (expr.type === "BinaryExpression") {
          expect(expr.operator).toBe("+");
          expect(expr.right.type).toBe("BinaryExpression");
        }
      }
    });

    it("parses unary expressions", () => {
      const program = parse("非 确实");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        expect(stmt.expression.type).toBe("UnaryExpression");
      }
    });

    it("parses function calls", () => {
      const program = parse("喊话（42）");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        expect(stmt.expression.type).toBe("CallExpression");
      }
    });

    it("parses nested function calls", () => {
      const program = parse("喊话（加法（1，2））");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement" && stmt.expression.type === "CallExpression") {
        expect(stmt.expression.arguments[0].type).toBe("CallExpression");
      }
    });

    it("parses array literals", () => {
      const program = parse("[1, 2, 3]");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        expect(stmt.expression.type).toBe("ArrayLiteral");
      }
    });

    it("parses index expressions", () => {
      const program = parse("arr[0]");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        expect(stmt.expression.type).toBe("IndexExpression");
      }
    });

    it("parses assignment expressions", () => {
      const program = parse("x = 42");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        expect(stmt.expression.type).toBe("AssignmentExpression");
      }
    });

    it("parses logical expressions", () => {
      const program = parse("确实 并且 没有内味");
      const stmt = program.body[0];
      if (stmt.type === "ExpressionStatement") {
        expect(stmt.expression.type).toBe("LogicalExpression");
      }
    });
  });

  describe("full programs", () => {
    it("parses fibonacci", () => {
      const source = `
整活 斐波那契（n）「
  如果（n <= 1）「
    栓Q n
  」
  栓Q 斐波那契（n - 1） + 斐波那契（n - 2）
」

搞个 i = 0
卷（i < 10）「
  喊话（斐波那契（i））
  i = i + 1
」`;
      const program = parse(source);
      expect(program.body).toHaveLength(3); // function, var decl, while
      expect(program.body[0].type).toBe("FunctionDeclaration");
      expect(program.body[1].type).toBe("VariableDeclaration");
      expect(program.body[2].type).toBe("WhileStatement");
    });
  });
});
