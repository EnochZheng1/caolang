import { describe, it, expect } from "vitest";
import { BACKENDS } from "../helpers/backends.js";

describe.each(BACKENDS)("Easter Eggs ($name)", (backend) => {
  function runWithEggs(
    source: string,
    eggs: { socialCredit?: boolean; strict?: boolean; mode996?: boolean },
  ): string[] {
    const output: string[] = [];
    backend.run(source, { output: (text) => output.push(text), easterEggs: eggs });
    return output;
  }

  describe("Social Credit System", () => {
    it("warns when function has > 5 returns", () => {
      const source = `
整活 太客气了（x）「
  如果（x == 1）「栓Q 1」
  如果（x == 2）「栓Q 2」
  如果（x == 3）「栓Q 3」
  如果（x == 4）「栓Q 4」
  如果（x == 5）「栓Q 5」
  如果（x == 6）「栓Q 6」
  栓Q 0
」
`;
      const output = runWithEggs(source, { socialCredit: true });
      expect(output.some((line) => line.includes("社会信用警告"))).toBe(true);
    });

    it("does not warn for <= 5 returns", () => {
      const source = `
整活 正常的（x）「
  如果（x == 1）「栓Q 1」
  栓Q 0
」
`;
      const output = runWithEggs(source, { socialCredit: true });
      expect(output.some((line) => line.includes("社会信用警告"))).toBe(false);
    });

    it("does nothing when disabled", () => {
      const source = `
整活 太客气了（x）「
  如果（x == 1）「栓Q 1」
  如果（x == 2）「栓Q 2」
  如果（x == 3）「栓Q 3」
  如果（x == 4）「栓Q 4」
  如果（x == 5）「栓Q 5」
  如果（x == 6）「栓Q 6」
  栓Q 0
」
`;
      const output = runWithEggs(source, {});
      expect(output.some((line) => line.includes("社会信用警告"))).toBe(false);
    });
  });

  describe("严厉 (Strict) Mode", () => {
    it("rejects ASCII braces in strict mode", () => {
      const source = '整活 foo（）{ 喊话（"hi"） }';
      expect(() => runWithEggs(source, { strict: true })).toThrow("文化自信");
    });

    it("rejects ASCII parens in strict mode", () => {
      const source = '喊话("hi")';
      expect(() => runWithEggs(source, { strict: true })).toThrow("文化自信");
    });

    it("allows Chinese punctuation in strict mode", () => {
      const source = '喊话（"hi"）';
      const output = runWithEggs(source, { strict: true });
      expect(output).toEqual(["hi"]);
    });

    it("does not check in non-strict mode", () => {
      const source = '喊话("hi")';
      const output = runWithEggs(source, {});
      expect(output).toEqual(["hi"]);
    });
  });
});
