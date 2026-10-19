import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runCompiled } from "../../src/compiler/index.js";
import { installCanvas, CANVAS_BUILTINS } from "../../src/stdlib/index.js";
import type { CaoError } from "../../src/errors/index.js";

type Listener = (e: unknown) => void;

/** A fake browser: records drawing calls, lets tests step frames and press keys. */
function fakeBrowser() {
  const calls: Array<[string, ...unknown[]]> = [];
  const state: Record<string, unknown> = {};
  const imageData = (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
  let lastImage: ReturnType<typeof imageData> | null = null;

  const ctx = new Proxy(state, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop === "createImageData") return (w: number, h: number) => (lastImage = imageData(w, h));
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
      };
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });

  const listeners = new Map<string, Set<Listener>>();
  const addEventListener = (type: string, fn: Listener) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(fn);
  };
  const removeEventListener = (type: string, fn: Listener) => listeners.get(type)?.delete(fn);
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    addEventListener,
    removeEventListener,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  };

  let frames: Array<() => void> = [];
  let now = 0;
  const win = {
    requestAnimationFrame: (fn: () => void) => frames.push(fn),
    cancelAnimationFrame: () => {
      frames = [];
    },
    addEventListener,
    removeEventListener,
  };

  let opened: [number, number] | null = null;
  const host = {
    canvas: canvas as unknown as HTMLCanvasElement,
    createCanvas: () => ({ getContext: () => ctx }) as unknown as HTMLCanvasElement,
    window: win as unknown as Window,
    now: () => now,
    onOpen: (w: number, h: number) => {
      opened = [w, h];
    },
  };

  return {
    host,
    calls,
    state,
    canvas,
    image: () => lastImage,
    opened: () => opened,
    listenerCount: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
    /** Advance one frame of `ms` milliseconds. */
    step(ms = 16) {
      now += ms;
      const due = frames;
      frames = [];
      due.forEach((f) => f());
    },
    key(type: "keydown" | "keyup", key: string) {
      listeners.get(type)?.forEach((fn) => fn({ key, target: null, preventDefault() {} }));
    },
  };
}

function run(source: string, browser = fakeBrowser()) {
  const output: string[] = [];
  const errors: CaoError[] = [];
  const program = runCompiled(source, {
    output: (t) => output.push(t),
    extraBuiltins: CANVAS_BUILTINS,
    setup: ($) => installCanvas($, browser.host),
    onError: (e) => errors.push(e),
  });
  return { browser, output, errors, program };
}

describe("画布", () => {
  it("开画 sizes the canvas (scaled) and tells the page", () => {
    const { browser } = run("开画（320，180，3）");
    expect(browser.canvas.width).toBe(960);
    expect(browser.canvas.height).toBe(540);
    expect(browser.opened()).toEqual([320, 180]);
    expect(browser.calls).toContainEqual(["setTransform", 3, 0, 0, 3, 0, 0]);
  });

  it("draws with Chinese color names, CSS colors, and 颜色（）", () => {
    const { browser } = run('开画（10，10）\n画方块（1，2，3，4，"红"）\n画圆（5，5，2，"#123456"）\n画方块（0，0，1，1，颜色（255，0，128））');
    expect(browser.calls).toContainEqual(["fillRect", 1, 2, 3, 4]);
    expect(browser.calls).toContainEqual(["arc", 5, 5, 2, 0, Math.PI * 2]);
    expect(browser.state.fillStyle).toBe("#ff0080");
  });

  it("颜色 and 混色 do color math", () => {
    const { output } = run("喊话（颜色（1，2，3），混色（颜色（0，0，0），颜色（200，100，50），0.5））");
    expect(output).toEqual([`${(1 << 16) | (2 << 8) | 3} ${(100 << 16) | (50 << 8) | 25}`]);
  });

  it("像素 writes RGBA into the pixel buffer and 刷像素 shows it", () => {
    const { browser } = run("开画（4，4）\n像素（1，2，颜色（10，20，30））\n像素（99，99，颜色（1，1，1））\n刷像素（）");
    const data = browser.image()!.data;
    const i = (2 * 4 + 1) * 4;
    expect([...data.slice(i, i + 4)]).toEqual([10, 20, 30, 255]);
    expect(browser.calls.some(([name]) => name === "putImageData")).toBe(true);
    expect(browser.calls.some(([name]) => name === "drawImage")).toBe(true);
  });

  it("refuses to draw before 开画", () => {
    expect(() => run('画方块（0，0，1，1，"红"）')).toThrow("还没开画呢");
  });

  it("一直卷 runs every frame with seconds elapsed, until 别卷了", () => {
    const { browser, output } = run(
      "开画（10，10）\n搞个 n = 0\n一直卷（整活（秒）「\n  n += 1\n  喊话（n，秒）\n  如果（n == 3）「别卷了（）」\n」）",
    );
    browser.step(16);
    browser.step(32);
    browser.step(16);
    browser.step(16);
    expect(output).toEqual(["1 0.016", "2 0.032", "3 0.016"]);
  });

  it("tracks held and just-pressed keys", () => {
    const { browser, output } = run(
      '开画（10，10）\n一直卷（整活（秒）「喊话（按住了吗（"左"），刚按了吗（"空格"），按住了吗（"w"））」）',
    );
    browser.key("keydown", "ArrowLeft");
    browser.key("keydown", " ");
    browser.key("keydown", "W");
    browser.step();
    browser.step();
    browser.key("keyup", "ArrowLeft");
    browser.step();
    expect(output).toEqual(["确实 确实 确实", "确实 没有内味 确实", "没有内味 没有内味 确实"]);
  });

  it("reports errors inside the game loop with their .cao line, and stops the loop", () => {
    const { browser, errors, output } = run("开画（10，10）\n一直卷（整活（秒）「\n  喊话（\"帧\"）\n  喊话（1 / 0）\n」）");
    browser.step();
    browser.step();
    expect(output).toEqual(["帧"]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe("除以零？脑子瓦特了？");
    expect(errors[0].loc?.line).toBe(4);
  });

  it("stop() ends the loop and removes listeners", () => {
    const { browser, output, program } = run('开画（10，10）\n一直卷（整活（秒）「喊话（"帧"）」）');
    browser.step();
    expect(browser.listenerCount()).toBeGreaterThan(0);
    program.stop();
    browser.step();
    expect(output).toEqual(["帧"]);
    expect(browser.listenerCount()).toBe(0);
  });

  it("canvas builtins only exist when a host installs them", () => {
    expect(() => runCompiled("开画（1，1）", { output: () => {} })).toThrow("这谁啊，不认识: 开画");
  });

  it("《逃离996》 runs: title screen, start, play for a few seconds", () => {
    const source = readFileSync(new URL("../../examples/逃离996.cao", import.meta.url), "utf-8");
    const { browser, errors } = run(source);
    expect(browser.opened()).toEqual([320, 180]);
    for (let i = 0; i < 5; i++) browser.step();
    browser.key("keydown", "Enter");
    browser.step();
    browser.key("keyup", "Enter");
    browser.key("keydown", "w");
    browser.key("keydown", " ");
    for (let i = 0; i < 120; i++) browser.step();
    expect(errors).toEqual([]);
    expect(browser.calls.filter(([name]) => name === "fillText").length).toBeGreaterThan(100);
  });
});
