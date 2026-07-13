import { useEffect, useRef, useState } from 'react'

interface Point3D {
  x: number
  y: number
  z: number
  label: string
  emoji: string
  color: string
  pulse?: boolean
}

export default function Hero3DScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = canvas.width = containerRef.current?.clientWidth || 600
    let height = canvas.height = containerRef.current?.clientHeight || 600

    const handleResize = () => {
      if (!canvas || !containerRef.current) return
      width = canvas.width = containerRef.current.clientWidth
      height = canvas.height = containerRef.current.clientHeight
    }
    window.addEventListener('resize', handleResize)

    // Generate 3D nodes representing emergency network on a sphere
    const radius = Math.min(width, height) * 0.28
    const points: Point3D[] = [
      { x: 0, y: 0, z: 0, label: 'GUARDIAN AI CORE', emoji: '🤖', color: '#7C3AED', pulse: true },
      { x: radius * Math.cos(0), y: radius * Math.sin(0), z: 0, label: 'Trauma Hospital', emoji: '🚑', color: '#2563EB' },
      { x: radius * Math.cos(1.2), y: 0, z: radius * Math.sin(1.2), label: 'Police Precinct', emoji: '🚓', color: '#EF4444' },
      { x: 0, y: radius * Math.cos(2.4), z: radius * Math.sin(2.4), label: 'NGO Hope Shelter', emoji: '🏢', color: '#F59E0B' },
      { x: -radius * Math.cos(3.6), y: radius * Math.sin(3.6), z: 0, label: 'Volunteer Network', emoji: '🛵', color: '#22C55E' },
      { x: radius * Math.cos(4.8) * 0.7, y: -radius * Math.sin(4.8) * 0.7, z: radius * 0.5, label: 'Child Welfare Office', emoji: '🏫', color: '#EC4899' },
    ]

    // Generate wireframe sphere rings
    const sphereLines: { p1: Point3D; p2: Point3D }[] = []
    const segments = 12
    const rings = 6

    // Longitudinal rings
    for (let r = 0; r < rings; r++) {
      const phi = (Math.PI / rings) * (r + 1)
      const ringRadius = radius * Math.sin(phi)
      const ringY = radius * Math.cos(phi)
      
      const ringPoints: Point3D[] = []
      for (let s = 0; s < segments; s++) {
        const theta = (2 * Math.PI / segments) * s
        ringPoints.push({
          x: ringRadius * Math.cos(theta),
          y: ringY,
          z: ringRadius * Math.sin(theta),
          label: '',
          emoji: '',
          color: '#E2E8F0',
        })
      }
      for (let s = 0; s < segments; s++) {
        sphereLines.push({
          p1: ringPoints[s],
          p2: ringPoints[(s + 1) % segments],
        })
      }
    }

    let angleY = 0.005
    let angleX = 0.002
    const focalLength = 400

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(width / 2, height / 2)

      // Slow drift rotation based on mouse coordinates
      const currentAngleY = angleY + (mouse.x - width / 2) * 0.00002
      const currentAngleX = angleX + (mouse.y - height / 2) * 0.00002

      const cosY = Math.cos(currentAngleY)
      const sinY = Math.sin(currentAngleY)
      const cosX = Math.cos(currentAngleX)
      const sinX = Math.sin(currentAngleX)

      // Rotate sphere wireframe lines
      sphereLines.forEach((line) => {
        const rotate = (p: Point3D) => {
          // Y-axis rotation
          let x1 = p.x * cosY - p.z * sinY
          let z1 = p.z * cosY + p.x * sinY
          // X-axis rotation
          let y2 = p.y * cosX - z1 * sinX
          let z2 = z1 * cosX + p.y * sinX
          return { x: x1, y: y2, z: z2 }
        }

        const r1 = rotate(line.p1)
        const r2 = rotate(line.p2)

        const sc1 = focalLength / (focalLength + r1.z)
        const sc2 = focalLength / (focalLength + r2.z)

        const sx1 = r1.x * sc1
        const sy1 = r1.y * sc1
        const sx2 = r2.x * sc2
        const sy2 = r2.y * sc2

        // Soft elegant grid line rendering
        ctx.beginPath()
        ctx.moveTo(sx1, sy1)
        ctx.lineTo(sx2, sy2)
        ctx.strokeStyle = `rgba(203, 213, 225, ${0.15 * (1 - r1.z / radius)})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })

      // Rotate and project active nodes
      const projectedNodes = points.map((p) => {
        // Y-axis rotation
        let x1 = p.x * cosY - p.z * sinY
        let z1 = p.z * cosY + p.x * sinY
        // X-axis rotation
        let y2 = p.y * cosX - z1 * sinX
        let z2 = z1 * cosX + p.y * sinX

        const scale = focalLength / (focalLength + z2)
        const sx = x1 * scale
        const sy = y2 * scale

        return { ...p, sx, sy, sz: z2, scale }
      })

      // Sort by depth (render back elements first)
      projectedNodes.sort((a, b) => b.sz - a.sz)

      // Draw connection lines to central AI Core
      const core = projectedNodes.find((n) => n.pulse)
      if (core) {
        projectedNodes.forEach((node) => {
          if (node === core) return
          ctx.beginPath()
          ctx.moveTo(core.sx, core.sy)
          ctx.lineTo(node.sx, node.sy)
          
          // Shimmer line path
          const grad = ctx.createLinearGradient(core.sx, core.sy, node.sx, node.sy)
          grad.addColorStop(0, 'rgba(124, 58, 237, 0.4)')
          grad.addColorStop(0.5, 'rgba(37, 99, 235, 0.25)')
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
          
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.stroke()
        })
      }

      // Draw projected nodes
      projectedNodes.forEach((node) => {
        const size = (node.pulse ? 32 : 24) * node.scale
        const alpha = Math.max(0.3, Math.min(1, 1 - node.sz / (radius * 1.5)))

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(node.sx, node.sy)

        // Pulsing glow rings for AI Core
        if (node.pulse) {
          const pulseScale = 1 + 0.15 * Math.sin(Date.now() * 0.003)
          ctx.beginPath()
          ctx.arc(0, 0, size * pulseScale, 0, 2 * Math.PI)
          ctx.fillStyle = 'rgba(124, 58, 237, 0.12)'
          ctx.fill()
          ctx.lineWidth = 1.2
          ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)'
          ctx.stroke()
        }

        // Draw node physical white glass circle
        ctx.beginPath()
        ctx.arc(0, 0, size / 2, 0, 2 * Math.PI)
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 4
        ctx.fill()
        
        ctx.lineWidth = 1.5
        ctx.strokeStyle = node.color
        ctx.stroke()

        // Render emoji
        ctx.font = `${size * 0.55}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.emoji, 0, 0)

        // Render node label overlay
        if (node.scale > 0.8) {
          ctx.font = `bold 9px 'Plus Jakarta Sans', sans-serif`
          ctx.fillStyle = '#111827'
          ctx.fillText(node.label, 0, size / 2 + 12)
        }

        ctx.restore()
      })

      ctx.restore()

      // Increment Y and X angles slightly to rotate continuously
      angleY += 0.003
      angleX += 0.001

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [mouse])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      className="w-full h-full min-h-[400px] flex items-center justify-center relative select-none"
    >
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full drop-shadow-[0_10px_30px_rgba(124,58,237,0.06)]"
      />
    </div>
  )
}
