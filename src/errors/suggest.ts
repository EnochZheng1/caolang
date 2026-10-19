/**
 * "你是不是想说…？" — find the closest known name to a typo.
 * Returns null if nothing is close enough to be a plausible typo.
 */
export function suggest(name: string, candidates: Iterable<string>): string | null {
  const target = [...name];
  // Any one-letter name is one edit away from every other; don't guess
  if (target.length < 2) return null;
  // Allow roughly one edit per three characters, at least one.
  const maxDistance = Math.max(1, Math.floor(target.length / 3));
  let best: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    if (candidate === name) continue;
    const d = editDistance(target, [...candidate]);
    if (d <= maxDistance && d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}

/** Levenshtein distance over code points (so each 汉字 counts as one). */
function editDistance(a: string[], b: string[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}
