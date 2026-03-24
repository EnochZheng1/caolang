import { SourceLocation } from "../utils/source-location.js";

/**
 * Format a pretty error message with source context.
 *
 * Output looks like:
 * ```
 * 错误！啊？这写的什么玩意儿
 *   --> file.cao:3:15
 *    |
 *  3 |   如果（n <= 1）「
 *    |               ^ 这里有问题
 * ```
 */
export function formatError(
  message: string,
  source?: string,
  loc?: SourceLocation,
  filename?: string,
): string {
  const lines: string[] = [];

  lines.push(`\x1b[31m错误！${message}\x1b[0m`);

  if (loc && filename) {
    lines.push(`  --> ${filename}:${loc.line}:${loc.column}`);
  } else if (loc) {
    lines.push(`  --> ${loc.line}:${loc.column}`);
  }

  if (source && loc) {
    const sourceLines = source.split("\n");
    const lineIdx = loc.line - 1;

    if (lineIdx >= 0 && lineIdx < sourceLines.length) {
      const lineNum = String(loc.line);
      const padding = " ".repeat(lineNum.length);

      lines.push(`${padding} |`);
      lines.push(`${lineNum} | ${sourceLines[lineIdx]}`);
      lines.push(`${padding} | ${" ".repeat(loc.column - 1)}\x1b[31m^ 这里有问题\x1b[0m`);
    }
  }

  return lines.join("\n");
}
