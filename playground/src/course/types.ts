export interface Hint {
  text: string;
}

export type ValidationMode = "exact" | "includes" | "includes_any" | "custom";

export interface ValidationResult {
  passed: boolean;
  message: string;
}

export interface Lesson {
  id: string;
  title: string;
  instruction: string;
  starterCode: string;
  task: string;
  expectedOutput: string[];
  validationMode: ValidationMode;
  customValidator?: (output: string[], error: string | null) => ValidationResult;
  hints: Hint[];
  solutionCode?: string;
  testSuite?: string;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  lessons: Lesson[];
}

export interface Course {
  title: string;
  chapters: Chapter[];
}

export interface LessonProgress {
  completed: boolean;
  bestCode?: string;
  hintsRevealed: number;
  attempts: number;
}

export interface CourseProgress {
  currentLessonId: string;
  lessons: Record<string, LessonProgress>;
  socialCredit: number;
  courseStartedAt: number;
  lastAccessedAt: number;
}
