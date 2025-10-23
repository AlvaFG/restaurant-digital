# Script de Verificación Pre-Migración
# Verifica que todos los archivos necesarios estén presentes

Write-Host "🔍 Verificando archivos de migración..." -ForegroundColor Cyan
Write-Host ""

$todoBien = $true

# Verificar migración 1
$migracion1 = "supabase\migrations\20251017000001_create_table_audit.sql"
if (Test-Path $migracion1) {
    Write-Host "✅ Migración 1 encontrada: $migracion1" -ForegroundColor Green
    $lineas1 = (Get-Content $migracion1).Count
    Write-Host "   📄 Líneas: $lineas1" -ForegroundColor Gray
} else {
    Write-Host "❌ ERROR: No se encuentra $migracion1" -ForegroundColor Red
    $todoBien = $false
}

Write-Host ""

# Verificar migración 2
$migracion2 = "supabase\migrations\20251017000002_create_atomic_functions.sql"
if (Test-Path $migracion2) {
    Write-Host "✅ Migración 2 encontrada: $migracion2" -ForegroundColor Green
    $lineas2 = (Get-Content $migracion2).Count
    Write-Host "   📄 Líneas: $lineas2" -ForegroundColor Gray
} else {
    Write-Host "❌ ERROR: No se encuentra $migracion2" -ForegroundColor Red
    $todoBien = $false
}

Write-Host ""

# Verificar servicio de auditoría
$auditService = "lib\services\audit-service.ts"
if (Test-Path $auditService) {
    Write-Host "✅ Servicio de auditoría encontrado: $auditService" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: No se encuentra $auditService" -ForegroundColor Red
    $todoBien = $false
}

Write-Host ""

# Verificar reglas de negocio
$businessRules = "lib\business-rules\table-rules.ts"
if (Test-Path $businessRules) {
    Write-Host "✅ Reglas de negocio encontradas: $businessRules" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: No se encuentra $businessRules" -ForegroundColor Red
    $todoBien = $false
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

if ($todoBien) {
    Write-Host "🎉 ¡Todos los archivos están listos!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Lee las instrucciones en: INSTRUCCIONES_MIGRACION.md"
    Write-Host "   2. Ve a Supabase Dashboard: https://supabase.com/dashboard"
    Write-Host "   3. Aplica las migraciones en SQL Editor"
    Write-Host "   4. Ejecuta: npm run dev"
    Write-Host "   5. Prueba creando un pedido"
    Write-Host ""
} else {
    Write-Host "❌ Faltan archivos. Verifica la instalación." -ForegroundColor Red
    Write-Host ""
}

Write-Host "Presiona Enter para continuar..."
Read-Host
