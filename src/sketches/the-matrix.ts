import { mapXY } from '@dank-inc/lewps'
import { createSketch, Vec2 } from '../lib'
import { hsl, hex } from '../lib/helpers/color'
import { createControls } from '../lib/helpers/controls'

export default createSketch((params) => {
  const { context, setFillStyle, setFilter, sin, cos, lerp } = params

  const points = mapXY<Vec2>(50, 50, (u, v) => [u - 0.5, v - 0.5])

  const state = {
    x: 0,
    y: 0,
    lastKey: '',
    blur: false,
  }

  const [controls] = createControls({
    KeyQ: () => state.x--,
    KeyE: () => state.x++,
    Space: () => (state.blur = !state.blur),
  })

  return ({ width, height, t }) => {
    // draw loop function
    const lastKey = controls.shift()
    if (lastKey) state.lastKey = lastKey

    setFillStyle('#111')
    context.fillRect(0, 0, width, height)

    setFillStyle(hex(0.5, 0.5, 0.5))
    context.fillText(state.lastKey, 10, height - 100)

    context.save()
    context.translate(width / 2, height / 2)
    for (let [u, v] of points) {
      const x = lerp(u, width * 0.7)
      const y = lerp(v, height * 0.7)

      setFillStyle(hsl(u, 0.5, 0.5))

      const { x1, y1, x2, y2 } = params.data
      const x3 = x1 * x + y1 * y
      const y3 = x2 * x + y2 * y

      context.fillRect(x3 - 2.5, y3 - 2.5, 5, 5)
    }
    context.restore()
  }
})
