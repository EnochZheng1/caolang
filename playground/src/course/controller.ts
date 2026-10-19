import type { Course, Lesson, CourseProgress } from "./types.js";
import { COURSE } from "./data.js";
import { validateLesson } from "./validator.js";
import {
  loadProgress, saveProgress, getLessonProgress,
  markLessonComplete, getCompletionStats,
  getNextLessonId, getPrevLessonId, adjustSocialCredit,
} from "./progress.js";
import type { RunResult } from "../runner.js";

export class CourseController {
  private course: Course = COURSE;
  private progress: CourseProgress;
  private currentLesson: Lesson;

  // DOM refs
  private lessonContentEl: HTMLElement;
  private validationBarEl: HTMLElement;
  private lessonSelectEl: HTMLSelectElement;
  private prevBtnEl: HTMLButtonElement;
  private nextBtnEl: HTMLButtonElement;
  private tabButtons: NodeListOf<Element>;
  private lessonPanelEl: HTMLElement;
  private outputPanelEl: HTMLElement;

  // Callbacks
  private setEditorCode: (code: string) => void;
  private getEditorCode: () => string;
  private showToast: (msg: string) => void;

  constructor(options: {
    lessonContentEl: HTMLElement;
    validationBarEl: HTMLElement;
    lessonSelectEl: HTMLSelectElement;
    prevBtnEl: HTMLButtonElement;
    nextBtnEl: HTMLButtonElement;
    lessonPanelEl: HTMLElement;
    outputPanelEl: HTMLElement;
    setEditorCode: (code: string) => void;
    getEditorCode: () => string;
    showToast: (msg: string) => void;
  }) {
    this.lessonContentEl = options.lessonContentEl;
    this.validationBarEl = options.validationBarEl;
    this.lessonSelectEl = options.lessonSelectEl;
    this.prevBtnEl = options.prevBtnEl;
    this.nextBtnEl = options.nextBtnEl;
    this.lessonPanelEl = options.lessonPanelEl;
    this.outputPanelEl = options.outputPanelEl;
    this.setEditorCode = options.setEditorCode;
    this.getEditorCode = options.getEditorCode;
    this.showToast = options.showToast;

    this.tabButtons = document.querySelectorAll("#output-tabs .tab");

    // Load progress
    this.progress = loadProgress();
    this.currentLesson = this.findLesson(this.progress.currentLessonId) || this.allLessons()[0];

    // Populate dropdown
    this.populateLessonSelect();

    // Wire navigation
    this.prevBtnEl.addEventListener("click", () => this.prevLesson());
    this.nextBtnEl.addEventListener("click", () => this.nextLesson());
    this.lessonSelectEl.addEventListener("change", () => {
      const id = this.lessonSelectEl.value;
      if (id) this.goToLesson(id);
    });

    // Wire tabs
    this.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = (btn as HTMLElement).dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Load current lesson
    this.goToLesson(this.currentLesson.id);
  }

  // ---- Navigation ----

  goToLesson(lessonId: string): void {
    const lesson = this.findLesson(lessonId);
    if (!lesson) return;

    this.currentLesson = lesson;
    this.progress.currentLessonId = lessonId;
    saveProgress(this.progress);

    // Update editor
    this.setEditorCode(lesson.starterCode);

    // Render lesson content
    this.renderLesson(lesson);

    // Update dropdown
    this.lessonSelectEl.value = lessonId;

    // Update nav buttons
    this.prevBtnEl.disabled = !getPrevLessonId(this.course, lessonId);
    this.nextBtnEl.disabled = !getNextLessonId(this.course, lessonId);

    // Reset validation bar
    this.validationBarEl.className = "validation-bar idle";
    this.validationBarEl.textContent = "运行代码查看结果...";

    // Switch to lesson tab
    this.switchTab("lesson");
  }

  nextLesson(): void {
    const nextId = getNextLessonId(this.course, this.currentLesson.id);
    if (nextId) this.goToLesson(nextId);
  }

  prevLesson(): void {
    const prevId = getPrevLessonId(this.course, this.currentLesson.id);
    if (prevId) this.goToLesson(prevId);
  }

  // ---- Called by main.ts after executeCode ----

  onCodeRun(userCode: string): void {
    const { result, validation } = validateLesson(this.currentLesson, userCode);

    // Render output in terminal
    this.renderOutput(result);

    // Switch to output tab
    this.switchTab("output");

    // Update validation bar
    if (validation.passed) {
      this.validationBarEl.className = "validation-bar pass";
      this.validationBarEl.textContent = validation.message;

      // Mark complete + social credit
      const lp = getLessonProgress(this.progress, this.currentLesson.id);
      if (!lp.completed) {
        markLessonComplete(this.progress, this.currentLesson.id, userCode);
        adjustSocialCredit(this.progress, 50);
        this.showToast(`🎉 +50 摸鱼值！课程通过！`);
      }
      lp.attempts++;
      saveProgress(this.progress);
      this.updateDropdownMarks();
    } else {
      this.validationBarEl.className = "validation-bar fail";
      this.validationBarEl.textContent = validation.message;

      // Social credit penalty
      const lp = getLessonProgress(this.progress, this.currentLesson.id);
      lp.attempts++;
      adjustSocialCredit(this.progress, -10);
      saveProgress(this.progress);

      // Shake effect
      this.validationBarEl.classList.add("shake");
      setTimeout(() => this.validationBarEl.classList.remove("shake"), 300);
    }
  }

  // ---- Rendering ----

  private renderLesson(lesson: Lesson): void {
    const lp = getLessonProgress(this.progress, lesson.id);
    const stats = getCompletionStats(this.progress, this.course);
    const completedMark = lp.completed ? " ✅" : "";

    let html = `
      <div class="lesson-header">
        <span class="progress-badge">${stats.completed}/${stats.total} 完成 | 🐟 ${this.progress.socialCredit}</span>
        <button class="btn-reset-lesson" id="btn-reset-lesson">↻ 重置代码</button>
      </div>
      ${lesson.instruction}
    `;

    // Hints section
    html += `<div class="hints-section">`;
    // Revealed hints
    for (let i = 0; i < lp.hintsRevealed && i < lesson.hints.length; i++) {
      html += `<div class="hint-item">💡 提示 ${i + 1}：${escapeHtml(lesson.hints[i].text)}</div>`;
    }
    // Show hint button if more hints available
    if (lp.hintsRevealed < lesson.hints.length) {
      html += `<button class="btn-hint" id="btn-reveal-hint">💡 显示提示（-5 摸鱼值）</button>`;
    }
    // Solution button
    if (lesson.solutionCode) {
      html += `<button class="btn-solution" id="btn-show-solution">🔓 查看答案</button>`;
      html += `<pre class="solution-code" id="solution-code" style="display:none;">${escapeHtml(lesson.solutionCode)}</pre>`;
    }
    html += `</div>`;

    this.lessonContentEl.innerHTML = html;

    // Wire hint button
    const hintBtn = document.getElementById("btn-reveal-hint");
    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        lp.hintsRevealed++;
        adjustSocialCredit(this.progress, -5);
        saveProgress(this.progress);
        this.renderLesson(lesson);
      });
    }

    // Wire solution button
    const solBtn = document.getElementById("btn-show-solution");
    const solCode = document.getElementById("solution-code");
    if (solBtn && solCode) {
      solBtn.addEventListener("click", () => {
        solCode.style.display = solCode.style.display === "none" ? "block" : "none";
      });
    }

    // Wire reset button
    const resetBtn = document.getElementById("btn-reset-lesson");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.setEditorCode(lesson.starterCode);
        this.showToast("代码已重置");
      });
    }
  }

  private renderOutput(result: { output: string[]; error: string | null; time: number }): void {
    const outputEl = document.getElementById("output")!;
    outputEl.innerHTML = "";

    for (const line of result.output) {
      const div = document.createElement("div");
      div.className = "line";
      if (line.includes("⚠️") || line.includes("警告")) {
        div.className = "line line-warning";
      }
      div.textContent = line;
      outputEl.appendChild(div);
    }

    if (result.error) {
      const div = document.createElement("div");
      div.className = "line line-error";
      div.textContent = `错误！${result.error}`;
      outputEl.appendChild(div);
    }

    const meta = document.createElement("div");
    meta.className = "line line-meta";
    meta.textContent = `\n⏱ ${result.time.toFixed(1)}ms`;
    outputEl.appendChild(meta);

    outputEl.scrollTop = outputEl.scrollHeight;
  }

  // ---- Tabs ----

  switchTab(tabName: string): void {
    this.tabButtons.forEach((btn) => {
      btn.classList.toggle("active", (btn as HTMLElement).dataset.tab === tabName);
    });
    this.lessonPanelEl.classList.toggle("hidden", tabName !== "lesson");
    this.outputPanelEl.classList.toggle("hidden", tabName !== "output");
  }

  // ---- Dropdown ----

  private populateLessonSelect(): void {
    this.lessonSelectEl.innerHTML = "";
    for (const chapter of this.course.chapters) {
      const group = document.createElement("optgroup");
      group.label = `${chapter.emoji} ${chapter.title}`;
      for (const lesson of chapter.lessons) {
        const opt = document.createElement("option");
        opt.value = lesson.id;
        const mark = this.progress.lessons[lesson.id]?.completed ? "✓ " : "";
        opt.textContent = `${mark}${lesson.id} ${lesson.title}`;
        group.appendChild(opt);
      }
      this.lessonSelectEl.appendChild(group);
    }
  }

  private updateDropdownMarks(): void {
    this.populateLessonSelect();
    this.lessonSelectEl.value = this.currentLesson.id;
  }

  // ---- Helpers ----

  private allLessons(): Lesson[] {
    return this.course.chapters.flatMap((ch) => ch.lessons);
  }

  private findLesson(id: string): Lesson | undefined {
    return this.allLessons().find((l) => l.id === id);
  }

  getSocialCredit(): number {
    return this.progress.socialCredit;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
