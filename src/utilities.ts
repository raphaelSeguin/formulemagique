export function enumerate<T>(list: T[]): [number, T][] {
    return Object.entries(list).map(([index, value]) => [Number(index), value])
}