'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ExportOptions, ExportFormat } from '@/lib/types/analytics-extended'

interface ExportButtonProps {
  filters?: any
  onExport?: () => void
}

export function ExportButton({ filters, onExport }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeCharts: false,
    sections: {
      covers: true,
      sales: true,
      staff: true,
      rotation: true,
      occupancy: true
    },
    filters: filters || {}
  })
  const { toast } = useToast()

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    
    try {
      const options: ExportOptions = {
        ...exportOptions,
        format,
        filters: filters || exportOptions.filters
      }

      // Llamar al endpoint de exportación
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        throw new Error('Error al exportar datos')
      }

      // Descargar el archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Nombre del archivo con fecha
      const timestamp = new Date().toISOString().split('T')[0]
      const extension = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx'
      a.download = `analitica-${timestamp}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Exportación exitosa',
        description: `Los datos se han exportado en formato ${format.toUpperCase()}`,
      })

      onExport?.()
    } catch (error) {
      console.error('Error exporting:', error)
      toast({
        title: 'Error al exportar',
        description: error instanceof Error ? error.message : 'No se pudieron exportar los datos',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const toggleSection = (section: keyof ExportOptions['sections']) => {
    setExportOptions({
      ...exportOptions,
      sections: {
        ...exportOptions.sections,
        [section]: !exportOptions.sections[section]
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>CSV (Excel)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>XLSX (Excel Avanzado)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          <span>PDF (con gráficos)</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Secciones a incluir</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={exportOptions.sections.covers}
          onCheckedChange={() => toggleSection('covers')}
        >
          Cubiertos
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={exportOptions.sections.sales}
          onCheckedChange={() => toggleSection('sales')}
        >
          Ventas
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={exportOptions.sections.staff}
          onCheckedChange={() => toggleSection('staff')}
        >
          Staff
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={exportOptions.sections.rotation}
          onCheckedChange={() => toggleSection('rotation')}
        >
          Rotación
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={exportOptions.sections.occupancy}
          onCheckedChange={() => toggleSection('occupancy')}
        >
          Ocupación
        </DropdownMenuCheckboxItem>

        {exportOptions.format === 'pdf' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={exportOptions.includeCharts}
              onCheckedChange={(checked) => 
                setExportOptions({ ...exportOptions, includeCharts: checked as boolean })
              }
            >
              Incluir gráficos
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
