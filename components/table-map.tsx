"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva"
import type Konva from "konva"
import {
  MOCK_TABLES,
  MOCK_TABLE_LAYOUT,
  type Table,
  type TableMapLayout,
} from "@/lib/mock-data"
import { TABLE_STATE_COLORS, TABLE_STATE_LABELS } from "@/lib/table-states"
import { useAuth } from "@/contexts/auth-context"
import { useSocket } from "@/hooks/use-socket"
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

const DEFAULT_NODE_DIMENSIONS = { width: 80, height: 60 }

type LayoutSnapshot = {
  layout: TableMapLayout
  tables: Table[]
}

function cloneLayoutFrom(source: TableMapLayout): TableMapLayout {
  return JSON.parse(JSON.stringify(source))
}

function cloneTablesFrom(source: Table[]): Table[] {
  return JSON.parse(JSON.stringify(source))
}

function cloneLayout(): TableMapLayout {
  return cloneLayoutFrom(MOCK_TABLE_LAYOUT)
}

function cloneTables(): Table[] {
  return cloneTablesFrom(MOCK_TABLES)
}

function generateNodeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `node-${Math.random().toString(36).slice(2, 8)}`
}

export function TableMap({ onTableClick, editable = false }: TableMapProps) {
  const { user } = useAuth()
  const { emit } = useSocket()
  const stageRef = useRef<Konva.Stage>(null)

  const [tables, setTables] = useState<Table[]>(() => cloneTables())
  const [layout, setLayout] = useState<TableMapLayout>(() => cloneLayout())
  const [baseline, setBaseline] = useState<LayoutSnapshot>(() => ({
    layout: cloneLayout(),
    tables: cloneTables(),
  }))
  const [isEditing, setIsEditing] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [tableToAdd, setTableToAdd] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const canEdit = user?.role === "admin" && editable

  const selectedNode = useMemo(
    () => layout.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [layout.nodes, selectedNodeId],
  )

  const selectedTable = useMemo(
    () => (selectedNode ? tables.find((table) => table.id === selectedNode.tableId) ?? null : null),
    [selectedNode, tables],
  )

  const usedTableIds = useMemo(() => new Set(layout.nodes.map((node) => node.tableId)), [layout.nodes])

  const availableTables = useMemo(
    () => tables.filter((table) => !usedTableIds.has(table.id)),
    [tables, usedTableIds],
  )

  const markDirty = useCallback(() => setHasUnsavedChanges(true), [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsInitialLoading(true)
      setFetchError(null)

      try {
        const response = await fetch("/api/table-layout", {
          headers: {
            "Cache-Control": "no-store",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to load layout: ${response.status}`)
        }

        const data = (await response.json()) as LayoutSnapshot
        if (cancelled) return

        const nextLayout = cloneLayoutFrom(data.layout)
        const nextTables = cloneTablesFrom(data.tables)

        setLayout(nextLayout)
        setTables(nextTables)
        setBaseline({ layout: nextLayout, tables: nextTables })
        setHasUnsavedChanges(false)
        setSelectedNodeId(null)
      } catch (error) {
        console.error("[table-map] Error loading layout", error)
        if (!cancelled) {
          setFetchError("No se pudo cargar el layout guardado. Se muestran los valores por defecto.")
          const fallbackLayout = cloneLayout()
          const fallbackTables = cloneTables()
          setLayout(fallbackLayout)
          setTables(fallbackTables)
          setBaseline({ layout: fallbackLayout, tables: fallbackTables })
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const handleNodeDragEnd = useCallback(
    (nodeId: string, event: Konva.KonvaEventObject<DragEvent>) => {
      if (!isEditing) return

      setLayout((current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                x: Math.round(event.target.x()),
                y: Math.round(event.target.y()),
              }
            : node,
        ),
      }))
      markDirty()
    },
    [isEditing, markDirty],
  )

  const handleTableClick = useCallback(
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

  const updateNode = useCallback((nodeId: string, updates: Partial<TableMapLayout["nodes"][number]>) => {
    setLayout((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
    }))
    markDirty()
  }, [markDirty])

  const updateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    setTables((current) => current.map((table) => (table.id === tableId ? { ...table, ...updates } : table)))
    markDirty()
  }, [markDirty])

  const addTableToLayout = useCallback(() => {
    if (!tableToAdd) return

    const table = tables.find((item) => item.id === tableToAdd)
    if (!table) return

    const newNodeId = generateNodeId()

    setLayout((current) => {
      const defaultZone = current.zones[0]?.id ?? "general"
      const offsetIndex = current.nodes.length
      const offsetX = 80 + ((offsetIndex * 36) % 360)
      const offsetY = 80 + ((offsetIndex * 48) % 240)

      return {
        ...current,
        nodes: [
          ...current.nodes,
          {
            id: newNodeId,
            tableId: table.id,
            x: offsetX,
            y: offsetY,
            width: DEFAULT_NODE_DIMENSIONS.width,
            height: DEFAULT_NODE_DIMENSIONS.height,
            shape: "rectangle",
            zone: defaultZone,
          },
        ],
      }
    })

    setSelectedNodeId(newNodeId)
    setTableToAdd(null)
    markDirty()
  }, [markDirty, tableToAdd, tables])

  const removeNode = useCallback((nodeId: string) => {
    setLayout((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== nodeId),
    }))
    setSelectedNodeId((current) => (current === nodeId ? null : current))
    markDirty()
  }, [markDirty])

  const resetChanges = useCallback(() => {
    setTables(cloneTablesFrom(baseline.tables))
    setLayout(cloneLayoutFrom(baseline.layout))
    setSelectedNodeId(null)
    setHasUnsavedChanges(false)
  }, [baseline.layout, baseline.tables])

  const saveLayout = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const payload: LayoutSnapshot = {
        layout,
        tables,
      }

      const response = await fetch("/api/table-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to persist layout: ${response.status}`)
      }

      const data = (await response.json()) as LayoutSnapshot
      const persistedLayout = cloneLayoutFrom(data.layout)
      const persistedTables = cloneTablesFrom(data.tables)

      setLayout(persistedLayout)
      setTables(persistedTables)
      setBaseline({ layout: persistedLayout, tables: persistedTables })
      setHasUnsavedChanges(false)
      setIsEditing(false)

      emit("table.layout.updated", {
        layout: persistedLayout,
        tables: persistedTables,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[table-map] Error saving layout", error)
      setFetchError("No se pudo guardar el layout. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }, [emit, layout, tables])

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Modo {isEditing ? "Edicion" : "Vista"}</Badge>
            {hasUnsavedChanges && <Badge variant="secondary">Cambios sin guardar</Badge>}
            {isLoading && <LoadingSpinner size="sm" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" disabled={isInitialLoading}>
                <Edit className="mr-2 h-4 w-4" />
                Editar layout
              </Button>
            ) : (
              <>
                <Button onClick={resetChanges} variant="outline" size="sm" disabled={isLoading}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Deshacer cambios
                </Button>
                <Button onClick={saveLayout} size="sm" disabled={isLoading || !hasUnsavedChanges}>
                  {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {fetchError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {fetchError}
        </div>
      )}

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
          {isInitialLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
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
                        <Rect
                          x={minX}
                          y={minY}
                          width={maxX - minX}
                          height={maxY - minY}
                          fill={zone.color}
                          opacity={0.25}
                          cornerRadius={10}
                        />
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
                            handleTableClick(table)
                          }
                        }}
                        onTap={() => {
                          if (isEditing) {
                            setSelectedNodeId(isSelected ? null : node.id)
                          } else {
                            handleTableClick(table)
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
          )}
        </CardContent>
      </Card>

      {isEditing && !isInitialLoading && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Herramientas de edicion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="add-table">Agregar mesa existente</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={tableToAdd ?? undefined}
                  onValueChange={(value) => setTableToAdd(value === "none" ? null : value)}
                >
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
                <Button
                  type="button"
                  size="sm"
                  onClick={addTableToLayout}
                  disabled={!tableToAdd || isLoading}
                >
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
                      const value = event.target.value
                      if (!value) {
                        return
                      }

                      const parsed = Number(value)
                      if (Number.isNaN(parsed)) {
                        return
                      }

                      updateTable(selectedTable.id, { number: Math.max(1, parsed) })
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
                      const value = event.target.value
                      if (!value) {
                        updateTable(selectedTable.id, { seats: undefined })
                        return
                      }

                      const parsed = Number(value)
                      if (Number.isNaN(parsed)) {
                        return
                      }

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
                      if (Number.isNaN(parsed)) {
                        return
                      }

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
                      if (Number.isNaN(parsed)) {
                        return
                      }

                      updateNode(selectedNode.id, { height: Math.max(40, parsed) })
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecciona una mesa para ver sus detalles o agrega una nueva desde la lista.
              </p>
            )}

            {selectedNode && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeNode(selectedNode.id)}
                  disabled={isLoading}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Quitar mesa del salon
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isEditing && !isInitialLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Consejos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>- Arrastra las mesas para reposicionarlas.</li>
              <li>- Ajusta forma, tamano y capacidad en el panel lateral.</li>
              <li>- Usa Guardar para compartir el nuevo layout con el equipo.</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
