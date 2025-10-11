# Supabase Quick Start Guide

## 🚀 Paso 1: Instalar Dependencias

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D @supabase/cli
```

## 🔧 Paso 2: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Crea un nuevo proyecto:
   - **Name**: restaurant-digital-dev
   - **Database Password**: Genera una segura
   - **Region**: South America (São Paulo) - más cercano a Argentina

## 📝 Paso 3: Configurar Variables de Entorno

Copia las credenciales de tu proyecto:

```bash
# En Supabase Dashboard -> Settings -> API
cp .env.example .env.local
```

Edita `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
```

## 🗃️ Paso 4: Configurar Supabase CLI

```bash
# Login
npx supabase login

# Vincular proyecto
npx supabase link --project-ref your-project-ref

# El project-ref está en la URL: https://app.supabase.com/project/your-project-ref
```

## 📊 Paso 5: Crear Schema Inicial

```bash
# Crear primera migración
npx supabase migration new init_schema

# Esto creará: supabase/migrations/20251011000001_init_schema.sql
```

Copia el contenido del schema desde `docs/database/migrations/` (próximo paso)

## ▶️ Paso 6: Aplicar Migrations

```bash
# Development local (Supabase CLI inicia Docker)
npx supabase start
npx supabase db reset

# Production
npx supabase db push
```

## 🧪 Paso 7: Generar TypeScript Types

```bash
# Desde schema local
npx supabase gen types typescript --local > lib/supabase/types.ts

# Desde producción
npx supabase gen types typescript --project-id your-project-ref > lib/supabase/types.ts
```

## ✅ Paso 8: Verificar Configuración

Crea un archivo de prueba:

```typescript
// scripts/test-supabase.ts
import { createBrowserClient } from '@/lib/supabase/client'

async function testConnection() {
  const supabase = createBrowserClient()
  
  // Test simple query
  const { data, error } = await supabase
    .from('tenants')
    .select('count')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('✅ Supabase connected!', data)
}

testConnection()
```

```bash
npx tsx scripts/test-supabase.ts
```

## 📚 Próximos Pasos

1. **Crear migrations**: Ver `docs/database/SUPABASE_MIGRATION_PLAN.md`
2. **Seed data**: Migrar datos de JSON a Supabase
3. **Feature flags**: Habilitar módulo por módulo
4. **Real-time**: Configurar subscriptions

## 🔗 Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
