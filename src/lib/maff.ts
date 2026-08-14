export type SinCosFn = (
  u: number,
  freq?: number,
  scale?: number,
  offset?: number,
) => number

export const sin: SinCosFn = (u: number, freq = 1, scale = 1, offset = 0) =>
  Math.sin(u * Math.PI * 2 * freq) * scale + offset

export const cos: SinCosFn = (u: number, freq = 1, scale = 1, offset = 0) =>
  Math.cos(u * Math.PI * 2 * freq) * scale + offset

export type Scaler = (scale?: number, offset?: number) => number

export type Lerpr = (
  u: number,
  max: number,
  margin?: number,
  min?: number,
) => number

// min is the floor of the output range, not an offset subtracted from it
export const lerp: Lerpr = (u, max, margin = 0, min = 0) =>
  min + margin + u * (max - min - margin * 2)

export const r: Scaler = (scale = 1, offset = 0) =>
  Math.random() * scale + offset

/**
 * @deprecated Alias of `r` — uniform random, not coherent noise. It cannot be
 * noise at this signature (no coordinate to sample); use `r` instead.
 */
export const n: Scaler = r
