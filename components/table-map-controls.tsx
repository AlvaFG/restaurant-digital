"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash, Plus, Info, AlertCircle } from "lucide-react"
import type { Table, TableMapLayout } from "@/lib/mock-data"

interface TableMapControlsProps {
  // Selección actual
  selectedNode: TableMapLayout["nodes"][0] | null
  selectedTable: Table | null
  
  // Mesas disponibles
  availableTables: Table[]
  tableToAdd: string | null
  
  // Layout actual
  layout: TableMapLayout
  
  // Todas las mesas (para validación)
  allTables?: Table[]
  
  // Estado
  isSaving: boolean
  
  // Callbacks
  onTableToAddChange: (tableId: string | null) => void
  onAddTable: () => void
  onUpdateNode: (nodeId: string, updates: Partial<TableMapLayout["nodes"][0]>) => void
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void
  onRemoveNode: (nodeId: string) => void
}

export function TableMapControls({
  selectedNode,
  selectedTable,
  availableTables,
  tableToAdd,
  layout,
  allTables = [],
  isSaving,
  onTableToAddChange,
  onAddTable,
  onUpdateNode,
  onUpdateTable,
  onRemoveNode,
}: TableMapControlsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validar número de mesa
  const validateTableNumber = (value: string, currentTableId: string): string | null => {
    if (!value || value.trim() === '') {
      return "El número de mesa es requerido"
    }

    // Validar formato (letras, números y guiones)
    if (!/^[A-Z0-9-]+$/i.test(value)) {
      return "Solo se permiten letras, números y guiones"
    }

    // Validar unicidad
    const isDuplicate = allTables.some(
      table => table.number.toLowerCase() === value.toLowerCase() && table.id !== currentTableId
    )
    
    if (isDuplicate) {
      return `Ya existe una mesa con el número "${value}"`
    }

    return null
  }

  // Validar dimensiones
  const validateDimension = (value: number, min: number, max: number, name: string): string | null => {
    if (isNaN(value)) {
      return `${name} debe ser un número válido`
    }
    if (value < min) {
      return `${name} debe ser al menos ${min}px`
    }
    if (value > max) {
      return `${name} no puede exceder ${max}px`
    }
    return null
  }

  const handleTableNumberChange = (value: string) => {
    if (!selectedTable) return

    const error = validateTableNumber(value, selectedTable.id)
    
    if (error) {
      setErrors(prev => ({ ...prev, tableNumber: error }))
    } else {
      setErrors(prev => {
        const next = { ...prev }
        delete next.tableNumber
        return next
      })
      onUpdateTable(selectedTable.id, { number: value })
    }
  }

  const handleDimensionChange = (
    dimension: 'width' | 'height',
    value: string
  ) => {
    if (!selectedNode) return

    const parsed = Number(value)
    const error = validateDimension(
      parsed,
      40,
      200,
      dimension === 'width' ? 'Ancho' : 'Alto'
    )

    if (error) {
      setErrors(prev => ({ ...prev, [dimension]: error }))
    } else {
      setErrors(prev => {
        const next = { ...prev }
        delete next[dimension]
        return next
      })
      onUpdateNode(selectedNode.id, {
        [dimension]: Math.max(40, Math.min(200, parsed)),
      })
    }
  }

  const handleCapacityChange = (value: string) => {
    if (!selectedTable) return

    if (!value) {
      setErrors(prev => {
        const next = { ...prev }
        delete next.capacity
        return next
      })
      onUpdateTable(selectedTable.id, { seats: undefined })
      return
    }

    const parsed = Number(value)
    
    if (isNaN(parsed) || parsed < 1) {
      setErrors(prev => ({ ...prev, capacity: 'La capacidad debe ser al menos 1 persona' }))
    } else if (parsed > 50) {
      setErrors(prev => ({ ...prev, capacity: 'La capacidad no puede exceder 50 personas' }))
    } else {
      setErrors(prev => {
        const next = { ...prev }
        delete next.capacity
        return next
      })
      onUpdateTable(selectedTable.id, { seats: parsed })
    }
  }

  return (
    <div className="space-y-4">
      {/* Agregar mesa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar mesa al mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={tableToAdd ?? undefined}
              onValueChange={(value) => onTableToAddChange(value === "none" ? null : value)}
            >
              <SelectTrigger id="add-table" className="w-[200px]">
                <SelectValue
                  placeholder={
                    availableTables.length
                      ? "Seleccionar mesa"
                      : "Sin mesas disponibles"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableTables.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Todas las mesas están en el mapa
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
              onClick={onAddTable}
              disabled={!tableToAdd || isSaving}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar al mapa
            </Button>
          </div>
          {availableTables.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Todas las mesas existentes ya están en el mapa
            </p>
          )}
        </CardContent>
      </Card>

      {/* Editar mesa seleccionada */}
      {selectedNode && selectedTable ? (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Editar Mesa {selectedTable.number}</span>
              <Badge variant="secondary">Seleccionada</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Número de mesa */}
              <div className="space-y-2">
                <Label htmlFor="table-number">Número de mesa</Label>
                <Input
                  id="table-number"
                  type="text"
                  value={selectedTable.number}
                  onChange={(event) => handleTableNumberChange(event.target.value)}
                  className={errors.tableNumber ? 'border-red-500' : ''}
                />
                {errors.tableNumber && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tableNumber}
                  </p>
                )}
              </div>

              {/* Capacidad */}
              <div className="space-y-2">
                <Label htmlFor="table-seats">Capacidad (personas)</Label>
                <Input
                  id="table-seats"
                  type="number"
                  min={1}
                  max={50}
                  value={selectedTable.seats ?? ""}
                  placeholder="Ej: 4"
                  onChange={(event) => handleCapacityChange(event.target.value)}
                  className={errors.capacity ? 'border-red-500' : ''}
                />
                {errors.capacity && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.capacity}
                  </p>
                )}
              </div>

              {/* Forma */}
              <div className="space-y-2">
                <Label>Forma</Label>
                <ToggleGroup
                  type="single"
                  value={selectedNode.shape}
                  onValueChange={(value) =>
                    value &&
                    onUpdateNode(selectedNode.id, {
                      shape: value as "rectangle" | "circle",
                    })
                  }
                >
                  <ToggleGroupItem value="rectangle" className="flex-1">
                    Rectangular
                  </ToggleGroupItem>
                  <ToggleGroupItem value="circle" className="flex-1">
                    Redonda
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Zona */}
              <div className="space-y-2">
                <Label>Zona</Label>
                <Select
                  value={selectedNode.zone}
                  onValueChange={(zoneId) => {
                    onUpdateNode(selectedNode.id, { zone: zoneId })
                    const zoneName = layout.zones.find((zone) => zone.id === zoneId)?.name
                    if (zoneName) {
                      onUpdateTable(selectedTable.id, { zone: zoneName })
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

              {/* Ancho */}
              <div className="space-y-2">
                <Label htmlFor="table-width">Ancho (px)</Label>
                <Input
                  id="table-width"
                  type="number"
                  min={40}
                  max={200}
                  value={selectedNode.width}
                  onChange={(event) => handleDimensionChange('width', event.target.value)}
                  className={errors.width ? 'border-red-500' : ''}
                />
                {errors.width && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.width}
                  </p>
                )}
              </div>

              {/* Alto */}
              <div className="space-y-2">
                <Label htmlFor="table-height">Alto (px)</Label>
                <Input
                  id="table-height"
                  type="number"
                  min={40}
                  max={200}
                  value={selectedNode.height}
                  onChange={(event) => handleDimensionChange('height', event.target.value)}
                  className={errors.height ? 'border-red-500' : ''}
                />
                {errors.height && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.height}
                  </p>
                )}
              </div>
            </div>

            {/* Botón eliminar */}
            <div className="flex justify-end pt-2 border-t">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onRemoveNode(selectedNode.id)}
                disabled={isSaving}
              >
                <Trash className="mr-2 h-4 w-4" />
                Quitar del mapa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Haz clic en una mesa del mapa para editar sus propiedades o agrega una nueva
                mesa desde el selector de arriba.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consejos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">💡 Consejos rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Arrastra las mesas para reposicionarlas</li>
            <li>• Ajusta la forma y tamaño según tu espacio real</li>
            <li>• Agrupa mesas por zonas para mejor organización</li>
            <li>• Guarda regularmente para no perder cambios</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
