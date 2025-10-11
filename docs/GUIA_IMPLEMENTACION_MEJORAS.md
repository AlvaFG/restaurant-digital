# 💡 GUÍA PRÁCTICA: Implementación de Mejoras

**Objetivo:** Ejemplos concretos de cómo implementar las mejoras sugeridas en la revisión completa.

---

## 📋 TABLA DE CONTENIDOS

1. [Sistema de Internacionalización](#1-sistema-de-internacionalización)
2. [Manejo de Errores Mejorado](#2-manejo-de-errores-mejorado)
3. [Optimización de Componentes](#3-optimización-de-componentes)
4. [Optimización de Queries](#4-optimización-de-queries)
5. [Sistema de Logging](#5-sistema-de-logging)
6. [Tests Mejorados](#6-tests-mejorados)

---

## 1️⃣ SISTEMA DE INTERNACIONALIZACIÓN

### Crear Archivo de Constantes

**lib/i18n/mensajes.ts**
```typescript
export const MENSAJES = {
  // Mensajes de Error
  ERRORES: {
    GENERICO: "Ocurrió un error inesperado. Por favor, intente nuevamente.",
    AUTENTICACION: "Error de autenticación. Verifique sus credenciales.",
    PERMISO_DENEGADO: "No tiene permisos para realizar esta acción.",
    RECURSO_NO_ENCONTRADO: "El recurso solicitado no fue encontrado.",
    VALIDACION: "Los datos ingresados no son válidos.",
    RED: "Error de conexión. Verifique su conexión a internet.",
    TIMEOUT: "La operación tardó demasiado tiempo. Intente nuevamente.",
    
    // Errores específicos de Pedidos
    PEDIDO_NO_ENCONTRADO: "El pedido no fue encontrado.",
    PEDIDO_YA_PROCESADO: "Este pedido ya ha sido procesado.",
    PEDIDO_CANCELADO: "No se puede modificar un pedido cancelado.",
    
    // Errores específicos de Mesas
    MESA_NO_ENCONTRADA: "La mesa no fue encontrada.",
    MESA_OCUPADA: "La mesa ya está ocupada.",
    MESA_SIN_PEDIDOS: "La mesa no tiene pedidos activos.",
    
    // Errores específicos de Pagos
    PAGO_FALLIDO: "El pago no pudo ser procesado.",
    PAGO_RECHAZADO: "El pago fue rechazado.",
    MONTO_INVALIDO: "El monto ingresado no es válido.",
  },
  
  // Mensajes de Éxito
  EXITO: {
    PEDIDO_CREADO: "Pedido creado exitosamente.",
    PEDIDO_ACTUALIZADO: "Pedido actualizado correctamente.",
    PEDIDO_CANCELADO: "Pedido cancelado exitosamente.",
    
    MESA_ACTUALIZADA: "Mesa actualizada correctamente.",
    MESA_LIBERADA: "Mesa liberada exitosamente.",
    
    PAGO_PROCESADO: "Pago procesado exitosamente.",
    PAGO_CONFIRMADO: "Pago confirmado correctamente.",
    
    USUARIO_CREADO: "Usuario creado exitosamente.",
    USUARIO_ACTUALIZADO: "Usuario actualizado correctamente.",
    
    CONFIGURACION_GUARDADA: "Configuración guardada exitosamente.",
  },
  
  // Mensajes Informativos
  INFO: {
    CARGANDO: "Cargando...",
    PROCESANDO: "Procesando...",
    GUARDANDO: "Guardando cambios...",
    ENVIANDO: "Enviando...",
    VERIFICANDO: "Verificando...",
    
    SIN_DATOS: "No hay datos disponibles.",
    SIN_RESULTADOS: "No se encontraron resultados.",
    SIN_PEDIDOS: "No hay pedidos activos.",
    SIN_MESAS: "No hay mesas disponibles.",
  },
  
  // Mensajes de Confirmación
  CONFIRMACION: {
    CANCELAR_PEDIDO: "¿Está seguro que desea cancelar este pedido?",
    ELIMINAR_ITEM: "¿Está seguro que desea eliminar este ítem?",
    CERRAR_MESA: "¿Está seguro que desea cerrar esta mesa?",
    INVITAR_CASA: "¿Desea invitar la casa para esta mesa?",
    CERRAR_SESION: "¿Está seguro que desea cerrar sesión?",
  },
  
  // Labels de UI
  LABELS: {
    // Campos de formulario
    EMAIL: "Correo electrónico",
    PASSWORD: "Contraseña",
    NOMBRE: "Nombre",
    APELLIDO: "Apellido",
    TELEFONO: "Teléfono",
    DIRECCION: "Dirección",
    
    // Pedidos
    NUMERO_PEDIDO: "Número de pedido",
    ESTADO_PEDIDO: "Estado del pedido",
    FECHA_PEDIDO: "Fecha del pedido",
    ITEMS_PEDIDO: "Ítems del pedido",
    TOTAL_PEDIDO: "Total del pedido",
    
    // Mesas
    NUMERO_MESA: "Número de mesa",
    ESTADO_MESA: "Estado de la mesa",
    CAPACIDAD: "Capacidad",
    ZONA: "Zona",
    
    // Pagos
    METODO_PAGO: "Método de pago",
    MONTO: "Monto",
    PROPINA: "Propina",
    TOTAL: "Total",
  },
  
  // Placeholders
  PLACEHOLDERS: {
    BUSCAR: "Buscar...",
    SELECCIONAR: "Seleccione una opción",
    INGRESE_EMAIL: "Ingrese su correo electrónico",
    INGRESE_PASSWORD: "Ingrese su contraseña",
    COMENTARIOS: "Comentarios adicionales (opcional)",
  },
  
  // Estados
  ESTADOS: {
    PEDIDO: {
      PENDIENTE: "Pendiente",
      EN_PREPARACION: "En preparación",
      LISTO: "Listo",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
    },
    MESA: {
      DISPONIBLE: "Disponible",
      OCUPADA: "Ocupada",
      RESERVADA: "Reservada",
      EN_LIMPIEZA: "En limpieza",
    },
    PAGO: {
      PENDIENTE: "Pendiente",
      PROCESANDO: "Procesando",
      APROBADO: "Aprobado",
      RECHAZADO: "Rechazado",
    },
  },
};

// Helper para obtener mensaje de error
export function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return MENSAJES.ERRORES.GENERICO;
}

// Formateo de números y fechas
export const formatearMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(monto);
};

export const formatearFecha = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fechaObj);
};

export const formatearFechaCompleta = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(fechaObj);
};
```

### Uso en Componentes

**ANTES:**
```typescript
// components/order-form.tsx
<Button>Create Order</Button>
<Label>Email</Label>
<Input placeholder="Enter email" />
```

**DESPUÉS:**
```typescript
// components/order-form.tsx
import { MENSAJES } from '@/lib/i18n/mensajes';

<Button>Crear Pedido</Button>
<Label>{MENSAJES.LABELS.EMAIL}</Label>
<Input placeholder={MENSAJES.PLACEHOLDERS.INGRESE_EMAIL} />
```

### Uso en Servicios

**ANTES:**
```typescript
// lib/order-service.ts
throw new Error("Order not found");
```

**DESPUÉS:**
```typescript
// lib/order-service.ts
import { MENSAJES } from '@/lib/i18n/mensajes';

throw new Error(MENSAJES.ERRORES.PEDIDO_NO_ENCONTRADO);
```

---

## 2️⃣ MANEJO DE ERRORES MEJORADO

### Crear Clase de Error Personalizada

**lib/errors.ts**
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, resource?: string) {
    super(message, 404, 'NOT_FOUND', { resource });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, 'CONFLICT', context);
    this.name = 'ConflictError';
  }
}
```

### Uso en Servicios

**ANTES:**
```typescript
// lib/order-service.ts
export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
    
  if (error) throw new Error("Failed to get order");
  if (!data) throw new Error("Order not found");
  
  return data;
}
```

**DESPUÉS:**
```typescript
// lib/order-service.ts
import { NotFoundError, AppError } from '@/lib/errors';
import { MENSAJES } from '@/lib/i18n/mensajes';
import { logger } from '@/lib/logger';

export async function obtenerPedido(pedidoId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', pedidoId)
      .single();
      
    if (error) {
      logger.error('Error al obtener pedido de la base de datos', {
        pedidoId,
        error: error.message,
      });
      throw new AppError(MENSAJES.ERRORES.GENERICO, 500);
    }
    
    if (!data) {
      throw new NotFoundError(MENSAJES.ERRORES.PEDIDO_NO_ENCONTRADO, 'pedido');
    }
    
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    logger.error('Error inesperado al obtener pedido', {
      pedidoId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new AppError(MENSAJES.ERRORES.GENERICO, 500);
  }
}
```

### Handler de Errores en API Routes

**lib/api-helpers.ts**
```typescript
import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { logger } from './logger';

export function manejarError(error: unknown, contexto?: string) {
  if (error instanceof AppError) {
    logger.warn('Error de aplicación', {
      contexto,
      mensaje: error.message,
      codigo: error.code,
      statusCode: error.statusCode,
      detalles: error.context,
    });
    
    return NextResponse.json(
      { 
        error: error.message,
        codigo: error.code,
        detalles: error.context,
      },
      { status: error.statusCode }
    );
  }
  
  // Error no manejado
  logger.error('Error no manejado', {
    contexto,
    error: error instanceof Error ? error.message : String(error),
  });
  
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}
```

**Uso en API Route:**
```typescript
// app/api/orders/[id]/route.ts
import { manejarError } from '@/lib/api-helpers';
import { obtenerPedido } from '@/lib/order-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pedido = await obtenerPedido(params.id);
    return NextResponse.json(pedido);
  } catch (error) {
    return manejarError(error, 'GET /api/orders/[id]');
  }
}
```

---

## 3️⃣ OPTIMIZACIÓN DE COMPONENTES

### Ejemplo: Optimizar Lista de Pedidos

**ANTES:**
```typescript
// components/orders-list.tsx
export function OrdersList({ orders }: { orders: Order[] }) {
  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const handleStatusChange = (newStatus: string) => {
    updateOrderStatus(order.id, newStatus);
  };
  
  return (
    <Card>
      <h3>Order #{order.id}</h3>
      <p>Status: {order.status}</p>
      <Button onClick={() => handleStatusChange('completed')}>
        Complete
      </Button>
    </Card>
  );
}
```

**DESPUÉS:**
```typescript
// components/orders-list.tsx
import { memo, useCallback, useMemo } from 'react';
import { MENSAJES } from '@/lib/i18n/mensajes';

interface OrdersListProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrdersList = memo(function OrdersList({ 
  orders,
  onStatusChange 
}: OrdersListProps) {
  // Virtualización para listas largas (> 100 items)
  const { items, scrollRef } = useVirtualizedList(orders, {
    itemHeight: 120,
    overscan: 5,
  });
  
  return (
    <div ref={scrollRef} className="overflow-auto max-h-screen">
      {items.map(order => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
});

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderCard = memo(function OrderCard({ 
  order,
  onStatusChange 
}: OrderCardProps) {
  // Memoizar callback para evitar re-renders
  const handleComplete = useCallback(() => {
    onStatusChange(order.id, 'completed');
  }, [order.id, onStatusChange]);
  
  // Memoizar cálculos pesados
  const total = useMemo(() => {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order.items]);
  
  const estadoTexto = MENSAJES.ESTADOS.PEDIDO[order.status];
  
  return (
    <Card>
      <h3>Pedido #{order.id}</h3>
      <p>Estado: {estadoTexto}</p>
      <p>Total: {formatearMoneda(total)}</p>
      <Button onClick={handleComplete}>
        {MENSAJES.EXITO.PEDIDO_ACTUALIZADO}
      </Button>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.items.length === nextProps.order.items.length
  );
});
```

### Lazy Loading de Componentes Pesados

**ANTES:**
```typescript
// app/dashboard/page.tsx
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
```

**DESPUÉS:**
```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';

const AnalyticsDashboard = dynamic(
  () => import('@/components/analytics-dashboard').then(mod => mod.AnalyticsDashboard),
  {
    loading: () => <LoadingSpinner mensaje={MENSAJES.INFO.CARGANDO} />,
    ssr: false, // Si no necesita SSR
  }
);

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
```

---

## 4️⃣ OPTIMIZACIÓN DE QUERIES

### Implementar Paginación

**ANTES:**
```typescript
// lib/order-service.ts
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw new Error("Failed to get orders");
  return data;
}
```

**DESPUÉS:**
```typescript
// lib/order-service.ts
interface PaginationParams {
  pagina: number;
  porPagina: number;
}

interface PaginatedResult<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export async function obtenerPedidosPaginados(
  params: PaginationParams
): Promise<PaginatedResult<Order>> {
  const { pagina, porPagina } = params;
  const inicio = (pagina - 1) * porPagina;
  const fin = inicio + porPagina - 1;
  
  // Obtener total de registros
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    logger.error('Error al contar pedidos', { error: countError.message });
    throw new AppError(MENSAJES.ERRORES.GENERICO);
  }
  
  // Obtener datos paginados
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      table_id,
      total,
      created_at,
      tables (
        number,
        zone
      )
    `)
    .order('created_at', { ascending: false })
    .range(inicio, fin);
    
  if (error) {
    logger.error('Error al obtener pedidos paginados', {
      error: error.message,
      pagina,
      porPagina,
    });
    throw new AppError(MENSAJES.ERRORES.GENERICO);
  }
  
  return {
    datos: data,
    total: count || 0,
    pagina,
    porPagina,
    totalPaginas: Math.ceil((count || 0) / porPagina),
  };
}
```

### Implementar Caching con React Query

**lib/hooks/use-orders.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerPedidosPaginados, crearPedido, actualizarPedido } from '@/lib/order-service';

export function usePedidos(pagina: number, porPagina: number = 20) {
  return useQuery({
    queryKey: ['pedidos', pagina, porPagina],
    queryFn: () => obtenerPedidosPaginados({ pagina, porPagina }),
    staleTime: 30000, // 30 segundos
    cacheTime: 300000, // 5 minutos
  });
}

export function useCrearPedido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: crearPedido,
    onSuccess: () => {
      // Invalidar cache de pedidos
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function useActualizarPedido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => 
      actualizarPedido(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache específico
      queryClient.invalidateQueries({ queryKey: ['pedido', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}
```

**Uso en Componente:**
```typescript
// components/orders-panel.tsx
export function OrdersPanel() {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, error } = usePedidos(pagina);
  const { mutate: crearPedido, isLoading: creando } = useCrearPedido();
  
  if (isLoading) return <LoadingSpinner mensaje={MENSAJES.INFO.CARGANDO} />;
  if (error) return <ErrorMessage mensaje={obtenerMensajeError(error)} />;
  
  return (
    <div>
      <OrdersList orders={data.datos} />
      <Pagination
        paginaActual={pagina}
        totalPaginas={data.totalPaginas}
        onCambioPagina={setPagina}
      />
    </div>
  );
}
```

---

## 5️⃣ SISTEMA DE LOGGING

### Logger Estructurado Mejorado

**lib/logger.ts**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private contextoGlobal: LogContext = {};
  
  constructor() {
    // Contexto global que se incluirá en todos los logs
    this.contextoGlobal = {
      environment: process.env.NODE_ENV,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    };
  }
  
  private log(level: LogLevel, mensaje: string, contexto?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      nivel: level,
      timestamp,
      mensaje,
      ...this.contextoGlobal,
      ...contexto,
    };
    
    // En desarrollo, mostrar en consola con formato legible
    if (process.env.NODE_ENV === 'development') {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];
      
      console[level === 'debug' ? 'log' : level](
        `${emoji} [${timestamp}] ${mensaje}`,
        contexto || ''
      );
    } else {
      // En producción, enviar a servicio de logging (ej: Datadog, Sentry)
      this.enviarAServicioExterno(logData);
    }
  }
  
  debug(mensaje: string, contexto?: LogContext) {
    this.log('debug', mensaje, contexto);
  }
  
  info(mensaje: string, contexto?: LogContext) {
    this.log('info', mensaje, contexto);
  }
  
  warn(mensaje: string, contexto?: LogContext) {
    this.log('warn', mensaje, contexto);
  }
  
  error(mensaje: string, contexto?: LogContext) {
    this.log('error', mensaje, contexto);
    
    // Enviar errores a Sentry u otro servicio
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(new Error(mensaje), { extra: contexto });
    }
  }
  
  private enviarAServicioExterno(logData: any) {
    // Implementar integración con servicio de logging
    // Por ejemplo: Datadog, Logtail, etc.
  }
  
  // Crear logger con contexto específico
  crearLoggerConContexto(contexto: LogContext): Logger {
    const logger = new Logger();
    logger.contextoGlobal = { ...this.contextoGlobal, ...contexto };
    return logger;
  }
}

export const logger = new Logger();

// Crear loggers específicos por módulo
export const orderLogger = logger.crearLoggerConContexto({ modulo: 'orders' });
export const paymentLogger = logger.crearLoggerConContexto({ modulo: 'payments' });
export const authLogger = logger.crearLoggerConContexto({ modulo: 'auth' });
```

**Uso en Servicios:**
```typescript
// lib/order-service.ts
import { orderLogger as logger } from '@/lib/logger';

export async function crearPedido(datos: CreateOrderData) {
  logger.info('Iniciando creación de pedido', {
    mesaId: datos.tableId,
    cantidadItems: datos.items.length,
  });
  
  try {
    // Lógica de creación...
    
    logger.info('Pedido creado exitosamente', {
      pedidoId: nuevoPedido.id,
      mesaId: datos.tableId,
      total: nuevoPedido.total,
    });
    
    return nuevoPedido;
  } catch (error) {
    logger.error('Error al crear pedido', {
      mesaId: datos.tableId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
```

---

## 6️⃣ TESTS MEJORADOS

### Test Unitario Completo

**lib/__tests__/order-service.test.ts**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearPedido, obtenerPedido, actualizarEstadoPedido } from '../order-service';
import { NotFoundError, ValidationError } from '../errors';
import { MENSAJES } from '../i18n/mensajes';

// Mock de Supabase
vi.mock('../supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('order-service', () => {
  describe('crearPedido', () => {
    it('debería crear un pedido exitosamente', async () => {
      // Arrange
      const datosPedido = {
        tableId: '123',
        items: [
          { menuItemId: 'item-1', quantity: 2, price: 100 },
        ],
      };
      
      // Act
      const pedido = await crearPedido(datosPedido);
      
      // Assert
      expect(pedido).toBeDefined();
      expect(pedido.tableId).toBe(datosPedido.tableId);
      expect(pedido.items).toHaveLength(1);
      expect(pedido.total).toBe(200);
    });
    
    it('debería lanzar ValidationError si no hay items', async () => {
      // Arrange
      const datosPedido = {
        tableId: '123',
        items: [],
      };
      
      // Act & Assert
      await expect(crearPedido(datosPedido)).rejects.toThrow(ValidationError);
      await expect(crearPedido(datosPedido)).rejects.toThrow(
        MENSAJES.ERRORES.VALIDACION
      );
    });
  });
  
  describe('obtenerPedido', () => {
    it('debería obtener un pedido existente', async () => {
      // Arrange
      const pedidoId = 'order-123';
      
      // Act
      const pedido = await obtenerPedido(pedidoId);
      
      // Assert
      expect(pedido).toBeDefined();
      expect(pedido.id).toBe(pedidoId);
    });
    
    it('debería lanzar NotFoundError si el pedido no existe', async () => {
      // Arrange
      const pedidoId = 'pedido-inexistente';
      
      // Act & Assert
      await expect(obtenerPedido(pedidoId)).rejects.toThrow(NotFoundError);
      await expect(obtenerPedido(pedidoId)).rejects.toThrow(
        MENSAJES.ERRORES.PEDIDO_NO_ENCONTRADO
      );
    });
  });
});
```

### Test de Integración

**tests/integration/order-flow.test.ts**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { crearTestClient, limpiarBaseDatos } from './test-helpers';

describe('Flujo completo de pedido', () => {
  let testClient: any;
  let testUser: any;
  let testTable: any;
  
  beforeAll(async () => {
    testClient = await crearTestClient();
    testUser = await crearUsuarioPrueba();
    testTable = await crearMesaPrueba();
  });
  
  afterAll(async () => {
    await limpiarBaseDatos();
  });
  
  it('debería completar el flujo de pedido: crear -> actualizar -> pagar', async () => {
    // 1. Crear pedido
    const pedido = await testClient.post('/api/orders', {
      tableId: testTable.id,
      items: [
        { menuItemId: 'pizza-1', quantity: 1, price: 150 },
      ],
    });
    
    expect(pedido.status).toBe(201);
    expect(pedido.data.id).toBeDefined();
    
    // 2. Actualizar estado a "en preparación"
    const pedidoActualizado = await testClient.patch(
      `/api/orders/${pedido.data.id}`,
      { status: 'preparing' }
    );
    
    expect(pedidoActualizado.status).toBe(200);
    expect(pedidoActualizado.data.status).toBe('preparing');
    
    // 3. Procesar pago
    const pago = await testClient.post('/api/payments', {
      orderId: pedido.data.id,
      amount: 150,
      method: 'cash',
    });
    
    expect(pago.status).toBe(200);
    expect(pago.data.status).toBe('approved');
    
    // 4. Verificar que el pedido se marcó como pagado
    const pedidoFinal = await testClient.get(`/api/orders/${pedido.data.id}`);
    expect(pedidoFinal.data.paid).toBe(true);
  });
});
```

---

## 🎯 RESUMEN DE MEJORES PRÁCTICAS

### ✅ DO (Hacer)

1. **Usar sistema de i18n consistente** para todos los mensajes
2. **Implementar manejo de errores robusto** con clases personalizadas
3. **Optimizar componentes** con memo, useMemo, useCallback
4. **Implementar paginación** en listados grandes
5. **Usar caching** con React Query o SWR
6. **Logging estructurado** con contexto relevante
7. **Tests completos** unitarios e integración
8. **Tipado estricto** sin `any`

### ❌ DON'T (No hacer)

1. **No mezclar idiomas** en mensajes (inglés/español)
2. **No usar console.log** directamente (usar logger)
3. **No cargar todo** sin paginación
4. **No tener componentes sin memo** cuando procesan mucha data
5. **No lanzar strings** como errores (usar clases de Error)
6. **No hardcodear mensajes** en componentes
7. **No olvidar cleanup** de efectos y listeners
8. **No skip** de tests en código crítico

---

**Autor:** GitHub Copilot  
**Fecha:** 11 de Octubre de 2025  
**Versión:** 1.0
