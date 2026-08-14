// CSS font shorthand is size-then-family, and the canvas silently ignores an
// invalid assignment to context.font — so `Arial 20px` renders as 10px sans.
export const font = (name: string, size: number) => {
  const quoted = /\s/.test(name) && !/[,'"]/.test(name) ? `"${name}"` : name
  return `${size}px ${quoted}`
}
