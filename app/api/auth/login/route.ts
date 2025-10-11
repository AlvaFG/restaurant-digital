import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validar inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Usar admin client para bypassear RLS
    const supabase = createAdminClient()

    // 1. Buscar usuario
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        tenants (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('email', email)
      .eq('active', true)
      .limit(1)

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      )
    }

    const userData: any = users[0]

    // 2. Verificar password
    const isValid = await bcrypt.compare(password, userData.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // 3. Actualizar last_login_at
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userData.id)

    // 4. Preparar respuesta
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: userData.active,
      tenant_id: userData.tenant_id,
      last_login_at: new Date().toISOString(),
    }

    const tenantData = userData.tenants as any
    const tenant = {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      logoUrl: tenantData.settings?.logoUrl,
      theme: {
        accentColor: tenantData.settings?.theme?.accentColor || '#3b82f6',
      },
      features: {
        tablets: tenantData.settings?.features?.tablets ?? true,
        kds: tenantData.settings?.features?.kds ?? true,
        payments: tenantData.settings?.features?.payments ?? true,
      },
    }

    return NextResponse.json({ user, tenant }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
