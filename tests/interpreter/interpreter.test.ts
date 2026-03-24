import { describe, it, expect } from "vitest";
import { run } from "../../src/index.js";

function capture(source: string): string[] {
  const output: string[] = [];
  run(source, { output: (text) => output.push(text) });
  return output;
}

describe("Interpreter", () => {
  describe("basics", () => {
    it("prints hello world", () => {
      const output = capture('喊话（"你好世界"）');
      expect(output).toEqual(["你好世界"]);
    });

    it("prints numbers", () => {
      const output = capture("喊话（42）");
      expect(output).toEqual(["42"]);
    });

    it("prints booleans in Chinese", () => {
      const output = capture("喊话（确实）");
      expect(output).toEqual(["确实"]);
    });

    it("prints null in Chinese", () => {
      const output = capture("喊话（虚无）");
      expect(output).toEqual(["虚无"]);
    });
  });

  describe("variables", () => {
    it("declares and uses variables", () => {
      const output = capture('搞个 x = 42\n喊话（x）');
      expect(output).toEqual(["42"]);
    });

    it("reassigns variables", () => {
      const output = capture("搞个 x = 1\nx = 2\n喊话（x）");
      expect(output).toEqual(["2"]);
    });
  });

  describe("arithmetic", () => {
    it("basic arithmetic", () => {
      const output = capture("喊话（2 + 3 * 4）");
      expect(output).toEqual(["14"]);
    });

    it("string concatenation", () => {
      const output = capture('喊话（"你好" + "世界"）');
      expect(output).toEqual(["你好世界"]);
    });

    it("string + number concatenation", () => {
      const output = capture('喊话（"答案是" + 42）');
      expect(output).toEqual(["答案是42"]);
    });

    it("division by zero throws meme error", () => {
      expect(() => capture("喊话（1 / 0）")).toThrow("除以零？脑子瓦特了？");
    });
  });

  describe("comparison and logic", () => {
    it("comparison operators", () => {
      const output = capture("喊话（1 < 2）\n喊话（2 > 3）");
      expect(output).toEqual(["确实", "没有内味"]);
    });

    it("equality", () => {
      const output = capture("喊话（42 == 42）\n喊话（42 != 43）");
      expect(output).toEqual(["确实", "确实"]);
    });

    it("logical 并且 (and)", () => {
      const output = capture("喊话（确实 并且 确实）\n喊话（确实 并且 没有内味）");
      expect(output).toEqual(["确实", "没有内味"]);
    });

    it("logical 或者 (or)", () => {
      const output = capture("喊话（没有内味 或者 确实）\n喊话（没有内味 或者 没有内味）");
      expect(output).toEqual(["确实", "没有内味"]);
    });

    it("非 (not)", () => {
      const output = capture("喊话（非 确实）\n喊话（非 没有内味）");
      expect(output).toEqual(["没有内味", "确实"]);
    });
  });

  describe("functions", () => {
    it("defines and calls functions", () => {
      const output = capture(`
整活 加法（a，b）「
  栓Q a + b
」
喊话（加法（3，4））
`);
      expect(output).toEqual(["7"]);
    });

    it("closures work", () => {
      const output = capture(`
整活 制造计数器（）「
  搞个 计数 = 0
  整活 增加（）「
    计数 = 计数 + 1
    栓Q 计数
  」
  栓Q 增加
」
搞个 计数器 = 制造计数器（）
喊话（计数器（））
喊话（计数器（））
喊话（计数器（））
`);
      expect(output).toEqual(["1", "2", "3"]);
    });

    it("recursion works", () => {
      const output = capture(`
整活 阶乘（n）「
  如果（n <= 1）「
    栓Q 1
  」
  栓Q n * 阶乘（n - 1）
」
喊话（阶乘（5））
`);
      expect(output).toEqual(["120"]);
    });

    it("stack overflow produces meme error", () => {
      expect(() =>
        capture(`
整活 无限（）「
  栓Q 无限（）
」
无限（）
`),
      ).toThrow("卷太狠了，栈都溢出了");
    });
  });

  describe("control flow", () => {
    it("如果/啊这 (if/else)", () => {
      const output = capture(`
搞个 x = 10
如果（x > 5）「
  喊话（"大"）
」啊这「
  喊话（"小"）
」
`);
      expect(output).toEqual(["大"]);
    });

    it("卷 (while) loop", () => {
      const output = capture(`
搞个 i = 0
卷（i < 5）「
  喊话（i）
  i = i + 1
」
`);
      expect(output).toEqual(["0", "1", "2", "3", "4"]);
    });

    it("润 (break) exits loop", () => {
      const output = capture(`
搞个 i = 0
卷（确实）「
  如果（i == 3）「润」
  喊话（i）
  i = i + 1
」
`);
      expect(output).toEqual(["0", "1", "2"]);
    });

    it("继续卷 (continue) skips iteration", () => {
      const output = capture(`
搞个 i = 0
卷（i < 5）「
  i = i + 1
  如果（i == 3）「继续卷」
  喊话（i）
」
`);
      expect(output).toEqual(["1", "2", "4", "5"]);
    });

    it("摆烂 (pass) does nothing", () => {
      const output = capture("摆烂\n喊话（42）");
      expect(output).toEqual(["42"]);
    });
  });

  describe("error handling", () => {
    it("寄/真香/草 (throw/try/catch)", () => {
      const output = capture(`
真香「
  寄（"出错了兄弟"）
」草（错误）「
  喊话（错误）
」
`);
      expect(output).toEqual(["出错了兄弟"]);
    });

    it("草 without param silently catches (摆烂 mode)", () => {
      const output = capture(`
真香「
  寄（"boom"）
」草「
  喊话（"没事了"）
」
`);
      expect(output).toEqual(["没事了"]);
    });

    it("undefined variable throws meme error", () => {
      expect(() => capture("喊话（不存在的变量）")).toThrow("这谁啊，不认识");
    });
  });

  describe("arrays", () => {
    it("creates and accesses arrays", () => {
      const output = capture(`
搞个 数组 = [1, 2, 3]
喊话（数组[0]）
喊话（数组[2]）
`);
      expect(output).toEqual(["1", "3"]);
    });

    it("array push and pop", () => {
      const output = capture(`
搞个 数组 = [1, 2]
推入（数组，3）
喊话（长度（数组））
搞个 最后 = 弹出（数组）
喊话（最后）
`);
      expect(output).toEqual(["3", "3"]);
    });

    it("out of bounds throws meme error", () => {
      expect(() => capture("搞个 a = [1]\n喊话（a[5]）")).toThrow("越界了兄弟，别越线");
    });
  });

  describe("built-in functions", () => {
    it("类型 (typeof)", () => {
      const output = capture(`
喊话（类型（42））
喊话（类型（"hello"））
喊话（类型（确实））
喊话（类型（虚无））
`);
      expect(output).toEqual(["数字", "字符串", "布尔", "虚无"]);
    });

    it("长度 (length)", () => {
      const output = capture(`
喊话（长度（"你好"））
喊话（长度（[1，2，3]））
`);
      expect(output).toEqual(["2", "3"]);
    });

    it("字符串化 (toString)", () => {
      const output = capture('喊话（字符串化（42））');
      expect(output).toEqual(["42"]);
    });
  });

  describe("fibonacci integration", () => {
    it("computes fibonacci correctly", () => {
      const output = capture(`
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
」
`);
      expect(output).toEqual(["0", "1", "1", "2", "3", "5", "8", "13", "21", "34"]);
    });
  });
});
