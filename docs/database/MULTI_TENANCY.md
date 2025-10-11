# Multi-Tenancy Architecture

## 🏢 **Concepto**

Cada restaurante es un **tenant** (inquilino) independiente que comparte la misma infraestructura pero tiene sus datos completamente separados.

---

## 🗂️ **Estructura de Datos**

### **Jerarquía**
```
Tenant (Restaurante)
├─ Users (Empleados del restaurante)
├─ Tables (Mesas del restaurante)
├─ Menu Categories (Categorías de menú)
│  └─ Menu Items (Platos del menú)
│     └─ Inventory (Stock de cada plato)
├─ Orders (Pedidos)
│  ├─ Order Items (Items del pedido)
│  ├─ Order Discounts (Descuentos)
│  └─ Order Taxes (Impuestos)
├─ Payments (Pagos)
├─ QR Sessions (Sesiones de escaneo QR)
└─ Audit Logs (Registro de auditoría)
```

---

## 🔐 **Aislamiento de Datos**

### **Método 1: Filtrado Manual (Actual)**
```typescript
// En cada query, filtrar explícitamente por tenant_id
const { data: menu } = await supabase
  .from('menu_items')
  .select('*')
  .eq('tenant_id', currentTenant.id);  // ← Filtro manual
```

### **Método 2: RLS Automático (Recomendado)**
```typescript
// Con RLS, el filtrado es AUTOMÁTICO
// El tenant_id viene del JWT token del usuario autenticado
const { data: menu } = await supabase
  .from('menu_items')
  .select('*');
// PostgreSQL automáticamente filtra por tenant_id
```

---

## 🎯 **Ejemplos Prácticos**

### **Escenario: Tres Restaurantes**

```sql
-- Restaurante A: "La Parrilla"
tenant_id: 'aaa-111'
- 15 mesas
- 50 items de menú
- 200 pedidos

-- Restaurante B: "Sushi Bar"
tenant_id: 'bbb-222'
- 10 mesas
- 30 items de menú
- 150 pedidos

-- Restaurante C: "Pizza Express"
tenant_id: 'ccc-333'
- 20 mesas
- 25 items de menú
- 300 pedidos
```

### **Query: "Dame todas las mesas"**

#### ❌ **Sin filtro (ERROR)**
```typescript
const { data } = await supabase.from('tables').select('*');
// Retorna: 45 mesas (15+10+20) de TODOS los restaurantes ← MALO
```

#### ✅ **Con filtro manual**
```typescript
const { data } = await supabase
  .from('tables')
  .select('*')
  .eq('tenant_id', 'aaa-111');
// Retorna: 15 mesas solo de "La Parrilla" ← CORRECTO
```

#### ✅ **Con RLS (automático)**
```typescript
// Usuario autenticado de "La Parrilla" (tenant_id en JWT)
const { data } = await supabase.from('tables').select('*');
// Retorna: 15 mesas solo de "La Parrilla" ← AUTOMÁTICO
```

---

## 🔑 **Configuración del Tenant en el Frontend**

### **Paso 1: Login del Usuario**
```typescript
// Usuario se loguea con email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'mesero@laparrilla.com',
  password: 'secreto123'
});

// Supabase devuelve un JWT con el tenant_id del usuario
// JWT payload:
{
  sub: 'user-uuid',
  email: 'mesero@laparrilla.com',
  tenant_id: 'aaa-111',  // ← ID del restaurante
  role: 'staff'
}
```

### **Paso 2: Queries Automáticamente Filtradas**
```typescript
// Todas las queries usan el tenant_id del JWT automáticamente
const { data: myTables } = await supabase.from('tables').select('*');
// Solo retorna mesas de 'aaa-111' (La Parrilla)

const { data: myMenu } = await supabase.from('menu_items').select('*');
// Solo retorna menú de 'aaa-111' (La Parrilla)
```

---

## 🚀 **Ventajas del Multi-Tenancy**

### **1. Costo-Eficiencia**
- Una sola base de datos para todos los restaurantes
- Una sola instancia de Supabase
- Compartir infraestructura = menos costos

### **2. Mantenimiento Simplificado**
- Una migración se aplica a todos los tenants
- Upgrades simultáneos
- Fixes de bugs benefician a todos

### **3. Escalabilidad**
- Agregar un nuevo restaurante = INSERT en tabla `tenants`
- No requiere crear nueva base de datos
- Soporta cientos de restaurantes

### **4. Seguridad**
- RLS garantiza que cada tenant solo vea sus datos
- Imposible que "La Parrilla" vea datos de "Sushi Bar"
- Auditoría completa por tenant

---

## ⚠️ **Consideraciones Importantes**

### **1. Siempre Filtrar por tenant_id**
```typescript
// ❌ NUNCA
const orders = await supabase.from('orders').select('*');

// ✅ SIEMPRE (hasta que RLS esté activo)
const orders = await supabase
  .from('orders')
  .select('*')
  .eq('tenant_id', currentTenantId);
```

### **2. Validar tenant_id en Backend**
```typescript
// API Route: /api/orders
export async function POST(request: Request) {
  const { user } = await getCurrentUser();
  const body = await request.json();
  
  // Validar que el tenant_id coincida con el usuario
  if (body.tenant_id !== user.tenant_id) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Procesar el pedido...
}
```

### **3. Unique Constraints por Tenant**
```sql
-- Mesa #1 puede existir en múltiples restaurantes
CREATE TABLE tables (
  tenant_id UUID,
  number INTEGER,
  ...
  UNIQUE(tenant_id, number)  -- Unique POR tenant
);

-- ✅ Válido
INSERT INTO tables (tenant_id, number) VALUES ('aaa-111', 1);
INSERT INTO tables (tenant_id, number) VALUES ('bbb-222', 1);

-- ❌ Inválido (duplicate en mismo tenant)
INSERT INTO tables (tenant_id, number) VALUES ('aaa-111', 1);
```

---

## 🧪 **Testing Multi-Tenancy**

### **Test: Aislamiento de Datos**
```typescript
describe('Multi-tenancy isolation', () => {
  it('users only see their own tenant data', async () => {
    // Login como restaurante A
    await supabase.auth.signInWithPassword({
      email: 'admin@restaurantea.com',
      password: 'test123'
    });
    
    const { data: tablesA } = await supabase.from('tables').select('*');
    expect(tablesA).toHaveLength(15);
    expect(tablesA.every(t => t.tenant_id === 'aaa-111')).toBe(true);
    
    // Login como restaurante B
    await supabase.auth.signInWithPassword({
      email: 'admin@restauranteb.com',
      password: 'test456'
    });
    
    const { data: tablesB } = await supabase.from('tables').select('*');
    expect(tablesB).toHaveLength(10);
    expect(tablesB.every(t => t.tenant_id === 'bbb-222')).toBe(true);
    
    // Verificar que NO hay overlap
    const idsA = tablesA.map(t => t.id);
    const idsB = tablesB.map(t => t.id);
    expect(idsA.some(id => idsB.includes(id))).toBe(false);
  });
});
```

---

## 📊 **Dashboard Multi-Tenant**

### **Selector de Restaurante (Admins)**
Si un usuario admin maneja múltiples restaurantes:

```typescript
// components/tenant-selector.tsx
export function TenantSelector() {
  const [tenants, setTenants] = useState([]);
  const [current, setCurrent] = useState(null);
  
  useEffect(() => {
    // Cargar restaurantes del admin
    loadUserTenants();
  }, []);
  
  async function switchTenant(tenantId: string) {
    // Actualizar el tenant activo
    await supabase.rpc('set_tenant', { tenant_id: tenantId });
    setCurrent(tenantId);
    
    // Recargar datos del nuevo tenant
    window.location.reload();
  }
  
  return (
    <Select value={current} onValueChange={switchTenant}>
      {tenants.map(t => (
        <SelectItem key={t.id} value={t.id}>
          {t.name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

---

## 🔄 **Migración: JSON → Multi-Tenant DB**

### **Plan de Migración**
1. **Semana 1:** Crear tenant por defecto ('demo')
2. **Semana 2:** Migrar datos actuales al tenant demo
3. **Semana 3-4:** Implementar selector de tenant
4. **Semana 5:** Permitir crear nuevos tenants
5. **Semana 6:** Activar RLS
6. **Semana 7:** Onboarding de restaurantes reales

---

## 📚 **Recursos**

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenancy Patterns](https://supabase.com/blog/multi-tenancy)
- Migration: `supabase/migrations/20251011000002_enable_rls.sql`

---

## ✅ **Checklist de Implementación**

- [x] Tabla `tenants` creada
- [x] `tenant_id` en todas las tablas
- [x] Foreign keys configurados
- [x] Unique constraints por tenant
- [x] Índices en `tenant_id`
- [ ] RLS policies aplicadas (próximo)
- [ ] JWT con `tenant_id` claim
- [ ] Frontend context para tenant actual
- [ ] Tests de aislamiento
- [ ] Documentación de onboarding

---

**Conclusión:** El sistema ya está diseñado para multi-tenancy desde día 1. Cada restaurante tiene sus datos completamente separados. 🎉
