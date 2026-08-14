import { ArcOptions, ShapeOptions } from '../helpers/draw'
import { Lerpr, Scaler, SinCosFn } from '../maff'

/** Shape of `params.data` when a sketch does not declare one. */
export type SketchData = Record<string, unknown>

export type Frame<T = SketchData> = (params: SketchyParams<T>) => void
export type Sketch<T = SketchData> = (params: SketchyParams<T>) => Frame<T>

export type SketchyParams<T = SketchData> = Canvas2DParams & SketchParams<T>

export type Canvas2DParams = {
  context: CanvasRenderingContext2D

  // render helpers
  /** The live requestAnimationFrame handle, or null when not animating. */
  requestId: number | null
  /** Backing-store scale applied to the context (devicePixelRatio). */
  dpr: number
  setFilter: (val: string) => void
  setFillStyle: (val: string) => void
  setStrokeStyle: (val: string) => void
  setBlendMode: (val: BlendMode) => void
  createGradient: (
    c1: string,
    c2: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => CanvasGradient
  onKill?: () => void

  // draw helpers
  saver: (body: () => void) => void
  circle: (x: number, y: number, r: number, options?: ArcOptions) => void
  shape: (points: [number, number][], options?: ShapeOptions) => void
}

export type SketchParams<T = SketchData> = {
  // config
  time: number
  startTime: number
  /** Timestamp of the previous frame — dt is measured against this, not time. */
  lastFrameTime: number
  dt: number
  width: number
  height: number
  animated?: boolean
  // Maff
  TAU: number
  PI: number

  abs: Math['abs']
  sin: SinCosFn
  cos: SinCosFn
  t: Scaler

  r: Scaler
  n: Scaler

  lerp: Lerpr
  stop: () => boolean
  data: T
}

export type SketchConfig<T = SketchData> = {
  containerId?: string
  element?: HTMLElement
  animate?: boolean
  dimensions?: [number, number]
  timeOffset?: number
  data?: T
}

export type BlendMode =
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
