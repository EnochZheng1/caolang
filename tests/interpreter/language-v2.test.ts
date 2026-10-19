import { describe, it, expect } from "vitest";
import { run } from "../../src/index.js";
import { Parser } from "../../src/parser/index.js";
import { Interpreter, CaoRuntimeError } from "../../src/interpreter/index.js";
import type { ModuleLoader } from "../../src/interpreter/index.js";

function capture(source: string): string[] {
  const output: string[] = [];
  run(source, { output: (text) => output.push(text) });
  return output;
}

/** Run `main` with an in-memory file system of .cao modules. */
function runWithFiles(files: Record<string, string>, main = "main.cao"): string[] {
  const output: string[] = [];
  const loader: ModuleLoader = {
    resolve: (spec) => (spec.replace(/^\.\//, "").endsWith(".cao") ? spec.replace(/^\.\//, "") : `${spec.replace(/^\.\//, "")}.cao`),
    read: (path) => {
      if (!(path in files)) throw new Error("ENOENT");
      return files[path];
    },
  };
  const interpreter = new Interpreter({ output: (t) => output.push(t), modules: loader });
  interpreter.run(Parser.fromSource(files[main]).parse(), files[main], main);
  return output;
}

function errorOf(fn: () => unknown): CaoRuntimeError {
  try {
    fn();
  } catch (e) {
    return e as CaoRuntimeError;
  }
  throw new Error("expected an error");
}

describe("CaoLang v0.2", () => {
  describe("字典 dicts", () => {
    it("creates, reads, and prints dicts", () => {
      expect(capture('搞个 人 = 「名字："张三"，年龄：25」\n喊话（人.名字，人["年龄"]）\n喊话（人）')).toEqual([
        "张三 25",
        "「名字：张三，年龄：25」",
      ]);
    });

    it("supports shorthand, nesting, and trailing commas", () => {
      expect(capture('搞个 名字 = "李四"\n搞个 x = 「名字，地址：「城市："北京"」，」\n喊话（x.地址.城市，x.名字）')).toEqual([
        "北京 李四",
      ]);
    });

    it("assigns to properties and keys", () => {
      expect(capture('搞个 x = 「」\nx.a = 1\nx["b"] = 2\nx.a += 10\n喊话（x，长度（x））')).toEqual([
        "「a：11，b：2」 2",
      ]);
    });

    it("returns 虚无 for missing keys", () => {
      expect(capture("喊话（「」.没有）")).toEqual(["虚无"]);
    });

    it("reports reading from 虚无 with a meme", () => {
      expect(() => capture("搞个 x = 虚无\n喊话（x.名字）")).toThrow("你在凝视深渊");
    });

    it("has type 字典 and compares structurally", () => {
      expect(capture("喊话（类型（「」），「a：[1]」 == 「a：[1]」，「a：1」 == 「a：2」）")).toEqual([
        "字典 确实 没有内味",
      ]);
    });

    it("keys, values, delete", () => {
      expect(capture('搞个 x = 「a：1，b：2」\n喊话（键们（x），值们（x））\n删掉（x，"a"）\n喊话（x，包含（x，"b"））')).toEqual([
        "[a，b] [1，2]",
        "「b：2」 确实",
      ]);
    });
  });

  describe("匿名整活 anonymous functions", () => {
    it("can be stored and called", () => {
      expect(capture("搞个 双倍 = 整活（x）「栓Q x * 2」\n喊话（双倍（21））")).toEqual(["42"]);
    });

    it("can be returned (closures)", () => {
      const src = "整活 加几（n）「\n  栓Q 整活（x）「栓Q x + n」\n」\n喊话（加几（10）（5））";
      expect(capture(src)).toEqual(["15"]);
    });

    it("prints as 无名氏", () => {
      expect(capture("喊话（整活（）「摆烂」）")).toEqual(["<整活 无名氏>"]);
    });
  });

  describe("盘它 for-each", () => {
    it("iterates arrays", () => {
      expect(capture('盘它（x：["a"，"b"]）「喊话（x）」')).toEqual(["a", "b"]);
    });

    it("iterates arrays with index", () => {
      expect(capture('盘它（i，x：["a"，"b"]）「喊话（i，x）」')).toEqual(["0 a", "1 b"]);
    });

    it("iterates strings by character", () => {
      expect(capture('盘它（字："草😂"）「喊话（字）」')).toEqual(["草", "😂"]);
    });

    it("iterates dict keys, or keys and values", () => {
      expect(capture("盘它（k：「a：1，b：2」）「喊话（k）」")).toEqual(["a", "b"]);
      expect(capture("盘它（k，v：「a：1」）「喊话（k，v）」")).toEqual(["a 1"]);
    });

    it("supports 润 and 继续卷", () => {
      const src = "盘它（x：范围（10））「\n  如果（x == 1）「继续卷」\n  如果（x == 3）「润」\n  喊话（x）\n」";
      expect(capture(src)).toEqual(["0", "2"]);
    });

    it("refuses to iterate numbers", () => {
      expect(() => capture("盘它（x：42）「」")).toThrow("盘不动");
    });
  });

  describe("assignment", () => {
    it("supports compound assignment", () => {
      expect(capture('搞个 x = 10\nx += 5\nx -= 3\nx *= 2\nx /= 4\n喊话（x）\n搞个 s = "草"\ns += "语言"\n喊话（s）')).toEqual([
        "6",
        "草语言",
      ]);
    });

    it("assigns array elements", () => {
      expect(capture("搞个 a = [1，2，3]\na[1] = 20\na[2] += 1\n喊话（a）")).toEqual(["[1，20，4]"]);
    });

    it("is right-associative", () => {
      expect(capture("搞个 a = 0\n搞个 b = 0\na = b = 7\n喊话（a，b）")).toEqual(["7 7"]);
    });

    it("tells you to 搞个 new variables", () => {
      expect(() => capture("没声明 = 1")).toThrow("新变量要先「搞个」");
    });
  });

  describe("方法调用 x.f（）", () => {
    it("calls builtins with the receiver as the first argument", () => {
      expect(capture("喊话（[3，1，2].排序（）.反转（））")).toEqual(["[3，2，1]"]);
    });

    it("chains map/filter", () => {
      const src = "喊话（范围（6）.过滤（整活（x）「栓Q x % 2 == 0」）.映射（整活（x）「栓Q x * 10」））";
      expect(capture(src)).toEqual(["[0，20，40]"]);
    });

    it("prefers functions stored in a dict", () => {
      expect(capture("搞个 狗 = 「叫：整活（）「栓Q \"汪\"」」\n喊话（狗.叫（））")).toEqual(["汪"]);
    });
  });

  describe("标准库 standard library", () => {
    it("映射 / 过滤 / 内卷 / 找找", () => {
      expect(capture(
        "搞个 a = [1，2，3，4]\n" +
        "喊话（映射（a，整活（x）「栓Q x * x」））\n" +
        "喊话（过滤（a，整活（x）「栓Q x > 2」））\n" +
        "喊话（内卷（a，整活（和，x）「栓Q 和 + x」））\n" +
        "喊话（内卷（a，整活（和，x）「栓Q 和 + x」，100））\n" +
        "喊话（找找（a，整活（x）「栓Q x > 2」），找找（a，整活（x）「栓Q x > 9」））",
      )).toEqual(["[1，4，9，16]", "[3，4]", "10", "110", "3 虚无"]);
    });

    it("passes the index to callbacks that want it", () => {
      expect(capture('喊话（映射（["a"，"b"]，整活（x，i）「栓Q i + x」））')).toEqual(["[0a，1b]"]);
    });

    it("范围", () => {
      expect(capture("喊话（范围（3），范围（1，4），范围（10，0，-5））")).toEqual(["[0，1，2] [1，2，3] [10，5]"]);
    });

    it("排序 / 反转 / 躺平 / 去重", () => {
      expect(capture(
        '喊话（排序（[3，1，2]），排序（["b"，"a"]），排序（[1，3，2]，整活（a，b）「栓Q b - a」））\n' +
        '喊话（反转（[1，2]），反转（"草语言"），躺平（[[1，2]，[3]，4]），去重（[1，1，2，1]））',
      )).toEqual(["[1，2，3] [a，b] [3，2，1]", "[2，1] 言语草 [1，2，3，4] [1，2]"]);
    });

    it("strings", () => {
      expect(capture(
        '喊话（分割（"a,b"，","），分割（"草语"），拼接（[1，2，3]，"-"））\n' +
        '喊话（替换（"卷卷卷"，"卷"，"润"），去空格（"  草  "），大写（"cao"），重复（"哈"，3））\n' +
        '喊话（开头是（"草语言"，"草"），结尾是（"草语言"，"草"），查找（"草语言"，"语"），包含（"草语言"，"言"））',
      )).toEqual(["[a，b] [草，语] 1-2-3", "润润润 草 CAO 哈哈哈", "确实 没有内味 1 确实"]);
    });

    it("counts characters, not UTF-16 units", () => {
      expect(capture('喊话（长度（"😂草"），切片（"😂草语言"，1，3），切片（"草语言"，1））')).toEqual(["2 草语 语言"]);
    });

    it("math", () => {
      expect(capture("喊话（取整（3.7），四舍五入（2.5），绝对值（-3），开方（16），次方（2，10），最大（1，5，3），最小（[4，2，8]））")).toEqual([
        "3 3 3 4 1024 5 2",
      ]);
    });

    it("随机整数 stays in range", () => {
      const out = capture("搞个 ok = 确实\n盘它（i：范围（200））「\n  搞个 r = 随机整数（1，6）\n  如果（r < 1 或者 r > 6）「ok = 没有内味」\n」\n喊话（ok）");
      expect(out).toEqual(["确实"]);
    });

    it("builtin errors are catchable by 真香/草", () => {
      expect(capture('真香「长度（42）」草（e）「喊话（"抓到了"）」')).toEqual(["抓到了"]);
    });

    it("checks optional-argument arity", () => {
      expect(() => capture("范围（）")).toThrow("需要1到3个");
    });
  });

  describe("error messages", () => {
    it("suggests the closest name", () => {
      expect(() => capture('搞个 名字 = "张三"\n喊话（名子）')).toThrow("你是不是想说「名字」？");
    });

    it("attaches line and column to runtime errors", () => {
      const e = errorOf(() => capture("搞个 a = 1\n\n喊话（a / 0）"));
      expect(e.loc).toMatchObject({ line: 3, column: 4 });
    });

    it("reports 润 outside a loop", () => {
      expect(() => capture("整活 f（）「润」\nf（）")).toThrow("不在卷里润什么润");
    });

    it("lets a top-level 栓Q end the program", () => {
      expect(capture('喊话（1）\n栓Q\n喊话（2）')).toEqual(["1"]);
    });
  });

  describe("拿来吧你 / 上交 modules", () => {
    it("imports exported names only", () => {
      const out = runWithFiles({
        "main.cao": '搞个 工具 = 拿来吧你（"./工具"）\n喊话（工具.打招呼（"世界"），工具.版本，工具.私房钱）',
        "工具.cao": '上交 整活 打招呼（名字）「栓Q "你好，" + 名字」\n上交 搞个 版本 = 2\n搞个 私房钱 = 100',
      });
      expect(out).toEqual(["你好，世界 2 虚无"]);
    });

    it("runs each module once", () => {
      const out = runWithFiles({
        "main.cao": '拿来吧你（"./a"）\n拿来吧你（"./a"）',
        "a.cao": '喊话（"加载了"）',
      });
      expect(out).toEqual(["加载了"]);
    });

    it("detects circular imports (套娃)", () => {
      expect(() => runWithFiles({
        "main.cao": '拿来吧你（"./b"）',
        "b.cao": '拿来吧你（"./main"）',
      })).toThrow("套娃了兄弟：main.cao → b.cao → main.cao");
    });

    it("reports missing files", () => {
      expect(() => runWithFiles({ "main.cao": '拿来吧你（"./没有"）' })).toThrow("拿了个寂寞");
    });

    it("attributes errors inside module functions to the module file", () => {
      const e = errorOf(() => runWithFiles({
        "main.cao": '搞个 m = 拿来吧你（"./坏"）\nm.坏（）',
        "坏.cao": "上交 整活 坏（）「\n  栓Q 1 / 0\n」",
      }));
      expect(e.filename).toBe("坏.cao");
      expect(e.loc).toMatchObject({ line: 2 });
    });

    it("refuses to import without a module loader", () => {
      expect(() => capture('拿来吧你（"./x"）')).toThrow("这个环境不支持引入文件");
    });

    it("only exports declarations", () => {
      expect(() => capture("上交 1")).toThrow("国家不收");
    });
  });
});
