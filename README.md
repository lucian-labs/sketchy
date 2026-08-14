# Sketchy!

**[Live demo →](https://sketchy.lucianlabs.ca)** · [npm](https://www.npmjs.com/package/@dank-inc/sketchy) · [all packages](https://lucianlabs.ca/packages/)

A super-dank sketching library built with ♥ and typescript. Inspired heavily by [Canvas Sketch by @mattdesl](https://github.com/mattdesl/canvas-sketch) - the difference is that this is meant to just drop into a webpage. [Here is a live example](https://elijahlucian.ca/artpi) - under construction...

[![npm version](https://badge.fury.io/js/@dank-inc%2Fsketchy.svg)](https://badge.fury.io/js/@dank-inc%2Fsketchy)

```
npm install @dank-inc/sketchy
```

# 1.0

- moved 3d to a separate package

# Getting Started

This library is a nice lightweight typescript wrapper for the 2d Web canvas. It's purpose is to give you a simple interface to the canvas, with minimal overhead.

The goal of this project is to give a creative coder an entrypoint between raw javascript and p5.js

start by creating a config object:

```ts
const params = createParams({
  containerId: 'root', // id of the container where you want a canvas
  animate: true, // animated?
  // dimensions: [1200, 1200], // size of canvas
})
```

then pass your sketch & config object into the sketch loader function:

```ts
import sketch from './sketches/sketch'

loadSketch(sketch, params)
```

# Implementation Examples

React Wrapper Example [here](https://github.com/dank-inc/react-sketchy/blob/main/src/lib/ReactSketchy.tsx)

Example running inside a react page [here](https://www.elijahlucian.ca/dank-vision?dank-vision-index=0)

## Example Sketch

note: This library and it's helper functions all assume you are workng with normalized values :)

```ts
import { mapXY } from '@dank-inc/lewps'
import { createSketch, color, controls, Vec2 } from '@dank-inc/sketchy'

// type the function, and all params are implicitly typed
export default createSketch((params) => {
  // destructure helper functions and convenience variables
  const { context, setFillStyle, setFilter, sin, cos, lerp } = params

  // initialize your sketch and objects
  const points = mapXY<Vec2>(15, 15, (u, v) => [u, v])

  const state = {
    x: 0,
    y: 0,
    lastKey: '',
    blur: false,
  }

  const [keys] = controls.createControls({
    KeyQ: () => state.x--,
    KeyE: () => state.x++,
    Space: () => (state.blur = !state.blur),
  })

  return ({ width, height, t }) => {
    // draw loop function
    const lastKey = keys.shift()
    if (lastKey) state.lastKey = lastKey

    setFillStyle('#111')
    context.fillRect(0, 0, width, height)

    setFillStyle(color.hex(0.5, 0.5, 0.5))
    context.fillText(state.lastKey, 10, height - 100)

    for (let [u, v] of points) {
      const x = lerp(u, width, width / 3)
      const y = lerp(v, height, 200)

      setFillStyle(color.hsl(u, 0.5, 0.5))

      context.fillRect(
        x + state.x * 10,
        y + state.y * 10,
        cos(v, 1, 20),
        sin(t(0.3) + u, 1, 50),
      )
    }
  }
})
```

This will give you something that looks like this:

![](https://thumbs.gfycat.com/BasicWelltodoGavial-mobile.mp4)
