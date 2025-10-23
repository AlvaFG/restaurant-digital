/**
 * Servicio: Socket Notifications
 * 
 * Sistema de notificaciones en tiempo real usando Supabase Realtime
 * para cambios de estado de mesas, pedidos y auditoría.
 */

import { supabase } from '@/lib/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type TableStatusChangeEvent = {
  type: 'table_status_change';
  payload: {
    table_id: string;
    table_number: string;
    previous_status: string;
    new_status: string;
    changed_at: string;
    reason?: string;
    order_id?: string;
  };
};

export type OrderCreatedEvent = {
  type: 'order_created';
  payload: {
    order_id: string;
    order_number: string;
    table_id: string;
    table_number: string;
    total_cents: number;
  };
};

export type NotificationEvent = TableStatusChangeEvent | OrderCreatedEvent;

type EventCallback = (event: NotificationEvent) => void;

/**
 * Clase para manejar notificaciones en tiempo real
 */
export class SocketNotificationService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Suscribirse a cambios de estado de mesas para un tenant
   */
  subscribeToTableStatusChanges(
    tenantId: string,
    callback: EventCallback
  ): () => void {
    const channelName = `table-status-changes:${tenantId}`;

    // Si no existe el canal, créalo
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'table_status_audit',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            const event: TableStatusChangeEvent = {
              type: 'table_status_change',
              payload: {
                table_id: payload.new.table_id,
                table_number: payload.new.table_number,
                previous_status: payload.new.previous_status,
                new_status: payload.new.new_status,
                changed_at: payload.new.changed_at,
                reason: payload.new.reason,
                order_id: payload.new.order_id,
              },
            };

            this.notifyListeners(channelName, event);
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.listeners.set(channelName, new Set());
    }

    // Agregar callback a los listeners
    const listeners = this.listeners.get(channelName)!;
    listeners.add(callback);

    // Retornar función de unsubscribe
    return () => {
      listeners.delete(callback);

      // Si no quedan listeners, eliminar el canal
      if (listeners.size === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.listeners.delete(channelName);
        }
      }
    };
  }

  /**
   * Suscribirse a creación de pedidos para un tenant
   */
  subscribeToOrderCreation(
    tenantId: string,
    callback: EventCallback
  ): () => void {
    const channelName = `orders:${tenantId}`;

    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            // Obtener información de la mesa
            this.getTableInfo(payload.new.table_id).then((tableInfo) => {
              const event: OrderCreatedEvent = {
                type: 'order_created',
                payload: {
                  order_id: payload.new.id,
                  order_number: payload.new.order_number,
                  table_id: payload.new.table_id,
                  table_number: tableInfo?.number || 'N/A',
                  total_cents: payload.new.total_cents,
                },
              };

              this.notifyListeners(channelName, event);
            });
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.listeners.set(channelName, new Set());
    }

    const listeners = this.listeners.get(channelName)!;
    listeners.add(callback);

    return () => {
      listeners.delete(callback);

      if (listeners.size === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.listeners.delete(channelName);
        }
      }
    };
  }

  /**
   * Suscribirse a cambios de una mesa específica
   */
  subscribeToTable(
    tableId: string,
    callback: EventCallback
  ): () => void {
    const channelName = `table:${tableId}`;

    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tables',
            filter: `id=eq.${tableId}`,
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const oldStatus = payload.old.status;
              const newStatus = payload.new.status;

              if (oldStatus !== newStatus) {
                const event: TableStatusChangeEvent = {
                  type: 'table_status_change',
                  payload: {
                    table_id: tableId,
                    table_number: payload.new.number,
                    previous_status: oldStatus,
                    new_status: newStatus,
                    changed_at: new Date().toISOString(),
                  },
                };

                this.notifyListeners(channelName, event);
              }
            }
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.listeners.set(channelName, new Set());
    }

    const listeners = this.listeners.get(channelName)!;
    listeners.add(callback);

    return () => {
      listeners.delete(callback);

      if (listeners.size === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.listeners.delete(channelName);
        }
      }
    };
  }

  /**
   * Notificar a todos los listeners de un canal
   */
  private notifyListeners(channelName: string, event: NotificationEvent) {
    const listeners = this.listeners.get(channelName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error en listener:', error);
        }
      });
    }
  }

  /**
   * Obtener información de una mesa
   */
  private async getTableInfo(tableId: string) {
    const { data } = await supabase
      .from('tables')
      .select('number')
      .eq('id', tableId)
      .single();

    return data;
  }

  /**
   * Desuscribirse de todos los canales
   */
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });

    this.channels.clear();
    this.listeners.clear();
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus(): Record<string, string> {
    const status: Record<string, string> = {};

    this.channels.forEach((channel, name) => {
      status[name] = channel.state;
    });

    return status;
  }
}

// Instancia singleton
export const socketNotifications = new SocketNotificationService();

// Hook React para facilitar el uso
import { useEffect, useRef } from 'react';

/**
 * Hook para escuchar cambios de estado de mesas
 */
export function useTableStatusNotifications(
  tenantId: string | undefined,
  onStatusChange: (event: TableStatusChangeEvent) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    unsubscribeRef.current = socketNotifications.subscribeToTableStatusChanges(
      tenantId,
      (event) => {
        if (event.type === 'table_status_change') {
          onStatusChange(event);
        }
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tenantId, onStatusChange]);
}

/**
 * Hook para escuchar creación de pedidos
 */
export function useOrderNotifications(
  tenantId: string | undefined,
  onOrderCreated: (event: OrderCreatedEvent) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    unsubscribeRef.current = socketNotifications.subscribeToOrderCreation(
      tenantId,
      (event) => {
        if (event.type === 'order_created') {
          onOrderCreated(event);
        }
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tenantId, onOrderCreated]);
}

/**
 * Hook para escuchar cambios de una mesa específica
 */
export function useSingleTableNotifications(
  tableId: string | undefined,
  onStatusChange: (event: TableStatusChangeEvent) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!tableId) return;

    unsubscribeRef.current = socketNotifications.subscribeToTable(
      tableId,
      (event) => {
        if (event.type === 'table_status_change') {
          onStatusChange(event);
        }
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tableId, onStatusChange]);
}
