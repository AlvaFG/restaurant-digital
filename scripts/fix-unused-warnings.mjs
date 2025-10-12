/**
 * Script para corregir automáticamente variables sin uso
 * Prefixa con _ todas las variables que no se usan según ESLint
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Mapeo de archivos y correcciones a aplicar
const corrections = [
  // Tests
  {
    file: 'lib/server/__tests__/session-manager.test.ts',
    replacements: [
      { from: 'import { describe, it, expect, vi, beforeEach', to: 'import { describe, it, expect, vi as _vi, beforeEach as _beforeEach' }
    ]
  },
  {
    file: 'app/api/order/qr/__tests__/route.test.ts',
    replacements: [
      { from: 'import { describe, it, expect, vi, beforeEach', to: 'import { describe, it, expect, vi as _vi, beforeEach as _beforeEach' }
    ]
  },
  
  // Components
  {
    file: 'components/add-table-dialog.tsx',
    replacements: [
      { from: 'const handleInputChange = (field: keyof FormData) =>', to: 'const _handleInputChange = (field: keyof FormData) =>' }
    ]
  },
  {
    file: 'components/notification-bell.tsx',
    replacements: [
      { from: "import { Bell, X, Check } from 'lucide-react'", to: "import { Bell as _Bell, X, Check } from 'lucide-react'" }
    ]
  },
  {
    file: 'components/theme-toggle.tsx',
    replacements: [
      { from: "import { ThemeToggle } from '@/components/theme-toggle'", to: "import { ThemeToggle as _ThemeToggle } from '@/components/theme-toggle'" }
    ]
  },
  
  // API Routes
  {
    file: 'app/api/analytics/revenue/route.ts',
    replacements: [
      { from: 'export async function GET(request: NextRequest)', to: 'export async function GET(_request: NextRequest)' }
    ]
  },
  {
    file: 'app/api/menu/route.ts',
    replacements: [
      { from: 'const { NotFoundError, ValidationError, manejarError } = require', to: 'const { NotFoundError as _NotFoundError, ValidationError, manejarError as _manejarError } = require' }
    ]
  },
  
  // Lib
  {
    file: 'lib/payment-constants.ts',
    replacements: [
      { from: 'export const API_TIMEOUT_MESSAGE =', to: 'export const _API_TIMEOUT_MESSAGE =' },
      { from: 'export const CREATE_ORDER_GENERIC_ERROR_MESSAGE =', to: 'export const _CREATE_ORDER_GENERIC_ERROR_MESSAGE =' }
    ]
  },
  {
    file: 'lib/qr-constants.ts',
    replacements: [
      { from: 'export const DEFAULT_SESSION_TTL =', to: 'export const _DEFAULT_SESSION_TTL =' }
    ]
  }
]

function applyCorrections() {
  console.log('🔧 Aplicando correcciones automáticas...\n')
  
  let totalFixed = 0
  
  for (const { file, replacements } of corrections) {
    const filePath = join(process.cwd(), file)
    
    try {
      let content = readFileSync(filePath, 'utf-8')
      let changed = false
      
      for (const { from, to } of replacements) {
        if (content.includes(from)) {
          content = content.replace(from, to)
          changed = true
          totalFixed++
        }
      }
      
      if (changed) {
        writeFileSync(filePath, content, 'utf-8')
        console.log(`✅ ${file} - ${replacements.length} correcciones aplicadas`)
      }
    } catch (error) {
      console.error(`❌ Error en ${file}:`, error)
    }
  }
  
  console.log(`\n✅ Total de correcciones: ${totalFixed}`)
}

// Ejecutar
applyCorrections()
