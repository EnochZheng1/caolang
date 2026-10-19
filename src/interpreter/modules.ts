/**
 * How 拿来吧你 finds and reads other .cao files.
 * The interpreter itself never touches the file system, so it can run in the
 * browser; the CLI plugs in a Node implementation (see node-loader.ts).
 */
export interface ModuleLoader {
  /** Turn a path written in code (e.g. "./工具") into a canonical path. */
  resolve(specifier: string, fromFile: string | null): string;
  /** Read a resolved module's source. Throws if it doesn't exist. */
  read(path: string): string;
}
