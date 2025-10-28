#!/usr/bin/env pwsh
# cleanup-legacy-stores.ps1
# Script para hacer backup y preparar migracion de stores legacy a Supabase

param(
    [switch]$BackupOnly,
    [switch]$FullCleanup
)

$ErrorActionPreference = "Stop"

Write-Host "`n[LIMPIEZA] STORES LEGACY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. CREAR BACKUP
Write-Host "[BACKUP] Paso 1: Creando backup de seguridad..." -ForegroundColor Yellow
$backupDir = "data\legacy-backup"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

$filesBackedUp = 0

if (Test-Path "data\table-store.json") {
    Copy-Item "data\table-store.json" "$backupDir\table-store-$timestamp.json"
    Write-Host "  [OK] table-store.json -> backup creado" -ForegroundColor Green
    $filesBackedUp++
} else {
    Write-Host "  [INFO] table-store.json no existe" -ForegroundColor Gray
}

if (Test-Path "data\order-store.json") {
    Copy-Item "data\order-store.json" "$backupDir\order-store-$timestamp.json"
    Write-Host "  [OK] order-store.json -> backup creado" -ForegroundColor Green
    $filesBackedUp++
} else {
    Write-Host "  [INFO] order-store.json no existe" -ForegroundColor Gray
}

if (Test-Path "data\menu-store.json") {
    Copy-Item "data\menu-store.json" "$backupDir\menu-store-$timestamp.json"
    Write-Host "  [OK] menu-store.json -> backup creado" -ForegroundColor Green
    $filesBackedUp++
} else {
    Write-Host "  [INFO] menu-store.json no existe" -ForegroundColor Gray
}

Write-Host "`n  [TOTAL] Archivos respaldados: $filesBackedUp" -ForegroundColor Cyan

if ($BackupOnly) {
    Write-Host "`n[SUCCESS] Backup completado! (modo BackupOnly)" -ForegroundColor Green
    Write-Host "[LOCATION] Archivos guardados en: $backupDir`n" -ForegroundColor Cyan
    exit 0
}

# 2. CREAR DIRECTORIO LEGACY PARA CÓDIGO
Write-Host "`n[PREPARE] Paso 2: Preparando directorio legacy..." -ForegroundColor Yellow
$legacyCodeDir = "lib\server\legacy"
New-Item -ItemType Directory -Force -Path $legacyCodeDir | Out-Null

# 3. MOVER CÓDIGO LEGACY (si FullCleanup está activado)
if ($FullCleanup) {
    Write-Host "`n[MOVE] Paso 3: Moviendo codigo legacy..." -ForegroundColor Yellow
    
    $filesToMove = @(
        "lib\server\table-store.ts",
        "lib\server\order-store.ts",
        "lib\server\menu-store.ts",
        "lib\server\payment-store.ts"
    )
    
    $filesMoved = 0
    foreach ($file in $filesToMove) {
        if (Test-Path $file) {
            $fileName = Split-Path $file -Leaf
            Move-Item $file "$legacyCodeDir\$fileName" -Force
            Write-Host "  [OK] $fileName -> legacy/" -ForegroundColor Green
            $filesMoved++
        } else {
            Write-Host "  [INFO] $fileName no existe" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n  [TOTAL] Archivos movidos: $filesMoved" -ForegroundColor Cyan
    
    # 4. ELIMINAR JSON STORES
    Write-Host "`n[DELETE] Paso 4: Eliminando archivos JSON..." -ForegroundColor Yellow
    
    Remove-Item "data\table-store.json" -ErrorAction SilentlyContinue
    Remove-Item "data\order-store.json" -ErrorAction SilentlyContinue
    Remove-Item "data\menu-store.json" -ErrorAction SilentlyContinue
    
    Write-Host "  [OK] Archivos JSON eliminados" -ForegroundColor Green
} else {
    Write-Host "`n[WARNING] Paso 3-4: OMITIDOS (usa -FullCleanup para ejecutarlos)" -ForegroundColor Yellow
    Write-Host "  Los archivos legacy se mantendrán hasta que actualices las APIs" -ForegroundColor Gray
}

# 5. ACTUALIZAR .gitignore
Write-Host "`n[CONFIG] Paso 5: Actualizando .gitignore..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content .gitignore -Raw
    
    if ($gitignoreContent -notmatch "data/.*-store\.json") {
        Add-Content .gitignore "`n# Legacy JSON stores (deprecated - use Supabase)"
        Add-Content .gitignore "data/*-store.json"
        Add-Content .gitignore "lib/server/legacy/"
        Write-Host "  [OK] .gitignore actualizado" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] .gitignore ya tiene las reglas necesarias" -ForegroundColor Gray
    }
} else {
    Write-Host "  [WARNING] .gitignore no encontrado" -ForegroundColor Yellow
}

# RESUMEN FINAL
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] PROCESO COMPLETADO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[BACKUPS] Archivos de backup:" -ForegroundColor Cyan
Write-Host "  -> $backupDir\*-$timestamp.json`n" -ForegroundColor White

if ($FullCleanup) {
    Write-Host "[LEGACY] Codigo legacy:" -ForegroundColor Cyan
    Write-Host "  -> $legacyCodeDir\`n" -ForegroundColor White
    
    Write-Host "[WARNING] SIGUIENTE PASO CRÍTICO:" -ForegroundColor Yellow
    Write-Host "  Las APIs están rotas hasta que las actualices a Supabase" -ForegroundColor White
    Write-Host "  Ver: CONFLICTO_JSON_SUPABASE.md - Fase 2`n" -ForegroundColor White
} else {
    Write-Host "[OK] Los archivos legacy aun existen (respaldados)" -ForegroundColor Green
    Write-Host "[WARNING] SIGUIENTE PASO:" -ForegroundColor Yellow
    Write-Host "  1. Actualizar APIs para usar Supabase (ver Fase 2)" -ForegroundColor White
    Write-Host "  2. Ejecutar: .\cleanup-legacy-stores.ps1 -FullCleanup`n" -ForegroundColor White
}

Write-Host "[DOCS] Documentacion completa:" -ForegroundColor Cyan
Write-Host "  -> CONFLICTO_JSON_SUPABASE.md`n" -ForegroundColor White

# VERIFICACIÓN DE ESTADO
Write-Host "[CHECK] Verificando estado actual..." -ForegroundColor Cyan

$jsonExists = (Test-Path "data\table-store.json") -or 
              (Test-Path "data\order-store.json") -or 
              (Test-Path "data\menu-store.json")

$legacyCodeExists = (Test-Path "lib\server\table-store.ts") -or 
                    (Test-Path "lib\server\order-store.ts") -or 
                    (Test-Path "lib\server\menu-store.ts")

if ($jsonExists -or $legacyCodeExists) {
    Write-Host "[WARNING] Estado: MIGRACIÓN PENDIENTE" -ForegroundColor Yellow
    if ($jsonExists) {
        Write-Host "  - Archivos JSON: [X] Existen" -ForegroundColor White
    } else {
        Write-Host "  - Archivos JSON: [OK] Eliminados" -ForegroundColor White
    }
    if ($legacyCodeExists) {
        Write-Host "  - Codigo legacy: [X] Activo" -ForegroundColor White
    } else {
        Write-Host "  - Codigo legacy: [OK] Movido" -ForegroundColor White
    }
} else {
    Write-Host "[SUCCESS] Estado: MIGRACIÓN COMPLETA" -ForegroundColor Green
    Write-Host "  - Todos los archivos legacy eliminados/movidos" -ForegroundColor White
}

Write-Host ""
