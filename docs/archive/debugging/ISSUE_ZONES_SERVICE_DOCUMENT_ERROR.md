# 🔴 PROBLEMA CRÍTICO: zones-service usa createBrowserClient()

**Fecha**: Octubre 16, 2025, 8:50 PM  
**Error**: `ReferenceError: document is not defined`  
**Severidad**: 🔥 BLOQUEANTE

---

## 🐛 Problema

`zones-service.ts` usa `createBrowserClient()` que intenta acceder a `document.cookie`, pero este servicio se llama desde:

1. ✅ **Frontend** (hooks → fetch API → zones API)
2. ❌ **Backend/Server** (zones API → zones-service) ← **AQUÍ FALLA**

```typescript
// lib/services/zones-service.ts línea 23
export async function getZones(tenantId: string, includeInactive = false) {
  const supabase = createBrowserClient()  // ❌ FALLA en server-side
  //                ↑ Intenta acceder a document.cookie
```

---

## 🔍 Stack Trace

```
GET /api/zones?includeInactive=false 500
ReferenceError: document is not defined
    at Object.getAll (lib/supabase/client.ts:45:17)
```

---

## ✅ Solución

`zones-service.ts` debe usar **createServerClient()** de Supabase para funcionar en server-side.

### Opción A: Crear zones-service SERVER-SIDE (RECOMENDADA)

Modificar `lib/services/zones-service.ts` para detectar contexto y usar el cliente correcto:

```typescript
import { createBrowserClient } from "@/lib/supabase/client"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { cookies } from 'next/headers'

function getSupabaseClient() {
  // Detectar si estamos en servidor o cliente
  if (typeof window === 'undefined') {
    // Server-side: usar createClient directo con service_role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } else {
    // Client-side: usar browser client
    return createBrowserClient()
  }
}

export async function getZones(tenantId: string, includeInactive = false) {
  const supabase = getSupabaseClient()
  // ... resto del código
}
```

**Problema**: Usar service_role key bypasea RLS, no es ideal.

---

### Opción B: NO USAR zones-service en API (MEJOR)

**El API NO debería llamar a zones-service**. El servicio es para cliente. El API debería:

1. Usar `createServerClient()` directamente
2. O crear un `zones-server.ts` separado

```typescript
// app/api/zones/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('tenant_id', tenantId)
  
  // ...
}
```

---

### Opción C: Migrar zones-service a usar parámetro (RÁPIDA)

Pasar el cliente Supabase como parámetro:

```typescript
// lib/services/zones-service.ts
export async function getZones(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  includeInactive = false
) {
  // Ya no crea cliente, lo recibe
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('tenant_id', tenantId)
  // ...
}

// app/api/zones/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { getZones } from '@/lib/services/zones-service'

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await getZones(supabase, tenantId)
  // ...
}
```

---

## 🎯 Decisión Recomendada

**Opción B + C Híbrida**:

1. API routes usan `createServerClient()` directamente (inline queries)
2. zones-service queda solo para uso en server components/actions

**¿Por qué?**
- ✅ API tiene control completo de autenticación
- ✅ Servicios separados por contexto (client vs server)
- ✅ No bypasea RLS
- ✅ Más explícito y mantenible

---

## 📝 Implementación Propuesta

### Modificar app/api/zones/route.ts

```typescript
import { NextResponse } from "next/server"
import { getCurrentUser, createServerClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 })
    }

    // Usar createServerClient directamente
    const supabase = await createServerClient()
    
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: zones })
  } catch (error) {
    logger.error('Error al obtener zonas', error as Error)
    return NextResponse.json(
      { error: 'No se pudieron cargar las zonas' },
      { status: 500 }
    )
  }
}
```

---

**¿Procedemos con esta solución?**
