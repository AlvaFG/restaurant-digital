# ✅ Supabase Setup Complete - Next Steps

¡Excelente! Has completado el setup inicial de Supabase. 🎉

## 📦 Dependencias Instaladas

```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest"
  }
}
```

## 📁 Archivos Creados

```
✅ lib/supabase/
   ├── client.ts           # Cliente browser
   ├── server.ts           # Cliente server
   ├── admin.ts            # Cliente admin (service role)
   └── types.ts            # TypeScript types

✅ supabase/
   ├── config.toml         # Configuración local
   └── migrations/
       └── 20251011000001_init_schema.sql

✅ docs/database/
   ├── SUPABASE_MIGRATION_PLAN.md
   └── SUPABASE_QUICKSTART.md
```

---

## 🚀 Próximos Pasos

### 1. Instalar Supabase CLI (Global)

```bash
# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS
brew install supabase/tap/supabase

# NPX (alternativa multiplataforma)
npx supabase --version
```

### 2. Crear Proyecto en Supabase

Ve a: https://supabase.com/dashboard

1. **Crear nuevo proyecto**:
   - Name: `restaurant-digital-dev`
   - Database Password: (genera una segura)
   - Region: **South America (São Paulo)**
   
2. **Esperar ~2 minutos** a que se cree el proyecto

3. **Copiar credenciales**:
   - Ve a Settings → API
   - Copia:
     - Project URL
     - anon/public key
     - service_role key (⚠️ SECRET)

### 3. Configurar Variables de Entorno

```bash
# Copiar ejemplo
cp .env.example .env.local
```

Editar `.env.local`:
```env
# Pegar valores de Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...  # ⚠️ NO COMMITEAR
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
```

### 4. Aplicar Migrations

**Opción A: Local Development (Recomendado para testing)**

```bash
# Iniciar Supabase local (Docker required)
npx supabase start

# Aplicar migrations
npx supabase db reset

# Ver Studio local
# http://localhost:54323
```

**Opción B: Cloud (Producción/Desarrollo)**

```bash
# Login
npx supabase login

# Link proyecto
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

### 5. Generar TypeScript Types

```bash
# Desde local
npx supabase gen types typescript --local > lib/supabase/types.ts

# Desde cloud
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > lib/supabase/types.ts
```

### 6. Test Connection

Crea `scripts/test-supabase.ts`:

```typescript
import { createBrowserClient } from '@/lib/supabase/client'

async function test() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from('tenants').select('*')
  
  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Connected! Tenants:', data)
  }
}

test()
```

```bash
npx tsx scripts/test-supabase.ts
```

---

## 🎯 Estrategia de Migración

### Fase 1: Crear Adapters (Semana 1)
- [ ] `lib/db/adapters/menu-adapter.ts`
- [ ] `lib/db/adapters/order-adapter.ts`
- [ ] `lib/db/adapters/payment-adapter.ts`
- [ ] `lib/db/adapters/table-adapter.ts`

### Fase 2: Feature Flags (Semana 2)
```env
NEXT_PUBLIC_USE_SUPABASE_MENU=true    # ← Habilitar uno por uno
NEXT_PUBLIC_USE_SUPABASE_ORDERS=false
NEXT_PUBLIC_USE_SUPABASE_PAYMENTS=false
```

### Fase 3: Seed Data (Semana 2-3)
- [ ] Migrar `data/menu-store.json` → Supabase
- [ ] Migrar `data/table-store.json` → Supabase
- [ ] Seed inicial para desarrollo

### Fase 4: Real-time (Semana 3)
- [ ] Reemplazar WebSocket custom
- [ ] Supabase Realtime subscriptions
- [ ] Cleanup socket-bus legacy

### Fase 5: Auth (Semana 4)
- [ ] Supabase Auth
- [ ] Row Level Security (RLS)
- [ ] Deprecar mock auth

---

## 📚 Recursos

- **[Plan Completo](./SUPABASE_MIGRATION_PLAN.md)** - 50+ páginas de documentación
- **[Quickstart](./SUPABASE_QUICKSTART.md)** - Guía rápida
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🆘 Troubleshooting

### Error: "Cannot find module @supabase/ssr"
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Error: "Docker not found"
Supabase CLI local require Docker Desktop.
Alternativa: Usar cloud directamente.

### Error: "SUPABASE_URL not set"
Verifica que `.env.local` tenga las variables correctas.

---

## ✅ Checklist

- [x] Dependencias instaladas
- [x] Archivos creados
- [x] Migration inicial lista
- [ ] Proyecto Supabase creado
- [ ] Variables de entorno configuradas
- [ ] Migrations aplicadas
- [ ] Types generados
- [ ] Test connection exitoso

---

**Siguiente paso recomendado:**  
👉 Crear proyecto en Supabase Dashboard y configurar `.env.local`

**Tiempo estimado:** 10-15 minutos

¿Listo para continuar? 🚀
