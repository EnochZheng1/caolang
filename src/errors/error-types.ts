import { SourceLocation } from "../utils/source-location.js";

export class CaoError extends Error {
  /** File the error came from, if known (set when an error escapes a module). */
  public filename?: string;

  constructor(
    public category: string,
    message: string,
    public loc?: SourceLocation,
    public source?: string,
  ) {
    super(message);
    this.name = "CaoError";
  }
}

export class CaoSyntaxError extends CaoError {
  constructor(message: string, loc?: SourceLocation, source?: string) {
    super("语法错误", message, loc, source);
    this.name = "CaoSyntaxError";
  }
}

export class CaoReferenceError extends CaoError {
  constructor(name: string, loc?: SourceLocation, source?: string) {
    super("引用错误", `这谁啊，不认识: ${name}`, loc, source);
    this.name = "CaoReferenceError";
  }
}

export class CaoTypeError extends CaoError {
  constructor(message: string, loc?: SourceLocation, source?: string) {
    super("类型错误", `类型不对啊兄弟，别乱搞：${message}`, loc, source);
    this.name = "CaoTypeError";
  }
}

/**
 * One-line description of an error, with position if known.
 * e.g. "[3:15] 这谁啊，不认识: 名子"
 */
export function describeError(e: unknown): string {
  if (e instanceof CaoError && e.loc) {
    return `[${e.loc.line}:${e.loc.column}] ${e.message}`;
  }
  return e instanceof Error ? e.message : String(e);
}
