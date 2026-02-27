import { useEffect, useRef, useCallback } from 'react'

// Edge padding
const EDGE_PAD = 28
const MIN_DIST = 100

// Color palette — weighted toward blue
const BASE_COLORS = [
  { h: 212, s: 48, l: 82, weight: 3 }, // Soft blue
  { h: 140, s: 25, l: 76, weight: 1 }, // Sage green
  { h: 42, s: 55, l: 75, weight: 1 },  // Warm yellow
  { h: 0, s: 6, l: 90, weight: 1 },    // White-grey
  { h: 340, s: 35, l: 85, weight: 1 }, // Light pink
]

function pickWeightedColor() {
  const total = BASE_COLORS.reduce((s, c) => s + c.weight, 0)
  let r = Math.random() * total
  for (const c of BASE_COLORS) {
    r -= c.weight
    if (r <= 0) return c
  }
  return BASE_COLORS[0]
}

function jitterColor(base) {
  return {
    h: base.h + (Math.random() - 0.5) * 10,
    s: Math.min(100, Math.max(0, base.s + (Math.random() - 0.5) * 8)),
    l: Math.min(100, Math.max(0, base.l + (Math.random() - 0.5) * 6)),
  }
}

function hsla(c, a) {
  return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})`
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t) {
  return t * t
}

// Draw an organic petal shape using bezier curves instead of a perfect ellipse.
// Narrow at the base, wider toward the tip, with slight asymmetry.
function drawPetalPath(ctx, rr, rl, tipWidth) {
  // rr = length along petal direction (x-axis)
  // rl = half-width at widest point
  // tipWidth = 0.3–0.7, how rounded vs pointed the tip is
  const tw = rl * tipWidth

  ctx.beginPath()
  // Start at base (slightly pinched)
  ctx.moveTo(-rr * 0.15, 0)
  // Left side — curves outward to widest point around 55% up, then narrows to tip
  ctx.bezierCurveTo(
    -rr * 0.05, -rl * 0.6,   // control 1: pulls base inward
    rr * 0.35, -rl * 1.05,    // control 2: widest bulge
    rr * 0.75, -tw             // end: approaching tip
  )
  // Tip — smooth rounded cap
  ctx.bezierCurveTo(
    rr * 0.95, -tw * 0.4,
    rr * 0.95, tw * 0.4,
    rr * 0.75, tw
  )
  // Right side — mirror back to base
  ctx.bezierCurveTo(
    rr * 0.35, rl * 1.05,
    -rr * 0.05, rl * 0.6,
    -rr * 0.15, 0
  )
  ctx.closePath()
}

function generateFlower(canvasW, canvasH, activeFlowers) {
  const baseColor = pickWeightedColor()
  const petalCount = Math.random() < 0.6 ? 5 : 6
  const sizeScale = 0.85 + Math.random() * 0.3
  const flowerRotation = Math.random() * Math.PI * 2
  const petals = []

  const petalRadiusR = (12 + Math.random() * 3) * sizeScale
  const petalRadiusL = (6 + Math.random() * 2.5) * sizeScale

  // Two offset distances: rest (cozy) and hover (opened)
  const restOffset = (5 + Math.random() * 2) * sizeScale
  const hoverOffset = (12 + Math.random() * 3) * sizeScale

  // Shared tip style per flower (so petals look like they belong together)
  const baseTipWidth = 0.35 + Math.random() * 0.35 // 0.35–0.7 (pointed to rounded)

  // Per-petal bloom delay
  const petalDelays = []
  for (let p = 0; p < petalCount; p++) {
    petalDelays.push(Math.random() * 600)
  }

  for (let p = 0; p < petalCount; p++) {
    const angle = (Math.PI * 2 * p) / petalCount + (Math.random() - 0.5) * 0.2
    const color = jitterColor(baseColor)
    const edgeColor = {
      h: color.h,
      s: Math.min(100, color.s + 20),
      l: Math.max(0, color.l - 16),
    }

    const layerCount = 10 + Math.floor(Math.random() * 4)
    const layers = []
    for (let l = 0; l < layerCount; l++) {
      layers.push({
        dx: (Math.random() - 0.5) * 3,
        dy: (Math.random() - 0.5) * 3,
        scaleX: 0.92 + Math.random() * 0.16,
        scaleY: 0.92 + Math.random() * 0.16,
        tilt: (Math.random() - 0.5) * 0.12,
        alpha: 0.035 + Math.random() * 0.035,
        color: jitterColor(color),
      })
    }

    const rMult = 0.88 + Math.random() * 0.24
    const lMult = 0.88 + Math.random() * 0.24
    const offsetMult = 0.92 + Math.random() * 0.16

    // Per-petal tip variation (slight differences within the flower)
    const tipWidth = baseTipWidth + (Math.random() - 0.5) * 0.15

    petals.push({
      angle,
      restOffset: restOffset * offsetMult,
      hoverOffset: hoverOffset * offsetMult,
      rr: petalRadiusR * rMult,
      rl: petalRadiusL * lMult,
      tipWidth: Math.max(0.25, Math.min(0.75, tipWidth)),
      color,
      edgeColor,
      layers,
      tilt: (Math.random() - 0.5) * 0.25,
      bloomDelay: petalDelays[p],
    })
  }

  // Center stamens
  const centerDots = []
  const dotCount = 5 + Math.floor(Math.random() * 4)
  for (let d = 0; d < dotCount; d++) {
    const a = Math.random() * Math.PI * 2
    const dist = Math.random() * 3 * sizeScale
    centerDots.push({
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist,
      r: (0.5 + Math.random() * 0.8) * sizeScale,
      alpha: 0.25 + Math.random() * 0.15,
    })
  }

  // Position
  const usableW = canvasW - EDGE_PAD * 2
  const usableH = canvasH - EDGE_PAD * 2
  let x = EDGE_PAD + Math.random() * usableW
  let y = EDGE_PAD + Math.random() * usableH

  for (let attempt = 0; attempt < 15; attempt++) {
    const tooClose = activeFlowers.some(f => Math.hypot(x - f.x, y - f.y) < MIN_DIST)
    if (!tooClose) break
    x = EDGE_PAD + Math.random() * usableW
    y = EDGE_PAD + Math.random() * usableH
  }

  // Per-flower timing — wide variance so flowers desync naturally
  const bloomIn = 1600 + Math.random() * 800
  const hold = 2500 + Math.random() * 3500
  const fadeOut = 1800 + Math.random() * 1500
  const bloomDrift = 4 + Math.random() * 4
  const fadeDrift = 2 + Math.random() * 3

  return {
    x, y, petals, centerDots, baseColor, flowerRotation, sizeScale,
    bloomIn, hold, fadeOut, bloomDrift, fadeDrift,
    cycleTotal: bloomIn + hold + fadeOut,
  }
}

function drawFlower(ctx, flower, opacity, dy, bloomProgress, hoverProgress) {
  if (opacity <= 0.01) return

  const { x, y, petals, centerDots, baseColor, flowerRotation, bloomIn } = flower

  ctx.save()
  ctx.translate(x, y + dy)
  ctx.rotate(flowerRotation)

  for (const petal of petals) {
    const petalBloomStart = petal.bloomDelay / (bloomIn * 0.7)
    const petalT = Math.max(0, Math.min(1, (bloomProgress - petalBloomStart) / (1 - petalBloomStart)))
    const petalScale = easeOutCubic(petalT)

    if (petalScale <= 0.01) continue

    // Staggered petal opening — outer petals (higher bloomDelay) open slightly later
    const petalHover = Math.max(0, Math.min(1, hoverProgress * 1.4 - petal.bloomDelay / 2000))

    // Interpolate offset between rest and hover
    const restOff = petal.restOffset * petalScale
    const hoverOff = petal.hoverOffset * petalScale
    const offset = restOff + (hoverOff - restOff) * petalHover

    const rr = petal.rr * petalScale
    const rl = petal.rl * petalScale

    const cx = Math.cos(petal.angle) * offset
    const cy = Math.sin(petal.angle) * offset

    // Draw watercolor wash layers using organic petal shape
    for (const layer of petal.layers) {
      ctx.save()
      ctx.translate(cx + layer.dx * petalScale, cy + layer.dy * petalScale)
      ctx.rotate(petal.angle + petal.tilt + layer.tilt)
      ctx.scale(layer.scaleX, layer.scaleY)

      drawPetalPath(ctx, rr, rl, petal.tipWidth)
      ctx.fillStyle = hsla(layer.color, layer.alpha * opacity)
      ctx.fill()

      ctx.restore()
    }

    // Edge stroke — pigment pooling
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(petal.angle + petal.tilt)
    ctx.scale(0.98, 0.98)

    drawPetalPath(ctx, rr, rl, petal.tipWidth)
    ctx.strokeStyle = hsla(petal.edgeColor, 0.03 * opacity)
    ctx.lineWidth = 1.2
    ctx.stroke()

    ctx.restore()
  }

  // Center stamens
  const centerOpacity = Math.max(0, (bloomProgress - 0.5) * 2)
  if (centerOpacity > 0.01) {
    const centerColor = {
      h: baseColor.h + 5,
      s: Math.min(100, baseColor.s + 30),
      l: Math.max(0, baseColor.l - 50),
    }
    for (const dot of centerDots) {
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
      ctx.fillStyle = hsla(centerColor, dot.alpha * opacity * centerOpacity)
      ctx.fill()
    }
  }

  ctx.restore()
}

const WatercolorFlowers = ({ isVisible = false, hasBeenSeen = false }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animFrameRef = useRef(null)
  const slotsRef = useRef([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const hasBeenSeenRef = useRef(hasBeenSeen)
  hasBeenSeenRef.current = hasBeenSeen

  const getSize = useCallback(() => {
    const el = containerRef.current
    if (!el) return { w: 300, h: 130 }
    return { w: el.clientWidth, h: el.clientHeight }
  }, [])

  const redraw = useCallback((ctx, w, h, dpr) => {
    ctx.clearRect(0, 0, w * dpr, h * dpr)
    ctx.save()
    ctx.scale(dpr, dpr)

    for (const slot of slotsRef.current) {
      if (!slot || !slot.flower) continue
      drawFlower(ctx, slot.flower, slot.opacity, slot.dy, slot.bloomProgress, slot.hoverProgress || 0)
    }

    ctx.restore()
  }, [])

  // Convert client coords to canvas coords
  const clientToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: -1000, y: -1000 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / (window.devicePixelRatio || 1) / rect.width
    const scaleY = canvas.height / (window.devicePixelRatio || 1) / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  // Mouse tracking + click
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e) => {
      mouseRef.current = clientToCanvas(e.clientX, e.clientY)
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    const handleClick = (e) => {
      const { x, y } = clientToCanvas(e.clientX, e.clientY)
      for (const slot of slotsRef.current) {
        if (!slot || !slot.flower || slot.clickedAt) continue
        const dist = Math.hypot(x - slot.flower.x, y - (slot.flower.y + (slot.dy || 0)))
        if (dist < 30 && slot.opacity > 0.1) {
          slot.clickedAt = performance.now()
          slot.clickOpacity = slot.opacity
          break
        }
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('click', handleClick)
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('click', handleClick)
    }
  }, [clientToCanvas])

  // Initialize + resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const syncSize = () => {
      const dpr = window.devicePixelRatio || 1
      const { w, h } = getSize()
      canvas.width = w * dpr
      canvas.height = h * dpr
    }

    syncSize()

    const ro = new ResizeObserver(syncSize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [getSize])

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!isVisible) {
      // Clear canvas and reset slots so no remnants show on re-open
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      slotsRef.current = []
      return
    }

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const { w, h } = getSize()

    canvas.width = w * dpr
    canvas.height = h * dpr

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      const f0 = generateFlower(w, h, [])
      const f1 = generateFlower(w, h, [f0])
      slotsRef.current = [
        { flower: f0, opacity: 0.9, dy: 0, bloomProgress: 1, hoverProgress: 0, hoverTarget: 0 },
        { flower: f1, opacity: 0.9, dy: 0, bloomProgress: 1, hoverProgress: 0, hoverTarget: 0 },
      ]
      redraw(ctx, w, h, dpr)
      return
    }

    const now = performance.now()
    const initialDelay = hasBeenSeenRef.current ? 100 : 400

    // Return ALL flowers from non-null slots (fading ones still occupy space)
    const getActiveFlowers = () => {
      return slotsRef.current
        .filter(s => s && s.flower)
        .map(s => s.flower)
    }

    const makeSlot = (spawnTime) => {
      const activeFlowers = getActiveFlowers()
      return {
        flower: generateFlower(w, h, activeFlowers),
        spawnTime,
        opacity: 0,
        dy: 0,
        bloomProgress: 0,
        hoverProgress: 0,
        hoverTarget: 0,
      }
    }

    // Start with just 2 flowers, well staggered
    slotsRef.current = [makeSlot(now + initialDelay)]
    slotsRef.current.push(makeSlot(now + initialDelay + 3000 + Math.random() * 3000))

    const animate = (timestamp) => {

      const mouseX = mouseRef.current.x
      const mouseY = mouseRef.current.y

      for (let i = slotsRef.current.length - 1; i >= 0; i--) {
        const slot = slotsRef.current[i]
        if (!slot) continue

        const elapsed = timestamp - slot.spawnTime
        const flower = slot.flower

        // Click dissolve override — faster fade (~1200ms)
        if (slot.clickedAt) {
          const clickElapsed = timestamp - slot.clickedAt
          const dissolveDuration = 1200
          if (clickElapsed >= dissolveDuration) {
            slotsRef.current.splice(i, 1)
            // Respawn after a pause (always at least one replacement for clicked flowers)
            const pause = 1000 + Math.random() * 2500
            slotsRef.current.push(makeSlot(timestamp + pause))
            continue
          }
          const t = clickElapsed / dissolveDuration
          const eased = easeInQuad(t)
          slot.opacity = slot.clickOpacity * (1 - eased)
          slot.dy = (slot.dy || 0) - flower.fadeDrift * eased * 0.6
          // Keep bloomProgress at current value (don't regress)
        } else if (elapsed < 0) {
          slot.opacity = 0
          slot.dy = flower.bloomDrift
          slot.bloomProgress = 0
        } else if (elapsed < flower.bloomIn) {
          const t = elapsed / flower.bloomIn
          const eased = easeOutCubic(t)
          slot.opacity = eased * 0.9
          slot.dy = flower.bloomDrift * (1 - eased)
          slot.bloomProgress = t
        } else if (elapsed < flower.bloomIn + flower.hold) {
          slot.opacity = 0.9
          slot.dy = 0
          slot.bloomProgress = 1
        } else if (elapsed < flower.cycleTotal) {
          const t = (elapsed - flower.bloomIn - flower.hold) / flower.fadeOut
          const eased = easeInQuad(t)
          slot.opacity = 0.9 * (1 - eased)
          slot.dy = -flower.fadeDrift * eased
          slot.bloomProgress = 1
        } else {
          slotsRef.current.splice(i, 1)

          // Spawn one replacement, but only keep max 2 active — longer pause feels calmer
          const totalCount = slotsRef.current.filter(s => s).length
          if (totalCount < 2) {
            const pause = 2500 + Math.random() * 3500
            slotsRef.current.push(makeSlot(timestamp + pause))
          }
          continue
        }

        // Hover hit detection
        const dist = Math.hypot(mouseX - flower.x, mouseY - (flower.y + slot.dy))
        slot.hoverTarget = (dist < 30 && !slot.clickedAt) ? 1 : 0
        slot.hoverProgress += (slot.hoverTarget - slot.hoverProgress) * 0.07
      }

      // Update cursor based on whether any flower is hovered
      const anyHovered = slotsRef.current.some(s => s && s.hoverTarget === 1)
      canvas.style.cursor = anyHovered ? 'pointer' : 'default'

      redraw(ctx, w, h, dpr)
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, getSize, redraw])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, pointerEvents: 'auto', cursor: 'default' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default WatercolorFlowers
