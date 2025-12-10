"use client"

import { useEffect, useRef, useState } from "react"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import { TABLE_STATE_COLORS } from "@/lib/table-states"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { Table } from "@/lib/mock-data"

interface TableMapSimpleProps {
  onTableClick?: (table: Table) => void
  editable?: boolean
}

export function TableMapSimple({ onTableClick, editable = false }: TableMapSimpleProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [mounted, setMounted] = useState(false)
  
  const { tables = [], loading: tablesLoading } = useTables()
  const { zones = [], loading: zonesLoading } = useZones()

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setCanvasSize({
          width: Math.max(width, 600),
          height: 600
        })
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || tablesLoading) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw background
    ctx.fillStyle = '#f9fafb'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw zones (if any)
    zones.forEach(zone => {
      if (zone.layout_config) {
        try {
          const config = typeof zone.layout_config === 'string' 
            ? JSON.parse(zone.layout_config) 
            : zone.layout_config
          
          if (config.x !== undefined && config.y !== undefined) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2
            ctx.fillRect(config.x, config.y, config.width || 200, config.height || 150)
            ctx.strokeRect(config.x, config.y, config.width || 200, config.height || 150)
            
            // Zone label
            ctx.fillStyle = '#1f2937'
            ctx.font = 'bold 14px sans-serif'
            ctx.fillText(zone.name, config.x + 10, config.y + 25)
          }
        } catch (e) {
          // Skip invalid zone config
        }
      }
    })

    // Draw tables
    tables.forEach((table, index) => {
      // Get position from layout or use grid
      let x = 100 + (index % 6) * 120
      let y = 100 + Math.floor(index / 6) * 100
      
      if (table.layout_config) {
        try {
          const config = typeof table.layout_config === 'string'
            ? JSON.parse(table.layout_config)
            : table.layout_config
          if (config.x !== undefined) x = config.x
          if (config.y !== undefined) y = config.y
        } catch (e) {
          // Use default position
        }
      }

      const size = 60
      const color = TABLE_STATE_COLORS[table.status] || TABLE_STATE_COLORS.libre

      // Draw table shape
      if (table.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.fillStyle = color.fill
        ctx.fill()
        ctx.strokeStyle = color.stroke
        ctx.lineWidth = 3
        ctx.stroke()
      } else {
        ctx.fillStyle = color.fill
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
        ctx.strokeStyle = color.stroke
        ctx.lineWidth = 3
        ctx.strokeRect(x - size / 2, y - size / 2, size, size)
      }

      // Draw table number
      ctx.fillStyle = color.text || '#1f2937'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(table.number?.toString() || '?', x, y)
    })
  }, [tables, zones, tablesLoading, zonesLoading, canvasSize])

  // Handle clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTableClick || editable) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find clicked table
    for (const table of tables) {
      let tx = 100 + (tables.indexOf(table) % 6) * 120
      let ty = 100 + Math.floor(tables.indexOf(table) / 6) * 100

      if (table.layout_config) {
        try {
          const config = typeof table.layout_config === 'string'
            ? JSON.parse(table.layout_config)
            : table.layout_config
          if (config.x !== undefined) tx = config.x
          if (config.y !== undefined) ty = config.y
        } catch (e) {
          // Use default position
        }
      }

      const size = 60
      const distance = Math.sqrt((x - tx) ** 2 + (y - ty) ** 2)
      
      if (distance < size / 2) {
        onTableClick(table)
        return
      }
    }
  }

  // Conditional renders AFTER all hooks
  if (!mounted || tablesLoading) {
    return (
      <Card className="p-4">
        <div className="flex h-[500px] items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  const statusLabels: Record<string, string> = {
    libre: 'Libre',
    ocupada: 'Ocupada',
    reservada: 'Reservada',
    limpieza: 'Limpieza',
    pago: 'Pago'
  }

  return (
    <Card className="p-4">
      <div ref={containerRef} className="relative">
        {editable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              El modo de edición avanzado estará disponible próximamente. Por ahora puedes ver la disposición del salón.
            </p>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          className="border rounded-lg cursor-pointer bg-white w-full"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(TABLE_STATE_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border-2"
                style={{ 
                  backgroundColor: colors.fill,
                  borderColor: colors.stroke
                }}
              />
              <span className="text-sm capitalize">{statusLabels[status] || status}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
