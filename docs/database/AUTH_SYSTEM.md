# Sistema de Autenticación y Roles

## 🎭 **Roles del Sistema**

### **1. Super Admin (Tú - Proveedor del Servicio)**
```typescript
{
  email: 'admin@restaurantdigital.com',
  role: 'super_admin',
  is_super_admin: true,
  tenant_id: null  // Puede acceder a TODOS los tenants
}
```

**Permisos:**
- ✅ Ver TODOS los restaurantes (tenants)
- ✅ Crear nuevos restaurantes
- ✅ Asignar admins a restaurantes
- ✅ Ver estadísticas globales
- ✅ Acceder a cualquier tenant
- ✅ Dashboard con selector de restaurantes

---

### **2. Admin (Dueño del Restaurante)**
```typescript
{
  email: 'dueno@restaurante.com',
  role: 'admin',
  is_super_admin: false,
  tenant_id: 'aaa-111'  // Solo su restaurante
}
```

**Permisos:**
- ✅ Ver solo SU restaurante
- ✅ Agregar/editar/eliminar staff
- ✅ Configurar menú
- ✅ Ver reportes y analíticas
- ✅ Configurar mesas
- ✅ Gestionar pagos

---

### **3. Manager (Supervisor de Turno)**
```typescript
{
  email: 'supervisor@restaurante.com',
  role: 'manager',
  tenant_id: 'aaa-111'
}
```

**Permisos:**
- ✅ Ver pedidos
- ✅ Gestionar mesas
- ✅ Modificar menú (disponibilidad)
- ✅ Ver reportes del día
- ❌ No puede agregar usuarios
- ❌ No puede cambiar configuración

---

### **4. Staff (Mesero/Camarero)**
```typescript
{
  email: 'mesero@restaurante.com',
  role: 'staff',
  tenant_id: 'aaa-111'
}
```

**Permisos:**
- ✅ Tomar pedidos
- ✅ Ver mesas
- ✅ Consultar menú
- ❌ No puede ver reportes
- ❌ No puede agregar usuarios
- ❌ No puede editar menú

---

## 🔐 **Flujo de Autenticación**

### **Login**
```typescript
// lib/auth/login.ts
export async function login(email: string, password: string) {
  // 1. Verificar credenciales
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('active', true)
    .single();
  
  if (!user) throw new Error('Usuario no encontrado');
  
  // 2. Verificar password (bcrypt)
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Contraseña incorrecta');
  
  // 3. Generar JWT token con tenant_id
  const token = jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.is_super_admin ? null : user.tenant_id,
    is_super_admin: user.is_super_admin
  }, JWT_SECRET, { expiresIn: '8h' });
  
  // 4. Actualizar last_login_at
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);
  
  return { user, token };
}
```

### **Verificación de Permisos**
```typescript
// lib/auth/permissions.ts
export function canAccessTenant(user: User, tenantId: string): boolean {
  // Super admin puede acceder a todo
  if (user.is_super_admin) return true;
  
  // Usuario regular solo su tenant
  return user.tenant_id === tenantId;
}

export function canManageUsers(user: User): boolean {
  return user.role === 'admin' || user.is_super_admin;
}

export function canEditMenu(user: User): boolean {
  return ['admin', 'manager', 'super_admin'].includes(user.role);
}

export function canViewReports(user: User): boolean {
  return ['admin', 'manager', 'super_admin'].includes(user.role);
}
```

---

## 🏗️ **Componentes del Frontend**

### **1. Login Form**
```typescript
// app/login/page.tsx
'use client';

export default function LoginPage() {
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const { user, token } = await login(
      formData.get('email') as string,
      formData.get('password') as string
    );
    
    // Guardar token
    localStorage.setItem('auth_token', token);
    
    // Redirect según rol
    if (user.is_super_admin) {
      router.push('/super-admin/dashboard');
    } else if (user.role === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/salon');
    }
  }
  
  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
```

### **2. Super Admin Dashboard**
```typescript
// app/super-admin/dashboard/page.tsx
'use client';

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  useEffect(() => {
    loadAllTenants();
  }, []);
  
  async function loadAllTenants() {
    // Super admin ve TODOS los tenants
    const { data } = await supabase
      .from('v_tenant_stats')  // View con estadísticas
      .select('*');
    
    setTenants(data);
  }
  
  return (
    <div>
      <h1>Panel de Super Admin</h1>
      
      {/* Selector de Restaurante */}
      <Select value={selectedTenant} onValueChange={setSelectedTenant}>
        {tenants.map(t => (
          <SelectItem key={t.id} value={t.id}>
            {t.name} - {t.orders_last_7_days} pedidos
          </SelectItem>
        ))}
      </Select>
      
      {/* Dashboard del restaurante seleccionado */}
      {selectedTenant && <TenantDashboard tenantId={selectedTenant} />}
    </div>
  );
}
```

### **3. Admin - Gestión de Staff**
```typescript
// app/dashboard/usuarios/page.tsx
'use client';

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  
  useEffect(() => {
    loadStaff();
  }, []);
  
  async function loadStaff() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });
    
    setStaff(data);
  }
  
  async function createStaffUser(formData: {
    email: string;
    name: string;
    password: string;
    role: 'staff' | 'manager';
  }) {
    // Hash password
    const passwordHash = await bcrypt.hash(formData.password, 10);
    
    // Llamar función de PostgreSQL
    const { data, error } = await supabase.rpc('create_staff_user', {
      p_tenant_id: user.tenant_id,
      p_email: formData.email,
      p_password_hash: passwordHash,
      p_name: formData.name,
      p_role: formData.role,
      p_created_by: user.id
    });
    
    if (error) throw error;
    
    toast.success('Usuario creado exitosamente');
    loadStaff();
  }
  
  return (
    <div>
      <h1>Gestión de Personal</h1>
      
      {/* Formulario para agregar staff */}
      <CreateStaffForm onSubmit={createStaffUser} />
      
      {/* Lista de staff actual */}
      <StaffList users={staff} onDelete={deleteUser} />
    </div>
  );
}
```

---

## 📝 **API Routes Protegidos**

### **Middleware de Autenticación**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Agregar info del usuario al request
    request.headers.set('X-User-Id', payload.sub);
    request.headers.set('X-Tenant-Id', payload.tenant_id || 'all');
    request.headers.set('X-Is-Super-Admin', String(payload.is_super_admin));
    
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/super-admin/:path*', '/api/:path*']
};
```

### **API Route con Validación de Tenant**
```typescript
// app/api/orders/route.ts
export async function POST(request: Request) {
  const userId = request.headers.get('X-User-Id');
  const userTenantId = request.headers.get('X-Tenant-Id');
  const isSuperAdmin = request.headers.get('X-Is-Super-Admin') === 'true';
  
  const body = await request.json();
  
  // Validar que el tenant_id coincida (o sea super admin)
  if (!isSuperAdmin && body.tenant_id !== userTenantId) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Crear pedido...
  const { data, error } = await supabase
    .from('orders')
    .insert(body);
  
  return Response.json(data);
}
```

---

## 🔄 **Onboarding de Nuevo Restaurante**

```typescript
// Super Admin crea un nuevo restaurante
async function onboardNewRestaurant(data: {
  restaurantName: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}) {
  // 1. Crear tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .insert({
      name: data.restaurantName,
      slug: data.slug
    })
    .select()
    .single();
  
  // 2. Hash password del admin
  const passwordHash = await bcrypt.hash(data.adminPassword, 10);
  
  // 3. Crear admin del restaurante
  const { data: adminUser } = await supabase.rpc('create_tenant_admin', {
    p_tenant_id: tenant.id,
    p_email: data.adminEmail,
    p_password_hash: passwordHash,
    p_name: data.adminName
  });
  
  // 4. Enviar email de bienvenida
  await sendWelcomeEmail(data.adminEmail, {
    restaurantName: data.restaurantName,
    loginUrl: `https://app.restaurantdigital.com/login`,
    temporaryPassword: data.adminPassword
  });
  
  return { tenant, adminUser };
}
```

---

## 🎯 **Resumen**

| Rol | Acceso | Puede Crear Usuarios | Ve Todos los Tenants |
|-----|--------|---------------------|---------------------|
| **Super Admin** | TODO | ✅ Sí | ✅ Sí |
| **Admin** | Su tenant | ✅ Sí (staff/manager) | ❌ No |
| **Manager** | Su tenant | ❌ No | ❌ No |
| **Staff** | Su tenant | ❌ No | ❌ No |

---

## 📦 **Próximos Pasos**

1. ✅ Aplicar migración `20251011000003_add_auth_system.sql`
2. Crear componentes de login
3. Implementar JWT authentication
4. Crear dashboard de super admin
5. Crear UI de gestión de staff
6. Hash passwords con bcrypt
7. Implementar forgot password
8. Testing de roles y permisos
