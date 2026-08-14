import { BlendMode, SketchConfig, SketchData, SketchyParams } from './types'
import { cos, sin, lerp, r, n } from './maff'
import { createLinearGradient } from './helpers/color'
import { arc, drawShape, saver } from './helpers/draw'
import { Vec2 } from './types/common'

export const createCanvas = (
  el: HTMLElement,
  dimensions?: Vec2,
): HTMLCanvasElement => {
  // Only ever adopt a canvas this library put in this container. The old
  // document-wide lookup re-parented (and blanked) any canvas on the page.
  const canvas =
    el.querySelector<HTMLCanvasElement>(':scope > canvas[data-sketchy]') ||
    document.createElement('canvas')

  canvas.dataset.sketchy = ''
  el.appendChild(canvas)

  const [width, height] = dimensions || [el.clientWidth, el.clientHeight]

  // Backing store in device pixels, layout in CSS pixels — otherwise the browser
  // upscales a half-resolution bitmap on every HiDPI screen.
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  return canvas
}

export const createParams = <T = SketchData>(
  config: SketchConfig<T>,
): SketchyParams<T> => {
  const id = config.containerId || config.element?.id || 'sketchy'
  const rootElement = config.element || document.getElementById(id)
  if (!rootElement) throw new Error(`No Root Element Found at ${id}`)

  // Sizes stay in CSS pixels so sketch maths is unchanged; the canvas itself is
  // oversampled by dpr and the context is scaled to match.
  const [width, height] = config.dimensions || [
    rootElement.clientWidth,
    rootElement.clientHeight,
  ]
  const dpr = window.devicePixelRatio || 1

  const canvas = createCanvas(rootElement, [width, height])

  const context = canvas.getContext('2d')
  if (!context) throw new Error(`cannot initialize canvas`)

  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  const startTime = +new Date()

  const params: SketchyParams<T> = {
    // an omitted data bag is only typeable as T when the caller took the default
    data: config.data || ({} as T),
    // config
    requestId: null,
    dpr,
    time: config.timeOffset || 0,
    dt: 0,
    startTime,
    lastFrameTime: startTime,
    width,
    height,
    animated: config.animate,
    context,

    // render helpers
    setFilter: (val: string) => (context.filter = val),
    setFillStyle: (val: string) => (context.fillStyle = val),
    setStrokeStyle: (val: string) => (context.strokeStyle = val),
    setBlendMode: (val: BlendMode) => (context.globalCompositeOperation = val),

    // draw helpers
    saver: (body: () => void) => saver(context, body),
    circle: (x, y, r, options) => arc(context, x, y, r, options),
    shape: (points, options) => drawShape(context, points, options),

    // generators
    createGradient: (
      c1: string,
      c2: string,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) => createLinearGradient(context, c1, c2, x1, y1, x2, y2),

    // maff
    TAU: Math.PI * 2,
    PI: Math.PI,
    abs: Math.abs,
    sin,
    cos,
    // reads params.time live, so it tracks the loop instead of returning 0
    t: (s = 1, o = 0) => 0.001 * params.time * s + o,
    r,
    n,
    lerp,
    stop: () => false,
  }

  return params
}
