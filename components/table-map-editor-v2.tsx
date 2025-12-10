"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import { TABLE_STATE_COLORS, type TableState } from "@/lib/table-states"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { toast } from "@/hooks/use-toast"
import { TableMapToolbar, type ToolMode, type SnapStrength, type GridSize } from "./table-map-toolbar"
import { TablePropertiesPanel, type TableProperties } from "./table-properties-panel"
import { TableMapMinimap } from "./table-map-minimap"

// ============ Types ============
interface TablePosition {
  x: number
  y: number
  w: number
  h: number
  rot: number
  shape: 'rectangle' | 'square' | 'circle'
}

interface ZonePosition {
  x: number
  y: number
  w: number
  h: number
}

interface ZoneWithPosition {
  id: string
  name: string
  color: string
  position: ZonePosition
}

interface TableWithPosition {
  id: string
  number: string
  status: string
  capacity: number
  zone_id: string | null
  position: TablePosition
}

interface DragState {
  isDragging: boolean
  targetId: string | null
  targetType: 'table' | 'zone' | null
  offsetX: number
  offsetY: number
  handle: 'body' | 'resize' | 'rotate' | null
  startAngle?: number
  startRotation?: number
}

interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

interface HistoryEntry {
  tablePositions: Map<string, TablePosition>
  zonePositions: Map<string, ZonePosition>
  timestamp: number
}

interface TableMapEditorProps {
  onTableClick?: (table: { id: string; number: string; status: string }) => void
  editable?: boolean
}

// ============ Constants ============
const DEFAULT_WIDTH = 80
const DEFAULT_HEIGHT = 60
const MIN_SIZE = 30
const MAX_SIZE = 300
const RESIZE_HANDLE_SIZE = 10
const ROTATE_HANDLE_DISTANCE = 25
const MAX_HISTORY = 50

// ============ Utilities ============
function getTableColors(status: string) {
  const baseColor = TABLE_STATE_COLORS[status as TableState] || TABLE_STATE_COLORS.libre
  return {
    fill: baseColor + '40',
    stroke: baseColor,
    text: '#ffffff'
  }
}

function snapToGrid(value: number, gridSize: number, strength: SnapStrength): number {
  if (strength === 'off') return value
  const snapped = Math.round(value / gridSize) * gridSize
  if (strength === 'hard') return snapped
  // Soft snap: only snap if very close
  const distance = Math.abs(value - snapped)
  if (distance < gridSize * 0.3) return snapped
  return value
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

function parsePosition(posData: unknown, index: number): TablePosition {
  const defaultPos: TablePosition = {
    x: 100 + (index % 6) * 130,
    y: 100 + Math.floor(index / 6) * 100,
    w: DEFAULT_WIDTH,
    h: DEFAULT_HEIGHT,
    rot: 0,
    shape: 'rectangle'
  }
  
  if (!posData) return defaultPos
  
  try {
    const pos = typeof posData === 'string' ? JSON.parse(posData) : posData
    return {
      x: typeof pos.x === 'number' ? pos.x : defaultPos.x,
      y: typeof pos.y === 'number' ? pos.y : defaultPos.y,
      w: typeof pos.w === 'number' ? pos.w : (typeof pos.width === 'number' ? pos.width : defaultPos.w),
      h: typeof pos.h === 'number' ? pos.h : (typeof pos.height === 'number' ? pos.height : defaultPos.h),
      rot: typeof pos.rot === 'number' ? pos.rot : (typeof pos.rotation === 'number' ? pos.rotation : 0),
      shape: ['rectangle', 'square', 'circle'].includes(pos.shape) ? pos.shape : 'rectangle'
    }
  } catch {
    return defaultPos
  }
}

// ============ Main Component ============
export function TableMapEditor({ onTableClick, editable = false }: TableMapEditorProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  // Core state
  const [mounted, setMounted] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 })
  const [tablePositions, setTablePositions] = useState<Map<string, TablePosition>>(new Map())
  const [zonePositions, setZonePositions] = useState<Map<string, ZonePosition>>(new Map())
  
  // Tool state
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState<GridSize>(20)
  const [snapStrength, setSnapStrength] = useState<SnapStrength>('soft')
  
  // Selection state
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set())
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  
  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    targetId: null,
    targetType: null,
    offsetX: 0,
    offsetY: 0,
    handle: null
  })
  
  // Viewport state for minimap
  const [viewportScroll, setViewportScroll] = useState({ x: 0, y: 0 })
  const [showMinimap, setShowMinimap] = useState(true)
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Zone colors for visual distinction
  const zoneColors = useMemo(() => [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ], [])
  
  // Data hooks
  const { tables = [], loading: tablesLoading } = useTables()
  const { zones = [], loading: zonesLoading, createZone, updateZone } = useZones()
  
  // Memoized tables with positions
  const tablesWithPositions = useMemo((): TableWithPosition[] => {
    return tables.map((table, index) => ({
      id: table.id,
      number: table.number,
      status: table.status,
      capacity: table.capacity || 4,
      zone_id: table.zone_id,
      position: tablePositions.get(table.id) || parsePosition(table.position, index)
    }))
  }, [tables, tablePositions])

  // Memoized zones with positions
  const zonesWithPositions = useMemo((): ZoneWithPosition[] => {
    return zones.map((zone, index) => {
      // Calculate zone bounds from tables or use stored position
      const zoneTables = tablesWithPositions.filter(t => t.zone_id === zone.id)
      const storedPosition = zonePositions.get(zone.id)
      
      let position: ZonePosition
      if (storedPosition) {
        position = storedPosition
      } else if (zoneTables.length > 0) {
        // Auto-calculate from tables
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0
        zoneTables.forEach(table => {
          minX = Math.min(minX, table.position.x - 30)
          minY = Math.min(minY, table.position.y - 30)
          maxX = Math.max(maxX, table.position.x + table.position.w + 30)
          maxY = Math.max(maxY, table.position.y + table.position.h + 30)
        })
        position = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
      } else {
        // Default position for empty zones
        position = { x: 50 + (index % 3) * 250, y: 50 + Math.floor(index / 3) * 200, w: 200, h: 150 }
      }
      
      return {
        id: zone.id,
        name: zone.name,
        color: zoneColors[index % zoneColors.length],
        position
      }
    })
  }, [zones, tablesWithPositions, zonePositions, zoneColors])

  // Get selected table for properties panel
  const selectedTable = useMemo((): TableProperties | null => {
    if (selectedTableIds.size !== 1) return null
    const id = Array.from(selectedTableIds)[0]
    const table = tablesWithPositions.find(t => t.id === id)
    if (!table) return null
    
    const zone = zones.find(z => z.id === table.zone_id)
    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      zoneId: table.zone_id,
      zoneName: zone?.name,
      position: table.position
    }
  }, [selectedTableIds, tablesWithPositions, zones])

  // ============ Effects ============
  
  // Initialize positions from tables
  useEffect(() => {
    if (tables.length > 0 && tablePositions.size === 0) {
      const initialPositions = new Map<string, TablePosition>()
      tables.forEach((table, index) => {
        initialPositions.set(table.id, parsePosition(table.position, index))
      })
      setTablePositions(initialPositions)
      // Initialize history
      setHistory([{ tablePositions: new Map(initialPositions), zonePositions: new Map(), timestamp: Date.now() }])
      setHistoryIndex(0)
    }
  }, [tables, tablePositions.size])

  // Mount effect
  useEffect(() => {
    setMounted(true)
    // Create offscreen canvas for double buffering
    offscreenCanvasRef.current = document.createElement('canvas')
  }, [])

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setCanvasSize({
          width: Math.max(width - 32, 600),
          height: 700
        })
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editable) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') setToolMode('select')
      if (e.key === 'm' || e.key === 'M') setToolMode('move')
      if (e.key === 'r' || e.key === 'R') setToolMode('rotate')
      if (e.key === 's' && !e.ctrlKey) setToolMode('resize')
      
      // Grid toggle
      if (e.key === 'g' || e.key === 'G') setShowGrid(prev => !prev)
      
      // Zoom
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      
      // Undo/Redo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        handleRedo()
      }
      
      // Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (hasChanges) handleSave()
      }
      
      // Delete
      if (e.key === 'Delete' && selectedTableIds.size > 0) {
        // For now, just deselect (delete would require API call)
        setSelectedTableIds(new Set())
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedTableIds(new Set())
        setSelectionBox(null)
      }
      
      // Duplicate
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        handleDuplicate()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editable, hasChanges, selectedTableIds, historyIndex, history])

  // ============ History Management ============
  
  const pushHistory = useCallback(() => {
    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ 
        tablePositions: new Map(tablePositions), 
        zonePositions: new Map(zonePositions),
        timestamp: Date.now() 
      })
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex, tablePositions, zonePositions])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1]
      setTablePositions(new Map(prevEntry.tablePositions))
      setZonePositions(new Map(prevEntry.zonePositions))
      setHistoryIndex(prev => prev - 1)
      setHasChanges(true)
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1]
      setTablePositions(new Map(nextEntry.tablePositions))
      setZonePositions(new Map(nextEntry.zonePositions))
      setHistoryIndex(prev => prev + 1)
      setHasChanges(true)
    }
  }, [history, historyIndex])

  // ============ Drawing ============
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const offscreen = offscreenCanvasRef.current
    if (!canvas || !offscreen) return

    // Setup offscreen canvas
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    // Clear and setup
    ctx.clearRect(0, 0, offscreen.width, offscreen.height)
    ctx.save()
    ctx.scale(zoom, zoom)
    
    const virtualWidth = offscreen.width / zoom
    const virtualHeight = offscreen.height / zoom
    
    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, virtualWidth, virtualHeight)

    // Grid
    if (showGrid) {
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= virtualWidth; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, virtualHeight)
        ctx.stroke()
      }
      for (let y = 0; y <= virtualHeight; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(virtualWidth, y)
        ctx.stroke()
      }
    }

    // Draw zones as background areas (now with positions and selection)
    zonesWithPositions.forEach(zone => {
      const pos = zone.position
      const isSelected = selectedZoneId === zone.id
      const isDragging = dragState.isDragging && dragState.targetType === 'zone' && dragState.targetId === zone.id
      
      ctx.save()
      
      // Shadow for selected zones
      if (isSelected || isDragging) {
        ctx.shadowColor = zone.color + '80'
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
      }
      
      // Zone background
      ctx.fillStyle = zone.color + '15'
      ctx.strokeStyle = isSelected ? zone.color : zone.color + '60'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.setLineDash(isSelected ? [] : [8, 4])
      ctx.beginPath()
      ctx.roundRect(pos.x, pos.y, pos.w, pos.h, 12)
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.restore()
      
      // Zone label
      ctx.fillStyle = zone.color
      ctx.font = 'bold 12px Inter, system-ui, sans-serif'
      ctx.fillText(zone.name, pos.x + 10, pos.y + 22)
      
      // Resize handle when selected and editable
      if (editable && isSelected) {
        ctx.fillStyle = zone.color
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        const handleX = pos.x + pos.w - RESIZE_HANDLE_SIZE / 2
        const handleY = pos.y + pos.h - RESIZE_HANDLE_SIZE / 2
        ctx.fillRect(handleX, handleY, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE)
        ctx.strokeRect(handleX, handleY, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE)
      }
    })

    // Draw tables
    tablesWithPositions.forEach(table => {
      const pos = table.position
      const colors = getTableColors(table.status)
      const isSelected = selectedTableIds.has(table.id)
      const isDragging = dragState.isDragging && dragState.targetType === 'table' && dragState.targetId === table.id
      
      ctx.save()
      
      // Transform for rotation
      const centerX = pos.x + pos.w / 2
      const centerY = pos.y + pos.h / 2
      ctx.translate(centerX, centerY)
      ctx.rotate((pos.rot * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)
      
      // Shadow for selected/dragging
      if (isSelected || isDragging) {
        ctx.shadowColor = 'rgba(59, 130, 246, 0.6)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
      }
      
      // Draw shape
      ctx.fillStyle = colors.fill
      ctx.strokeStyle = isSelected ? '#3b82f6' : colors.stroke
      ctx.lineWidth = isSelected ? 3 : 2
      
      ctx.beginPath()
      if (pos.shape === 'circle') {
        ctx.ellipse(centerX, centerY, pos.w / 2, pos.h / 2, 0, 0, Math.PI * 2)
      } else {
        ctx.roundRect(pos.x, pos.y, pos.w, pos.h, pos.shape === 'square' ? 4 : 8)
      }
      ctx.fill()
      ctx.stroke()
      
      ctx.restore()
      
      // Draw table number (not rotated for readability)
      ctx.fillStyle = colors.text
      ctx.font = 'bold 16px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(table.number || '?', centerX, centerY)
      
      // Capacity badge
      if (table.capacity) {
        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px Inter, system-ui, sans-serif'
        ctx.fillText(`${table.capacity}p`, centerX, centerY + 18)
      }
      
      // Draw handles when selected and editable
      if (editable && isSelected) {
        // Resize handle (bottom-right corner)
        ctx.fillStyle = '#3b82f6'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        const handleX = pos.x + pos.w - RESIZE_HANDLE_SIZE / 2
        const handleY = pos.y + pos.h - RESIZE_HANDLE_SIZE / 2
        ctx.fillRect(handleX, handleY, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE)
        ctx.strokeRect(handleX, handleY, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE)
        
        // Rotate handle (above center)
        const rotateHandleX = centerX
        const rotateHandleY = pos.y - ROTATE_HANDLE_DISTANCE
        ctx.beginPath()
        ctx.arc(rotateHandleX, rotateHandleY, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        
        // Line connecting rotate handle
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(centerX, pos.y)
        ctx.lineTo(rotateHandleX, rotateHandleY)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })

    // Draw selection box
    if (selectionBox) {
      const x = Math.min(selectionBox.startX, selectionBox.endX)
      const y = Math.min(selectionBox.startY, selectionBox.endY)
      const w = Math.abs(selectionBox.endX - selectionBox.startX)
      const h = Math.abs(selectionBox.endY - selectionBox.startY)
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)
      ctx.setLineDash([])
    }
    
    ctx.restore()

    // Copy to main canvas
    const mainCtx = canvas.getContext('2d')
    if (mainCtx) {
      mainCtx.clearRect(0, 0, canvas.width, canvas.height)
      mainCtx.drawImage(offscreen, 0, 0)
    }
  }, [tablesWithPositions, zones, zoom, showGrid, gridSize, selectedTableIds, dragState, selectionBox, editable])

  // Redraw on changes
  useEffect(() => {
    requestAnimationFrame(draw)
  }, [draw])

  // ============ Hit Testing ============
  
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    }
  }, [zoom])

  const getTableAtPosition = useCallback((x: number, y: number): {
    table: TableWithPosition
    handle: 'body' | 'resize' | 'rotate'
  } | null => {
    // Check in reverse order (top-most first)
    for (let i = tablesWithPositions.length - 1; i >= 0; i--) {
      const table = tablesWithPositions[i]
      const pos = table.position
      const isSelected = selectedTableIds.has(table.id)
      
      // Check rotate handle first (if selected and editable)
      if (editable && isSelected) {
        const centerX = pos.x + pos.w / 2
        const rotateHandleY = pos.y - ROTATE_HANDLE_DISTANCE
        const distToRotate = Math.hypot(x - centerX, y - rotateHandleY)
        if (distToRotate <= 10) {
          return { table, handle: 'rotate' }
        }
        
        // Check resize handle
        const handleX = pos.x + pos.w - RESIZE_HANDLE_SIZE / 2
        const handleY = pos.y + pos.h - RESIZE_HANDLE_SIZE / 2
        if (x >= handleX && x <= handleX + RESIZE_HANDLE_SIZE &&
            y >= handleY && y <= handleY + RESIZE_HANDLE_SIZE) {
          return { table, handle: 'resize' }
        }
      }
      
      // Check table body
      if (pos.shape === 'circle') {
        const centerX = pos.x + pos.w / 2
        const centerY = pos.y + pos.h / 2
        const dx = (x - centerX) / (pos.w / 2)
        const dy = (y - centerY) / (pos.h / 2)
        if (dx * dx + dy * dy <= 1) {
          return { table, handle: 'body' }
        }
      } else {
        if (x >= pos.x && x <= pos.x + pos.w &&
            y >= pos.y && y <= pos.y + pos.h) {
          return { table, handle: 'body' }
        }
      }
    }
    return null
  }, [tablesWithPositions, selectedTableIds, editable])

  // Check if point is on a zone
  const getZoneAtPosition = useCallback((x: number, y: number): {
    zone: ZoneWithPosition
    handle: 'body' | 'resize'
  } | null => {
    // Check in reverse order (top-most first)
    for (let i = zonesWithPositions.length - 1; i >= 0; i--) {
      const zone = zonesWithPositions[i]
      const pos = zone.position
      const isSelected = selectedZoneId === zone.id
      
      // Check resize handle first (if selected and editable)
      if (editable && isSelected) {
        const handleX = pos.x + pos.w - RESIZE_HANDLE_SIZE / 2
        const handleY = pos.y + pos.h - RESIZE_HANDLE_SIZE / 2
        if (x >= handleX && x <= handleX + RESIZE_HANDLE_SIZE &&
            y >= handleY && y <= handleY + RESIZE_HANDLE_SIZE) {
          return { zone, handle: 'resize' }
        }
      }
      
      // Check zone body
      if (x >= pos.x && x <= pos.x + pos.w &&
          y >= pos.y && y <= pos.y + pos.h) {
        return { zone, handle: 'body' }
      }
    }
    return null
  }, [zonesWithPositions, selectedZoneId, editable])

  // ============ Mouse Handlers ============
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY)
    if (!coords) return
    
    // Check tables first (they're on top)
    const hit = getTableAtPosition(coords.x, coords.y)
    
    if (hit) {
      const { table, handle } = hit
      
      // Clear zone selection when selecting a table
      setSelectedZoneId(null)
      
      // Handle selection
      if (e.shiftKey) {
        // Toggle selection with shift
        setSelectedTableIds(prev => {
          const next = new Set(prev)
          if (next.has(table.id)) next.delete(table.id)
          else next.add(table.id)
          return next
        })
      } else if (!selectedTableIds.has(table.id)) {
        // Select only this table
        setSelectedTableIds(new Set([table.id]))
      }
      
      if (editable && (toolMode === 'move' || handle === 'body' || handle === 'resize' || handle === 'rotate')) {
        const pos = table.position
        const centerX = pos.x + pos.w / 2
        const centerY = pos.y + pos.h / 2
        
        setDragState({
          isDragging: true,
          targetId: table.id,
          targetType: 'table',
          offsetX: coords.x - pos.x,
          offsetY: coords.y - pos.y,
          handle: toolMode === 'rotate' ? 'rotate' : toolMode === 'resize' ? 'resize' : handle,
          startAngle: Math.atan2(coords.y - centerY, coords.x - centerX) * 180 / Math.PI,
          startRotation: pos.rot
        })
      }
      return
    }
    
    // Check zones
    const zoneHit = getZoneAtPosition(coords.x, coords.y)
    
    if (zoneHit) {
      const { zone, handle } = zoneHit
      
      // Clear table selection when selecting a zone
      setSelectedTableIds(new Set())
      setSelectedZoneId(zone.id)
      
      // Initialize zone position if not exists
      if (!zonePositions.has(zone.id)) {
        setZonePositions(prev => {
          const updated = new Map(prev)
          updated.set(zone.id, zone.position)
          return updated
        })
      }
      
      if (editable && (toolMode === 'move' || handle === 'body' || handle === 'resize')) {
        const pos = zone.position
        
        setDragState({
          isDragging: true,
          targetId: zone.id,
          targetType: 'zone',
          offsetX: coords.x - pos.x,
          offsetY: coords.y - pos.y,
          handle: toolMode === 'resize' ? 'resize' : handle
        })
      }
      return
    }
    
    // Clicked empty space
    setSelectedTableIds(new Set())
    setSelectedZoneId(null)
    
    // Start selection box
    if (toolMode === 'select') {
      setSelectionBox({
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y
      })
    }
  }, [getCanvasCoords, getTableAtPosition, getZoneAtPosition, editable, toolMode, selectedTableIds, zonePositions])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY)
    if (!coords) return
    
    // Update cursor based on what's under it
    const canvas = canvasRef.current
    if (canvas) {
      const hit = getTableAtPosition(coords.x, coords.y)
      const zoneHit = getZoneAtPosition(coords.x, coords.y)
      if (hit) {
        if (hit.handle === 'rotate') canvas.style.cursor = 'grab'
        else if (hit.handle === 'resize') canvas.style.cursor = 'nwse-resize'
        else canvas.style.cursor = editable ? 'move' : 'pointer'
      } else if (zoneHit) {
        if (zoneHit.handle === 'resize') canvas.style.cursor = 'nwse-resize'
        else canvas.style.cursor = editable ? 'move' : 'pointer'
      } else {
        canvas.style.cursor = toolMode === 'select' ? 'crosshair' : 'default'
      }
    }
    
    // Handle selection box
    if (selectionBox) {
      setSelectionBox(prev => prev ? { ...prev, endX: coords.x, endY: coords.y } : null)
      return
    }
    
    // Handle dragging
    if (!dragState.isDragging || !dragState.targetId) return
    
    // Dragging a zone
    if (dragState.targetType === 'zone') {
      const pos = zonePositions.get(dragState.targetId)
      if (!pos) return
      
      setZonePositions(prev => {
        const updated = new Map(prev)
        const current = updated.get(dragState.targetId!) || pos
        
        if (dragState.handle === 'resize') {
          let newW = coords.x - current.x
          let newH = coords.y - current.y
          newW = Math.max(100, Math.min(800, newW))
          newH = Math.max(80, Math.min(600, newH))
          newW = snapToGrid(newW, gridSize, snapStrength)
          newH = snapToGrid(newH, gridSize, snapStrength)
          updated.set(dragState.targetId!, { ...current, w: newW, h: newH })
        } else {
          let newX = coords.x - dragState.offsetX
          let newY = coords.y - dragState.offsetY
          newX = snapToGrid(newX, gridSize, snapStrength)
          newY = snapToGrid(newY, gridSize, snapStrength)
          newX = Math.max(0, Math.min(newX, (canvasSize.width / zoom) - current.w))
          newY = Math.max(0, Math.min(newY, (canvasSize.height / zoom) - current.h))
          updated.set(dragState.targetId!, { ...current, x: newX, y: newY })
        }
        return updated
      })
      setHasChanges(true)
      return
    }
    
    // Dragging a table
    const pos = tablePositions.get(dragState.targetId)
    if (!pos) return
    
    const centerX = pos.x + pos.w / 2
    const centerY = pos.y + pos.h / 2
    
    setTablePositions(prev => {
      const updated = new Map(prev)
      const current = updated.get(dragState.targetId!)
      if (!current) return prev
      
      let newPos = { ...current }
      
      if (dragState.handle === 'rotate') {
        // Calculate new rotation
        const angle = Math.atan2(coords.y - centerY, coords.x - centerX) * 180 / Math.PI
        const deltaAngle = angle - (dragState.startAngle || 0)
        let newRot = normalizeAngle((dragState.startRotation || 0) + deltaAngle)
        
        // Snap rotation to 15-degree increments
        if (snapStrength !== 'off') {
          newRot = Math.round(newRot / 15) * 15
        }
        newPos.rot = newRot
        
      } else if (dragState.handle === 'resize') {
        // Calculate new size
        let newW = coords.x - pos.x
        let newH = coords.y - pos.y
        
        newW = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newW))
        newH = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newH))
        
        newW = snapToGrid(newW, gridSize, snapStrength)
        newH = snapToGrid(newH, gridSize, snapStrength)
        
        newPos.w = newW
        newPos.h = newH
        
      } else {
        // Move
        let newX = coords.x - dragState.offsetX
        let newY = coords.y - dragState.offsetY
        
        // Snap to grid
        newX = snapToGrid(newX, gridSize, snapStrength)
        newY = snapToGrid(newY, gridSize, snapStrength)
        
        // Keep within bounds
        newX = Math.max(0, Math.min(newX, (canvasSize.width / zoom) - pos.w))
        newY = Math.max(0, Math.min(newY, (canvasSize.height / zoom) - pos.h))
        
        // Move all selected tables
        if (selectedTableIds.size > 1 && selectedTableIds.has(dragState.targetId!)) {
          const deltaX = newX - current.x
          const deltaY = newY - current.y
          
          selectedTableIds.forEach(id => {
            if (id === dragState.targetId) return
            const otherPos = updated.get(id)
            if (otherPos) {
              updated.set(id, {
                ...otherPos,
                x: Math.max(0, otherPos.x + deltaX),
                y: Math.max(0, otherPos.y + deltaY)
              })
            }
          })
        }
        
        newPos.x = newX
        newPos.y = newY
      }
      
      updated.set(dragState.targetId!, newPos)
      return updated
    })
    
    setHasChanges(true)
  }, [getCanvasCoords, getTableAtPosition, getZoneAtPosition, selectionBox, dragState, tablePositions, zonePositions, selectedTableIds, zoom, gridSize, snapStrength, canvasSize, editable, toolMode])

  const handleMouseUp = useCallback(() => {
    // Handle selection box
    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.endX)
      const y1 = Math.min(selectionBox.startY, selectionBox.endY)
      const x2 = Math.max(selectionBox.startX, selectionBox.endX)
      const y2 = Math.max(selectionBox.startY, selectionBox.endY)
      
      // Select all tables within the box
      const selected = new Set<string>()
      tablesWithPositions.forEach(table => {
        const pos = table.position
        const centerX = pos.x + pos.w / 2
        const centerY = pos.y + pos.h / 2
        
        if (centerX >= x1 && centerX <= x2 && centerY >= y1 && centerY <= y2) {
          selected.add(table.id)
        }
      })
      
      setSelectedTableIds(selected)
      setSelectionBox(null)
    }
    
    // Handle drag end
    if (dragState.isDragging) {
      pushHistory()
      setDragState({
        isDragging: false,
        targetId: null,
        targetType: null,
        offsetX: 0,
        offsetY: 0,
        handle: null
      })
    }
  }, [selectionBox, tablesWithPositions, dragState, pushHistory])

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY)
    if (!coords) return
    
    const hit = getTableAtPosition(coords.x, coords.y)
    if (hit && onTableClick) {
      onTableClick({
        id: hit.table.id,
        number: hit.table.number,
        status: hit.table.status
      })
    }
  }, [getCanvasCoords, getTableAtPosition, onTableClick])

  // ============ Actions ============
  
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.1, 2)), [])
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.1, 0.5)), [])
  
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    
    try {
      // Save table positions
      const tableUpdates = Array.from(tablePositions.entries()).map(([id, pos]) => ({
        id,
        position: pos
      }))
      
      const response = await fetch('/api/table-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: tableUpdates })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar')
      }
      
      // Save zone positions
      for (const [zoneId, pos] of zonePositions.entries()) {
        await updateZone({ id: zoneId, position: pos })
      }
      
      setHasChanges(false)
      toast({
        title: "Layout guardado",
        description: `Se guardaron ${result.summary?.successful || tableUpdates.length} posiciones correctamente.`
      })
      
      if (result.errors?.length > 0) {
        toast({
          title: "Advertencia",
          description: `${result.errors.length} mesas no se pudieron actualizar.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el layout.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [tablePositions, zonePositions, updateZone])

  const handleDelete = useCallback(() => {
    // For layout editor, delete just means remove from view/reset position
    toast({
      title: "Función no disponible",
      description: "Para eliminar mesas, usa el panel de gestión de mesas."
    })
  }, [])

  const handleDuplicate = useCallback(() => {
    // Duplication would require creating new tables via API
    toast({
      title: "Función no disponible",
      description: "Para duplicar mesas, usa el panel de gestión de mesas."
    })
  }, [])

  const handleAddTable = useCallback(() => {
    toast({
      title: "Agregar mesa",
      description: "Usa el panel de gestión de mesas para crear nuevas mesas."
    })
  }, [])

  const handleAddZone = useCallback(async () => {
    // Generate a unique name
    const existingNames = zones.map(z => z.name)
    let newName = "Nueva Zona"
    let counter = 1
    while (existingNames.includes(newName)) {
      newName = `Nueva Zona ${counter++}`
    }
    
    try {
      const result = await createZone({
        name: newName,
        description: "",
        sortOrder: zones.length
      })
      
      // Set initial position for the new zone
      if (result?.id) {
        const newPosition: ZonePosition = {
          x: 50 + Math.random() * 200,
          y: 50 + Math.random() * 100,
          w: 200,
          h: 150
        }
        setZonePositions(prev => {
          const updated = new Map(prev)
          updated.set(result.id, newPosition)
          return updated
        })
        setSelectedZoneId(result.id)
        setSelectedTableIds(new Set())
        setHasChanges(true)
      }
      
      toast({
        title: "Zona creada",
        description: `"${newName}" creada. Haz doble clic para editar el nombre.`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la zona.",
        variant: "destructive"
      })
    }
  }, [zones, createZone])

  const handleUpdateTable = useCallback((updates: Partial<TableProperties>) => {
    if (selectedTableIds.size !== 1) return
    const id = Array.from(selectedTableIds)[0]
    
    if (updates.position) {
      setTablePositions(prev => {
        const updated = new Map(prev)
        const current = updated.get(id)
        if (current) {
          updated.set(id, { ...current, ...updates.position })
        }
        return updated
      })
      setHasChanges(true)
    }
    
    // Other updates (capacity, status, etc.) would need API calls
  }, [selectedTableIds])

  // ============ Render ============
  
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
    <div className="space-y-4">
      {/* Toolbar */}
      <TableMapToolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        snapStrength={snapStrength}
        onSnapStrengthChange={setSnapStrength}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        hasChanges={hasChanges}
        onSave={handleSave}
        isSaving={isSaving}
        hasSelection={selectedTableIds.size > 0 || selectedZoneId !== null}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onAddTable={handleAddTable}
        onAddZone={handleAddZone}
        editable={editable}
      />

      {/* Main content */}
      <div className="flex gap-4">
        {/* Canvas */}
        <Card className="flex-1 p-4 bg-card overflow-hidden">
          {editable && (
            <div className="mb-3 p-2 bg-blue-950/30 border border-blue-800/50 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>Atajos:</strong> V=Seleccionar, M=Mover, R=Rotar, S=Resize, G=Grilla, 
                Ctrl+Z=Deshacer, Ctrl+S=Guardar, Shift+Click=Multi-selección
              </p>
            </div>
          )}
          
          <div 
            ref={containerRef} 
            className="relative overflow-auto rounded-lg border border-border"
            style={{ maxHeight: '700px' }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement
              setViewportScroll({ x: target.scrollLeft, y: target.scrollTop })
            }}
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
              style={{ 
                display: 'block',
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom
              }}
            />
            
            {/* Minimap */}
            {showMinimap && tablesWithPositions.length > 0 && (
              <TableMapMinimap
                tables={tablesWithPositions.map(t => ({
                  id: t.id,
                  status: t.status,
                  position: t.position
                }))}
                viewportX={viewportScroll.x}
                viewportY={viewportScroll.y}
                viewportWidth={containerRef.current?.clientWidth || canvasSize.width}
                viewportHeight={containerRef.current?.clientHeight || canvasSize.height}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                zoom={zoom}
                onViewportChange={(x, y) => {
                  if (containerRef.current) {
                    containerRef.current.scrollLeft = x
                    containerRef.current.scrollTop = y
                    setViewportScroll({ x, y })
                  }
                }}
                selectedIds={selectedTableIds}
              />
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {Object.entries(TABLE_STATE_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded border-2"
                  style={{ 
                    backgroundColor: color + '40',
                    borderColor: color
                  }}
                />
                <span className="text-xs capitalize text-muted-foreground">
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Properties Panel */}
        {editable && (
          <TablePropertiesPanel
            table={selectedTable}
            zones={zones.map(z => ({ id: z.id, name: z.name }))}
            onUpdate={handleUpdateTable}
            onClose={() => setSelectedTableIds(new Set())}
            editable={editable}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <span>
          {tablesWithPositions.length} mesas | {zones.length} zonas
          {selectedTableIds.size > 0 && ` | ${selectedTableIds.size} seleccionadas`}
        </span>
        <span>
          Zoom: {Math.round(zoom * 100)}% | Grilla: {gridSize}px
          {hasChanges && <span className="text-yellow-500 ml-2">● Cambios sin guardar</span>}
        </span>
      </div>
    </div>
  )
}
