export type ArcOptions = {
  fill?: boolean
  stroke?: boolean
  start?: number
  end?: number
}

export const arc = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  {
    fill = true,
    stroke = false,
    start = 0,
    end = Math.PI * 2,
  }: ArcOptions = {},
) => {
  //
  context.beginPath()

  context.arc(x, y, r, start, end)

  context.closePath()
  if (stroke) context.stroke()
  if (fill) context.fill()
}

export const saver = (context: CanvasRenderingContext2D, body: () => void) => {
  context.save()

  body()

  context.restore()
}

export type ShapeOptions = {
  fill?: boolean
  stroke?: boolean
  closed?: boolean
}

export const drawShape = (
  context: CanvasRenderingContext2D,
  points: [number, number][],
  { fill = false, stroke = false, closed = true }: ShapeOptions = {},
) => {
  // an empty point list is ordinary input (an unfilled trail, a filtered set);
  // throwing here used to kill the frame, and with it the animation loop
  if (!points.length) return

  context.beginPath()
  const [x, y] = points[0]

  context.moveTo(x, y)
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i][0], points[i][1])
  }
  if (closed) context.lineTo(x, y)

  if (stroke) context.stroke()
  if (fill) context.fill()
}
