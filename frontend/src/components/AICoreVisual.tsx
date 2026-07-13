import { useEffect, useRef } from 'react'

export default function AICoreVisual({ size = 150 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    canvas.width = size
    canvas.height = size

    const particleCount = 40
    const particles: { x: number; y: number; z: number; speed: number; angle: number }[] = []
    for (let i = 0; i < particleCount; i++) {
      const radius = (size / 2) * (0.5 + Math.random() * 0.4)
      const angle = Math.random() * Math.PI * 2
      particles.push({
        x: radius * Math.cos(angle),
        y: (Math.random() - 0.5) * (size * 0.3),
        z: radius * Math.sin(angle),
        speed: 0.02 + Math.random() * 0.03,
        angle,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.translate(size / 2, size / 2)

      // Rotate particles in 3D Y-axis
      particles.forEach((p) => {
        p.angle += p.speed
        const radius = Math.sqrt(p.x * p.x + p.z * p.z)
        p.x = radius * Math.cos(p.angle)
        p.z = radius * Math.sin(p.angle)

        // Project
        const scale = 120 / (120 + p.z)
        const sx = p.x * scale
        const sy = p.y * scale

        // Draw particle
        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(1, 3 * scale), 0, 2 * Math.PI)
        ctx.fillStyle = `rgba(124, 58, 237, ${Math.max(0.2, scale * 0.7)})`
        ctx.fill()
      })

      // Draw glass sphere surface
      const gradient = ctx.createRadialGradient(-size * 0.1, -size * 0.1, 5, 0, 0, size * 0.35)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      gradient.addColorStop(0.3, 'rgba(219, 234, 254, 0.4)')
      gradient.addColorStop(0.8, 'rgba(124, 58, 237, 0.15)')
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.3)')

      ctx.beginPath()
      ctx.arc(0, 0, size * 0.35, 0, 2 * Math.PI)
      ctx.fillStyle = gradient
      ctx.shadowColor = 'rgba(124, 58, 237, 0.35)'
      ctx.shadowBlur = 24
      ctx.fill()

      // Rotating energy ring overlay
      ctx.rotate(Date.now() * 0.001)
      ctx.beginPath()
      ctx.ellipse(0, 0, size * 0.42, size * 0.12, Math.PI / 6, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Scan Pulse wave
      const pulseRadius = (size * 0.35) * (1 + 0.25 * Math.sin(Date.now() * 0.004))
      ctx.beginPath()
      ctx.arc(0, 0, pulseRadius, 0, 2 * Math.PI)
      ctx.strokeStyle = `rgba(124, 58, 237, ${Math.max(0, 0.4 - (pulseRadius / size))})`
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.restore()
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [size])

  return (
    <div className="flex items-center justify-center relative select-none">
      <canvas ref={canvasRef} className="drop-shadow-[0_10px_20px_rgba(124,58,237,0.15)]" />
    </div>
  )
}
