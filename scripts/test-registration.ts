/**
 * Script para probar el registro de usuarios
 * Ejecutar: npx tsx scripts/test-registration.ts
 */

import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

// Cargar variables de entorno
config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan variables de entorno de Supabase")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRegistration() {
  console.log("🔍 Verificando usuarios registrados...\n")

  try {
    // Obtener todos los usuarios
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, active, created_at, tenant_id")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error al obtener usuarios:", error.message)
      return
    }

    if (!users || users.length === 0) {
      console.log("⚠️  No hay usuarios en la base de datos")
      return
    }

    console.log(`✅ Total de usuarios: ${users.length}\n`)

    // Mostrar usuarios
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   👤 Role: ${user.role}`)
      console.log(`   ✓ Activo: ${user.active ? "Sí" : "No"}`)
      console.log(`   🏢 Tenant ID: ${user.tenant_id}`)
      console.log(`   📅 Creado: ${new Date(user.created_at).toLocaleString("es-AR")}`)
      console.log("")
    })

    // Mostrar usuarios creados hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usersToday = users.filter((user) => new Date(user.created_at) >= today)

    if (usersToday.length > 0) {
      console.log(`\n🎉 Usuarios registrados hoy: ${usersToday.length}`)
      usersToday.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`)
      })
    }

    // Mostrar por rol
    const byRole = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("\n📊 Usuarios por rol:")
    Object.entries(byRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

testRegistration()
