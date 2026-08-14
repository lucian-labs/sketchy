const test = require('node:test')
const assert = require('node:assert')

const { installDom, makeEl, makeContext } = require('./dom-stub')

const { pump, listeners } = installDom()

// the built output is what consumers get, so that is what is tested
const sketchy = require('../lib')
const { lerp, r, n } = require('../lib/maff')
const { drawShape } = require('../lib/helpers/draw')

const stage = (config = {}) =>
  sketchy.createParams({
    element: makeEl('div'),
    dimensions: [100, 100],
    ...config,
  })

test('color.hex', () => {
  assert.equal(sketchy.color.hex(1, 0, 0), '#ff0000')
  assert.equal(sketchy.color.hex(0.02, 0.5, 0.9), '#0580e6')
  assert.equal(sketchy.color.hex(0.5), '#808080')
  assert.equal(sketchy.color.hex(2, -1, 0.5), '#ff0080')
})

test('text.font emits the CSS shorthand in size-family order', () => {
  assert.equal(sketchy.text.font('Arial', 20), '20px Arial')
  assert.equal(sketchy.text.font('Helvetica Neue', 12), '12px "Helvetica Neue"')
  assert.equal(
    sketchy.text.font('Arial, sans-serif', 12),
    '12px Arial, sans-serif',
  )
})

test('lerp treats min as a floor', () => {
  assert.equal(lerp(0, 100, 0, 10), 10)
  assert.equal(lerp(1, 100, 0, 10), 100)
  assert.equal(lerp(0, 100, 20), 20)
  assert.equal(lerp(1, 100, 20), 80)
  assert.equal(lerp(0.5, 100), 50)
})

test('r and n stay inside their range', () => {
  for (let i = 0; i < 100; i++) {
    assert.ok(r(10, 5) >= 5 && r(10, 5) < 15)
    assert.ok(n(1) >= 0 && n(1) < 1)
  }
})

test('drawShape tolerates an empty point list', () => {
  assert.doesNotThrow(() => drawShape(makeContext(makeEl('canvas')), []))
})

test('createParams only adopts its own canvas', () => {
  const foreign = makeEl('canvas')
  const otherRoot = makeEl('div')
  otherRoot.appendChild(foreign)

  const root = makeEl('div')
  const params = sketchy.createParams({ element: root, dimensions: [300, 200] })

  assert.equal(foreign.parent, otherRoot)
  assert.equal(root.children.length, 1)
  assert.notEqual(params.context.canvas, foreign)

  // a second params for the same container reuses the canvas it made
  const again = sketchy.createParams({ element: root, dimensions: [300, 200] })
  assert.equal(again.context.canvas, params.context.canvas)
  assert.equal(root.children.length, 1)
})

test('the canvas is oversampled for devicePixelRatio', () => {
  const params = sketchy.createParams({
    element: makeEl('div'),
    dimensions: [300, 200],
  })
  assert.equal(params.width, 300)
  assert.equal(params.height, 200)
  assert.equal(params.dpr, 2)
  assert.equal(params.context.canvas.width, 600)
  assert.equal(params.context.canvas.style.width, '300px')
})

test('stop() ends the loop', () => {
  const params = stage({ animate: true })
  let frames = 0

  sketchy.loadSketch(
    () => (p) => {
      frames++
      if (frames === 2) p.stop()
    },
    params,
  )
  pump(10)

  assert.equal(frames, 2)
  assert.equal(params.animated, false)
  assert.equal(params.requestId, null)
})

test('timeOffset survives, and dt never goes backwards', () => {
  const params = stage({ animate: true, timeOffset: 5000 })
  const seen = []

  sketchy.loadSketch(() => (p) => seen.push({ t: p.t(), dt: p.dt }), params)
  pump(3)
  params.stop()

  assert.equal(seen[0].t, 5)
  assert.ok(seen.every((f) => f.dt >= 0))
  assert.ok(seen.every((f) => f.t >= 5))
})

test('requestId holds the real animation frame handle', () => {
  const params = stage({ animate: true })
  sketchy.loadSketch(() => () => {}, params)
  assert.equal(typeof params.requestId, 'number')
  params.stop()
})

test('two sketches on two canvases run side by side', () => {
  const a = stage({ animate: true })
  const b = stage({ animate: true })
  let framesA = 0
  let framesB = 0

  sketchy.loadSketch(() => () => framesA++, a)
  sketchy.loadSketch(() => () => framesB++, b)
  pump(3)
  a.stop()
  b.stop()

  assert.ok(framesA > 1)
  assert.ok(framesB > 1)
})

test('loading over a canvas kills the sketch that owned it', () => {
  const params = stage({ animate: true })
  let killed = false
  params.onKill = () => (killed = true)

  let old = 0
  sketchy.loadSketch(() => () => old++, params)
  pump(2)
  const oldAtSwap = old

  let fresh = 0
  sketchy.loadSketch(() => () => fresh++, params)
  pump(3)
  params.stop()

  assert.ok(killed)
  assert.equal(old, oldAtSwap)
  assert.ok(fresh > 1)
})

test('a detached canvas stops its own loop', () => {
  const params = stage({ animate: true })
  let frames = 0

  sketchy.loadSketch(() => () => frames++, params)
  pump(2)
  params.context.canvas.isConnected = false
  const atDetach = frames
  pump(3)

  assert.equal(frames, atDetach)
})

test('loadSketch resets context state left by the previous sketch', () => {
  const params = stage()
  params.context.filter = 'blur(10px)'
  params.context.globalAlpha = 0.2
  params.context.globalCompositeOperation = 'lighter'

  sketchy.loadSketch(() => () => {}, params)

  assert.equal(params.context.filter, 'none')
  assert.equal(params.context.globalAlpha, 1)
  assert.equal(params.context.globalCompositeOperation, 'source-over')
  // the transform is restored before the clear, so it clears the right region
  const reset = params.context.calls.findIndex(([c]) => c === 'setTransform')
  const clear = params.context.calls.findIndex(([c]) => c === 'clearRect')
  assert.ok(reset > -1 && clear > reset)
})

test('createControls returns a working teardown', () => {
  const before = listeners.length
  const [keys, teardown] = sketchy.controls.createControls({ KeyQ: () => {} })

  assert.equal(listeners.length, before + 1)
  listeners[listeners.length - 1][1]({ code: 'KeyE' })
  assert.deepEqual(keys, ['KeyE'])

  teardown()
  assert.equal(listeners.length, before)
})
