/**
 * Date Range Picker Component
 * 
 * Allows users to select date range presets
 */

'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DateRangePreset } from '@/lib/analytics-types'

interface DateRangePickerProps {
  value: DateRangePreset
  onChange: (value: DateRangePreset) => void
}

const presets: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes pasado' },
]

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Seleccionar período" />
      </SelectTrigger>
      <SelectContent>
        {presets.map((preset) => (
          <SelectItem key={preset.value} value={preset.value}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
