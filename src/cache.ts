export class Cache<T> {
  #storage: {[K in keyof T]?: T[K];} = {};
  #timers: {[K in keyof T]?: NodeJS.Timeout;} = {};

  set<K extends keyof T>(name: K, value: T[K]) {
    this.#storage[name] = value;

    const timer = this.#timers[name];
    if (timer) clearTimeout(timer);

    this.#timers[name] = setTimeout(() => {
      delete this.#storage[name];
    }, 1000 * 60 * 60 * 24);
  }

  unset<K extends keyof T>(name: K) {
    delete this.#storage[name];
    const timer = this.#timers[name];
    if (timer) clearTimeout(timer);
  }

  get<K extends keyof T>(name: K): T[K]|undefined {
    return this.#storage[name];
  }
}
