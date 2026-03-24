import LZString from "lz-string";

export function encodeToHash(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}

export function decodeFromHash(): string | null {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  try {
    const decoded = LZString.decompressFromEncodedURIComponent(hash);
    return decoded || null;
  } catch {
    return null;
  }
}

export function updateHash(code: string): void {
  const compressed = encodeToHash(code);
  window.history.replaceState(null, "", `#${compressed}`);
}

export async function copyShareLink(code: string): Promise<void> {
  const compressed = encodeToHash(code);
  const url = `${window.location.origin}${window.location.pathname}#${compressed}`;
  await navigator.clipboard.writeText(url);
}
