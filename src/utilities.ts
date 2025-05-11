export function enumerate<T>(list: T[]): [number, T][] {
  return Object.entries(list).map(([index, value]) => [Number(index), value]);
}

export function djb2(input: string): string {
  /**
   * https://en.wikipedia.org/wiki/Universal_hashing#Hashing_strings
   * https://en.wikipedia.org/wiki/Daniel_J._Bernstein
   * https://medium.com/@khorvath3327/implementing-a-hashing-algorithm-in-node-js-9bbe56caab28
   */
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 3) + hash + char;
  }
  return (hash & 0xffffffffff).toString(16);
}

export function serializeWithKeys<
  T extends Record<string, string | number>,
  U extends keyof T
>(input: T, keys: U[]): string {
  return keys.map((key) => `${input[key]}`).join("");
}
