import { Frame, Sketch, SketchData, SketchyParams } from './types'

// Keyed by canvas rather than module-scoped, so two sketches on two canvases can
// run side by side: loading a sketch only kills the one already on that canvas.
const running = new WeakMap<HTMLCanvasElement, SketchyParams<unknown>>()

export const loadSketch = <T>(
  sketch: Sketch<T>,
  params: SketchyParams<T>,
): SketchyParams<T> => {
  const { context } = params
  const canvas = context.canvas
  const animated = params.animated

  const previous = running.get(canvas)
  if (previous) {
    previous.stop()
    previous.onKill?.()
  }
  running.set(canvas, params)

  // stop() must reach the loop's own state, so the loop mutates this object in
  // place (it used to recurse on spread copies, leaving the flag unreadable).
  params.animated = animated
  params.stop = () => {
    params.animated = false
    if (params.requestId !== null) {
      cancelAnimationFrame(params.requestId)
      params.requestId = null
    }
    return false
  }

  // The 2D context is shared between sketches, so drop whatever the previous one
  // left on it. clearRect obeys the current transform, hence the reset first.
  context.setTransform(params.dpr, 0, 0, params.dpr, 0, 0)
  context.filter = 'none'
  context.globalCompositeOperation = 'source-over'
  context.globalAlpha = 1
  context.lineWidth = 1
  context.clearRect(0, 0, params.width, params.height)

  params.lastFrameTime = +new Date()
  params.dt = 0

  const frame: Frame<T> = sketch(params)
  const attached = canvas.isConnected

  const step = () => {
    // A canvas torn out of the document can no longer be reached by stop(), so
    // end the loop rather than leak a rAF for the life of the page.
    if (attached && !canvas.isConnected) {
      params.animated = false
      params.requestId = null
      running.delete(canvas)
      params.onKill?.()
      return
    }

    if (!params.animated) return

    const now = +new Date()
    params.dt = now - params.lastFrameTime
    params.lastFrameTime = now
    params.time += params.dt

    frame(params)

    // re-checked: the frame itself may have called stop()
    if (!params.animated) return
    params.requestId = requestAnimationFrame(step)
  }

  frame(params)
  if (params.animated) params.requestId = requestAnimationFrame(step)

  return params
}

export const createSketch = <T = SketchData>(sketch: Sketch<T>) => sketch
