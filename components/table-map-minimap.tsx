"use client"

import { useRef, useEffect, useCallback } from "react"
import { TABLE_STATE_COLORS, type TableState } from "@/lib/table-states"

interface TablePosition {
  x: number
  y: number
  w: number
  h: number
  rot: number
  shape: 'rectangle' | 'square' | 'circle'
}

interface TableData {
  id: string
  status: string
  position: TablePosition
}

interface TableMapMinimapProps {
  tables: TableData[]
  viewportX: number
  viewportY: number
  viewportWidth: number
  viewportHeight: number
  canvasWidth: number
  canvasHeight: number
  zoom: number
  onViewportChange: (x: number, y: number) => void
  selectedIds?: Set<string>
}

const MINIMAP_WIDTH = 180
const MINIMAP_HEIGHT = 120
const MINIMAP_PADDING = 8

export function TableMapMinimap({
  tables,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  onViewportChange,
  selectedIds = new Set()
}: TableMapMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)

  // Calculate scale to fit canvas in minimap
  const scale = Math.min(
    (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / canvasWidth,
    (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / canvasHeight
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT)

    ctx.save()
    ctx.translate(MINIMAP_PADDING, MINIMAP_PADDING)

    // Draw scaled canvas background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvasWidth * scale, canvasHeight * scale)

    // Draw tables
    tables.forEach(table => {
      const pos = table.position
      const color = TABLE_STATE_COLORS[table.status as TableState] || TABLE_STATE_COLORS.libre
      const isSelected = selectedIds.has(table.id)

      ctx.fillStyle = isSelected ? '#3b82f6' : color
      ctx.globalAlpha = isSelected ? 1 : 0.7

      const x = pos.x * scale
      const y = pos.y * scale
      const w = Math.max(pos.w * scale, 3)
      const h = Math.max(pos.h * scale, 3)

      if (pos.shape === 'circle') {
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, w, h)
      }
    })

    ctx.globalAlpha = 1

    // Draw viewport indicator
    const vpX = (viewportX / zoom) * scale
    const vpY = (viewportY / zoom) * scale
    const vpW = (viewportWidth / zoom) * scale
    const vpH = (viewportHeight / zoom) * scale

    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2
    ctx.strokeRect(vpX, vpY, vpW, vpH)

    // Viewport fill
    ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'
    ctx.fillRect(vpX, vpY, vpW, vpH)

    ctx.restore()
  }, [tables, viewportX, viewportY, viewportWidth, viewportHeight, canvasWidth, canvasHeight, zoom, scale, selectedIds])

  useEffect(() => {
    draw()
  }, [draw])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true
    handleMouseMove(e)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - MINIMAP_PADDING
    const y = e.clientY - rect.top - MINIMAP_PADDING

    // Convert minimap coords to canvas coords
    const canvasX = (x / scale) * zoom - viewportWidth / 2
    const canvasY = (y / scale) * zoom - viewportHeight / 2

    // Clamp to bounds
    const maxX = canvasWidth * zoom - viewportWidth
    const maxY = canvasHeight * zoom - viewportHeight
    const clampedX = Math.max(0, Math.min(canvasX, maxX))
    const clampedY = Math.max(0, Math.min(canvasY, maxY))

    onViewportChange(clampedX, clampedY)
  }, [scale, zoom, viewportWidth, viewportHeight, canvasWidth, canvasHeight, onViewportChange])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur border rounded-lg p-1 shadow-lg">
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="rounded cursor-crosshair"
      />
      <div className="text-[10px] text-muted-foreground text-center mt-1">
        {tables.length} mesas
      </div>
    </div>
  )
}
