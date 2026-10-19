import { CaoValue } from "./values.js";

export class Environment {
  private bindings: Map<string, CaoValue> = new Map();
  private parent: Environment | null;

  constructor(parent?: Environment) {
    this.parent = parent ?? null;
  }

  /**
   * Define a new variable in the current scope.
   */
  define(name: string, value: CaoValue): void {
    this.bindings.set(name, value);
  }

  /**
   * Look up a variable, walking the scope chain.
   * Throws if not found.
   */
  get(name: string): CaoValue {
    if (this.bindings.has(name)) {
      return this.bindings.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`这谁啊，不认识: ${name}`);
  }

  /**
   * Look up a variable, or undefined if it isn't defined anywhere in the chain.
   */
  lookup(name: string): CaoValue | undefined {
    const value = this.bindings.get(name);
    if (value !== undefined) return value;
    return this.parent?.lookup(name);
  }

  /**
   * Every name visible from this scope (for "你是不是想说…" suggestions).
   */
  names(): Set<string> {
    const all = this.parent ? this.parent.names() : new Set<string>();
    for (const name of this.bindings.keys()) all.add(name);
    return all;
  }

  /**
   * Assign to an existing variable in the nearest scope that contains it.
   * Throws if the variable doesn't exist anywhere in the chain.
   */
  set(name: string, value: CaoValue): void {
    if (this.bindings.has(name)) {
      this.bindings.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new Error(`这谁啊，不认识: ${name}`);
  }
}
