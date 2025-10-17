"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import type { SocketEventPayload } from "@/lib/socket"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Edit, Plus, Save, Trash, Undo2 } from "lucide-react"

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
  const { user } = useAuth()
  const { on, off, lastReadyPayload } = useSocket()
  const { toast } = useToast()
  const stageRef = useRef<Konva.Stage>(null)
  
  // Hooks para datos
  const { tables: supabaseTables, loading: tablesLoading } = useTables()
  const { layout: savedLayout, saveLayout: saveLayoutService, isLoading: layoutLoading } = useTableLayout({ createDefaultIfMissing: false })

  const [tables, setTables] = useState<Table[]>([])
  const [layout, setLayout] = useState<TableMapLayout | null>(null)
  const [baseline, setBaseline] = useState<LayoutSnapshot | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [tableToAdd, setTableToAdd] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canEdit = user?.role === "admin" && editable

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
    if (tablesLoading || layoutLoading) {
      setIsLoading(true)
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
    
    setTables(tablesData)
    
    if (savedLayout) {
      setLayout(savedLayout)
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
      setLayout(defaultLayout)
      setBaseline({ layout: cloneLayout(defaultLayout), tables: cloneTables(tablesData) })
    }
    
    setIsLoading(false)
    setErrorMessage(null)
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
      setSelectedNodeId(null)
    }

    on("table.updated", handleTableUpdated)
    on("table.layout.updated", handleLayoutUpdated)

    return () => {
      off("table.updated", handleTableUpdated)
      off("table.layout.updated", handleLayoutUpdated)
    }
  }, [hasUnsavedChanges, isEditing, off, on])

  const markDirty = useCallback(() => setHasUnsavedChanges(true), [])

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
        return next
      })

      markDirty()
    },
    [isEditing, layout, markDirty],
  )

  const handleTableClickInternal = useCallback(
    (table: Table) => {
      if (isEditing) return
      onTableClick?.(table)
    },
    [isEditing, onTableClick],
  )

  const handleStagePointerDown = useCallback((event: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isEditing) return
    if (event.target === event.target.getStage()) {
      setSelectedNodeId(null)
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
    setSelectedNodeId(newNodeId)
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
      setSelectedNodeId((current) => (current === nodeId ? null : current))
      markDirty()
    },
    [markDirty],
  )

  const resetChanges = useCallback(() => {
    if (!baseline) return
    setLayout(cloneLayout(baseline.layout))
    setTables(cloneTables(baseline.tables))
    setSelectedNodeId(null)
    setHasUnsavedChanges(false)
  }, [baseline])

  const saveLayout = useCallback(async () => {
    if (!layout) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      // Guardar usando el servicio de layouts
      const success = await saveLayoutService(layout)
      
      if (success) {
        const newBaseline: LayoutSnapshot = {
          layout: cloneLayout(layout),
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
      console.error("[TableMap] Failed to persist layout", error)
      setErrorMessage("No se pudo guardar el layout. Intenta nuevamente.")
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el layout. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [layout, tables, saveLayoutService, toast])

  if (isLoading || !layout) {
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
            <Badge variant="outline">Modo {isEditing ? "Edicion" : "Vista"}</Badge>
            {hasUnsavedChanges && <Badge variant="secondary">Cambios sin guardar</Badge>}
            {isSaving && <LoadingSpinner size="sm" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Editar layout
              </Button>
            ) : (
              <>
                <Button onClick={resetChanges} variant="outline" size="sm" disabled={isSaving}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Deshacer cambios
                </Button>
                <Button onClick={saveLayout} size="sm" disabled={isSaving || !hasUnsavedChanges}>
                  {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "Guardando..." : "Guardar"}
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Leyenda</CardTitle>
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

      <Card>
        <CardContent className="p-6">
          <div className="overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900">
            <Stage
              width={700}
              height={440}
              ref={stageRef}
              onMouseDown={handleStagePointerDown}
              className={isEditing ? "cursor-move" : "cursor-pointer"}
            >
              <Layer>
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
                          setSelectedNodeId(isSelected ? null : node.id)
                        } else {
                          handleTableClickInternal(table)
                        }
                      }}
                      onTap={() => {
                        if (isEditing) {
                          setSelectedNodeId(isSelected ? null : node.id)
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
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Herramientas de edicion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="add-table">Agregar mesa existente</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={tableToAdd ?? undefined} onValueChange={(value) => setTableToAdd(value === "none" ? null : value)}>
                  <SelectTrigger id="add-table" className="w-48">
                    <SelectValue placeholder={availableTables.length ? "Seleccionar mesa" : "Sin mesas libres"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Todas las mesas estan ubicadas
                      </SelectItem>
                    ) : (
                      availableTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          Mesa {table.number} ({table.seats ?? "-"} pax)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={addTableToLayout} disabled={!tableToAdd || isSaving}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>

            {selectedNode && selectedTable ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="table-number">Numero de mesa</Label>
                  <Input
                    id="table-number"
                    type="number"
                    min={1}
                    value={selectedTable.number}
                    onChange={(event) => {
                      const parsed = Number(event.target.value)
                      if (Number.isNaN(parsed)) return
                      updateTable(selectedTable.id, { number: String(Math.max(1, parsed)) })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table-seats">Capacidad (personas)</Label>
                  <Input
                    id="table-seats"
                    type="number"
                    min={1}
                    value={selectedTable.seats ?? ""}
                    placeholder="Ej: 4"
                    onChange={(event) => {
                      if (!event.target.value) {
                        updateTable(selectedTable.id, { seats: undefined })
                        return
                      }
                      const parsed = Number(event.target.value)
                      if (Number.isNaN(parsed)) return
                      updateTable(selectedTable.id, { seats: Math.max(1, parsed) })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma</Label>
                  <ToggleGroup
                    type="single"
                    value={selectedNode.shape}
                    onValueChange={(value) => value && updateNode(selectedNode.id, { shape: value as "rectangle" | "circle" })}
                  >
                    <ToggleGroupItem value="rectangle">Rectangular</ToggleGroupItem>
                    <ToggleGroupItem value="circle">Redonda</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-2">
                  <Label>Zona</Label>
                  <Select
                    value={selectedNode.zone}
                    onValueChange={(zoneId) => {
                      updateNode(selectedNode.id, { zone: zoneId })
                      const zoneName = layout.zones.find((zone) => zone.id === zoneId)?.name
                      if (zoneName) {
                        updateTable(selectedTable.id, { zone: zoneName })
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {layout.zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table-width">Ancho (px)</Label>
                  <Input
                    id="table-width"
                    type="number"
                    min={40}
                    value={selectedNode.width}
                    onChange={(event) => {
                      const parsed = Number(event.target.value)
                      if (Number.isNaN(parsed)) return
                      updateNode(selectedNode.id, { width: Math.max(40, parsed) })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table-height">Alto (px)</Label>
                  <Input
                    id="table-height"
                    type="number"
                    min={40}
                    value={selectedNode.height}
                    onChange={(event) => {
                      const parsed = Number(event.target.value)
                      if (Number.isNaN(parsed)) return
                      updateNode(selectedNode.id, { height: Math.max(40, parsed) })
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecciona una mesa para editar sus detalles o agrega una nueva desde la lista.
              </p>
            )}

            {selectedNode ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeNode(selectedNode.id)}
                  disabled={isSaving}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Quitar mesa del salon
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Consejos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>- Arrastra las mesas para reposicionarlas.</li>
              <li>- Ajusta forma, tamano y capacidad en el panel lateral.</li>
              <li>- Usa Guardar para sincronizar el nuevo layout con el equipo.</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
