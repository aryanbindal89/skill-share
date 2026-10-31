import { useEffect, useRef } from 'react'

type Point = { x: number; y: number; vx: number; vy: number }
type RGB = [number, number, number]

function readColor(value: string, fallback: RGB): RGB {
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  if (!match) return fallback
  const hex = match[1].length === 3 ? [...match[1]].map((part) => part + part).join('') : match[1]
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

function rgba([red, green, blue]: RGB, alpha: number) {
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export default function AmbientWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    let width = 0
    let height = 0
    let scale = 1
    let points: Point[] = []
    let frame = 0
    let previousFrame = 0
    let pointerX = -1000
    let pointerY = -1000
    let webColor: RGB = [156, 183, 167]
    let accentColor: RGB = [223, 121, 100]

    const updateColors = () => {
      const styles = getComputedStyle(root)
      webColor = readColor(styles.getPropertyValue('--sage'), [156, 183, 167])
      accentColor = readColor(styles.getPropertyValue('--accent'), [223, 121, 100])
    }

    const draw = (time = 0) => {
      frame = 0
      if (document.hidden) return
      if (!reducedMotion.matches && time - previousFrame < 32) {
        frame = requestAnimationFrame(draw)
        return
      }
      const step = previousFrame ? Math.min(2, (time - previousFrame) / 16.67) : 1
      previousFrame = time
      context.clearRect(0, 0, width, height)

      if (!reducedMotion.matches) {
        for (const point of points) {
          point.x += point.vx * step
          point.y += point.vy * step
          if (point.x < -8 || point.x > width + 8) point.vx *= -1
          if (point.y < -8 || point.y > height + 8) point.vy *= -1
          point.x = Math.max(-8, Math.min(width + 8, point.x))
          point.y = Math.max(-8, Math.min(height + 8, point.y))
        }
      }

      const maxLinkDistance = Math.min(178, Math.max(132, width * 0.13))
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index]
        for (let next = index + 1; next < points.length; next += 1) {
          const other = points[next]
          const dx = point.x - other.x
          const dy = point.y - other.y
          const distance = Math.hypot(dx, dy)
          if (distance >= maxLinkDistance) continue
          context.beginPath()
          context.moveTo(point.x, point.y)
          context.lineTo(other.x, other.y)
          context.strokeStyle = rgba(webColor, (1 - distance / maxLinkDistance) * 0.24)
          context.lineWidth = 0.8
          context.stroke()

          if (!reducedMotion.matches && (index + next) % 3 === 0) {
            const phaseOffset = ((index * 37 + next * 19) % 101) / 101
            const phase = (time * 0.00042 + phaseOffset) % 1
            context.beginPath()
            context.arc(point.x + dx * phase, point.y + dy * phase, 1.35, 0, Math.PI * 2)
            context.fillStyle = rgba(accentColor, 0.72)
            context.fill()
          }
        }
      }

      if (!reducedMotion.matches && pointerX >= 0 && pointerY >= 0) {
        const nearest = points
          .map((point) => ({ point, distance: Math.hypot(point.x - pointerX, point.y - pointerY) }))
          .filter(({ distance }) => distance < 205)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 8)
        for (const { point, distance } of nearest) {
          context.beginPath()
          context.moveTo(pointerX, pointerY)
          context.lineTo(point.x, point.y)
          context.strokeStyle = rgba(accentColor, (1 - distance / 205) * 0.36)
          context.lineWidth = 1
          context.stroke()

          const pointPhase = (time * 0.00058 + point.x * 0.0013 + point.y * 0.0007) % 1
          context.beginPath()
          context.arc(pointerX + (point.x - pointerX) * pointPhase, pointerY + (point.y - pointerY) * pointPhase, 1.6, 0, Math.PI * 2)
          context.fillStyle = rgba(accentColor, 0.8)
          context.fill()
        }
      }

      for (const point of points) {
        const nearPointer = Math.hypot(point.x - pointerX, point.y - pointerY) < 205
        context.beginPath()
        context.arc(point.x, point.y, nearPointer && !reducedMotion.matches ? 1.8 : 1.15, 0, Math.PI * 2)
        context.fillStyle = rgba(nearPointer && !reducedMotion.matches ? accentColor : webColor, nearPointer ? 0.72 : 0.46)
        context.fill()
      }

      if (!reducedMotion.matches) frame = requestAnimationFrame(draw)
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      scale = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.setTransform(scale, 0, 0, scale, 0, 0)
      const count = Math.max(28, Math.min(100, Math.round(width * height / 15000)))
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
      }))
      if (!frame) frame = requestAnimationFrame(draw)
    }

    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || reducedMotion.matches) return
      pointerX = event.clientX
      pointerY = event.clientY
    }
    const clearPointer = () => { pointerX = -1000; pointerY = -1000 }
    const syncMotion = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      if (reducedMotion.matches) clearPointer()
      frame = requestAnimationFrame(draw)
    }
    const handleVisibility = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      } else if (!document.hidden && !frame) frame = requestAnimationFrame(draw)
    }
    const themeObserver = new MutationObserver(() => {
      updateColors()
      if (!frame) frame = requestAnimationFrame(draw)
    })

    updateColors()
    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', trackPointer, { passive: true })
    window.addEventListener('pointerleave', clearPointer)
    document.addEventListener('visibilitychange', handleVisibility)
    reducedMotion.addEventListener('change', syncMotion)
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', trackPointer)
      window.removeEventListener('pointerleave', clearPointer)
      document.removeEventListener('visibilitychange', handleVisibility)
      reducedMotion.removeEventListener('change', syncMotion)
      themeObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="ambient-web" aria-hidden="true" />
}
