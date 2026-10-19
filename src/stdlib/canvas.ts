/**
 * 画布 — graphics, input, sound and a game loop for compiled CaoLang in the browser.
 *
 * Two layers:
 *   - a low-res pixel buffer (像素 / 刷像素) for retro 3D and pixel art, scaled up crisply
 *   - vector drawing (画方块 / 画圆 / 写字 …) at full resolution on top
 * Coordinates are always in logical pixels (the size given to 开画).
 *
 * IMPORTANT: installCanvas must stay self-contained (no imports, nothing from
 * outside the function) — `cao build --网页` embeds it with toString().
 */
import type { Runtime } from "../compiler/runtime.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface CanvasHost {
  canvas: HTMLCanvasElement;
  /** Make a scratch canvas for the pixel buffer. */
  createCanvas: (width: number, height: number) => HTMLCanvasElement;
  window: Pick<Window, "requestAnimationFrame" | "cancelAnimationFrame" | "addEventListener" | "removeEventListener">;
  now: () => number;
  createAudioContext?: () => AudioContext;
  /** Called when 开画 sizes the canvas, so the page can show it. */
  onOpen?: (width: number, height: number) => void;
}

/** Names installCanvas defines, so the compiler can resolve them. */
export const CANVAS_BUILTINS = [
  "开画", "清屏", "画方块", "画框", "画圆", "画线", "写字", "透明度",
  "像素", "刷像素", "颜色", "混色",
  "按住了吗", "刚按了吗", "鼠标", "锁鼠标", "鼠标移动",
  "一直卷", "别卷了", "嘀", "沙沙",
];

export function installCanvas($: Runtime, host: CanvasHost): void {
  const { def, fail, guard, onCleanup, num, str } = $;
  const canvas = host.canvas;
  const win = host.window;
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let scale = 1;

  // ---- Colors ----
  // Colors are numbers 0xRRGGBB (from 颜色（r，g，b）) or strings: Chinese names or any CSS color

  const NAMED: Record<string, string> = {
    红: "#e53935", 绿: "#43a047", 蓝: "#1e88e5", 黄: "#fdd835", 黑: "#000000", 白: "#ffffff",
    灰: "#9e9e9e", 紫: "#8e24aa", 橙: "#fb8c00", 粉: "#f48fb1", 青: "#00acc1", 棕: "#6d4c41",
    金: "#ffd700", 透明: "rgba(0,0,0,0)",
  };
  const css = (c: Any): string => {
    if (typeof c === "number") return "#" + (c & 0xffffff).toString(16).padStart(6, "0");
    if (typeof c === "string") return NAMED[c] ?? c;
    return fail("颜色要么是 颜色（r，g，b） 算出来的数字，要么是 \"红\" 这样的字符串");
  };

  const need = (): CanvasRenderingContext2D => ctx ?? fail("还没开画呢！先写 开画（宽，高）");

  // ---- Setup ----

  let pixels: Uint32Array | null = null;
  let imageData: ImageData | null = null;
  let buffer: HTMLCanvasElement | null = null;
  let bufferCtx: CanvasRenderingContext2D | null = null;

  def("开画", 2, 3, (w, h, s) => {
    width = Math.floor(num("开画", w));
    height = Math.floor(num("开画", h));
    scale = s === undefined ? 1 : num("开画", s);
    if (width <= 0 || height <= 0) fail("画布大小得是正数，你这是要画个寂寞？");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx = canvas.getContext("2d")!;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    buffer = host.createCanvas(width, height);
    bufferCtx = buffer.getContext("2d")!;
    imageData = bufferCtx.createImageData(width, height);
    pixels = new Uint32Array(imageData.data.buffer);
    host.onOpen?.(width, height);
    return null;
  });

  // ---- Vector drawing ----

  def("清屏", 0, 1, (c) => {
    const g = need();
    g.fillStyle = css(c ?? "黑");
    g.fillRect(0, 0, width, height);
    return null;
  });
  def("画方块", 5, 5, (x, y, w, h, c) => {
    const g = need();
    g.fillStyle = css(c);
    g.fillRect(x, y, w, h);
    return null;
  });
  def("画框", 5, 6, (x, y, w, h, c, lw) => {
    const g = need();
    g.strokeStyle = css(c);
    g.lineWidth = lw ?? 1;
    g.strokeRect(x, y, w, h);
    return null;
  });
  def("画圆", 4, 4, (x, y, r, c) => {
    const g = need();
    g.fillStyle = css(c);
    g.beginPath();
    g.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
    g.fill();
    return null;
  });
  def("画线", 5, 6, (x1, y1, x2, y2, c, lw) => {
    const g = need();
    g.strokeStyle = css(c);
    g.lineWidth = lw ?? 1;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    return null;
  });
  // 写字（文字，x，y，颜色?，字号?，对齐?） — 对齐 is "左" / "中" / "右"
  def("写字", 3, 6, (text, x, y, c, size, align) => {
    const g = need();
    g.fillStyle = css(c ?? "白");
    g.font = `bold ${size ?? 12}px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`;
    g.textAlign = align === "中" ? "center" : align === "右" ? "right" : "left";
    g.textBaseline = "top";
    g.fillText($.display(text), x, y);
    return null;
  });
  def("透明度", 1, 1, (a) => {
    need().globalAlpha = Math.max(0, Math.min(1, num("透明度", a)));
    return null;
  });

  // ---- Pixel buffer ----

  def("颜色", 3, 3, (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255));
  // 混色（a，b，比例）: 0 → a, 1 → b. Handy for fog and lighting.
  def("混色", 3, 3, (a, b, t) => {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k;
    const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k;
    const bl = (a & 255) + ((b & 255) - (a & 255)) * k;
    return ((r & 255) << 16) | ((g & 255) << 8) | (bl & 255);
  });
  // Hot path (called per pixel), so checks are kept minimal
  def("像素", 3, 3, (x, y, c) => {
    if (pixels === null) return fail("还没开画呢！先写 开画（宽，高）");
    const xi = x | 0;
    const yi = y | 0;
    if (xi >= 0 && yi >= 0 && xi < width && yi < height) {
      // ImageData is RGBA in memory; as little-endian uint32 that's 0xAABBGGRR
      pixels[yi * width + xi] = 0xff000000 | ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255);
    }
    return null;
  });
  // 刷像素（偏移x?，偏移y?）: show the pixel buffer; the offset is handy for screen shake
  def("刷像素", 0, 2, (dx, dy) => {
    const g = need();
    bufferCtx!.putImageData(imageData!, 0, 0);
    g.drawImage(buffer!, dx ?? 0, dy ?? 0, width, height);
    return null;
  });

  // ---- Input ----

  const KEY_NAMES: Record<string, string> = {
    上: "arrowup", 下: "arrowdown", 左: "arrowleft", 右: "arrowright",
    空格: " ", 回车: "enter", 退出: "escape", 换挡: "shift",
  };
  const keyOf = (name: Any): string => {
    const s = str("按键", name);
    return KEY_NAMES[s] ?? s.toLowerCase();
  };
  const held = new Set<string>();
  const pressed = new Set<string>();
  const editable = (e: Event): boolean => {
    const t = e.target as Any;
    return !!t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (editable(e) || !looping) return;
    const k = e.key.toLowerCase();
    if (!held.has(k)) pressed.add(k);
    held.add(k);
    if (k.startsWith("arrow") || k === " ") e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => {
    held.delete(e.key.toLowerCase());
  };

  const mouse = { x: 0, y: 0, down: false, dx: 0, dy: 0 };
  let wantLock = false;
  const toLogical = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * width;
    mouse.y = ((e.clientY - rect.top) / rect.height) * height;
  };
  const onMouseMove = (e: MouseEvent) => {
    toLogical(e);
    mouse.dx += e.movementX ?? 0;
    mouse.dy += e.movementY ?? 0;
  };
  const onMouseDown = (e: MouseEvent) => {
    toLogical(e);
    mouse.down = true;
    if (wantLock && canvas.requestPointerLock) canvas.requestPointerLock();
  };
  const onMouseUp = () => {
    mouse.down = false;
  };

  let listening = false;
  const listen = () => {
    if (listening) return;
    listening = true;
    win.addEventListener("keydown", onKeyDown as EventListener);
    win.addEventListener("keyup", onKeyUp as EventListener);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    win.addEventListener("mouseup", onMouseUp as EventListener);
    onCleanup(() => {
      listening = false;
      win.removeEventListener("keydown", onKeyDown as EventListener);
      win.removeEventListener("keyup", onKeyUp as EventListener);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      win.removeEventListener("mouseup", onMouseUp as EventListener);
      held.clear();
      pressed.clear();
    });
  };

  def("按住了吗", 1, 1, (k) => held.has(keyOf(k)));
  def("刚按了吗", 1, 1, (k) => pressed.has(keyOf(k)));
  def("鼠标", 0, 0, () => ({ __proto__: null, x: mouse.x, y: mouse.y, 按下: mouse.down }));
  // 锁鼠标（）: clicking the canvas captures the mouse, for first-person looking around
  def("锁鼠标", 0, 0, () => {
    wantLock = true;
    return null;
  });
  // 鼠标移动（）: how far the mouse moved since the last frame
  def("鼠标移动", 0, 0, () => ({ __proto__: null, x: mouse.dx, y: mouse.dy }));

  // ---- Game loop ----

  let looping = false;
  let frame = 0;
  let last = 0;

  const stopLoop = () => {
    looping = false;
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
  };

  // 一直卷（整活（秒）「…」）: call the function every frame with the seconds since the last one
  def("一直卷", 1, 1, (fn) => {
    if (typeof fn !== "function") fail("一直卷 要一个整活，比如 一直卷（整活（秒）「…」）");
    stopLoop();
    listen();
    looping = true;
    last = host.now();
    const tick = () => {
      if (!looping) return;
      const now = host.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      guard(fn, [dt]);
      pressed.clear();
      mouse.dx = 0;
      mouse.dy = 0;
      if (looping) frame = win.requestAnimationFrame(tick);
    };
    frame = win.requestAnimationFrame(tick);
    return null;
  });
  def("别卷了", 0, 0, () => {
    stopLoop();
    return null;
  });
  onCleanup(stopLoop);

  // ---- Sound (8-bit style) ----

  let audio: AudioContext | null = null;
  const getAudio = (): AudioContext | null => {
    if (!audio && host.createAudioContext) {
      try {
        audio = host.createAudioContext();
      } catch {
        return null;
      }
    }
    return audio;
  };
  const WAVES: Record<string, OscillatorType> = { 方: "square", 三角: "triangle", 锯齿: "sawtooth", 正弦: "sine" };

  // 嘀（频率，毫秒，音量?，波形?） — 波形: "方" "三角" "锯齿" "正弦"
  def("嘀", 2, 4, (freq, ms, vol, wave) => {
    const a = getAudio();
    if (!a) return null;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = WAVES[wave as string] ?? "square";
    osc.frequency.setValueAtTime(num("嘀", freq), t);
    gain.gain.setValueAtTime(vol ?? 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + num("嘀", ms) / 1000);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + ms / 1000);
    return null;
  });
  // 沙沙（毫秒，音量?）: a burst of noise — hits, explosions
  def("沙沙", 1, 2, (ms, vol) => {
    const a = getAudio();
    if (!a) return null;
    const len = Math.max(1, Math.floor((a.sampleRate * num("沙沙", ms)) / 1000));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    const gain = a.createGain();
    gain.gain.value = vol ?? 0.2;
    src.buffer = buf;
    src.connect(gain).connect(a.destination);
    src.start();
    return null;
  });
}
