/* sketchy demo — https://sketchy.lucianlabs.ca
 *
 * Layout note: sketchy's createCanvas resolves its target with
 * document.querySelector('canvas'), which finds the FIRST canvas in the whole
 * document rather than one inside the container it was handed. This page
 * therefore keeps the sketch stage as its only <canvas> — no wl-scope, no
 * histogram — so the framework binds to the element we intend. It is a real
 * constraint of the published library, recorded in the review.
 */

import { createParams, createSketch, loadSketch, color } from '@dank-inc/sketchy'
import type { Sketch, SketchyParams } from '@dank-inc/sketchy'

declare const waveloop: { ready: (...tags: string[]) => Promise<unknown> }

const app = document.getElementById('app') as HTMLElement

const h = (tag: string, cls?: string, text?: string) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}

const section = (title: string) => {
  const s = document.createElement('wl-section')
  s.setAttribute('title', title)
  app.append(s)
  return s
}

/* ── the sketches ───────────────────────────────────────────────────────── */

/** Every sketch has the same shape: take params once, return the per-frame
 *  function. Anything declared before the return is per-load state. */

const orbits: Sketch = createSketch(({ width, height, TAU, sin, cos, data }) => {
  const arms = 7
  return ({ context, t, circle }) => {
    const time = t(1)
    context.clearRect(0, 0, width, height)
    for (let a = 0; a < arms; a++) {
      const au = a / arms
      const radius = Math.min(width, height) * (0.12 + au * 0.32)
      for (let i = 0; i < 22; i++) {
        const u = i / 22
        const angle = u * TAU + time * (0.2 + au * 0.5) * (a % 2 ? 1 : -1)
        const x = width / 2 + Math.cos(angle) * radius
        const y = height / 2 + Math.sin(angle) * radius * 0.55
        const r = 2 + sin(u + time * 0.3, 3, 6, 6) * (data.size as number)
        circle(x, y, Math.max(0.5, r), {
          fill: color.hsl((au + u * 0.15 + time * 0.02) % 1, 0.55, 0.35 + u * 0.35, 0.85),
        })
      }
    }
    void cos
  }
})

const lattice: Sketch = createSketch(({ width, height, data }) => {
  return ({ context, t, shape }) => {
    const time = t(1)
    context.clearRect(0, 0, width, height)
    const cols = 26
    const rows = 16
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const u = x / (cols - 1)
        const v = y / (rows - 1)
        const wob = Math.sin(u * 8 + time) * Math.cos(v * 6 - time * 0.7)
        const cx = u * width
        const cy = v * height
        const s = (4 + wob * 6) * (data.size as number)
        if (s <= 0.4) continue
        shape(
          [
            [cx - s, cy],
            [cx, cy - s],
            [cx + s, cy],
            [cx, cy + s],
          ],
          { fill: color.hsl((0.45 + wob * 0.12) % 1, 0.6, 0.3 + Math.abs(wob) * 0.4, 0.9) }
        )
      }
    }
  }
})

const ribbons: Sketch = createSketch(({ width, height, data }) => {
  const lines = 40
  return ({ context, t }) => {
    const time = t(1)
    context.clearRect(0, 0, width, height)
    context.lineWidth = 1.4
    for (let i = 0; i < lines; i++) {
      const u = i / (lines - 1)
      context.beginPath()
      for (let x = 0; x <= width; x += 6) {
        const xu = x / width
        const y =
          height / 2 +
          Math.sin(xu * 6 + time * 0.8 + u * 3) * height * 0.16 * (data.size as number) +
          (u - 0.5) * height * 0.7
        x === 0 ? context.moveTo(x, y) : context.lineTo(x, y)
      }
      context.strokeStyle = color.hsl((0.5 + u * 0.18 + time * 0.01) % 1, 0.6, 0.35 + u * 0.3, 0.75)
      context.stroke()
    }
  }
})

const SKETCHES: Record<string, Sketch> = { orbits, lattice, ribbons }

/* ── page ───────────────────────────────────────────────────────────────── */

waveloop.ready().then(boot)

let params: SketchyParams | null = null

function boot() {
  installSection()
  stageSection()
  anatomySection()
  apiSection()
}

function installSection() {
  const s = section('install')
  const install = document.createElement('wl-install')
  install.setAttribute('pkg', '@dank-inc/sketchy')
  const c = document.createElement('wl-code')
  c.textContent = `import { createParams, createSketch, loadSketch } from '@dank-inc/sketchy'

const sketch = createSketch((params) => {
  const arms = 7                    // per-load state, in the closure
  return ({ context, t, circle }) => {
    // per-frame
    circle(x, y, r, { fill: '#fff' })
  }
})

const params = createParams({ element, animate: true, dimensions: [900, 500] })
loadSketch(sketch, params)`
  s.append(install, c)
}

function stageSection() {
  const s = section('stage')
  s.append(
    h(
      'p',
      'wl-muted',
      'Switch sketches to call loadSketch again — it cancels the running frame ' +
        'loop and clears the canvas before the new one starts. The size fader ' +
        'writes into params.data, which the frame function reads live.'
    )
  )

  const hud = document.createElement('wl-hud')
  hud.style.height = '460px'
  const stage = h('div')
  stage.id = 'sketchy-stage'
  stage.style.position = 'absolute'
  stage.style.inset = '0'
  hud.append(stage)
  s.append(hud)

  const controls = h('div', 'wl-grid')
  controls.style.marginTop = '0.75rem'

  const which = document.createElement('wl-segmented')
  which.setAttribute('options', 'orbits,lattice,ribbons')
  which.setAttribute('value', 'orbits')

  const size = document.createElement('wl-fader')
  size.setAttribute('label', 'size')
  size.setAttribute('min', '0')
  size.setAttribute('max', '2')
  size.setAttribute('step', '0.01')
  size.setAttribute('value', '1')

  const running = document.createElement('wl-selector')
  running.setAttribute('label', 'animate')
  running.setAttribute('checked', '')

  controls.append(which, size, running)
  s.append(controls)

  const load = (name: string) => {
    const box = hud.getBoundingClientRect()
    stage.textContent = ''
    params = createParams({
      element: stage,
      animate: (running as HTMLElement & { checked: boolean }).checked,
      dimensions: [Math.round(box.width), Math.round(box.height)],
      data: { size: (size as HTMLElement & { value: number }).value },
    })
    loadSketch(SKETCHES[name], params)
    hud.setAttribute('tl', name.toUpperCase())
    hud.setAttribute('tr', `${Math.round(box.width)}×${Math.round(box.height)}`)
    hud.setAttribute('bl', 'LOADSKETCH')
  }

  which.addEventListener('wl-input', (e) => load((e as CustomEvent<{ value: string }>).detail.value))
  running.addEventListener('wl-input', () => load(which.getAttribute('value') || 'orbits'))
  size.addEventListener('wl-input', (e) => {
    const v = (e as CustomEvent<{ value: number }>).detail.value
    if (params) params.data.size = v
    hud.setAttribute('br', `SIZE ${v.toFixed(2)}`)
  })

  requestAnimationFrame(() => load('orbits'))
}

function anatomySection() {
  const s = section('anatomy of a sketch')
  s.append(
    h(
      'p',
      'wl-muted',
      'The framework hands the frame function a flat params object: the 2D context, ' +
        'draw helpers bound to it, a clock, and the maths from numbaz. There is no ' +
        'class to extend and nothing to subscribe to.'
    )
  )
  const c = document.createElement('wl-code')
  c.textContent = `const ribbons = createSketch(({ width, height, data }) => {
  const lines = 40                      // runs once, on load

  return ({ context, t }) => {          // runs every frame
    const time = t(1)                   // seconds since load, scalable
    context.clearRect(0, 0, width, height)

    for (let i = 0; i < lines; i++) {
      const u = i / (lines - 1)
      // ...
      context.strokeStyle = color.hsl(0.5 + u * 0.18, 0.6, 0.4, 0.75)
      context.stroke()
    }
  }
})`
  s.append(c)
}

function apiSection() {
  const s = section('api')
  const api = document.createElement('wl-api')
  s.append(api)
  ;(api as HTMLElement & { rows: unknown }).rows = [
    { name: 'createParams', kind: 'function', signature: '(config: SketchConfig) => SketchyParams', about: 'Builds the canvas and the params object. Takes element or containerId, dimensions, animate, data.' },
    { name: 'createSketch', kind: 'function', signature: '(sketch: Sketch) => Sketch', about: 'Identity helper that gives the callback its param types.' },
    { name: 'loadSketch', kind: 'function', signature: '(sketch: Sketch, params: SketchyParams) => SketchyParams', about: 'Cancels any running sketch, clears the canvas and starts this one.' },
    { name: 'params.context', kind: 'property', signature: 'CanvasRenderingContext2D', about: 'The raw 2D context — every native call is still available.' },
    { name: 'params.t', kind: 'function', signature: '(scale?, offset?) => number', about: 'Seconds since load, pre-scaled.' },
    { name: 'params.circle', kind: 'function', signature: '(x, y, r, options?) => void', about: 'Arc bound to the context, with fill/stroke options.' },
    { name: 'params.shape', kind: 'function', signature: '(points: [number, number][], options?) => void', about: 'Closed polygon through the points.' },
    { name: 'params.saver', kind: 'function', signature: '(body: () => void) => void', about: 'Runs the body between context.save() and restore().' },
    { name: 'params.createGradient', kind: 'function', signature: '(c1, c2, x1, y1, x2, y2) => CanvasGradient', about: 'Two-stop linear gradient.' },
    { name: 'params.setBlendMode', kind: 'function', signature: '(mode: BlendMode) => void', about: 'Sets globalCompositeOperation from a typed list.' },
    { name: 'color', kind: 'namespace', signature: 'hsl, rgb, hex, createLinearGradient, blendModes', about: 'Colour helpers taking 0..1 components.' },
    { name: 'ctx / controls / filter / text', kind: 'namespace', signature: 'various', about: 'Further helper namespaces re-exported from the entry point.' },
  ]
}
