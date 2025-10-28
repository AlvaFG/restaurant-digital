# Validacion de Migracion a Supabase
# ====================================

param([switch]$Verbose)

$ErrorActionPreference = "Stop"

Write-Host "`n=== VALIDACION DE MIGRACION A SUPABASE ===`n" -ForegroundColor Cyan

# 1. Verificar variables de entorno
Write-Host "[1/9] Verificando variables de entorno..." -ForegroundColor Yellow
$envFile = ".env.local"
$hasSupabaseUrl = $false
$hasSupabaseKey = $false

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    $hasSupabaseUrl = $envContent -match "NEXT_PUBLIC_SUPABASE_URL"
    $hasSupabaseKey = $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    
    if ($hasSupabaseUrl -and $hasSupabaseKey) {
        Write-Host "  OK: Variables de Supabase configuradas" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Faltan variables de Supabase" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARNING: Archivo .env.local no encontrado" -ForegroundColor Yellow
}

# 2. Verificar ausencia de imports legacy
Write-Host "`n[2/9] Verificando ausencia de imports legacy..." -ForegroundColor Yellow
$legacyFound = 0
$patterns = @("table-store", "order-store", "menu-store", "payment-store")

foreach ($pattern in $patterns) {
    $results = Get-ChildItem -Path "app/api" -Recurse -Filter "*.ts" | Select-String -Pattern $pattern -SimpleMatch
    if ($results) {
        $legacyFound += $results.Count
    }
}

if ($legacyFound -eq 0) {
    Write-Host "  OK: No se encontraron imports legacy" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Se encontraron $legacyFound referencias legacy" -ForegroundColor Red
}

# 3. Verificar servicios de Supabase
Write-Host "`n[3/9] Verificando uso de servicios..." -ForegroundColor Yellow
$serviceCount = 0
$apiFiles = Get-ChildItem -Path "app/api" -Recurse -Filter "route.ts"

foreach ($file in $apiFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "@/lib/services/") {
        $serviceCount++
    }
}

Write-Host "  OK: $serviceCount APIs usando servicios de Supabase" -ForegroundColor Green

# 4. Verificar estructura de servicios
Write-Host "`n[4/9] Verificando estructura de servicios..." -ForegroundColor Yellow
$services = @(
    "lib/services/tables-service.ts",
    "lib/services/orders-service.ts", 
    "lib/services/menu-service.ts",
    "lib/services/payments-service.ts"
)

$servicesFound = 0
foreach ($service in $services) {
    if (Test-Path $service) {
        $servicesFound++
    }
}

if ($servicesFound -eq $services.Count) {
    Write-Host "  OK: Todos los servicios encontrados ($servicesFound/$($services.Count))" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Faltan servicios ($servicesFound/$($services.Count))" -ForegroundColor Yellow
}

# 5. Verificar autenticacion
Write-Host "`n[5/9] Verificando autenticacion..." -ForegroundColor Yellow
$authCount = 0

foreach ($file in $apiFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "getCurrentUser") {
        $authCount++
    }
}

Write-Host "  OK: $authCount APIs con autenticacion" -ForegroundColor Green

# 6. Verificar tenant isolation
Write-Host "`n[6/9] Verificando tenant isolation..." -ForegroundColor Yellow
$tenantCount = 0

foreach ($file in $apiFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "tenantId") {
        $tenantCount++
    }
}

$percentage = [math]::Round(($tenantCount / $apiFiles.Count) * 100)
Write-Host "  OK: $tenantCount APIs con tenant isolation ($percentage%)" -ForegroundColor Green

# 7. Verificar build
Write-Host "`n[7/9] Verificando build..." -ForegroundColor Yellow
Write-Host "  Ejecutando npm run build..." -ForegroundColor Gray

$buildOutput = npm run build 2>&1 | Out-String
$buildSuccess = $buildOutput -match "Compiled successfully"

if ($buildSuccess) {
    Write-Host "  OK: Build exitoso" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Build fallo" -ForegroundColor Red
}

# 8. Verificar backups
Write-Host "`n[8/9] Verificando backups..." -ForegroundColor Yellow
$backupDir = "data/legacy-backup"

if (Test-Path $backupDir) {
    $backups = Get-ChildItem $backupDir -Filter "*.json"
    Write-Host "  OK: $($backups.Count) archivos de backup encontrados" -ForegroundColor Green
} else {
    Write-Host "  WARNING: No se encontro directorio de backup" -ForegroundColor Yellow
}

# 9. Verificar documentacion
Write-Host "`n[9/9] Verificando documentacion..." -ForegroundColor Yellow
$docs = @("MIGRACION_COMPLETADA.md", "docs/RESUMEN_MIGRACION_FASE2.md")
$docsFound = 0

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $docsFound++
    }
}

Write-Host "  OK: $docsFound/$($docs.Count) documentos encontrados" -ForegroundColor Green

# RESUMEN
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE VALIDACION" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$results = @{
    "Variables de entorno" = ($hasSupabaseUrl -and $hasSupabaseKey)
    "Sin imports legacy" = ($legacyFound -eq 0)
    "Servicios Supabase" = ($serviceCount -gt 10)
    "Estructura servicios" = ($servicesFound -eq $services.Count)
    "Autenticacion" = ($authCount -gt 10)
    "Tenant isolation" = ($percentage -gt 70)
    "Build exitoso" = $buildSuccess
    "Backups" = (Test-Path $backupDir)
    "Documentacion" = ($docsFound -gt 0)
}

$passed = 0
foreach ($key in $results.Keys) {
    $status = $results[$key]
    $icon = if ($status) { "[OK]" } else { "[FAIL]" }
    $color = if ($status) { "Green" } else { "Red" }
    Write-Host "$icon $key" -ForegroundColor $color
    if ($status) { $passed++ }
}

$total = $results.Count
$rate = [math]::Round(($passed / $total) * 100)

Write-Host "`n============================================" -ForegroundColor Cyan
if ($rate -eq 100) {
    Write-Host "RESULTADO: EXITOSO - $passed/$total checks ($rate%)" -ForegroundColor Green
    Write-Host "El proyecto esta completamente migrado a Supabase" -ForegroundColor Green
} elseif ($rate -ge 80) {
    Write-Host "RESULTADO: PARCIAL - $passed/$total checks ($rate%)" -ForegroundColor Yellow
    Write-Host "Revisa los warnings para completar" -ForegroundColor Yellow
} else {
    Write-Host "RESULTADO: FALLIDO - $passed/$total checks ($rate%)" -ForegroundColor Red
    Write-Host "Se requieren correcciones" -ForegroundColor Red
}
Write-Host "============================================`n" -ForegroundColor Cyan

exit $(if ($rate -eq 100) { 0 } else { 1 })
