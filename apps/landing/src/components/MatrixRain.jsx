import { useEffect, useRef } from 'react'

const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz<>/{}[]|&^%$#@!'

export default function MatrixRain({ theme = 'dark' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    let columns = []
    let drops = []
    let frameCount = 0

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const colCount = Math.floor(canvas.width / 14)
      columns = Array.from({ length: colCount }, (_, i) => i)
      drops = columns.map(() => Math.random() * -100)
    }

    resize()
    window.addEventListener('resize', resize)

    const fontSize = 14
    const frameSkip = 3 // updates every 3 frames to slow it down

    function draw() {
      // Semi-transparent overlay for fade trail effect
      ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px monospace`

      frameCount++

      for (let i = 0; i < columns.length; i++) {
        const x = i * fontSize
        const y = drops[i] * fontSize
        const char = chars[Math.floor(Math.random() * chars.length)]

        // Lead character (brightest)
        ctx.fillStyle = theme === 'dark' ? '#FFFFFF' : '#000000'
        ctx.globalAlpha = 0.9
        ctx.fillText(char, x, y)

        // Only draw trail on update frames
        if (frameCount % frameSkip === 0) {
          // Trail characters (dimmer)
          for (let t = 1; t < 6; t++) {
            const trailChar = chars[Math.floor(Math.random() * chars.length)]
            const alpha = Math.max(0, 0.5 - t * 0.08)
            ctx.fillStyle = '#808080'
            ctx.globalAlpha = alpha * 0.4
            ctx.fillText(trailChar, x, y - t * fontSize)
          }
        }

        ctx.globalAlpha = 1

        // Move drops only on update frames
        if (frameCount % frameSkip === 0) {
          if (y > canvas.height / fontSize && Math.random() > 0.975) {
            drops[i] = 0
          }
          drops[i]++
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block z-0 opacity-50"
    />
  )
}
