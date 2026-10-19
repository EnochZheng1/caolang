import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileSource, runCompiled, execute } from "../../src/compiler/index.js";
import { buildStandalone } from "../../src/compiler/node.js";

function capture(source: string, npm?: Record<string, unknown>): string[] {
  const output: string[] = [];
  runCompiled(source, { output: (t) => output.push(t), npm });
  return output;
}

/** Write standalone output to a temp file and run it with plain node. */
function runStandalone(source: string): { stdout: string; stderr: string } {
  const dir = mkdtempSync(join(tmpdir(), "cao-build-"));
  try {
    const out = join(dir, "out.mjs");
    writeFileSync(out, buildStandalone(compileSource(source)));
    try {
      return { stdout: execFileSync(process.execPath, [out], { encoding: "utf-8", stdio: "pipe" }), stderr: "" };
    } catch (e) {
      const { stdout, stderr } = e as { stdout: string; stderr: string };
      return { stdout, stderr };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("Compiler", () => {
  describe("generated code", () => {
    it("keeps CaoLang names, so the JS is readable", () => {
      const { code } = compileSource("整活 加法（a，b）「栓Q a + b」\n喊话（加法（1，2））");
      expect(code).toContain("let 加法 = function (a, b)");
      expect(code).toContain('$b["喊话"](加法(1, 2))');
    });

    it("skips truthiness checks for conditions that are already booleans", () => {
      const { code } = compileSource("搞个 i = 0\n卷（i < 3 并且 非 确实）「i += 1」");
      expect(code).toContain("while (($.lt(i, 3) && !(true)))");
    });

    it("compiles 润 outside a loop to a runtime error, not a JS syntax error", () => {
      expect(compileSource("整活 f（）「润」").code).toContain("$.strayLoop()");
    });

    it("maps generated lines back to CaoLang lines", () => {
      const result = compileSource("喊话（1）\n\n喊话（2）");
      const lines = result.lineMap.filter(Boolean).map((l) => l!.line);
      expect(lines).toEqual([1, 3]);
    });
  });

  describe("JS interop", () => {
    it("calls functions from npm modules, with JS values passing straight through", () => {
      const fakeLib = { "module.exports": { 加倍: (x: number) => x * 2, 配置: { 级别: 3 } } };
      expect(capture('搞个 库 = 拿来吧你（"npm:fake"）\n喊话（库.加倍（21），库.配置.级别，库.配置）', { fake: fakeLib })).toEqual([
        "42 3 「级别：3」",
      ]);
    });

    it("uses an ES module's default export when it has nothing else", () => {
      expect(capture('搞个 f = 拿来吧你（"npm:only-default"）\n喊话（f（"草"））', {
        "only-default": { default: (s: string) => s + "!" },
      })).toEqual(["草!"]);
    });

    it("keeps an ES module namespace with named exports", () => {
      expect(capture('搞个 m = 拿来吧你（"npm:named"）\n喊话（m.a，m.b（））', {
        named: { a: 1, b: () => "二" },
      })).toEqual(["1 二"]);
    });

    it("lists the npm modules a program needs", () => {
      expect(compileSource('拿来吧你（"npm:lodash"）\n拿来吧你（"node:fs"）\n拿来吧你（"npm:lodash"）').npm).toEqual([
        "lodash",
        "node:fs",
      ]);
    });

    it("errors clearly when an npm module wasn't loaded", () => {
      const result = compileSource('拿来吧你（"npm:nope"）');
      expect(() => execute(result, { output: () => {} })).toThrow("没有加载 nope");
    });

    it("lets 真香/草 catch errors thrown by JS code", () => {
      const lib = { "module.exports": { 炸: () => { throw new Error("JS 炸了"); } } };
      expect(capture('搞个 库 = 拿来吧你（"npm:boom"）\n真香「库.炸（）」草（e）「喊话（"抓到：" + e）」', { boom: lib })).toEqual([
        "抓到：JS 炸了",
      ]);
    });
  });

  describe("cao build", () => {
    it("produces a standalone module that runs with plain node", () => {
      const { stdout } = runStandalone('整活 夸（x）「栓Q x + "，yyds！"」\n喊话（映射（["草语言"]，夸））\n喊话（「a：[1，2]」）');
      expect(stdout).toBe("[草语言，yyds！]\n「a：[1，2]」\n");
    });

    it("prints CaoLang errors from standalone output", () => {
      expect(runStandalone("喊话（1 / 0）").stderr).toContain("错误！除以零？脑子瓦特了？");
    });
  });
});
