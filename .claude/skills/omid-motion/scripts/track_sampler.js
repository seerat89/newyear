// Records how elements move over time, one sample per animation frame.
//
// Paste/evaluate this file's contents in the page (for example with
// `playwright-cli eval "$(cat track_sampler.js)"`), then:
//
//   window.__track.start({ body: '.omid-root', crest: '.omid-crest-pose' })
//   ... let the move play (or trigger it) ...
//   window.__track.stop()          // returns nothing
//   JSON.stringify(window.__track.data)   // read the samples back
//
// Each sample is { t, x, y, a, sx, sy, o }:
//   t  ms since start (performance.now based, so frame gaps are real)
//   x, y  centre of the element's bounding box in viewport pixels
//   a  rotation in degrees of the element's own transform matrix, plus any
//      individual `rotate` property (CSS rotate)
//   sx, sy  scale factors from the matrix (plus individual `scale` property)
//   o  opacity of the element
// Feed the JSON to analyze_track.py.
(() => {
  const parseDeg = (v) => {
    if (!v || v === 'none') return 0
    const m = /(-?[\d.]+)(deg|rad|turn)?/.exec(v)
    if (!m) return 0
    const n = parseFloat(m[1])
    return m[2] === 'rad' ? (n * 180) / Math.PI : m[2] === 'turn' ? n * 360 : n
  }
  const parseScale = (v) => {
    if (!v || v === 'none') return [1, 1]
    const parts = v.split(/\s+/).map(parseFloat)
    return [parts[0], parts.length > 1 ? parts[1] : parts[0]]
  }
  const sample = (el, t0) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform)
    const [isx, isy] = parseScale(cs.scale)
    return {
      t: performance.now() - t0,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      a: (Math.atan2(m.b, m.a) * 180) / Math.PI + parseDeg(cs.rotate),
      sx: Math.hypot(m.a, m.b) * isx,
      sy: Math.hypot(m.c, m.d) * isy,
      o: parseFloat(cs.opacity),
    }
  }
  const track = {
    data: {},
    running: false,
    start(spec) {
      track.data = {}
      track.running = true
      const els = Object.fromEntries(
        Object.entries(spec).map(([name, sel]) => [name, document.querySelector(sel)]),
      )
      for (const [name, el] of Object.entries(els)) {
        if (!el) throw new Error('no element for ' + name)
        track.data[name] = []
      }
      const t0 = performance.now()
      const loop = () => {
        if (!track.running) return
        for (const [name, el] of Object.entries(els)) track.data[name].push(sample(el, t0))
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
      return Object.keys(els)
    },
    stop() {
      track.running = false
      return Object.fromEntries(Object.entries(track.data).map(([k, v]) => [k, v.length]))
    },
  }
  window.__track = track
  return 'track ready'
})()
