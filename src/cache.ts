/*
 * Copyright 2021 Mathematic, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class Cache<T> {
  #storage: {[K in keyof T]?: T[K];} = {};
  #timers: {[K in keyof T]?: NodeJS.Timeout;} = {};

  set<K extends keyof T>(name: K, value: T[K]) {
    this.#storage[name] = value;

    const timer = this.#timers[name];
    if (timer) {clearTimeout(timer);}

    this.#timers[name] = setTimeout(() => {
      delete this.#storage[name];
    }, 1000 * 60 * 60 * 24);
  }

  unset<K extends keyof T>(name: K) {
    delete this.#storage[name];
    const timer = this.#timers[name];
    if (timer) {clearTimeout(timer);}
  }

  get<K extends keyof T>(name: K): T[K]|undefined {
    return this.#storage[name];
  }
}
