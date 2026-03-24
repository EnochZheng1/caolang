import type { CourseProgress, Course, LessonProgress } from "./types.js";

const STORAGE_KEY = "caolang-course-progress";

export function createFreshProgress(): CourseProgress {
  return {
    currentLessonId: "1-1",
    lessons: {},
    socialCredit: 100,
    courseStartedAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
}

export function loadProgress(): CourseProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createFreshProgress();
    const parsed = JSON.parse(raw);
    if (!parsed.currentLessonId || !parsed.lessons) return createFreshProgress();
    return parsed as CourseProgress;
  } catch {
    return createFreshProgress();
  }
}

export function saveProgress(progress: CourseProgress): void {
  progress.lastAccessedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): CourseProgress {
  localStorage.removeItem(STORAGE_KEY);
  return createFreshProgress();
}

export function getLessonProgress(progress: CourseProgress, lessonId: string): LessonProgress {
  if (!progress.lessons[lessonId]) {
    progress.lessons[lessonId] = { completed: false, hintsRevealed: 0, attempts: 0 };
  }
  return progress.lessons[lessonId];
}

export function markLessonComplete(progress: CourseProgress, lessonId: string, code: string): void {
  const lp = getLessonProgress(progress, lessonId);
  lp.completed = true;
  lp.bestCode = code;
}

export function getCompletionStats(progress: CourseProgress, course: Course): { completed: number; total: number } {
  let total = 0;
  let completed = 0;
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      total++;
      if (progress.lessons[lesson.id]?.completed) completed++;
    }
  }
  return { completed, total };
}

export function getNextLessonId(course: Course, currentId: string): string | null {
  const all = course.chapters.flatMap((ch) => ch.lessons);
  const idx = all.findIndex((l) => l.id === currentId);
  if (idx >= 0 && idx < all.length - 1) return all[idx + 1].id;
  return null;
}

export function getPrevLessonId(course: Course, currentId: string): string | null {
  const all = course.chapters.flatMap((ch) => ch.lessons);
  const idx = all.findIndex((l) => l.id === currentId);
  if (idx > 0) return all[idx - 1].id;
  return null;
}

export function adjustSocialCredit(progress: CourseProgress, delta: number): void {
  progress.socialCredit = Math.max(0, Math.min(150, progress.socialCredit + delta));
}
