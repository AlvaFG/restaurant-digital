/**
 * Componente: TableAuditHistory
 * 
 * Muestra el historial de cambios de estado de una mesa con:
 * - Timeline visual de cambios
 * - Estadísticas de duración
 * - Filtros por fecha y estado
 * - Detalles de cada cambio (usuario, pedido, razón)
 */

'use client';

import { useState } from 'react';
import { 
  useTableHistory, 
  useTableStatistics,
  useAverageDurationByStatus,
  useTableTimeline 
} from '@/hooks/use-table-audit';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  User, 
  FileText, 
  TrendingUp,
  Calendar,
  Filter 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TableAuditHistoryProps {
  tableId: string;
  tableNumber?: string;
  showStatistics?: boolean;
}

// Mapeo de estados a colores
const STATUS_COLORS: Record<string, string> = {
  libre: 'bg-green-500',
  ocupada: 'bg-blue-500',
  pedido_en_curso: 'bg-yellow-500',
  cuenta_solicitada: 'bg-orange-500',
  pago_confirmado: 'bg-purple-500',
};

// Mapeo de estados a labels
const STATUS_LABELS: Record<string, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  pedido_en_curso: 'Pedido en Curso',
  cuenta_solicitada: 'Cuenta Solicitada',
  pago_confirmado: 'Pago Confirmado',
};

export function TableAuditHistory({
  tableId,
  tableNumber,
  showStatistics = true,
}: TableAuditHistoryProps) {
  const [timelineDays, setTimelineDays] = useState(7);
  
  const { data: history, isLoading: historyLoading } = useTableHistory(tableId);
  const { data: statistics } = useTableStatistics(tableId);
  const { data: avgDurations } = useAverageDurationByStatus(tableId);
  const { data: timeline } = useTableTimeline(tableId, timelineDays);

  if (historyLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Historial de Mesa {tableNumber || tableId}
          </h2>
          <p className="text-muted-foreground">
            Registro completo de cambios de estado
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {showStatistics && statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Cambios
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_changes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Días Activos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.days_with_changes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Duración Promedio
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.avg_duration_seconds / 60)}m
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Último Cambio
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {formatDistanceToNow(new Date(statistics.last_change_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Últimos:</span>
            {[7, 14, 30].map((days) => (
              <Button
                key={days}
                variant={timelineDays === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimelineDays(days)}
              >
                {days} días
              </Button>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {/* Eventos */}
                <div className="space-y-6">
                  {timeline && timeline.length > 0 ? (
                    timeline.map((change, index) => (
                      <div key={change.id} className="relative pl-10">
                        {/* Dot */}
                        <div
                          className={`absolute left-2.5 top-1.5 h-3 w-3 rounded-full ${
                            STATUS_COLORS[change.new_status] || 'bg-gray-500'
                          }`}
                        />

                        {/* Content */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${
                                STATUS_COLORS[change.new_status] || ''
                              } text-white border-none`}
                            >
                              {STATUS_LABELS[change.new_status] || change.new_status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(change.changed_at).toLocaleString('es-ES')}
                            </span>
                          </div>

                          {change.reason && (
                            <p className="text-sm text-muted-foreground">
                              {change.reason}
                            </p>
                          )}

                          {change.duration_seconds && (
                            <span className="text-xs text-muted-foreground">
                              Duración anterior: {Math.round(change.duration_seconds / 60)} min
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay cambios en el período seleccionado
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duración Promedio por Estado</CardTitle>
              <CardDescription>
                Tiempo promedio que la mesa permanece en cada estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {avgDurations && avgDurations.length > 0 ? (
                  avgDurations.map((stat) => (
                    <div key={stat.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            STATUS_COLORS[stat.status] || 'bg-gray-500'
                          }`}
                        />
                        <span className="font-medium">
                          {STATUS_LABELS[stat.status] || stat.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stat.average_minutes} min</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.occurrences} ocurrencias
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay suficientes datos para mostrar estadísticas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial Detallado</CardTitle>
              <CardDescription>
                Registro completo con información de usuario y pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history && history.length > 0 ? (
                  history.map((change: any) => (
                    <div
                      key={change.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${
                              STATUS_COLORS[change.previous_status] || ''
                            } text-white border-none`}
                          >
                            {STATUS_LABELS[change.previous_status] || change.previous_status}
                          </Badge>
                          <span>→</span>
                          <Badge
                            variant="outline"
                            className={`${
                              STATUS_COLORS[change.new_status] || ''
                            } text-white border-none`}
                          >
                            {STATUS_LABELS[change.new_status] || change.new_status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(change.changed_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>

                      {change.users && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span className="text-muted-foreground">
                            {change.users.email || change.users.name}
                          </span>
                        </div>
                      )}

                      {change.orders && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span className="text-muted-foreground">
                            Pedido: {change.orders.order_number}
                          </span>
                        </div>
                      )}

                      {change.reason && (
                        <p className="text-sm text-muted-foreground italic">
                          "{change.reason}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay historial disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
