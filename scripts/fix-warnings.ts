/**
 * Script de corrección automática de warnings
 * Resuelve imports y variables sin uso
 */

// Mapeo de archivos y correcciones
const corrections = {
  // Variables sin uso que se pueden prefijar con _
  'app/(public)/qr/validate/__tests__/validate-page.test.tsx': [
    { from: 'vi,', to: '_vi,' },
    { from: 'beforeEach', to: '_beforeEach' }
  ],
  'app/(public)/qr/[tableId]/page.tsx': [
    { from: 'const hasUnavailableItems =', to: 'const _hasUnavailableItems =' }
  ],
  'app/(public)/qr/_components/qr-checkout-form.tsx': [
    { from: 'sessionId,', to: '_sessionId,' },
    { from: 'const basePrice =', to: 'const _basePrice =' },
    { from: 'const modifiersPrice =', to: 'const _modifiersPrice =' }
  ],
  'app/analitica/_components/popular-items-list.tsx': [
    { from: 'TrendingDown,', to: '_TrendingDown,' }
  ],
  'app/analitica/_components/qr-usage-stats.tsx': [
    { from: 'CardDescription,', to: '_CardDescription,' }
  ],
  'app/api/dashboard/metrics/route.ts': [
    { from: 'error: yesterdayError', to: 'error: _yesterdayError' }
  ],
  'app/api/order/qr/route.ts': [
    { from: 'OrderItem,', to: '_OrderItem,' },
    { from: 'const order =', to: 'const _order =' }
  ],
  'app/api/payment/webhook/route.ts': [
    { from: 'export async function GET(request:', to: 'export async function GET(_request:' }
  ],
  'app/dashboard/page.tsx': [
    { from: 'Bell,', to: '_Bell,' },
    { from: 'const tenant =', to: 'const _tenant =' },
    { from: 'const salesGrowth =', to: 'const _salesGrowth =' },
    { from: 'const ticketGrowth =', to: 'const _ticketGrowth =' }
  ],
  'app/menu/__tests__/menu-page.test.tsx': [
    { from: 'const user =', to: 'const _user =' }
  ],
  'components/add-table-dialog.tsx': [
    { from: 'const handleInputChange =', to: 'const _handleInputChange =' }
  ],
  'components/dashboard-layout.tsx': [
    { from: 'ThemeToggle', to: '_ThemeToggle' }
  ],
  'components/orders-panel.tsx': [
    { from: 'const lastUpdated =', to: 'const _lastUpdated =' }
  ],
  'components/qr-management-panel.tsx': [
    { from: 'Input,', to: '_Input,' }
  ],
  'components/table-list.tsx': [
    { from: 'RefreshCw,', to: '_RefreshCw,' },
    { from: 'MENSAJES,', to: '_MENSAJES,' }
  ],
  'components/zones-management.tsx': [
    { from: ', error } =', to: ', error: _error } =' }
  ],
  'lib/dashboard-service.ts': [
    { from: 'tenantId:', to: '_tenantId:' }
  ],
  'lib/order-service.ts': [
    { from: 'NotFoundError,', to: '_NotFoundError,' },
    { from: 'const API_TIMEOUT_MESSAGE =', to: 'const _API_TIMEOUT_MESSAGE =' },
    { from: 'const CREATE_ORDER_GENERIC_ERROR_MESSAGE =', to: 'const _CREATE_ORDER_GENERIC_ERROR_MESSAGE =' }
  ],
  'lib/server/session-store.ts': [
    { from: 'const DEFAULT_SESSION_TTL =', to: 'const _DEFAULT_SESSION_TTL =' }
  ],
  'app/api/tables/route.ts': [
    { from: 'manejarError,', to: '_manejarError,' }
  ],
  'app/api/order/route.ts': [
    { from: 'manejarError', to: '_manejarError' }
  ],
  'app/api/tables/[id]/route.ts': [
    { from: 'NotFoundError,', to: '_NotFoundError,' }
  ],
  'app/api/zones/route.ts': [
    { from: 'const duration =', to: 'const _duration =' }
  ]
};

console.log('Correcciones mapeadas:', Object.keys(corrections).length, 'archivos');
console.log('Este script es solo una guía - las correcciones se aplicarán manualmente');
