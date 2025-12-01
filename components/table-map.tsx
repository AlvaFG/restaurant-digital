"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva"
import type Konva from "konva"
import type { Table, TableMapLayout } from "@/lib/mock-data"
import { deserializeTable, deserializeTableLayout, getReadyTables } from "@/lib/socket-client-utils"
import { TABLE_STATE_COLORS, TABLE_STATE_LABELS } from "@/lib/table-states"
import { useTables } from "@/hooks/use-tables"
import { useTableLayout } from "@/hooks/use-table-layout"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import type { SocketEventPayload } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/loading-spinner"
import { TableMapControls } from "@/components/table-map-controls"
import { ZoneDrawingLayer, type VisualZone } from "@/components/zone-drawing-layer"
import { Edit, Save, Undo2, Square, Circle as CircleIcon, Trash2 } from "lucide-react"

// Usar el tipo VisualZone exportado del layer de dibujo
type ZoneShape = VisualZone

type SelectionState = 
  | { type: 'none' }
  | { type: 'node'; id: string }
  | { type: 'zone'; id: string }

const ZONE_COLORS = [
  { name: 'Gris', fill: '#9ca3af', stroke: '#6b7280' },
  { name: 'Azul', fill: '#93c5fd', stroke: '#3b82f6' },
  { name: 'Verde', fill: '#86efac', stroke: '#22c55e' },
  { name: 'Amarillo', fill: '#fde047', stroke: '#eab308' },
  { name: 'Rojo', fill: '#fca5a5', stroke: '#ef4444' },
  { name: 'Púrpura', fill: '#c4b5fd', stroke: '#8b5cf6' },
]

interface TableMapProps {
  onTableClick?: (table: Table) => void
  editable?: boolean
}

type LayoutSnapshot = {
  layout: TableMapLayout
  tables: Table[]
}

const DEFAULT_NODE_DIMENSIONS = { width: 80, height: 60 }

function cloneLayout(layout: TableMapLayout): TableMapLayout {
  return structuredClone(layout)
}

function cloneTables(tables: Table[]): Table[] {
  return structuredClone(tables)
}

function generateNodeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `node-${Math.random().toString(36).slice(2, 10)}`
}

export function TableMap({ onTableClick, editable = false }: TableMapProps) {
  const tCommon = useTranslations('common')
  const { user } = useAuth()
  const { on, off, lastReadyPayload } = useSocket()
  const { toast } = useToast()
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Hooks para datos
  const { tables: supabaseTables, loading: tablesLoading } = useTables()
  const { layout: savedLayout, saveLayout: saveLayoutService, isLoading: layoutLoading } = useTableLayout({ createDefaultIfMissing: false })

  const [tables, setTables] = useState<Table[]>([])
  const [layout, setLayout] = useState<TableMapLayout | null>(null)
  const [baseline, setBaseline] = useState<LayoutSnapshot | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selection, setSelection] = useState<SelectionState>({ type: 'none' })
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [tableToAdd, setTableToAdd] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [visualZones, setVisualZones] = useState<ZoneShape[]>([])
  const [showZoneEditor, setShowZoneEditor] = useState(false)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 700, height: 440 })
  const [drawMode, setDrawMode] = useState<'none' | 'rectangle' | 'circle'>('none')
  const [isMounted, setIsMounted] = useState(false)

  const canEdit = user?.role === "admin" && editable

  // Helpers para acceder a la selección
  const selectedNodeId = selection.type === 'node' ? selection.id : null
  const selectedZoneId = selection.type === 'zone' ? selection.id : null
  const selectedZone = visualZones.find(z => z.id === selectedZoneId) || null

  // Asegurar que solo se renderice en el cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Canvas responsive - ajustar dimensiones al contenedor
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        // Mantener aspect ratio aproximado de 16:10, máximo 600px de alto
        const calculatedHeight = Math.min(600, containerWidth * 0.63)
        
        setCanvasDimensions({
          width: containerWidth,
          height: calculatedHeight
        })
      }
    }

    // Actualizar inmediatamente
    updateCanvasSize()

    // Usar ResizeObserver para actualizaciones en tiempo real
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Fallback con window resize (por compatibilidad)
    window.addEventListener('resize', updateCanvasSize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  const selectedNode = useMemo(
    () => layout?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [layout, selectedNodeId],
  )

  const selectedTable = useMemo(
    () => (selectedNode ? tables.find((table) => table.id === selectedNode.tableId) ?? null : null),
    [selectedNode, tables],
  )

  const usedTableIds = useMemo(
    () => new Set(layout?.nodes.map((node) => node.tableId) ?? []),
    [layout],
  )

  const availableTables = useMemo(
    () => tables.filter((table) => !usedTableIds.has(table.id)),
    [tables, usedTableIds],
  )

  // Cargar datos desde hooks cuando estén disponibles
  useEffect(() => {
    let cancelled = false
    
    const loadData = () => {
      if (tablesLoading || layoutLoading) {
        if (!cancelled) {
          setIsLoading(true)
        }
        return
      }
      
      // Convertir tablas de Supabase a formato legacy (compatible)
      const tablesData: Table[] = supabaseTables.map(t => ({
        id: t.id,
        number: t.number,
        zone_id: t.zone_id || undefined,
        zone: t.zone_id || undefined,
        status: t.status as Table["status"],
        seats: t.capacity,
        covers: {
          current: 0,
          total: 0,
          sessions: 0,
          lastUpdatedAt: null,
          lastSessionAt: null
        },
        qrcodeUrl: t.qrcode_url || undefined,
        qrToken: t.qr_token || undefined,
        qrTokenExpiry: t.qr_expires_at ? new Date(t.qr_expires_at) : undefined
      }))
      
      if (cancelled) return
      
      setTables(tablesData)
      
      if (savedLayout) {
        if (cancelled) return
        setLayout(savedLayout)
        // Cargar zonas visuales si existen
        if (savedLayout.visualZones) {
          setVisualZones(savedLayout.visualZones as ZoneShape[])
        }
        setBaseline({ layout: cloneLayout(savedLayout), tables: cloneTables(tablesData) })
        setHasUnsavedChanges(false)
      } else if (tablesData.length > 0) {
        // Crear layout por defecto simple si no hay guardado
        const defaultLayout: TableMapLayout = {
          zones: [],
          nodes: tablesData.map((table, index) => ({
            id: `node-${table.id}`,
            tableId: table.id,
            x: 50 + (index % 6) * 100,
            y: 50 + Math.floor(index / 6) * 80,
            width: 80,
            height: 60,
            shape: "rectangle" as const,
            zone: table.zone as string || "Sin Zona"
          }))
        }
        if (cancelled) return
        setLayout(defaultLayout)
        setBaseline({ layout: cloneLayout(defaultLayout), tables: cloneTables(tablesData) })
      }
      
      if (cancelled) return
      setIsLoading(false)
      setErrorMessage(null)
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [supabaseTables, savedLayout, tablesLoading, layoutLoading])

  useEffect(() => {
    const snapshot = getReadyTables(lastReadyPayload)
    if (!snapshot || snapshot.tables.length === 0) {
      return
    }
    if (isEditing || hasUnsavedChanges) {
      return
    }

    const nextLayout = snapshot.layout ? cloneLayout(snapshot.layout) : layout
    const nextTables = snapshot.tables.length ? cloneTables(snapshot.tables) : tables

    if (nextLayout) {
      setLayout(nextLayout)
    }
    if (nextTables) {
      setTables(nextTables)
    }
    if (nextLayout && nextTables) {
      setBaseline({ layout: cloneLayout(nextLayout), tables: cloneTables(nextTables) })
      setHasUnsavedChanges(false)
    }
  }, [hasUnsavedChanges, isEditing, lastReadyPayload, layout, tables])

  useEffect(() => {
    const handleTableUpdated = (payload: SocketEventPayload<"table.updated">) => {
      const table = deserializeTable(payload.table)
      setTables((current) => {
        const index = current.findIndex((item) => item.id === table.id)
        if (index === -1) {
          return current
        }
        const next = cloneTables(current)
        next[index] = table
        return next
      })
    }

    const handleLayoutUpdated = (payload: SocketEventPayload<"table.layout.updated">) => {
      if (isEditing || hasUnsavedChanges) {
        return
      }
      const nextLayout = deserializeTableLayout(payload.layout)
      const nextTables = payload.tables.map((table) => deserializeTable(table))
      setLayout(nextLayout)
      setTables(nextTables)
      setBaseline({ layout: cloneLayout(nextLayout), tables: cloneTables(nextTables) })
      setHasUnsavedChanges(false)
      setSelection({ type: 'none' })
    }

    on("table.updated", handleTableUpdated)
    on("table.layout.updated", handleLayoutUpdated)

    return () => {
      off("table.updated", handleTableUpdated)
      off("table.layout.updated", handleLayoutUpdated)
    }
  }, [hasUnsavedChanges, isEditing, off, on])

  const markDirty = useCallback(() => setHasUnsavedChanges(true), [])

  // Generar ID único para zonas
  const generateZoneId = useCallback(() => 
    `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  )

  // ============================================================================
  // ZONE MANAGEMENT
  // ============================================================================

  // Callback para cuando el ZoneDrawingLayer crea una nueva zona
  const handleZoneCreated = useCallback((zone: VisualZone) => {
    setVisualZones([...visualZones, zone])
    markDirty()
    logger.info('[TableMap] Zone created', { zoneId: zone.id, zoneName: zone.name })
  }, [visualZones, markDirty])

  // Actualizar zona
  const updateZone = useCallback((updates: Partial<ZoneShape>) => {
    if (!selectedZoneId) return

    setVisualZones(
      visualZones.map(z => z.id === selectedZoneId ? { ...z, ...updates } : z)
    )
    markDirty()
  }, [selectedZoneId, visualZones, markDirty])

  // Eliminar zona
  const deleteZone = useCallback(() => {
    if (!selectedZoneId) return

    setVisualZones(visualZones.filter(z => z.id !== selectedZoneId))
    setSelection({ type: 'none' })
    markDirty()
  }, [selectedZoneId, visualZones, markDirty])

  // Manejar arrastre de zona
  const handleZoneDragEnd = useCallback((zoneId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x()
    const newY = e.target.y()

    setVisualZones(
      visualZones.map(z => z.id === zoneId ? { ...z, x: newX, y: newY } : z)
    )
    markDirty()
  }, [visualZones, markDirty])

  const handleNodeDragEnd = useCallback(
    (nodeId: string, event: Konva.KonvaEventObject<DragEvent>) => {
      if (!isEditing || !layout) return

      setLayout((current) => {
        if (!current) return current
        const next = cloneLayout(current)
        const node = next.nodes.find((item) => item.id === nodeId)
        if (!node) return current
        node.x = Math.round(event.target.x())
        node.y = Math.round(event.target.y())
        
        // Auto-asignar zona basado en posición
        const assignedZone = findZoneForPoint(node.x + node.width / 2, node.y + node.height / 2)
        if (assignedZone) {
          node.zone = assignedZone.name
        }
        
        return next
      })

      markDirty()
    },
    [isEditing, layout, markDirty],
  )

  // Detectar si un punto está dentro de una zona visual
  const findZoneForPoint = useCallback((x: number, y: number): ZoneShape | null => {
    for (const zone of visualZones) {
      if (zone.type === 'rectangle' && zone.width && zone.height) {
        if (x >= zone.x && x <= zone.x + zone.width &&
            y >= zone.y && y <= zone.y + zone.height) {
          return zone
        }
      } else if (zone.type === 'circle' && zone.radius) {
        const distance = Math.sqrt(
          Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2)
        )
        if (distance <= zone.radius) {
          return zone
        }
      }
    }
    return null
  }, [visualZones])

  const handleTableClickInternal = useCallback(
    (table: Table) => {
      if (isEditing) return
      onTableClick?.(table)
    },
    [isEditing, onTableClick],
  )

  const handleStagePointerDown = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isEditing) return
    
    // Nota: El manejo de dibujo de zonas ahora lo hace ZoneDrawingLayer
    // Aquí solo manejamos la deselección cuando se hace clic en el fondo
    
    // Si hace clic en el stage (fondo), deseleccionar
    if (event.target === event.target.getStage()) {
      setSelection({ type: 'none' })
    }
  }, [isEditing])

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<TableMapLayout["nodes"][number]>) => {
      setLayout((current) => {
        if (!current) return current
        const next = cloneLayout(current)
        const node = next.nodes.find((item) => item.id === nodeId)
        if (!node) return current
        Object.assign(node, updates)
        return next
      })
      markDirty()
    },
    [markDirty],
  )

  const updateTable = useCallback(
    (tableId: string, updates: Partial<Table>) => {
      setTables((current) => {
        const next = cloneTables(current)
        const table = next.find((item) => item.id === tableId)
        if (!table) return current
        Object.assign(table, updates)
        return next
      })
      markDirty()
    },
    [markDirty],
  )

  const addTableToLayout = useCallback(() => {
    if (!layout || !tableToAdd) return

    const table = tables.find((item) => item.id === tableToAdd)
    if (!table) return

    const newNodeId = generateNodeId()

    setLayout((current) => {
      if (!current) return current
      const next = cloneLayout(current)
      const defaultZone = next.zones[0]?.id ?? "general"
      const offsetIndex = next.nodes.length
      next.nodes.push({
        id: newNodeId,
        tableId: table.id,
        x: 80 + ((offsetIndex * 36) % 360),
        y: 80 + ((offsetIndex * 48) % 240),
        width: DEFAULT_NODE_DIMENSIONS.width,
        height: DEFAULT_NODE_DIMENSIONS.height,
        shape: "rectangle",
        zone: defaultZone,
      })
      return next
    })

    setTableToAdd(null)
    setSelection({ type: 'node', id: newNodeId })
    markDirty()
  }, [layout, markDirty, tableToAdd, tables])

  const removeNode = useCallback(
    (nodeId: string) => {
      setLayout((current) => {
        if (!current) return current
        const next = cloneLayout(current)
        next.nodes = next.nodes.filter((node) => node.id !== nodeId)
        return next
      })
      setSelection((current) => (current.type === 'node' && current.id === nodeId ? { type: 'none' } : current))
      markDirty()
    },
    [markDirty],
  )

  const resetChanges = useCallback(() => {
    if (!baseline) return
    setLayout(cloneLayout(baseline.layout))
    setTables(cloneTables(baseline.tables))
    setSelection({ type: 'none' })
    setHasUnsavedChanges(false)
  }, [baseline])

  // Navegación por teclado (accesibilidad)
  useEffect(() => {
    if (!isEditing || !selectedNodeId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo actuar si no estamos en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const delta = e.shiftKey ? 10 : 1 // Shift para mover más rápido
      let handled = false

      switch (e.key) {
        case 'ArrowUp':
          updateNode(selectedNodeId, { y: (selectedNode?.y ?? 0) - delta })
          handled = true
          break
        case 'ArrowDown':
          updateNode(selectedNodeId, { y: (selectedNode?.y ?? 0) + delta })
          handled = true
          break
        case 'ArrowLeft':
          updateNode(selectedNodeId, { x: (selectedNode?.x ?? 0) - delta })
          handled = true
          break
        case 'ArrowRight':
          updateNode(selectedNodeId, { x: (selectedNode?.x ?? 0) + delta })
          handled = true
          break
        case 'Delete':
        case 'Backspace':
          removeNode(selectedNodeId)
          handled = true
          break
        case 'Escape':
          setSelection({ type: 'none' })
          handled = true
          break
      }

      if (handled) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, selectedNodeId, selectedNode, updateNode, removeNode])

  const saveLayout = useCallback(async () => {
    if (!layout) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      // Incluir zonas visuales en el layout
      const layoutToSave = {
        ...layout,
        visualZones
      }
      
      // Guardar usando el servicio de layouts
      const success = await saveLayoutService(layoutToSave)
      
      if (success) {
        const newBaseline: LayoutSnapshot = {
          layout: cloneLayout(layoutToSave),
          tables: cloneTables(tables),
        }
        setBaseline(newBaseline)
        setHasUnsavedChanges(false)
        setIsEditing(false)
        toast({
          title: "Layout guardado",
          description: "El layout se guardó correctamente en Supabase",
        })
      } else {
        throw new Error("Save failed")
      }
    } catch (error) {
      logger.error("[TableMap] Failed to persist layout", error instanceof Error ? error : new Error(String(error)))
      setErrorMessage("No se pudo guardar el layout. Intenta nuevamente.")
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el layout. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [layout, visualZones, tables, saveLayoutService, toast])

  if (isLoading || !layout) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // No renderizar Stage hasta que el componente esté montado en el cliente
  if (!isMounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Modo {isEditing ? "Edición" : "Vista"}</Badge>
            {hasUnsavedChanges && <Badge variant="secondary">Cambios sin guardar</Badge>}
            {isSaving && <LoadingSpinner size="sm" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edición
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => setShowZoneEditor(!showZoneEditor)} 
                  variant={showZoneEditor ? "default" : "outline"} 
                  size="sm"
                >
                  <Square className="mr-2 h-4 w-4" />
                  {showZoneEditor ? "Ocultar" : "Diseñar"} Zonas
                </Button>
                <Button onClick={resetChanges} variant="outline" size="sm" disabled={isSaving}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Deshacer cambios
                </Button>
                <Button onClick={saveLayout} size="sm" disabled={isSaving || !hasUnsavedChanges}>
                  {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? tCommon('saving') : tCommon('save')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {errorMessage ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel de controles de zonas (columna izquierda cuando está activo) */}
        {isEditing && showZoneEditor && (
          <div className="lg:col-span-1 space-y-4">
            {/* Herramientas de dibujo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Herramientas de Zona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dibujar nueva zona</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={drawMode === 'rectangle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDrawMode(drawMode === 'rectangle' ? 'none' : 'rectangle')}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Rectángulo
                    </Button>
                    <Button
                      variant={drawMode === 'circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDrawMode(drawMode === 'circle' ? 'none' : 'circle')}
                    >
                      <CircleIcon className="mr-2 h-4 w-4" />
                      Circular
                    </Button>
                  </div>
                  {drawMode !== 'none' && (
                    <p className="text-xs text-muted-foreground">
                      Haz clic y arrastra en el canvas para dibujar la zona. Presiona ESC para cancelar.
                    </p>
                  )}
                </div>

                {/* Editor de zona seleccionada */}
                {selectedZone && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">{tCommon('editZone')}</Label>
                      <Badge variant="secondary">{selectedZone.name}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zone-name">Nombre</Label>
                      <Input
                        id="zone-name"
                        value={selectedZone.name}
                        onChange={(e) => updateZone({ name: e.target.value })}
                        placeholder="Nombre de la zona"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={selectedZone.fill}
                        onValueChange={(fill) => {
                          const color = ZONE_COLORS.find(c => c.fill === fill)
                          if (color) {
                            updateZone({ fill: color.fill, stroke: color.stroke })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ZONE_COLORS.map((color) => (
                            <SelectItem key={color.fill} value={color.fill}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color.fill }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedZone.type === 'rectangle' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="zone-width">Ancho</Label>
                          <Input
                            id="zone-width"
                            type="number"
                            min={50}
                            value={Math.round(selectedZone.width || 0)}
                            onChange={(e) => updateZone({ width: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zone-height">Alto</Label>
                          <Input
                            id="zone-height"
                            type="number"
                            min={50}
                            value={Math.round(selectedZone.height || 0)}
                            onChange={(e) => updateZone({ height: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}

                    {selectedZone.type === 'circle' && (
                      <div className="space-y-2">
                        <Label htmlFor="zone-radius">Radio</Label>
                        <Input
                          id="zone-radius"
                          type="number"
                          min={25}
                          value={Math.round(selectedZone.radius || 0)}
                          onChange={(e) => updateZone({ radius: Number(e.target.value) })}
                        />
                      </div>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteZone}
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tCommon('deleteZone')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de zonas */}
            {visualZones.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Zonas Creadas ({visualZones.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visualZones.map((zone) => (
                      <div
                        key={zone.id}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-accent ${
                          selectedZoneId === zone.id ? 'bg-accent border-primary' : ''
                        }`}
                        onClick={() => setSelection({ type: 'zone', id: zone.id })}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: zone.fill }}
                          />
                          <span className="text-sm font-medium">{zone.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {zone.type === 'rectangle' ? 'Rectángulo' : 'Circular'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Mapa principal */}
        <div className={isEditing && showZoneEditor ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardContent className="p-6">
              <div 
                ref={containerRef} 
                className="overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900"
                role="application"
                aria-label="Mapa interactivo del salón del restaurante"
                aria-describedby="canvas-instructions"
              >
                {/* Instrucciones para screen readers */}
                <div id="canvas-instructions" className="sr-only">
                  {isEditing 
                    ? tCommon('editModeInstructions')
                    : "Mapa visual de las mesas del restaurante. Haz clic en una mesa para ver más detalles."
                  }
                </div>
                {/* Solo renderizar Stage cuando esté montado en el cliente */}
                {isMounted && (
                  <Stage
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    ref={stageRef}
                    onMouseDown={handleStagePointerDown}
                    className={
                      drawMode !== 'none' ? "cursor-crosshair" : 
                      isEditing ? "cursor-move" : "cursor-pointer"
                    }
                  >
                  {/* Layer de zonas visuales de fondo */}
                  <Layer>
                    {/* Renderizar zonas visuales de fondo */}
                    {visualZones.map((zone) => (
                      <Group 
                        key={zone.id} 
                        draggable={showZoneEditor && selectedZoneId === zone.id}
                        onDragEnd={(e) => handleZoneDragEnd(zone.id, e)}
                        onClick={() => showZoneEditor && setSelection({ type: 'zone', id: zone.id })}
                        onTap={() => showZoneEditor && setSelection({ type: 'zone', id: zone.id })}
                      >
                        {zone.type === 'rectangle' && zone.width && zone.height && (
                          <Rect
                            x={zone.x}
                            y={zone.y}
                            width={zone.width}
                            height={zone.height}
                            fill={zone.fill}
                            stroke={zone.stroke}
                            strokeWidth={selectedZoneId === zone.id ? 3 : 2}
                            opacity={zone.opacity}
                            cornerRadius={8}
                            dash={selectedZoneId === zone.id ? [5, 5] : undefined}
                          />
                        )}
                        {zone.type === 'circle' && zone.radius && (
                          <Circle
                            x={zone.x}
                            y={zone.y}
                            radius={zone.radius}
                            fill={zone.fill}
                            stroke={zone.stroke}
                            strokeWidth={selectedZoneId === zone.id ? 3 : 2}
                            opacity={zone.opacity}
                            dash={selectedZoneId === zone.id ? [5, 5] : undefined}
                          />
                        )}
                        <Text
                          x={zone.x + (zone.type === 'rectangle' ? 10 : -30)}
                          y={zone.y + 10}
                          text={zone.name}
                          fontSize={14}
                          fontStyle="bold"
                          fill={zone.stroke}
                        />
                      </Group>
                    ))}
                  </Layer>

                  {/* Layer separado para dibujo de nuevas zonas */}
                  {showZoneEditor && (
                    <ZoneDrawingLayer
                      isActive={drawMode !== 'none'}
                      drawMode={drawMode}
                      existingZonesCount={visualZones.length}
                      canvasWidth={canvasDimensions.width}
                      canvasHeight={canvasDimensions.height}
                      onZoneCreated={handleZoneCreated}
                      onDrawModeChange={setDrawMode}
                    />
                  )}

                  {/* Layer de contenido principal (zonas legacy y mesas) */}
                  <Layer>
                    {/* Zonas legacy (las antiguas del layout) */}
                    {layout.zones.map((zone) => {
                      const zoneNodes = layout.nodes.filter((node) => node.zone === zone.id)
                      if (zoneNodes.length === 0) return null

                      const minX = Math.min(...zoneNodes.map((n) => n.x)) - 24
                      const maxX = Math.max(...zoneNodes.map((n) => n.x + n.width)) + 24
                      const minY = Math.min(...zoneNodes.map((n) => n.y)) - 24
                      const maxY = Math.max(...zoneNodes.map((n) => n.y + n.height)) + 24

                      return (
                        <Group key={zone.id} listening={false}>
                          <Rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill={zone.color} opacity={0.25} cornerRadius={10} />
                          <Text x={minX + 12} y={minY + 8} text={zone.name} fontSize={12} fill="#475569" fontStyle="bold" />
                        </Group>
                      )
                    })}

                    {/* Mesas */}
                    {layout.nodes.map((node) => {
                      const table = tables.find((item) => item.id === node.tableId)
                      if (!table) return null

                      const color = TABLE_STATE_COLORS[table.status]
                      const isSelected = selectedNodeId === node.id

                      return (
                        <Group
                          key={node.id}
                          x={node.x}
                          y={node.y}
                          draggable={isEditing}
                          onDragEnd={(event) => handleNodeDragEnd(node.id, event)}
                          onClick={() => {
                            if (isEditing) {
                              setSelection(isSelected ? { type: 'none' } : { type: 'node', id: node.id })
                            } else {
                              handleTableClickInternal(table)
                            }
                          }}
                          onTap={() => {
                            if (isEditing) {
                              setSelection(isSelected ? { type: 'none' } : { type: 'node', id: node.id })
                            } else {
                              handleTableClickInternal(table)
                            }
                          }}
                        >
                          {node.shape === "rectangle" ? (
                            <Rect
                              width={node.width}
                              height={node.height}
                              fill={color}
                              stroke={isSelected ? "#2563eb" : "#1e293b"}
                              strokeWidth={isSelected ? 4 : 1}
                              cornerRadius={6}
                              shadowBlur={isEditing ? 6 : 0}
                              shadowColor="black"
                              shadowOpacity={0.3}
                            />
                          ) : (
                            <Circle
                              x={node.width / 2}
                              y={node.height / 2}
                              radius={Math.min(node.width, node.height) / 2}
                              fill={color}
                              stroke={isSelected ? "#2563eb" : "#1e293b"}
                              strokeWidth={isSelected ? 4 : 1}
                              shadowBlur={isEditing ? 6 : 0}
                              shadowColor="black"
                              shadowOpacity={0.3}
                            />
                          )}
                          <Text
                            x={node.width / 2}
                            y={node.height / 2}
                            text={`Mesa ${table.number}`}
                            fontSize={14}
                            fontStyle="bold"
                            fill="white"
                            align="center"
                            verticalAlign="middle"
                            offsetX={node.width / 2}
                            offsetY={8}
                          />
                          {table.seats ? (
                            <Text
                              x={node.width / 2}
                              y={node.height / 2 + 16}
                              text={`${table.seats} pax`}
                              fontSize={12}
                              fill="white"
                              align="center"
                              verticalAlign="middle"
                              offsetX={node.width / 2}
                              offsetY={8}
                            />
                          ) : null}
                        </Group>
                      )
                    })}
                  </Layer>
                </Stage>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leyenda de estados */}
      {!showZoneEditor && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Leyenda de Estados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(TABLE_STATE_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: color }} />
                  <span className="text-sm">{TABLE_STATE_LABELS[status as Table["status"]]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel de controles de mesa (cuando hay una seleccionada) */}
      {isEditing && !showZoneEditor && (
        <TableMapControls
          selectedNode={selectedNode}
          selectedTable={selectedTable}
          availableTables={availableTables}
          tableToAdd={tableToAdd}
          layout={layout}
          allTables={tables}
          isSaving={isSaving}
          onTableToAddChange={setTableToAdd}
          onAddTable={addTableToLayout}
          onUpdateNode={updateNode}
          onUpdateTable={updateTable}
          onRemoveNode={removeNode}
        />
      )}
    </div>
  )
}
