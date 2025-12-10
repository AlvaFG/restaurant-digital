"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { X, Square, Circle, RectangleHorizontal } from "lucide-react"
import { TABLE_STATE_COLORS, TABLE_STATE_LABELS, type TableState } from "@/lib/table-states"

export interface TableProperties {
  id: string
  number: string
  capacity: number
  status: string
  zoneId: string | null
  zoneName?: string
  position: {
    x: number
    y: number
    w: number
    h: number
    rot: number
    shape: 'rectangle' | 'square' | 'circle'
  }
}

interface Zone {
  id: string
  name: string
}

interface TablePropertiesPanelProps {
  table: TableProperties | null
  zones: Zone[]
  onUpdate: (updates: Partial<TableProperties>) => void
  onClose: () => void
  editable: boolean
}

export function TablePropertiesPanel({
  table,
  zones,
  onUpdate,
  onClose,
  editable
}: TablePropertiesPanelProps) {
  const [localProps, setLocalProps] = useState<TableProperties | null>(null)

  useEffect(() => {
    setLocalProps(table)
  }, [table])

  if (!table || !localProps) {
    return (
      <Card className="w-72 bg-card/95 backdrop-blur">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Selecciona una mesa para ver sus propiedades
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleChange = <K extends keyof TableProperties>(
    key: K, 
    value: TableProperties[K]
  ) => {
    setLocalProps(prev => prev ? { ...prev, [key]: value } : null)
    onUpdate({ [key]: value })
  }

  const handlePositionChange = (
    key: keyof TableProperties['position'], 
    value: number | string
  ) => {
    const newPosition = { ...localProps.position, [key]: value }
    setLocalProps(prev => prev ? { ...prev, position: newPosition } : null)
    onUpdate({ position: newPosition })
  }

  const statusColor = TABLE_STATE_COLORS[localProps.status as TableState] || TABLE_STATE_COLORS.libre

  return (
    <Card className="w-72 bg-card/95 backdrop-blur shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Mesa {localProps.number}
            <Badge 
              variant="outline" 
              style={{ 
                backgroundColor: statusColor + '30',
                borderColor: statusColor,
                color: statusColor
              }}
            >
              {TABLE_STATE_LABELS[localProps.status as TableState] || localProps.status}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Number */}
        <div className="space-y-1.5">
          <Label htmlFor="table-number" className="text-xs">Número</Label>
          <Input
            id="table-number"
            value={localProps.number}
            onChange={(e) => handleChange('number', e.target.value)}
            disabled={!editable}
            className="h-8"
          />
        </div>

        {/* Capacity */}
        <div className="space-y-1.5">
          <Label htmlFor="table-capacity" className="text-xs">
            Capacidad: {localProps.capacity} personas
          </Label>
          <Slider
            id="table-capacity"
            value={[localProps.capacity]}
            onValueChange={([v]) => handleChange('capacity', v)}
            min={1}
            max={20}
            step={1}
            disabled={!editable}
          />
        </div>

        {/* Zone */}
        <div className="space-y-1.5">
          <Label className="text-xs">Zona</Label>
          <Select
            value={localProps.zoneId || 'none'}
            onValueChange={(v) => handleChange('zoneId', v === 'none' ? null : v)}
            disabled={!editable}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Sin zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin zona</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs">Estado</Label>
          <Select
            value={localProps.status}
            onValueChange={(v) => handleChange('status', v)}
            disabled={!editable}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TABLE_STATE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TABLE_STATE_COLORS[value as TableState] }}
                    />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {editable && (
          <>
            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Geometría</p>
              
              {/* Shape */}
              <div className="space-y-1.5 mb-3">
                <Label className="text-xs">Forma</Label>
                <div className="flex gap-1">
                  {[
                    { value: 'rectangle', icon: RectangleHorizontal, label: 'Rectángulo' },
                    { value: 'square', icon: Square, label: 'Cuadrado' },
                    { value: 'circle', icon: Circle, label: 'Círculo' },
                  ].map((shape) => (
                    <Button
                      key={shape.value}
                      variant={localProps.position.shape === shape.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePositionChange('shape', shape.value)}
                      className="flex-1 h-8"
                      title={shape.label}
                    >
                      <shape.icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ancho</Label>
                  <Input
                    type="number"
                    value={localProps.position.w}
                    onChange={(e) => handlePositionChange('w', Number(e.target.value))}
                    min={20}
                    max={500}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alto</Label>
                  <Input
                    type="number"
                    value={localProps.position.h}
                    onChange={(e) => handlePositionChange('h', Number(e.target.value))}
                    min={20}
                    max={500}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={Math.round(localProps.position.x)}
                    onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                    min={0}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={Math.round(localProps.position.y)}
                    onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                    min={0}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Rotación: {Math.round(localProps.position.rot)}°
                </Label>
                <Slider
                  value={[localProps.position.rot]}
                  onValueChange={([v]) => handlePositionChange('rot', v)}
                  min={0}
                  max={360}
                  step={15}
                />
              </div>
            </div>
          </>
        )}

        {/* Quick info */}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-muted-foreground">
            ID: <code className="text-[10px]">{localProps.id.slice(0, 8)}...</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
