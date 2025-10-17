"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Check, MapPin } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type Zone = Database['public']['Tables']['zones']['Row']

interface ZoneFilterProps {
  zones: Zone[]
  selectedZones: string[]
  onZonesChange: (zoneIds: string[]) => void
  tableCountByZone?: Record<string, number>
  className?: string
}

export function ZoneFilter({ 
  zones, 
  selectedZones, 
  onZonesChange, 
  tableCountByZone = {},
  className 
}: ZoneFilterProps) {
  
  const toggleZone = (zoneId: string) => {
    if (selectedZones.includes(zoneId)) {
      // Deseleccionar
      onZonesChange(selectedZones.filter(id => id !== zoneId))
    } else {
      // Seleccionar
      onZonesChange([...selectedZones, zoneId])
    }
  }

  const toggleAll = () => {
    if (selectedZones.length === zones.length) {
      // Si todas están seleccionadas, deseleccionar todas
      onZonesChange([])
    } else {
      // Seleccionar todas
      onZonesChange(zones.map(z => z.id))
    }
  }

  const sortedZones = [...zones].sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  const allSelected = selectedZones.length === zones.length && zones.length > 0

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrar por zona:</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectedZones.length} de {zones.length} seleccionadas
          </Badge>
          {zones.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="h-7 text-xs"
            >
              {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </Button>
          )}
        </div>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No hay zonas creadas.</p>
          <p className="text-xs mt-1">Crea una zona para comenzar a organizar tus mesas.</p>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex flex-wrap gap-2 pb-2">
            {sortedZones.map((zone) => {
              const isSelected = selectedZones.includes(zone.id)
              const tableCount = tableCountByZone[zone.id] || 0

              return (
                <Button
                  key={zone.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleZone(zone.id)}
                  className={cn(
                    "transition-all duration-200",
                    isSelected && "shadow-md ring-2 ring-primary/20"
                  )}
                >
                  {isSelected && (
                    <Check className="mr-2 h-3 w-3" />
                  )}
                  <span>{zone.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-2 h-5 min-w-[20px] px-1",
                      isSelected && "bg-primary-foreground/20"
                    )}
                  >
                    {tableCount}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
