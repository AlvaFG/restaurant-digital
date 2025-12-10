"use client"

import { useEffect, useRef, useState } from "react"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import { TABLE_STATE_COLORS, type TableState } from "@/lib/table-states"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"

// Local type for table colors with fill/stroke
interface TableColorConfig {
  fill: string
  stroke: string
  text: string
}

// Map single colors to fill/stroke config
function getTableColors(status: string): TableColorConfig {
  const baseColor = TABLE_STATE_COLORS[status as TableState] || TABLE_STATE_COLORS.libre
  
  // Create fill (lighter) and stroke (darker) variants from base color
  return {
    fill: baseColor + '20', // Add 20% opacity for fill
    stroke: baseColor,
    text: '#1f2937'
  }
}

// Status label translations
const STATUS_LABELS: Record<string, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  limpieza: 'Limpieza',
  pago: 'Pago',
  pedido_en_curso: 'Pedido en curso',
  cuenta_solicitada: 'Cuenta solicitada',
  pago_confirmado: 'Pago confirmado'
}

interface TableMapSimpleProps {
  onTableClick?: (table: { id: string; number: string; status: string }) => void
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
      // Get position from position field or use grid layout
      let x = 100 + (index % 6) * 120
      let y = 100 + Math.floor(index / 6) * 100
      
      // Try to get position from the position field (JSON)
      if (table.position) {
        try {
          const pos = typeof table.position === 'string'
            ? JSON.parse(table.position)
            : table.position
          if (pos && typeof pos.x === 'number') x = pos.x
          if (pos && typeof pos.y === 'number') y = pos.y
        } catch (e) {
          // Use default position
        }
      }

      const size = 60
      const colors = getTableColors(table.status)

      // Draw table as rectangle (default shape)
      ctx.fillStyle = colors.fill
      ctx.fillRect(x - size / 2, y - size / 2, size, size)
      ctx.strokeStyle = colors.stroke
      ctx.lineWidth = 3
      ctx.strokeRect(x - size / 2, y - size / 2, size, size)

      // Draw table number
      ctx.fillStyle = colors.text
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
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Find clicked table
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      let tx = 100 + (i % 6) * 120
      let ty = 100 + Math.floor(i / 6) * 100

      // Try to get position from the position field
      if (table.position) {
        try {
          const pos = typeof table.position === 'string'
            ? JSON.parse(table.position)
            : table.position
          if (pos && typeof pos.x === 'number') tx = pos.x
          if (pos && typeof pos.y === 'number') ty = pos.y
        } catch (e) {
          // Use default position
        }
      }

      const size = 60
      const distance = Math.sqrt((clickX - tx) ** 2 + (clickY - ty) ** 2)
      
      if (distance < size / 2) {
        onTableClick({ id: table.id, number: table.number, status: table.status })
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
          {Object.entries(TABLE_STATE_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border-2"
                style={{ 
                  backgroundColor: color + '40',
                  borderColor: color
                }}
              />
              <span className="text-sm capitalize">{STATUS_LABELS[status] || status}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
