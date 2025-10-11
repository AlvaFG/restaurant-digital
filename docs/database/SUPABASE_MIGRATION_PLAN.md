# 🚀 Plan de Migración a Supabase

**Fecha**: 11 de octubre de 2025  
**Objetivo**: Migrar del sistema de persistencia basado en archivos JSON a Supabase  
**Milestone**: M7 - Database & Real Backend  

---

## 📋 Estado Actual

### Sistema Actual (File-based)
```
data/
├── menu-store.json          → Categorías, items, alérgenos
├── order-store.json         → Órdenes, inventory, sequence
├── payment-store.json       → Pagos, metadata
├── table-store.json         → Mesas, layouts, QR codes
└── __test__/                → Test fixtures
```

### Stores Actuales
- `lib/server/menu-store.ts`
- `lib/server/order-store.ts`
- `lib/server/payment-store.ts`
- `lib/server/table-store.ts`
- `lib/server/session-manager.ts`

---

## 🎯 Objetivos de la Migración

### Funcionales
- ✅ Mantener toda la funcionalidad existente
- ✅ Migración sin downtime (transición gradual)
- ✅ Compatibilidad con tests existentes
- ✅ Real-time subscriptions (reemplazar WebSocket custom)

### No Funcionales
- ✅ Performance: <200ms queries
- ✅ Escalabilidad: Multi-tenant ready
- ✅ Seguridad: Row Level Security (RLS)
- ✅ Backups automáticos
- ✅ Migrations versionadas

---

## 📊 Schema de Base de Datos

### Core Tables

#### 1. **tenants** (Multi-tenant support)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings JSON structure:
{
  "theme": {
    "accentColor": "#3b82f6"
  },
  "features": {
    "tablets": true,
    "kds": true,
    "payments": true
  }
}
```

#### 2. **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'manager')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

#### 3. **tables**
```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  zone TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'libre' CHECK (
    status IN ('libre', 'ocupada', 'reservada', 'pedido-en-curso', 'cuenta-pedida', 'en-limpieza')
  ),
  position JSONB, -- { x: number, y: number }
  qrcode_url TEXT,
  qr_token TEXT,
  qr_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, number)
);

CREATE INDEX idx_tables_tenant ON tables(tenant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_qr_token ON tables(qr_token);
```

#### 4. **menu_categories**
```sql
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_menu_categories_tenant ON menu_categories(tenant_id);
CREATE INDEX idx_menu_categories_sort ON menu_categories(sort_order);
```

#### 5. **menu_items**
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  allergens JSONB DEFAULT '[]'::jsonb, -- [{ code, contains, traces, notes }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(available);
```

#### 6. **inventory**
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, menu_item_id)
);

CREATE INDEX idx_inventory_tenant ON inventory(tenant_id);
CREATE INDEX idx_inventory_low_stock ON inventory(stock) WHERE stock <= min_stock;
```

#### 7. **orders**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL, -- ord-timestamp-sequence-random
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (
    status IN ('abierto', 'en-preparacion', 'listo', 'servido', 'pagado', 'cancelado')
  ),
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (
    payment_status IN ('pendiente', 'parcial', 'pagado', 'reembolsado')
  ),
  source TEXT DEFAULT 'staff' CHECK (source IN ('staff', 'qr', 'kiosk')),
  subtotal_cents INTEGER NOT NULL,
  discount_total_cents INTEGER DEFAULT 0,
  tax_total_cents INTEGER NOT NULL,
  tip_cents INTEGER DEFAULT 0,
  service_charge_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  notes TEXT,
  customer_data JSONB, -- { name, email, phone }
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

#### 8. **order_items**
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE RESTRICT,
  name TEXT NOT NULL, -- Snapshot del nombre
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  notes TEXT,
  modifiers JSONB DEFAULT '[]'::jsonb, -- [{ id?, name, priceCents }]
  discount JSONB, -- { type, value, amountCents, code, reason }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);
```

#### 9. **order_discounts**
```sql
CREATE TABLE order_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  amount_cents INTEGER NOT NULL,
  code TEXT,
  reason TEXT,
  scope TEXT NOT NULL DEFAULT 'order' CHECK (scope IN ('order', 'item')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_discounts_order ON order_discounts(order_id);
```

#### 10. **order_taxes**
```sql
CREATE TABLE order_taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_taxes_order ON order_taxes(order_id);
```

#### 11. **payments**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  payment_number TEXT NOT NULL, -- pmt-timestamp-sequence-random
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'stripe', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled', 'expired')
  ),
  method TEXT, -- card, cash, transfer, etc.
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  external_id TEXT, -- Provider payment ID
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  failure_code TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, payment_number)
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_id ON payments(external_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
```

#### 12. **qr_sessions**
```sql
CREATE TABLE qr_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'expired', 'error')
  ),
  ip_address INET,
  user_agent TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_sessions_tenant ON qr_sessions(tenant_id);
CREATE INDEX idx_qr_sessions_table ON qr_sessions(table_id);
CREATE INDEX idx_qr_sessions_token ON qr_sessions(token);
CREATE INDEX idx_qr_sessions_status ON qr_sessions(status);
CREATE INDEX idx_qr_sessions_expires ON qr_sessions(expires_at);
```

#### 13. **audit_logs** (Optional but recommended)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  entity_type TEXT NOT NULL, -- 'order', 'payment', 'table', etc.
  entity_id UUID,
  changes JSONB, -- { before: {}, after: {} }
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## 🔐 Row Level Security (RLS)

### Políticas por Tabla

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Ejemplo: Users solo ven su tenant
CREATE POLICY "Users can view own tenant"
  ON users FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Ejemplo: QR sessions son públicas para lectura con token
CREATE POLICY "QR sessions public read with token"
  ON qr_sessions FOR SELECT
  USING (token = current_setting('app.qr_token', true)::text);
```

---

## 🛠️ Implementación por Fases

### **Fase 1: Setup & Schema** (Semana 1)

#### Día 1-2: Configuración Inicial
- [ ] Crear proyecto en Supabase
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias
- [ ] Crear migrations iniciales

**Archivos a crear:**
```
.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres
```

**Dependencias:**
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install -D @supabase/cli
```

**Estructura:**
```
lib/
├── supabase/
│   ├── client.ts           # Cliente browser
│   ├── server.ts           # Cliente server
│   ├── admin.ts            # Cliente admin (service role)
│   └── types.ts            # Types generados
supabase/
├── migrations/
│   ├── 20251011000001_init_schema.sql
│   ├── 20251011000002_add_rls.sql
│   └── 20251011000003_seed_data.sql
└── config.toml
```

#### Día 3-5: Crear Schema
- [ ] Escribir migration `init_schema.sql`
- [ ] Aplicar RLS policies
- [ ] Crear seed data para testing
- [ ] Generar TypeScript types

---

### **Fase 2: Adapter Layer** (Semana 2)

Crear capa de adaptadores para NO romper código existente:

```typescript
// lib/db/adapters/menu-adapter.ts
import { createServerClient } from '@/lib/supabase/server'
import type { MenuResponse, MenuItem } from '@/lib/mock-data'

export class MenuAdapter {
  /**
   * Adaptador: mantiene la misma firma que menu-store
   */
  async getMenuCatalog(): Promise<MenuResponse> {
    const supabase = createServerClient()
    
    const [categories, items, allergens] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*'),
      // Allergens pueden estar hardcoded o en tabla separada
    ])
    
    return {
      categories: categories.data?.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        sort: c.sort_order
      })) || [],
      items: items.data?.map(this.mapMenuItem) || [],
      allergens: MOCK_ALLERGENS, // Por ahora
      metadata: {
        currency: 'ARS',
        version: 1, // Calcular desde updated_at
        updatedAt: new Date().toISOString()
      }
    }
  }
  
  private mapMenuItem(row: any): MenuItem {
    return {
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      priceCents: row.price_cents,
      available: row.available,
      allergens: row.allergens || [],
      tags: row.tags || [],
      imageUrl: row.image_url
    }
  }
}
```

**Archivos a crear:**
```
lib/db/
├── adapters/
│   ├── menu-adapter.ts
│   ├── order-adapter.ts
│   ├── payment-adapter.ts
│   ├── table-adapter.ts
│   └── session-adapter.ts
└── index.ts  # Re-exports
```

---

### **Fase 3: Migration Gradual** (Semana 3-4)

#### Estrategia: Feature Flags

```typescript
// lib/config/features.ts
export const FEATURES = {
  USE_SUPABASE_MENU: process.env.NEXT_PUBLIC_USE_SUPABASE_MENU === 'true',
  USE_SUPABASE_ORDERS: process.env.NEXT_PUBLIC_USE_SUPABASE_ORDERS === 'true',
  USE_SUPABASE_PAYMENTS: process.env.NEXT_PUBLIC_USE_SUPABASE_PAYMENTS === 'true',
  USE_SUPABASE_TABLES: process.env.NEXT_PUBLIC_USE_SUPABASE_TABLES === 'true',
}

// lib/db/menu-repository.ts
import { FEATURES } from '@/lib/config/features'
import { MenuAdapter } from './adapters/menu-adapter'
import * as MenuStore from '@/lib/server/menu-store'

export async function getMenuCatalog() {
  if (FEATURES.USE_SUPABASE_MENU) {
    const adapter = new MenuAdapter()
    return adapter.getMenuCatalog()
  }
  return MenuStore.getMenuCatalog()
}
```

#### Orden de Migración
1. **Semana 3**: Menu & Tables (read-only primero)
2. **Semana 4**: Orders & Inventory
3. **Semana 5**: Payments & Sessions
4. **Semana 6**: Auth & Users

---

### **Fase 4: Real-time Subscriptions** (Semana 5)

Reemplazar WebSocket custom con Supabase Realtime:

```typescript
// hooks/use-realtime-orders.ts
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function useRealtimeOrders() {
  const [orders, setOrders] = useState([])
  const supabase = createBrowserClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order changed:', payload)
          // Actualizar estado
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return orders
}
```

---

### **Fase 5: Auth Migration** (Semana 6)

```typescript
// lib/auth/supabase-auth.ts
import { createServerClient } from '@/lib/supabase/server'

export class SupabaseAuthService {
  async login(email: string, password: string) {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data.user
  }
  
  async logout() {
    const supabase = createServerClient()
    await supabase.auth.signOut()
  }
  
  async getCurrentUser() {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getUser()
    return data.user
  }
}
```

---

## 📋 Checklist Completo

### Setup
- [ ] Crear proyecto Supabase
- [ ] Configurar .env.local
- [ ] Instalar dependencias
- [ ] Configurar Supabase CLI

### Schema & Migrations
- [ ] Migration: Schema inicial
- [ ] Migration: RLS policies
- [ ] Migration: Seed data
- [ ] Generar TypeScript types

### Adapters
- [ ] MenuAdapter
- [ ] OrderAdapter
- [ ] PaymentAdapter
- [ ] TableAdapter
- [ ] SessionAdapter

### Testing
- [ ] Tests con Supabase local
- [ ] Tests de migración
- [ ] Tests de compatibilidad
- [ ] Performance benchmarks

### Feature Flags
- [ ] Implementar feature flags
- [ ] Configurar por módulo
- [ ] Logging de uso
- [ ] Rollback plan

### Real-time
- [ ] Migrar eventos de orders
- [ ] Migrar eventos de payments
- [ ] Migrar eventos de tables
- [ ] Cleanup WebSocket custom

### Auth
- [ ] Migrar a Supabase Auth
- [ ] JWT validation
- [ ] Session management
- [ ] RLS policies

### Production
- [ ] Backup strategy
- [ ] Monitoring setup
- [ ] Error tracking
- [ ] Performance optimization

---

## 📊 Métricas de Éxito

### Performance
- ✅ Query time <200ms (95th percentile)
- ✅ Real-time latency <100ms
- ✅ Concurrent connections >1000

### Reliability
- ✅ 99.9% uptime
- ✅ Automatic backups daily
- ✅ Point-in-time recovery

### Development
- ✅ Zero breaking changes
- ✅ All tests passing
- ✅ Documentation complete

---

## 🚨 Rollback Plan

En caso de problemas:

```bash
# 1. Deshabilitar feature flags
NEXT_PUBLIC_USE_SUPABASE_MENU=false
NEXT_PUBLIC_USE_SUPABASE_ORDERS=false

# 2. Sistema vuelve a JSON stores automáticamente

# 3. Investigar y fix

# 4. Re-enable cuando esté listo
```

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**Tiempo estimado total**: 6-8 semanas  
**Esfuerzo**: 1-2 developers full-time  
**Riesgo**: MEDIO (migration compleja pero con rollback)  
**ROI**: ALTO (escalabilidad, real-time, seguridad)
