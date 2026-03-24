/**
 * Check if a character (code point) is a CJK ideograph.
 * Covers CJK Unified Ideographs and common extensions.
 */
export function isCJK(codePoint: number): boolean {
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||   // CJK Unified Ideographs
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||   // CJK Extension A
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK Extension B
    (codePoint >= 0x2a700 && codePoint <= 0x2b73f) || // CJK Extension C
    (codePoint >= 0x2b740 && codePoint <= 0x2b81f) || // CJK Extension D
    (codePoint >= 0xf900 && codePoint <= 0xfaff)      // CJK Compatibility Ideographs
  );
}

/**
 * Check if a character can be part of an identifier.
 * Allows CJK characters, ASCII letters, digits, and underscore.
 */
export function isIdentChar(codePoint: number): boolean {
  return (
    isCJK(codePoint) ||
    (codePoint >= 0x41 && codePoint <= 0x5a) ||   // A-Z
    (codePoint >= 0x61 && codePoint <= 0x7a) ||   // a-z
    (codePoint >= 0x30 && codePoint <= 0x39) ||   // 0-9
    codePoint === 0x5f                              // _
  );
}

/**
 * Check if a character can start an identifier.
 * Same as isIdentChar but no digits.
 */
export function isIdentStart(codePoint: number): boolean {
  return (
    isCJK(codePoint) ||
    (codePoint >= 0x41 && codePoint <= 0x5a) ||   // A-Z
    (codePoint >= 0x61 && codePoint <= 0x7a) ||   // a-z
    codePoint === 0x5f                              // _
  );
}

export function isDigit(codePoint: number): boolean {
  return codePoint >= 0x30 && codePoint <= 0x39;
}

export function isWhitespace(codePoint: number): boolean {
  return (
    codePoint === 0x20 ||   // space
    codePoint === 0x09 ||   // tab
    codePoint === 0x0d ||   // carriage return
    codePoint === 0x0a ||   // newline
    codePoint === 0x3000    // ideographic space (　)
  );
}
