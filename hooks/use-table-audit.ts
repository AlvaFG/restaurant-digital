/**
 * Hook: useTableAudit
 * 
 * React Query hook para consultar el historial de auditoría de cambios de estado de mesas.
 * Proporciona métodos para obtener cambios recientes, historial completo y estadísticas.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

// Tipos
export interface TableStatusAuditRecord {
  id: string;
  tenant_id: string;
  table_id: string;
  table_number: string;
  previous_status: string;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
  order_id: string | null;
  session_id: string | null;
  duration_seconds: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Campos adicionales de la vista
  current_table_number?: string;
  changed_by_email?: string | null;
  order_number?: string | null;
}

export interface TableStatusSummary {
  table_id: string;
  table_number: string;
  tenant_id: string;
  total_changes: number;
  days_with_changes: number;
  avg_duration_seconds: number;
  last_change_at: string;
}

interface UseTableAuditOptions {
  tenantId?: string;
  tableId?: string;
  enabled?: boolean;
}

/**
 * Hook principal para consultar auditoría de mesas
 */
export function useTableAudit(options: UseTableAuditOptions = {}) {
  const { tenantId, tableId, enabled = true } = options;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['table-audit', { tenantId, tableId }],
    queryFn: async () => {
      let query = supabase
        .from('table_status_audit')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (tableId) {
        query = query.eq('table_id', tableId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TableStatusAuditRecord[];
    },
    enabled,
  });
}

/**
 * Hook para obtener cambios recientes (últimas 24 horas)
 */
export function useRecentTableChanges(tenantId?: string) {
  return useQuery({
    queryKey: ['recent-table-changes', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('recent_table_status_changes')
        .select('*')
        .order('changed_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TableStatusAuditRecord[];
    },
  });
}

/**
 * Hook para obtener resumen de cambios por mesa
 */
export function useTableStatusSummary(tenantId?: string) {
  return useQuery({
    queryKey: ['table-status-summary', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('table_status_changes_summary')
        .select('*')
        .order('total_changes', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TableStatusSummary[];
    },
  });
}

/**
 * Hook para obtener historial de una mesa específica
 */
export function useTableHistory(tableId: string, enabled = true) {
  return useQuery({
    queryKey: ['table-history', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_status_audit')
        .select(`
          *,
          users:changed_by (
            email,
            name
          ),
          orders:order_id (
            order_number,
            total_cents
          )
        `)
        .eq('table_id', tableId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled,
  });
}

/**
 * Hook para registrar un cambio de estado manualmente
 */
export function useLogTableStatusChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenantId: string;
      tableId: string;
      tableNumber: string;
      previousStatus: string;
      newStatus: string;
      userId?: string;
      reason?: string;
      orderId?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('log_table_status_change', {
        p_tenant_id: params.tenantId,
        p_table_id: params.tableId,
        p_table_number: params.tableNumber,
        p_previous_status: params.previousStatus,
        p_new_status: params.newStatus,
        p_changed_by: params.userId || null,
        p_reason: params.reason || null,
        p_order_id: params.orderId || null,
        p_metadata: params.metadata || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['table-audit'] });
      queryClient.invalidateQueries({ queryKey: ['recent-table-changes'] });
      queryClient.invalidateQueries({ queryKey: ['table-status-summary'] });
      queryClient.invalidateQueries({ 
        queryKey: ['table-history', variables.tableId] 
      });
    },
  });
}

/**
 * Hook para obtener estadísticas de una mesa
 */
export function useTableStatistics(tableId: string, enabled = true) {
  return useQuery({
    queryKey: ['table-statistics', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_status_changes_summary')
        .select('*')
        .eq('table_id', tableId)
        .single();

      if (error) throw error;
      return data as TableStatusSummary;
    },
    enabled,
  });
}

/**
 * Hook para obtener duración promedio en cada estado
 */
export function useAverageDurationByStatus(
  tableId: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['avg-duration-by-status', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_status_audit')
        .select('new_status, duration_seconds')
        .eq('table_id', tableId)
        .not('duration_seconds', 'is', null);

      if (error) throw error;

      // Calcular promedio por estado
      const statusMap = new Map<string, { total: number; count: number }>();

      data.forEach((record) => {
        const status = record.new_status;
        const duration = record.duration_seconds || 0;

        if (!statusMap.has(status)) {
          statusMap.set(status, { total: 0, count: 0 });
        }

        const current = statusMap.get(status)!;
        current.total += duration;
        current.count += 1;
      });

      // Convertir a array con promedios
      return Array.from(statusMap.entries()).map(([status, values]) => ({
        status,
        average_seconds: Math.round(values.total / values.count),
        average_minutes: Math.round(values.total / values.count / 60),
        occurrences: values.count,
      }));
    },
    enabled,
  });
}

/**
 * Hook para obtener timeline de cambios (últimos N días)
 */
export function useTableTimeline(
  tableId: string,
  days: number = 7,
  enabled = true
) {
  return useQuery({
    queryKey: ['table-timeline', tableId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('table_status_audit')
        .select('*')
        .eq('table_id', tableId)
        .gte('changed_at', startDate.toISOString())
        .order('changed_at', { ascending: true });

      if (error) throw error;
      return data as TableStatusAuditRecord[];
    },
    enabled,
  });
}

// Exportar tipos útiles
export type { TableStatusAuditRecord, TableStatusSummary };
