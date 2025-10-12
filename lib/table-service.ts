import type { Table, TableMapLayout } from "@/lib/mock-data"
import { MOCK_TABLES, MOCK_TABLE_LAYOUT } from "@/lib/mock-data"
import { TABLE_STATE } from "@/lib/table-states"
import { logger } from './logger'
import { NotFoundError, AppError, ValidationError } from './errors'
import { MENSAJES } from './i18n/mensajes'

type TablesResponse = {
  data: Table[]
  metadata?: {
    version: number
    updatedAt: string
  }
}

type TableResponse = {
  data: Table
  history?: unknown
  metadata?: {
    version: number
    updatedAt: string
  }
}

type LayoutResponse = {
  layout: TableMapLayout
  tables: Table[]
  metadata?: {
    version: number
    updatedAt: string
  }
}

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(input, {
      cache: "no-store",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.error('Error en fetchJSON', undefined, { 
        url: input.toString(), 
        status: response.status,
        errorText 
      });
      
      throw new AppError(
        `Error en la solicitud: ${response.status}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Error inesperado en fetchJSON', error as Error, { url: input.toString() });
    throw new AppError(MENSAJES.ERRORES.GENERICO);
  }
}

export async function fetchTables(): Promise<TablesResponse> {
  try {
    logger.debug('Obteniendo mesas');
    const result = await fetchJSON<TablesResponse>("/api/tables");
    logger.info('Mesas obtenidas exitosamente', { count: result.data.length });
    return result;
  } catch (error) {
    logger.warn('Error al obtener mesas, usando datos de respaldo', { 
      error: (error as Error).message 
    });
    return { data: structuredClone(MOCK_TABLES) };
  }
}

export async function fetchTable(tableId: string): Promise<Table | null> {
  try {
    logger.debug('Obteniendo mesa', { tableId });
    
    if (!tableId) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, { field: 'tableId' });
    }
    
    const result = await fetchJSON<TableResponse>(`/api/tables/${tableId}`);
    logger.info('Mesa obtenida exitosamente', { tableId });
    return result.data;
  } catch (error) {
    logger.warn(`Error al obtener mesa, usando datos de respaldo`, { 
      tableId,
      error: (error as Error).message 
    });
    const mockTable = structuredClone(MOCK_TABLES.find((table) => table.id === tableId) ?? null);
    
    if (!mockTable) {
      throw new NotFoundError(MENSAJES.ERRORES.MESA_NO_ENCONTRADA, 'table', { tableId });
    }
    
    return mockTable;
  }
}

export async function fetchLayout(): Promise<LayoutResponse> {
  try {
    logger.debug('Obteniendo layout de salón');
    const result = await fetchJSON<LayoutResponse>("/api/table-layout");
    logger.info('Layout obtenido exitosamente', { 
      tablesCount: result.tables.length 
    });
    return result;
  } catch (error) {
    logger.warn('Error al obtener layout, usando datos de respaldo', {
      error: (error as Error).message
    });
    return {
      layout: structuredClone(MOCK_TABLE_LAYOUT),
      tables: structuredClone(MOCK_TABLES),
    };
  }
}

export async function persistLayout(layout: TableMapLayout, tables: Table[]): Promise<void> {
  try {
    logger.info('Guardando layout de salón', { tablesCount: tables.length });
    
    await fetchJSON("/api/table-layout", {
      method: "PUT",
      body: JSON.stringify({ layout, tables }),
    });
    
    logger.info('Layout guardado exitosamente');
  } catch (error) {
    logger.error('Error al guardar layout', error as Error);
    throw new AppError(MENSAJES.ERRORES.GENERICO);
  }
}

export async function updateTableMetadata(tableId: string, updates: Partial<Pick<Table, "number" | "seats" | "zone">>) {
  try {
    logger.info('Actualizando metadata de mesa', { tableId, updates });
    
    if (!tableId) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, { field: 'tableId' });
    }
    
    await fetchJSON(`/api/tables/${tableId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    
    logger.info('Metadata de mesa actualizada', { tableId });
  } catch (error) {
    logger.error('Error al actualizar metadata de mesa', error as Error, { tableId });
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO);
  }
}

export async function updateTableState(tableId: string, status: Table["status"], opts?: {
  reason?: string
  actor?: {
    id?: string
    name?: string
    role?: string
  }
}) {
  try {
    logger.info('Actualizando estado de mesa', { tableId, status, reason: opts?.reason });
    
    if (!tableId) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, { field: 'tableId' });
    }
    
    await fetchJSON(`/api/tables/${tableId}/state`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...opts }),
    });
    
    logger.info('Estado de mesa actualizado', { tableId, status });
  } catch (error) {
    logger.error('Error al actualizar estado de mesa', error as Error, { tableId, status });
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO);
  }
}

export async function resetTable(tableId: string) {
  logger.info('Reseteando mesa', { tableId });
  await updateTableState(tableId, TABLE_STATE.FREE, { reason: "reset" });
}

export async function inviteHouse(tableId: string) {
  logger.info('Invitando la casa', { tableId });
  await updateTableState(tableId, TABLE_STATE.PAYMENT_CONFIRMED, { reason: "invita_la_casa" });
}

export async function createTable(data: {
  number: number
  zone?: string
}): Promise<Table> {
  try {
    logger.info('Creando nueva mesa', { number: data.number, zone: data.zone })
    
    if (!data.number || data.number < 1) {
      throw new ValidationError('El número de mesa es requerido y debe ser mayor a 0', { field: 'number' })
    }
    
    const result = await fetchJSON<{ data: Table }>('/api/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    logger.info('Mesa creada exitosamente', { tableId: result.data.id, number: result.data.number })
    return result.data
  } catch (error) {
    logger.error('Error al crear mesa', error as Error, { number: data.number })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}

export async function deleteTable(tableId: string): Promise<void> {
  try {
    logger.info('Eliminando mesa', { tableId })
    
    if (!tableId) {
      throw new ValidationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO, { field: 'tableId' })
    }
    
    await fetchJSON(`/api/tables/${tableId}`, {
      method: 'DELETE',
    })
    
    logger.info('Mesa eliminada exitosamente', { tableId })
  } catch (error) {
    logger.error('Error al eliminar mesa', error as Error, { tableId })
    throw error instanceof AppError ? error : new AppError(MENSAJES.ERRORES.GENERICO)
  }
}
