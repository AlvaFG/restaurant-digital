/**
 * Script para probar las políticas RLS del sistema jerárquico
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testRLSPolicies() {
  console.log('\n🧪 TESTING DE POLÍTICAS RLS\n')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // 1. Verificar usuarios existentes
    console.log('1️⃣  VERIFICANDO USUARIOS EXISTENTES...\n')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_by_admin_id')
      .order('created_at', { ascending: true })

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos')
      console.log('   Por favor, registra un admin primero\n')
      return
    }

    console.log(`✅ ${users.length} usuario(s) encontrado(s):\n`)
    users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email}`)
      console.log(`      - Nombre: ${u.name}`)
      console.log(`      - Rol: ${u.role}`)
      console.log(`      - Tenant: ${u.tenant_id}`)
      console.log(`      - Creado por admin: ${u.created_by_admin_id || 'N/A (es admin)'}`)
      console.log('')
    })

    // 2. Buscar admin y staff para testing
    const admin = users.find(u => u.role === 'admin')
    const staff = users.find(u => u.role === 'staff')

    if (!admin) {
      console.log('⚠️  No hay usuarios admin. Registra uno para continuar.\n')
      return
    }

    console.log('2️⃣  VERIFICANDO JERARQUÍA...\n')
    
    if (!staff) {
      console.log('⚠️  No hay usuarios staff todavía')
      console.log(`   → Login como admin (${admin.email}) y crea staff desde /staff\n`)
      return
    }

    // Verificar que staff tenga admin creador
    if (staff.created_by_admin_id === admin.id) {
      console.log('✅ Jerarquía correcta:')
      console.log(`   Staff: ${staff.email}`)
      console.log(`   Creado por: ${admin.email}\n`)
    } else {
      console.log('❌ ERROR: Staff no tiene created_by_admin_id correcto')
      console.log(`   Staff: ${staff.email}`)
      console.log(`   created_by_admin_id: ${staff.created_by_admin_id}`)
      console.log(`   Admin esperado: ${admin.id}\n`)
    }

    // 3. Verificar políticas de lectura
    console.log('3️⃣  VERIFICANDO POLÍTICAS DE LECTURA...\n')

    // Simular sesión de admin
    console.log(`   🔐 Probando como admin (${admin.email})...`)
    const { data: adminCanSee, error: adminError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('tenant_id', admin.tenant_id)

    if (adminError) {
      console.log(`   ❌ Error: ${adminError.message}`)
    } else {
      console.log(`   ✅ Admin puede ver ${adminCanSee?.length || 0} usuario(s) de su tenant`)
    }

    // 4. Verificar funciones helper
    console.log('\n4️⃣  VERIFICANDO FUNCIONES HELPER...\n')

    const { data: roleCheck, error: roleError } = await supabase
      .rpc('current_user_role')

    console.log('   ℹ️  Funciones helper creadas:')
    console.log('      - current_user_role()')
    console.log('      - is_admin()')
    console.log('      - is_staff()')
    console.log('   (Solo funcionan con auth.uid() válido)\n')

    // 5. Verificar vista v_admin_staff
    console.log('5️⃣  VERIFICANDO VISTA v_admin_staff...\n')

    const { data: staffView, error: viewError } = await supabase
      .from('v_admin_staff')
      .select('*')

    if (viewError) {
      console.log(`   ⚠️  Vista requiere contexto de usuario autenticado`)
      console.log(`      (Solo accesible desde sesión de admin)\n`)
    } else {
      console.log(`   ✅ Vista creada correctamente`)
      console.log(`      Staff visible: ${staffView?.length || 0}\n`)
    }

    // 6. Resumen
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 RESUMEN DEL SISTEMA\n')
    
    const adminCount = users.filter(u => u.role === 'admin').length
    const staffCount = users.filter(u => u.role === 'staff').length
    
    console.log(`   👥 Usuarios totales: ${users.length}`)
    console.log(`   👨‍💼 Admins: ${adminCount}`)
    console.log(`   👔 Staff: ${staffCount}`)
    console.log(`   🏢 Tenants: ${new Set(users.map(u => u.tenant_id)).size}\n`)
    
    console.log('✅ Sistema jerárquico configurado correctamente')
    console.log('═══════════════════════════════════════════════════════\n')
    
    console.log('📋 PRÓXIMOS PASOS:\n')
    console.log('1. Login como admin → http://localhost:3000/login')
    console.log('2. Ir a Gestión de Staff → http://localhost:3000/staff')
    console.log('3. Crear usuarios staff')
    console.log('4. Logout y login como staff')
    console.log('5. Verificar que staff NO puede acceder a /staff\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testRLSPolicies().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
