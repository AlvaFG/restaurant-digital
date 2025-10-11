# Script para copiar la migración al portapapeles y abrir el SQL Editor

Write-Host ""
Write-Host "Copiando migracion al portapapeles..." -ForegroundColor Cyan

# Leer el archivo de migración
$migrationPath = Join-Path $PSScriptRoot "..\supabase\migrations\20251011000001_init_schema.sql"
$migrationSQL = Get-Content $migrationPath -Raw

# Copiar al portapapeles
Set-Clipboard -Value $migrationSQL

Write-Host "Migracion copiada al portapapeles!" -ForegroundColor Green
Write-Host ""
Write-Host "Estadisticas:" -ForegroundColor Yellow
Write-Host "   - Tamano: $($migrationSQL.Length) caracteres"
Write-Host "   - Lineas: $((Get-Content $migrationPath).Count)"

Write-Host ""
Write-Host "Abriendo SQL Editor de Supabase..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr/sql/new"

Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "   1. El SQL Editor se abrira en tu navegador"
Write-Host "   2. Presiona Ctrl+V para pegar la migracion"
Write-Host "   3. Haz clic en el boton RUN (verde, esquina inferior derecha)"
Write-Host "   4. Espera a que termine la ejecucion"
Write-Host ""
Write-Host "La migracion ya esta en tu portapapeles!" -ForegroundColor Green
Write-Host ""
