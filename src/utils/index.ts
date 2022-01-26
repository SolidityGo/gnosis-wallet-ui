export function truncateMiddle(str: string, maxLength = 10): string {
  if (str.length <= maxLength) {
    return str;
  }

  const half = Math.floor(maxLength / 2);
  return str.substr(0, half) + '...' + str.substr(str.length - half);
}

export function asserts(x: unknown, message = 'not valid'): asserts x {
  if (!x) throw new Error(message);
}

export function isNonNil<T>(x: T): x is NonNullable<T> {
  return x !== undefined && x !== null;
}
