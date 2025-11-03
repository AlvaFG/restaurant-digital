'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AnalyticsFilters } from '@/lib/types/analytics-extended'
import { cn } from '@/lib/utils'

interface FiltersSidebarProps {
  filters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
  onApply: () => void
}

// Presets de fechas
const DATE_PRESETS: Array<{ label: string, value: AnalyticsFilters['dateRange']['preset'] }> = [
  { label: 'Hoy', value: 'today' },
  { label: 'Ayer', value: 'yesterday' },
  { label: 'Últimos 7 días', value: 'last7days' },
  { label: 'Últimos 30 días', value: 'last30days' },
  { label: 'Este mes', value: 'thisMonth' },
  { label: 'Mes anterior', value: 'lastMonth' },
  { label: 'Personalizado', value: 'custom' }
]

// Días de la semana
const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
] as const

// Horarios del día
const TIME_OF_DAY = [
  { value: 'morning', label: 'Mañana (6-12)' },
  { value: 'afternoon', label: 'Tarde (12-18)' },
  { value: 'evening', label: 'Noche (18-24)' },
  { value: 'night', label: 'Madrugada (0-6)' }
] as const

export function FiltersSidebar({ filters, onFiltersChange, onApply }: FiltersSidebarProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(filters)
  const [categories, setCategories] = useState<string[]>([])
  const [staff, setStaff] = useState<Array<{ id: string, name: string }>>([])
  const [zones, setZones] = useState<Array<{ id: string, name: string }>>([])

  // Cargar opciones de filtros
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        // Cargar categorías
        const categoriesRes = await fetch('/api/menu-categories')
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data.map((c: any) => c.name))
        }

        // Cargar staff
        const staffRes = await fetch('/api/users?role=waiter')
        if (staffRes.ok) {
          const data = await staffRes.json()
          setStaff(data.map((s: any) => ({ id: s.id, name: s.full_name || s.email })))
        }

        // Cargar zonas
        const zonesRes = await fetch('/api/zones')
        if (zonesRes.ok) {
          const data = await zonesRes.json()
          setZones(data.map((z: any) => ({ id: z.id, name: z.name })))
        }
      } catch (error) {
        console.error('Error loading filter options:', error)
      }
    }

    loadFilterOptions()
  }, [])

  const handlePresetChange = (preset: AnalyticsFilters['dateRange']['preset']) => {
    const now = new Date()
    let from = new Date()
    let to = new Date()

    switch (preset) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        to = now
        break
      case 'yesterday':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        break
      case 'last7days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'last30days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = now
        break
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        from = lastMonth
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case 'custom':
        // Mantener fechas actuales
        return
    }

    setLocalFilters({
      ...localFilters,
      dateRange: { from, to, preset }
    })
  }

  const handleCategoryToggle = (category: string) => {
    const current = localFilters.categories || []
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category]
    
    setLocalFilters({
      ...localFilters,
      categories: updated.length > 0 ? updated : undefined
    })
  }

  const handleStaffToggle = (staffId: string) => {
    const current = localFilters.staff || []
    const updated = current.includes(staffId)
      ? current.filter(s => s !== staffId)
      : [...current, staffId]
    
    setLocalFilters({
      ...localFilters,
      staff: updated.length > 0 ? updated : undefined
    })
  }

  const handleZoneToggle = (zoneId: string) => {
    const current = localFilters.zones || []
    const updated = current.includes(zoneId)
      ? current.filter(z => z !== zoneId)
      : [...current, zoneId]
    
    setLocalFilters({
      ...localFilters,
      zones: updated.length > 0 ? updated : undefined
    })
  }

  const handleDayToggle = (day: typeof DAYS_OF_WEEK[number]['value']) => {
    const current = localFilters.dayOfWeek || []
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day]
    
    setLocalFilters({
      ...localFilters,
      dayOfWeek: updated.length > 0 ? updated : undefined
    })
  }

  const handleTimeToggle = (time: typeof TIME_OF_DAY[number]['value']) => {
    const current = localFilters.timeOfDay || []
    const updated = current.includes(time)
      ? current.filter(t => t !== time)
      : [...current, time]
    
    setLocalFilters({
      ...localFilters,
      timeOfDay: updated.length > 0 ? updated : undefined
    })
  }

  const handleReset = () => {
    const now = new Date()
    const defaultFilters: AnalyticsFilters = {
      dateRange: {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
        preset: 'last7days'
      }
    }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
  }

  return (
    <Card className="w-80 h-fit sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        </div>
        <CardDescription>
          Personaliza tu vista de analítica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rango de Fechas */}
        <div className="space-y-3">
          <Label>Período</Label>
          <Select 
            value={localFilters.dateRange.preset || 'last7days'}
            onValueChange={(value) => handlePresetChange(value as AnalyticsFilters['dateRange']['preset'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value!}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {localFilters.dateRange.preset === 'custom' && (
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.from ? (
                      format(localFilters.dateRange.from, 'PPP', { locale: es })
                    ) : (
                      <span>Fecha inicio</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.from}
                    onSelect={(date) => date && setLocalFilters({
                      ...localFilters,
                      dateRange: { ...localFilters.dateRange, from: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.to ? (
                      format(localFilters.dateRange.to, 'PPP', { locale: es })
                    ) : (
                      <span>Fecha fin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.to}
                    onSelect={(date) => date && setLocalFilters({
                      ...localFilters,
                      dateRange: { ...localFilters.dateRange, to: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Categorías */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label>Categorías</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={localFilters.categories?.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <div className="space-y-3">
            <Label>Staff</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {staff.map(member => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`staff-${member.id}`}
                    checked={localFilters.staff?.includes(member.id)}
                    onCheckedChange={() => handleStaffToggle(member.id)}
                  />
                  <label
                    htmlFor={`staff-${member.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {member.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zonas */}
        {zones.length > 0 && (
          <div className="space-y-3">
            <Label>Zonas</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`zone-${zone.id}`}
                    checked={localFilters.zones?.includes(zone.id)}
                    onCheckedChange={() => handleZoneToggle(zone.id)}
                  />
                  <label
                    htmlFor={`zone-${zone.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {zone.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Días de la semana */}
        <div className="space-y-3">
          <Label>Días de la semana</Label>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={localFilters.dayOfWeek?.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <label
                  htmlFor={`day-${day.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Horario del día */}
        <div className="space-y-3">
          <Label>Horario</Label>
          <div className="space-y-2">
            {TIME_OF_DAY.map(time => (
              <div key={time.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`time-${time.value}`}
                  checked={localFilters.timeOfDay?.includes(time.value)}
                  onCheckedChange={() => handleTimeToggle(time.value)}
                />
                <label
                  htmlFor={`time-${time.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {time.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Aplicar */}
        <Button 
          onClick={handleApply} 
          className="w-full"
          size="lg"
        >
          Aplicar Filtros
        </Button>
      </CardContent>
    </Card>
  )
}
