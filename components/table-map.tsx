"use client"

import { useRef, useState } from "react"
import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva"
import type Konva from "konva"
import { MOCK_TABLES, MOCK_TABLE_LAYOUT, TABLE_STATUS_COLORS, type Table, type TableMapLayout } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Save } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { LoadingSpinner } from "@/components/loading-spinner"

interface TableMapProps {
  onTableClick?: (table: Table) => void
  editable?: boolean
}

export function TableMap({ onTableClick, editable = false }: TableMapProps) {
  const { user } = useAuth()
  const { emit } = useSocket()
  const [layout, setLayout] = useState<TableMapLayout>(MOCK_TABLE_LAYOUT)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const stageRef = useRef<Konva.Stage>(null)

  const canEdit = user?.role === "admin" && editable

  const handleNodeDragEnd = (nodeId: string, event: Konva.KonvaEventObject<DragEvent>) => {
    if (!isEditing) return

    const newLayout = {
      ...layout,
      nodes: layout.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              x: event.target.x(),
              y: event.target.y(),
            }
          : node,
      ),
    }
    setLayout(newLayout)
  }

  const handleTableClick = (table: Table) => {
    if (isEditing) return
    onTableClick?.(table)
  }

  const saveLayout = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Saving table layout:", layout)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Emit real-time update
      emit("table.layout.updated", { layout, timestamp: new Date().toISOString() })

      setIsEditing(false)
    } catch (error) {
      console.error("[v0] Error saving layout:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Modo {isEditing ? "EdiciÃ³n" : "Vista"}</Badge>
            {isLoading && <LoadingSpinner size="sm" />}
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar Layout
              </Button>
            ) : (
              <Button onClick={saveLayout} size="sm" disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(TABLE_STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-sm capitalize">{status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-6">
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Stage width={600} height={400} ref={stageRef}>
              <Layer>
                {/* Zone backgrounds */}
                {layout.zones.map((zone) => {
                  const zoneNodes = layout.nodes.filter((node) => node.zone === zone.id)
                  if (zoneNodes.length === 0) return null

                  const minX = Math.min(...zoneNodes.map((n) => n.x)) - 20
                  const maxX = Math.max(...zoneNodes.map((n) => n.x + n.width)) + 20
                  const minY = Math.min(...zoneNodes.map((n) => n.y)) - 20
                  const maxY = Math.max(...zoneNodes.map((n) => n.y + n.height)) + 20

                  return (
                    <Group key={zone.id}>
                      <Rect
                        x={minX}
                        y={minY}
                        width={maxX - minX}
                        height={maxY - minY}
                        fill={zone.color}
                        opacity={0.3}
                        cornerRadius={8}
                      />
                      <Text x={minX + 10} y={minY + 5} text={zone.name} fontSize={12} fill="#666" fontStyle="bold" />
                    </Group>
                  )
                })}

                {/* Tables */}
                {layout.nodes.map((node) => {
                  const table = MOCK_TABLES.find((t) => t.id === node.tableId)
                  if (!table) return null

                  const color = TABLE_STATUS_COLORS[table.status]
                  const isSelected = selectedNodeId === node.id

                  return (
                    <Group
                      key={node.id}
                      x={node.x}
                      y={node.y}
                      draggable={isEditing}
                      onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
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
                          stroke={isSelected ? "#000" : "#333"}
                          strokeWidth={isSelected ? 3 : 1}
                          cornerRadius={4}
                          shadowBlur={isEditing ? 5 : 0}
                          shadowColor="black"
                          shadowOpacity={0.3}
                        />
                      ) : (
                        <Circle
                          x={node.width / 2}
                          y={node.height / 2}
                          radius={Math.min(node.width, node.height) / 2}
                          fill={color}
                          stroke={isSelected ? "#000" : "#333"}
                          strokeWidth={isSelected ? 3 : 1}
                          shadowBlur={isEditing ? 5 : 0}
                          shadowColor="black"
                          shadowOpacity={0.3}
                        />
                      )}
                      <Text
                        x={node.width / 2}
                        y={node.height / 2}
                        text={table.number.toString()}
                        fontSize={16}
                        fontStyle="bold"
                        fill="white"
                        align="center"
                        verticalAlign="middle"
                        offsetX={8}
                        offsetY={8}
                      />
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
          <CardHeader>
            <CardTitle className="text-sm">Instrucciones de EdiciÃ³n</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>â€¢ Arrastra las mesas para reposicionarlas</li>
              <li>â€¢ Haz clic en una mesa para seleccionarla</li>
              <li>â€¢ Guarda los cambios cuando termines</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


