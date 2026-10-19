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
  /** A phone or tablet: show the virtual gamepad before the first touch. */
  touchDevice?: boolean;
  /** Show the canvas as an image the player can save or share (see 存图). */
  saveImage?: (canvas: HTMLCanvasElement, filename: string) => void;
}

/** Names installCanvas defines, so the compiler can resolve them. */
export const CANVAS_BUILTINS = [
  "开画", "清屏", "画方块", "画框", "画圆", "画线", "写字", "透明度",
  "像素", "刷像素", "颜色", "混色",
  "按住了吗", "刚按了吗", "鼠标", "锁鼠标", "鼠标移动",
  "虚拟手柄", "摇杆", "触屏吗",
  "一直卷", "别卷了", "嘀", "沙沙", "存图",
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
  // 存图（文件名?）: offer what's on the canvas right now as an image to save or share
  def("存图", 0, 1, (name) => {
    need();
    if (!host.saveImage) return fail("这个环境存不了图");
    host.saveImage(canvas, name === undefined ? "草语言.png" : str("存图", name));
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

  // Page coordinates → logical canvas coordinates. The canvas may be letterboxed
  // (object-fit: contain), so the drawing is centered inside the element's box.
  const toCanvasPoint = (clientX: number, clientY: number): [number, number] => {
    const rect = canvas.getBoundingClientRect();
    const k = Math.min(rect.width / width, rect.height / height) || 1;
    const left = rect.left + (rect.width - width * k) / 2;
    const top = rect.top + (rect.height - height * k) / 2;
    return [(clientX - left) / k, (clientY - top) / k];
  };

  const mouse = { x: 0, y: 0, down: false, dx: 0, dy: 0 };
  let wantLock = false;
  const toLogical = (e: MouseEvent) => {
    [mouse.x, mouse.y] = toCanvasPoint(e.clientX, e.clientY);
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

  // ---- Touch: virtual gamepad ----
  // A floating joystick on the left half acts as the arrow keys; buttons on the
  // right press whatever keys the game chose. So keyboard games work on phones.

  const STICK_RADIUS = 26;
  const BUTTON_RADIUS = 20;
  let touchUsed = !!host.touchDevice;
  let pad: Array<{ key: string; label: string; x: number; y: number }> | null = null;
  const stick = { id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  const stickKeys = new Set<string>();
  const buttonTouches = new Map<number, string>();
  let mouseTouch = -1; // a tap that's neither joystick nor button counts as a click

  const press = (k: string) => {
    if (!held.has(k)) pressed.add(k);
    held.add(k);
  };

  const layoutPad = (buttons: Array<[string, string]>) => {
    // Bottom-right, stacked upwards, then leftwards
    pad = buttons.map(([key, label], i) => ({
      key,
      label,
      x: width - 34 - Math.floor(i / 2) * 50,
      y: height - 34 - (i % 2) * 50,
    }));
  };

  const updateStick = () => {
    let vx = (stick.x - stick.ox) / STICK_RADIUS;
    let vy = (stick.y - stick.oy) / STICK_RADIUS;
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    stick.x = stick.ox + vx * STICK_RADIUS;
    stick.y = stick.oy + vy * STICK_RADIUS;
    const want = new Set<string>();
    if (vx < -0.35) want.add("arrowleft");
    if (vx > 0.35) want.add("arrowright");
    if (vy < -0.35) want.add("arrowup");
    if (vy > 0.35) want.add("arrowdown");
    for (const k of stickKeys) if (!want.has(k)) held.delete(k);
    for (const k of want) if (!stickKeys.has(k)) press(k);
    stickKeys.clear();
    want.forEach((k) => stickKeys.add(k));
  };

  const stickVector = () =>
    stick.id < 0 ? { x: 0, y: 0 } : { x: (stick.x - stick.ox) / STICK_RADIUS, y: (stick.y - stick.oy) / STICK_RADIUS };

  const onTouchStart = (e: TouchEvent) => {
    if (!looping) return;
    e.preventDefault();
    touchUsed = true;
    for (const t of Array.from(e.changedTouches)) {
      const [x, y] = toCanvasPoint(t.clientX, t.clientY);
      const hit = pad?.find((b) => Math.hypot(b.x - x, b.y - y) <= BUTTON_RADIUS * 1.4);
      if (hit) {
        buttonTouches.set(t.identifier, hit.key);
        press(hit.key);
      } else if (x < width / 2 && stick.id < 0) {
        Object.assign(stick, { id: t.identifier, ox: x, oy: y, x, y });
      } else if (mouseTouch < 0) {
        mouseTouch = t.identifier;
        mouse.x = x;
        mouse.y = y;
        mouse.down = true;
      }
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!looping) return;
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === stick.id) {
        [stick.x, stick.y] = toCanvasPoint(t.clientX, t.clientY);
        updateStick();
      }
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      const key = buttonTouches.get(t.identifier);
      if (key !== undefined) {
        buttonTouches.delete(t.identifier);
        if (![...buttonTouches.values()].includes(key)) held.delete(key);
      }
      if (t.identifier === mouseTouch) {
        mouseTouch = -1;
        mouse.down = false;
      }
      if (t.identifier === stick.id) {
        stick.id = -1;
        stickKeys.forEach((k) => held.delete(k));
        stickKeys.clear();
      }
    }
  };

  const drawPad = () => {
    if (!pad || !touchUsed || !ctx) return;
    const g = ctx;
    const alpha = g.globalAlpha;
    g.globalAlpha = 0.35;
    g.fillStyle = "#ffffff";
    g.strokeStyle = "#ffffff";
    g.lineWidth = 1.5;
    const [sx, sy] = stick.id < 0 ? [40, height - 40] : [stick.ox, stick.oy];
    g.beginPath();
    g.arc(sx, sy, STICK_RADIUS, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(stick.id < 0 ? sx : stick.x, stick.id < 0 ? sy : stick.y, 11, 0, Math.PI * 2);
    g.fill();
    for (const b of pad) {
      g.globalAlpha = held.has(b.key) ? 0.6 : 0.35;
      g.beginPath();
      g.arc(b.x, b.y, BUTTON_RADIUS, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 0.9;
      g.fillStyle = "#000000";
      g.font = 'bold 10px "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(b.label, b.x, b.y);
      g.fillStyle = "#ffffff";
    }
    g.globalAlpha = alpha;
  };

  // 虚拟手柄（「空格："扔"，回车："开始"」）: on touch screens, show a joystick
  // (acts as the arrow keys) and one button per key, labelled. Call again to change buttons.
  def("虚拟手柄", 0, 1, (buttons) => {
    if (buttons !== undefined && (buttons === null || typeof buttons !== "object" || Array.isArray(buttons))) {
      fail("虚拟手柄 要一个字典，比如 虚拟手柄（「空格：\"扔\"」）");
    }
    const entries: Array<[string, string]> = buttons === undefined
      ? [["空格", "A"]]
      : Object.keys(buttons).map((k) => [k, $.display(buttons[k])]);
    const keys = entries.map(([k, label]) => [keyOf(k), label] as [string, string]);
    // Let go of keys whose buttons disappeared
    for (const [id, key] of buttonTouches) {
      if (!keys.some(([k]) => k === key)) {
        buttonTouches.delete(id);
        held.delete(key);
      }
    }
    layoutPad(keys);
    listen();
    return null;
  });
  // 摇杆（）: the joystick as numbers from -1 to 1, for smooth analog control
  def("摇杆", 0, 0, () => ({ __proto__: null, ...stickVector() }));
  // 触屏吗（）: has the player used the touch screen? (e.g. to show "点「开始」" instead of "按回车")
  def("触屏吗", 0, 0, () => touchUsed);

  let listening = false;
  const listen = () => {
    if (listening) return;
    listening = true;
    const active = { passive: false } as AddEventListenerOptions;
    win.addEventListener("keydown", onKeyDown as EventListener);
    win.addEventListener("keyup", onKeyUp as EventListener);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    win.addEventListener("mouseup", onMouseUp as EventListener);
    canvas.addEventListener("touchstart", onTouchStart, active);
    canvas.addEventListener("touchmove", onTouchMove, active);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);
    onCleanup(() => {
      listening = false;
      win.removeEventListener("keydown", onKeyDown as EventListener);
      win.removeEventListener("keyup", onKeyUp as EventListener);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      win.removeEventListener("mouseup", onMouseUp as EventListener);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      held.clear();
      pressed.clear();
      buttonTouches.clear();
      stickKeys.clear();
      stick.id = -1;
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
      drawPad();
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
