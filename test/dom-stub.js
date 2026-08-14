/* Enough of a DOM to run the library headless: node:test, no browser, no deps. */

const makeContext = (canvas) => ({
  canvas,
  filter: '',
  globalCompositeOperation: '',
  globalAlpha: 1,
  lineWidth: 1,
  fillStyle: '',
  strokeStyle: '',
  calls: [],
  setTransform(...a) {
    this.calls.push(['setTransform', ...a])
  },
  clearRect(...a) {
    this.calls.push(['clearRect', ...a])
  },
  beginPath() {},
  closePath() {},
  moveTo() {},
  lineTo() {},
  arc() {},
  fill() {},
  stroke() {},
  save() {},
  restore() {},
  createLinearGradient: () => ({ addColorStop() {} }),
})

const makeEl = (tag) => {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    dataset: {},
    style: {},
    isConnected: true,
    clientWidth: 300,
    clientHeight: 200,
    appendChild(child) {
      if (!el.children.includes(child)) el.children.push(child)
      child.parent = el
      return child
    },
    querySelector(selector) {
      if (!/canvas/.test(selector)) return null
      return (
        el.children.find(
          (c) => c.tagName === 'CANVAS' && 'sketchy' in c.dataset,
        ) || null
      )
    },
  }

  if (tag === 'canvas') {
    el.width = 0
    el.height = 0
    el.getContext = () => (el.ctx = el.ctx || makeContext(el))
  }

  return el
}

/** Installs the globals the library reaches for, and returns a manual clock. */
const installDom = ({ dpr = 2 } = {}) => {
  const listeners = []
  let queue = []

  global.window = {
    devicePixelRatio: dpr,
    addEventListener: (type, fn) => listeners.push([type, fn]),
    removeEventListener: (type, fn) => {
      const i = listeners.findIndex(([t, f]) => t === type && f === fn)
      if (i > -1) listeners.splice(i, 1)
    },
  }
  global.document = { createElement: makeEl, getElementById: () => null }
  global.requestAnimationFrame = (fn) => queue.push(fn)
  global.cancelAnimationFrame = (id) => (queue[id - 1] = null)

  // drains whatever is queued, n times — one pass is one animation frame
  const pump = (n = 1) => {
    for (let i = 0; i < n; i++) {
      const due = queue
      queue = []
      due.forEach((fn) => fn && fn())
    }
  }

  return { pump, listeners }
}

module.exports = { installDom, makeEl, makeContext }
