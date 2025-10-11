/**
 * Popular Items List Component
 * 
 * Table showing top selling items
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { PopularItem } from '@/lib/analytics-types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PopularItemsListProps {
  items: PopularItem[]
  title?: string
  description?: string
  sortBy?: 'quantity' | 'revenue'
}

export function PopularItemsList({
  items,
  title,
  description,
  sortBy = 'quantity'
}: PopularItemsListProps) {
  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }
  
  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'quantity') {
      return b.quantitySold - a.quantitySold
    }
    return b.revenue - a.revenue
  }).slice(0, 10) // Top 10
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Productos Más Vendidos'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Precio Prom.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item, index) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {index + 1}
                      {index === 0 && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantitySold}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(item.avgPrice)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
