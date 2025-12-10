"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import { TABLE_STATE_COLORS, type TableState } from "@/lib/table-states"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Save, RotateCcw, ZoomIn, ZoomOut, Grid3X3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Types
interface TablePosition {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  shape: 'rectangle' | 'circle' | 'square'
}

interface DragState {
  isDragging: boolean
  tableId: string | null
  offsetX: number
  offsetY: number
}

interface TableMapEditorProps {
  onTableClick?: (table: { id: string; number: string; status: string }) => void
  editable?: boolean
}

// Get table colors based on status
function getTableColors(status: string) {
  const baseColor = TABLE_STATE_COLORS[status as TableState] || TABLE_STATE_COLORS.libre
  return {
    fill: baseColor + '40',
    stroke: baseColor,
    text: '#1f2937'
  }
}

// Default table dimensions
const TABLE_WIDTH = 80
const TABLE_HEIGHT = 60
const GRID_SIZE = 20

export function TableMapEditor({ onTableClick, editable = false }: TableMapEditorProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // State
  const [mounted, setMounted] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 })
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [positions, setPositions] = useState<Map<string, TablePosition>>(new Map())
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tableId: null,
    offsetX: 0,
    offsetY: 0
  })
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Hooks
  const { tables = [], loading: tablesLoading, updateTable } = useTables()
  const { zones = [], loading: zonesLoading } = useZones()

  // Initialize positions from tables
  useEffect(() => {
    if (tables.length > 0 && positions.size === 0) {
      const initialPositions = new Map<string, TablePosition>()
      
      tables.forEach((table, index) => {
        // Try to get position from the position field
        let x = 100 + (index % 6) * 130
        let y = 100 + Math.floor(index / 6) * 100
        
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
        
        initialPositions.set(table.id, {
          id: table.id,
          x,
          y,
          width: TABLE_WIDTH,
          height: TABLE_HEIGHT,
          rotation: 0,
          shape: 'rectangle'
        })
      })
      
      setPositions(initialPositions)
    }
  }, [tables, positions.size])

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setCanvasSize({
          width: Math.max(width - 32, 600),
          height: 600
        })
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Apply zoom
    ctx.save()
    ctx.scale(zoom, zoom)
    
    // Draw background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width / zoom, canvas.height / zoom)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#2d2d44'
      ctx.lineWidth = 0.5
      const gridStep = GRID_SIZE
      for (let x = 0; x <= canvas.width / zoom; x += gridStep) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height / zoom)
        ctx.stroke()
      }
      for (let y = 0; y <= canvas.height / zoom; y += gridStep) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width / zoom, y)
        ctx.stroke()
      }
    }

    // Draw zones first (as background areas)
    zones.forEach(zone => {
      const zoneColor = '#3b82f620'
      const zoneTables = tables.filter(t => t.zone_id === zone.id)
      
      if (zoneTables.length > 0) {
        // Calculate zone bounds from table positions
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0
        
        zoneTables.forEach(table => {
          const pos = positions.get(table.id)
          if (pos) {
            minX = Math.min(minX, pos.x - 20)
            minY = Math.min(minY, pos.y - 20)
            maxX = Math.max(maxX, pos.x + pos.width + 20)
            maxY = Math.max(maxY, pos.y + pos.height + 20)
          }
        })
        
        if (minX !== Infinity) {
          ctx.fillStyle = zoneColor
          ctx.strokeStyle = '#3b82f660'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.roundRect(minX, minY, maxX - minX, maxY - minY, 10)
          ctx.fill()
          ctx.stroke()
          
          // Zone label
          ctx.fillStyle = '#60a5fa'
          ctx.font = 'bold 12px Inter, sans-serif'
          ctx.fillText(zone.name, minX + 10, minY + 20)
        }
      }
    })

    // Draw tables
    tables.forEach(table => {
      const pos = positions.get(table.id)
      if (!pos) return
      
      const colors = getTableColors(table.status)
      const isSelected = selectedTableId === table.id
      const isDragging = dragState.isDragging && dragState.tableId === table.id
      
      ctx.save()
      
      // Shadow for selected/dragging tables
      if (isSelected || isDragging) {
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)'
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
      }
      
      // Draw table shape
      ctx.fillStyle = colors.fill
      ctx.strokeStyle = isSelected ? '#3b82f6' : colors.stroke
      ctx.lineWidth = isSelected ? 3 : 2
      
      ctx.beginPath()
      ctx.roundRect(pos.x, pos.y, pos.width, pos.height, 8)
      ctx.fill()
      ctx.stroke()
      
      ctx.restore()
      
      // Draw table number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        table.number?.toString() || '?',
        pos.x + pos.width / 2,
        pos.y + pos.height / 2
      )
      
      // Draw capacity indicator
      if (table.capacity) {
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px Inter, sans-serif'
        ctx.fillText(
          `${table.capacity}p`,
          pos.x + pos.width / 2,
          pos.y + pos.height - 8
        )
      }
      
      // Draw drag handle indicator when editable and selected
      if (editable && isSelected) {
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(pos.x + pos.width, pos.y + pos.height, 6, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    
    ctx.restore()
  }, [tables, zones, positions, zoom, showGrid, selectedTableId, dragState, editable])

  // Redraw on changes
  useEffect(() => {
    draw()
  }, [draw])

  // Get table at position
  const getTableAtPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) / zoom
    const y = (clientY - rect.top) / zoom
    
    // Check tables in reverse order (top-most first)
    for (let i = tables.length - 1; i >= 0; i--) {
      const table = tables[i]
      const pos = positions.get(table.id)
      if (!pos) continue
      
      if (x >= pos.x && x <= pos.x + pos.width &&
          y >= pos.y && y <= pos.y + pos.height) {
        return { table, pos, x, y }
      }
    }
    
    return null
  }, [tables, positions, zoom])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const result = getTableAtPosition(e.clientX, e.clientY)
    
    if (result) {
      setSelectedTableId(result.table.id)
      
      if (editable) {
        setDragState({
          isDragging: true,
          tableId: result.table.id,
          offsetX: result.x - result.pos.x,
          offsetY: result.y - result.pos.y
        })
      }
    } else {
      setSelectedTableId(null)
    }
  }, [getTableAtPosition, editable])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !dragState.tableId) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    let newX = (e.clientX - rect.left) / zoom - dragState.offsetX
    let newY = (e.clientY - rect.top) / zoom - dragState.offsetY
    
    // Snap to grid
    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
    
    // Keep within bounds
    const pos = positions.get(dragState.tableId)
    if (pos) {
      newX = Math.max(0, Math.min(newX, (canvas.width / zoom) - pos.width))
      newY = Math.max(0, Math.min(newY, (canvas.height / zoom) - pos.height))
    }
    
    setPositions(prev => {
      const updated = new Map(prev)
      const existing = updated.get(dragState.tableId!)
      if (existing) {
        updated.set(dragState.tableId!, { ...existing, x: newX, y: newY })
      }
      return updated
    })
    
    setHasChanges(true)
  }, [dragState, zoom, positions])

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        tableId: null,
        offsetX: 0,
        offsetY: 0
      })
    }
  }, [dragState])

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const result = getTableAtPosition(e.clientX, e.clientY)
    if (result && onTableClick) {
      onTableClick({
        id: result.table.id,
        number: result.table.number,
        status: result.table.status
      })
    }
  }, [getTableAtPosition, onTableClick])

  // Save positions
  const handleSave = async () => {
    try {
      const updates = Array.from(positions.entries()).map(([id, pos]) => ({
        id,
        position: { x: pos.x, y: pos.y, width: pos.width, height: pos.height }
      }))
      
      // Update each table's position
      for (const update of updates) {
        await updateTable(update.id, { position: update.position })
      }
      
      setHasChanges(false)
      toast({
        title: "Posiciones guardadas",
        description: "El layout del salón se ha guardado correctamente."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las posiciones.",
        variant: "destructive"
      })
    }
  }

  // Reset positions
  const handleReset = () => {
    setPositions(new Map())
    setHasChanges(false)
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5))

  // Loading state
  if (!mounted || tablesLoading || zonesLoading) {
    return (
      <Card className="p-4">
        <div className="flex h-[500px] items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
        
        {editable && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetear
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Layout
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {editable && (
        <div className="mb-4 p-3 bg-blue-950/50 border border-blue-800 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>Modo edición:</strong> Arrastra las mesas para reposicionarlas. 
            Las mesas se alinean automáticamente a la grilla. 
            Haz doble clic en una mesa para ver sus detalles.
          </p>
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={containerRef} 
        className="relative overflow-auto rounded-lg border border-border"
        style={{ maxHeight: '600px' }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className={`${editable ? 'cursor-move' : 'cursor-pointer'}`}
          style={{ 
            display: 'block',
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {Object.entries(TABLE_STATE_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded border-2"
              style={{ 
                backgroundColor: color + '40',
                borderColor: color
              }}
            />
            <span className="text-sm capitalize text-muted-foreground">
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Selected table info */}
      {selectedTableId && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Mesa seleccionada:</strong>{' '}
            {tables.find(t => t.id === selectedTableId)?.number || 'N/A'}
            {' - '}
            Posición: {positions.get(selectedTableId)?.x.toFixed(0)}, {positions.get(selectedTableId)?.y.toFixed(0)}
          </p>
        </div>
      )}
    </Card>
  )
}
