export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Merge a base class with a Base UI `className` that may be a string or state function. */
export function withClass<TState>(
  base: string,
  className: string | ((state: TState) => string | undefined) | undefined
): string | ((state: TState) => string | undefined) {
  if (typeof className === 'function') {
    return (state: TState) => cn(base, className(state))
  }
  return cn(base, className)
}
