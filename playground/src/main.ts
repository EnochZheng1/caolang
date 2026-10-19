import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { runCode, stopRunning, RunOptions, StageHost } from "./runner.js";
import { EXAMPLES } from "./examples.js";
import { decodeFromHash, copyShareLink } from "./share.js";
import { CourseController } from "./course/controller.js";
import "./style.css";
import "./course/course.css";

// ---- DOM Elements ----
const editorEl = document.getElementById("editor")!;
const outputEl = document.getElementById("output")!;
const widgetsEl = document.getElementById("widgets")!;
const btnRun = document.getElementById("btn-run") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnClear = document.getElementById("btn-clear") as HTMLButtonElement;
const examplesSelect = document.getElementById("examples") as HTMLSelectElement;
const eggSocial = document.getElementById("egg-social") as HTMLInputElement;
const egg996 = document.getElementById("egg-996") as HTMLInputElement;
const eggStrict = document.getElementById("egg-strict") as HTMLInputElement;
const toastEl = document.getElementById("toast")!;
const stageEl = document.getElementById("stage")!;
const stageCanvas = document.getElementById("stage-canvas") as HTMLCanvasElement;
const btnFullscreen = document.getElementById("btn-fullscreen") as HTMLButtonElement;

// Course-specific DOM
const btnModeToggle = document.getElementById("btn-mode-toggle") as HTMLButtonElement;
const sandboxControls = document.getElementById("sandbox-controls")!;
const courseControls = document.getElementById("course-controls")!;
const eggControls = document.getElementById("egg-controls")!;
const outputTitle = document.getElementById("output-title")!;
const outputTabs = document.getElementById("output-tabs")!;
const lessonPanel = document.getElementById("lesson-panel")!;
const outputPanel = document.getElementById("output-panel")!;
const validationBar = document.getElementById("validation-bar")!;

// ---- State ----
let courseMode = false;
let courseController: CourseController | null = null;
let sandboxCode = ""; // Preserved sandbox code when switching to course mode
let socialCreditScore = 100;

// ---- CodeMirror Editor ----
const runKeymap = keymap.of([
  {
    key: "Ctrl-Enter",
    run: () => { executeCode(); return true; },
  },
  {
    key: "Cmd-Enter",
    run: () => { executeCode(); return true; },
  },
]);

const sharedCode = decodeFromHash();
const initialCode = sharedCode || EXAMPLES[0].code;

const editor = new EditorView({
  state: EditorState.create({
    doc: initialCode,
    extensions: [
      basicSetup,
      javascript(),
      oneDark,
      runKeymap,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" },
      }),
    ],
  }),
  parent: editorEl,
});

// ---- Helper: set editor code ----
function setEditorCode(code: string): void {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: code },
  });
}

function getEditorCode(): string {
  return editor.state.doc.toString();
}

// ---- Populate Examples ----
EXAMPLES.forEach((ex, i) => {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = ex.name;
  examplesSelect.appendChild(opt);
});

examplesSelect.addEventListener("change", () => {
  const idx = parseInt(examplesSelect.value, 10);
  if (!isNaN(idx) && EXAMPLES[idx]) {
    setEditorCode(EXAMPLES[idx].code);
    examplesSelect.value = "";
  }
});

// ---- Mode Toggle ----
btnModeToggle.addEventListener("click", () => {
  courseMode = !courseMode;
  stopRunning();
  stageEl.classList.add("hidden");

  if (courseMode) {
    // Save sandbox code
    sandboxCode = getEditorCode();

    // Switch UI
    btnModeToggle.textContent = "🎮 自由模式";
    sandboxControls.style.display = "none";
    courseControls.style.display = "flex";
    eggControls.style.display = "none";
    outputTitle.style.display = "none";
    outputTabs.style.display = "flex";
    validationBar.style.display = "block";

    // Initialize course controller
    if (!courseController) {
      courseController = new CourseController({
        lessonContentEl: document.getElementById("lesson-content")!,
        validationBarEl: validationBar,
        lessonSelectEl: document.getElementById("lesson-select") as HTMLSelectElement,
        prevBtnEl: document.getElementById("btn-prev-lesson") as HTMLButtonElement,
        nextBtnEl: document.getElementById("btn-next-lesson") as HTMLButtonElement,
        lessonPanelEl: lessonPanel,
        outputPanelEl: outputPanel,
        setEditorCode,
        getEditorCode,
        showToast,
      });
    } else {
      // Re-enter: go to current lesson
      courseController.goToLesson(
        courseController["progress"].currentLessonId,
      );
    }
  } else {
    // Restore sandbox code
    setEditorCode(sandboxCode);

    // Switch UI back
    btnModeToggle.textContent = "📖 开始学习";
    sandboxControls.style.display = "flex";
    courseControls.style.display = "none";
    eggControls.style.display = "";
    outputTitle.style.display = "";
    outputTabs.style.display = "none";
    validationBar.style.display = "none";
    lessonPanel.classList.add("hidden");
    outputPanel.classList.remove("hidden");
  }
});

// ---- Run Code ----
function getEasterEggs(): RunOptions {
  return {
    socialCredit: eggSocial.checked,
    mode996: egg996.checked,
    strict: eggStrict.checked,
  };
}

function executeCode(): void {
  if (courseMode && courseController) {
    // In course mode: delegate to controller (handles validation + output rendering)
    const userCode = getEditorCode();
    courseController.onCodeRun(userCode);

    // Update social credit widget from course progress
    updateCourseWidgets();
    return;
  }

  // Sandbox mode: normal execution
  const source = getEditorCode();
  outputEl.innerHTML = "";
  stageEl.classList.add("hidden");

  const result = runCode(source, getEasterEggs(), stage);

  for (const line of result.output) appendOutput(line);
  if (result.error) appendError(result.error);

  const meta = document.createElement("div");
  meta.className = "line line-meta";
  meta.textContent = `\n⏱ ${result.time.toFixed(1)}ms`;
  outputEl.appendChild(meta);

  outputEl.scrollTop = outputEl.scrollHeight;
  updateWidgets(result);
}

// ---- Output ----
function appendOutput(line: string): void {
  const div = document.createElement("div");
  div.className = "line";
  if (line.includes("⚠️") || line.includes("警告")) {
    div.className = "line line-warning";
  }
  div.textContent = line;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function appendError(message: string): void {
  const div = document.createElement("div");
  div.className = "line line-error";
  div.textContent = `错误！${message}`;
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

// ---- 画布 stage ----
const stage: StageHost = {
  canvas: stageCanvas,
  onOpen: () => {
    stageEl.classList.remove("hidden");
    stageCanvas.focus();
  },
  onLateOutput: appendOutput,
  onLateError: appendError,
};

btnFullscreen.addEventListener("click", () => {
  void stageCanvas.requestFullscreen?.();
  stageCanvas.focus();
});

// ---- Widgets ----
function updateWidgets(result: { output: string[]; error: string | null }): void {
  widgetsEl.innerHTML = "";

  if (eggSocial.checked) {
    const hasWarning = result.output.some((l) => l.includes("社会信用警告"));
    if (hasWarning) socialCreditScore = Math.max(0, socialCreditScore - 20);
    else if (!result.error) socialCreditScore = Math.min(100, socialCreditScore + 5);
    if (result.error) socialCreditScore = Math.max(0, socialCreditScore - 10);

    const widget = document.createElement("div");
    widget.className = "widget";
    const fillClass = socialCreditScore > 60 ? "" : socialCreditScore > 30 ? "medium" : "low";
    widget.innerHTML = `
      🏅 社会信用: ${socialCreditScore}
      <div class="credit-meter">
        <div class="credit-meter-fill ${fillClass}" style="width: ${socialCreditScore}%"></div>
      </div>
    `;
    widgetsEl.appendChild(widget);
  }

  if (egg996.checked) {
    const hour = new Date().getHours();
    const is996 = hour >= 21 || hour < 6;
    const widget = document.createElement("div");
    widget.className = "widget";
    const status = is996 ? "🔴 加班中" : "🟢 正常";
    widget.innerHTML = `<span class="clock-996">💀 996: ${String(hour).padStart(2, "0")}:00 ${status}</span>`;
    widgetsEl.appendChild(widget);
  }

  if (eggStrict.checked) {
    const widget = document.createElement("div");
    widget.className = "widget";
    widget.innerHTML = `🔴 严厉模式已启用 — 文化自信！`;
    widgetsEl.appendChild(widget);
  }

  if (!eggSocial.checked && !egg996.checked && !eggStrict.checked) {
    const widget = document.createElement("div");
    widget.className = "widget";
    widget.textContent = "npm install -g caolang";
    widgetsEl.appendChild(widget);
  }
}

function updateCourseWidgets(): void {
  widgetsEl.innerHTML = "";
  if (!courseController) return;

  const credit = courseController.getSocialCredit();
  const widget = document.createElement("div");
  widget.className = "widget";
  const pct = Math.min(100, (credit / 150) * 100);
  const fillClass = credit > 80 ? "" : credit > 40 ? "medium" : "low";
  widget.innerHTML = `
    🏅 社会信用: ${credit}
    <div class="credit-meter">
      <div class="credit-meter-fill ${fillClass}" style="width: ${pct}%"></div>
    </div>
  `;
  widgetsEl.appendChild(widget);
}

// ---- Share ----
btnShare.addEventListener("click", async () => {
  const source = getEditorCode();
  try {
    await copyShareLink(source);
    showToast("🔗 链接已复制！+10 Social Credit");
  } catch {
    showToast("复制失败，请手动复制地址栏");
  }
});

// ---- Clear ----
btnClear.addEventListener("click", () => {
  outputEl.innerHTML = "";
  widgetsEl.innerHTML = "";
});

// ---- Run Button ----
btnRun.addEventListener("click", executeCode);

// ---- Toast ----
function showToast(message: string): void {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2000);
}

// ---- Init ----
if (sharedCode) {
  setTimeout(executeCode, 100);
}
