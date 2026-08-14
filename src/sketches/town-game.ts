import { createSketch } from '../lib'
import { hsl } from '../lib/helpers/color'

export default createSketch(
  ({ context, circle, setFillStyle, setStrokeStyle, shape, sin }) => {
    console.log('starting game')

    const data: State = { venues, venueId: 0, npcs: [{ u: 0, v: 0 }] }
    const genU = () => (Math.random() - 0.5) * 2
    setInterval(() => {
      for (let npc of data.npcs) {
        npc.u = genU()
        npc.v = genU()
      }
    }, 1500)

    setInterval(() => {
      const venue = data.venues[data.venueId]
      if (venue.points.length > 20) {
        venue.points.shift()
      }
      venue.points.push([genU(), genU()])
    }, 40)

    const n = (u: number, x: number) => (u * x) / 2 + x / 2

    return ({ width, height, t }) => {
      // set up normals
      const venue = data.venues[data.venueId]
      const cx = (u: number) => n(u, width)
      const cy = (v: number) => n(v, height)
      context.clearRect(0, 0, width, height)

      // check state
      // draw world map

      // draw player
      // draw npcs
      setFillStyle('#fff')
      for (let npc of data.npcs) {
        // const x = cx(npc.u) // * width) / 2 + width / 2
        // const y = cy(npc.v) // * height) / 2 + height / 2
        // circle(x, y, 10)
        // context.fill()
      }
      context.lineCap = 'butt'
      context.lineJoin = 'bevel'

      setStrokeStyle(hsl(t(0.2), 0.5, 0.5))
      context.lineWidth = (sin(t(0.01)) + 2) * 5
      shape(venue.points.map(([u, v]) => [cx(u), cy(v)]))
      context.stroke()

      // handle controls
    }
  },
)

type Venue = {
  id: number
  name: string
  points: [number, number][]
}

type NPC = {
  u: number
  v: number
}

const venues: Venue[] = [
  {
    id: 0,
    name: 'town square',
    points: [
      [0, 0],
      // [-0.8, 0.8],
      // [0.8, 0.8],
      // [0.8, -0.8],
      // [-0.8, -0.8],
    ],
  },
]

type State = {
  venues: Venue[]
  venueId: number
  npcs: NPC[]
}
