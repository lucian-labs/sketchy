// Sketches drain `state` with shift(); cap it so one that never drains doesn't
// grow a keypress log for the life of the page.
const MAX_QUEUED_KEYS = 64

export const createControls = (
  handlers: Record<KeyboardEvent['code'], () => void>,
) => {
  const state: string[] = []

  const handleKeyDown = (e: KeyboardEvent) => {
    handlers[e.code]?.()
    state.push(e.code)
    if (state.length > MAX_QUEUED_KEYS) state.shift()
  }

  window.addEventListener('keydown', handleKeyDown)

  // second element is the teardown — without it every re-loaded sketch leaves a
  // live listener holding its closure
  return [
    state,
    () => window.removeEventListener('keydown', handleKeyDown),
  ] as const
}
