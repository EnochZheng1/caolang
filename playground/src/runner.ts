import { runCompiled } from "@caolang/compiler/index.js";
import type { RunningProgram } from "@caolang/compiler/index.js";
import { installCanvas, CANVAS_BUILTINS, showSavedImage } from "@caolang/stdlib/index.js";
import { describeError } from "@caolang/errors/index.js";

export interface RunOptions {
  socialCredit?: boolean;
  mode996?: boolean;
  strict?: boolean;
}

export interface RunResult {
  output: string[];
  error: string | null;
  time: number;
}

/** For programs that keep running (games): where to draw and where late output goes. */
export interface StageHost {
  canvas: HTMLCanvasElement;
  onOpen: (width: number, height: number) => void;
  onLateOutput: (text: string) => void;
  onLateError: (message: string) => void;
}

// Only one program runs at a time; starting another stops the last one's game loop
let running: RunningProgram | null = null;

export function stopRunning(): void {
  running?.stop();
  running = null;
}

export function runCode(source: string, options: RunOptions = {}, stage?: StageHost): RunResult {
  stopRunning();
  const output: string[] = [];
  let error: string | null = null;
  let finished = false;
  const start = performance.now();

  try {
    // Compiled to JavaScript, so it runs at full browser speed
    running = runCompiled(source, {
      // After the first run, output (from a game loop) is shown as it happens
      output: (text: string) => (finished && stage ? stage.onLateOutput(text) : output.push(text)),
      easterEggs: {
        socialCredit: options.socialCredit,
        mode996: options.mode996,
        strict: options.strict,
      },
      extraBuiltins: stage ? CANVAS_BUILTINS : undefined,
      setup: stage
        ? ($) =>
            installCanvas($, {
              canvas: stage.canvas,
              createCanvas: (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }),
              window,
              now: () => performance.now(),
              createAudioContext: () => new AudioContext(),
              onOpen: stage.onOpen,
              touchDevice: navigator.maxTouchPoints > 0,
              saveImage: showSavedImage,
            })
        : undefined,
      onError: stage ? (e) => stage.onLateError(describeError(e)) : undefined,
    });
  } catch (e) {
    error = describeError(e);
  }
  finished = true;

  const time = performance.now() - start;
  return { output, error, time };
}
