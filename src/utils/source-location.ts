export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export function loc(line: number, column: number, offset: number): SourceLocation {
  return { line, column, offset };
}
