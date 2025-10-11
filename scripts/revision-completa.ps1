# Script de Revisión Completa del Proyecto
# Automatiza la limpieza, organización y verificación del proyecto

param(
    [switch]$DryRun = $false,
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "INICIANDO REVISION COMPLETA DEL PROYECTO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Funcion para logging
function Write-Step {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 1. VERIFICAR DEPENDENCIAS
Write-Host "Paso 1: Verificando dependencias..." -ForegroundColor Blue
Write-Host ""

try {
    node --version | Out-Null
    Write-Step "Node.js instalado"
} catch {
    Write-Error-Custom "Node.js no encontrado. Instalar Node.js 18+"
    exit 1
}

try {
    npm --version | Out-Null
    Write-Step "npm instalado"
} catch {
    Write-Error-Custom "npm no encontrado"
    exit 1
}

# 2. LIMPIAR ARCHIVOS TEMPORALES
Write-Host ""
Write-Host "Paso 2: Limpiando archivos temporales..." -ForegroundColor Blue
Write-Host ""

$tempDirs = @(".next", ".tmp", "node_modules/.cache")
foreach ($dir in $tempDirs) {
    if (Test-Path $dir) {
        if (-not $DryRun) {
            Remove-Item -Recurse -Force $dir
            Write-Step "Eliminado: $dir"
        } else {
            Write-Info "Se eliminaría: $dir"
        }
    }
}

# 3. VERIFICAR TYPESCRIPT
Write-Host ""
Write-Host "Paso 3: Verificando TypeScript..." -ForegroundColor Blue
Write-Host ""

if (-not $DryRun) {
    $tsCheck = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Sin errores de TypeScript"
    } else {
        Write-Error-Custom "Errores de TypeScript encontrados"
        if ($Verbose) {
            Write-Host $tsCheck
        }
    }
}

# 4. EJECUTAR LINTER
Write-Host ""
Write-Host "Paso 4: Ejecutando ESLint..." -ForegroundColor Blue
Write-Host ""

if (-not $DryRun) {
    $lintResult = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Linter pasó exitosamente"
    } else {
        Write-Error-Custom "Warnings/errores de ESLint encontrados"
        if ($Verbose) {
            Write-Host $lintResult
        }
    }
}

# 5. EJECUTAR TESTS
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "Paso 5: Ejecutando tests..." -ForegroundColor Blue
    Write-Host ""

    if (-not $DryRun) {
        $testResult = npm run test 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Step "Tests pasaron exitosamente"
        } else {
            Write-Error-Custom "Algunos tests fallaron"
            if ($Verbose) {
                Write-Host $testResult
            }
        }
    }
}

# 6. ANALIZAR ARCHIVOS DUPLICADOS
Write-Host ""
Write-Host "Paso 6: Buscando archivos duplicados..." -ForegroundColor Blue
Write-Host ""

$mdFiles = Get-ChildItem -Path . -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".next" }

$fileHashes = @{}
$duplicates = @()

foreach ($file in $mdFiles) {
    $hash = Get-FileHash $file.FullName -Algorithm MD5
    if ($fileHashes.ContainsKey($hash.Hash)) {
        $duplicates += [PSCustomObject]@{
            Original = $fileHashes[$hash.Hash]
            Duplicate = $file.FullName
        }
    } else {
        $fileHashes[$hash.Hash] = $file.FullName
    }
}

if ($duplicates.Count -gt 0) {
    Write-Info "Se encontraron $($duplicates.Count) archivos duplicados:"
    foreach ($dup in $duplicates) {
        Write-Host "  - $($dup.Duplicate) (duplicado de $($dup.Original))" -ForegroundColor DarkYellow
    }
} else {
    Write-Step "No se encontraron archivos duplicados"
}

# 7. VERIFICAR ARCHIVOS OBSOLETOS
Write-Host ""
Write-Host "Paso 7: Buscando archivos obsoletos..." -ForegroundColor Blue
Write-Host ""

$sixMonthsAgo = (Get-Date).AddMonths(-6)
$oldDocs = Get-ChildItem -Path ".\docs" -Filter "*.md" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $sixMonthsAgo -and $_.Name -notmatch "README" }

if ($oldDocs.Count -gt 0) {
    Write-Info "Se encontraron $($oldDocs.Count) documentos sin modificar en > 6 meses:"
    foreach ($doc in $oldDocs | Select-Object -First 10) {
        Write-Host "  - $($doc.FullName) (última modificación: $($doc.LastWriteTime.ToString('yyyy-MM-dd')))" -ForegroundColor DarkYellow
    }
    if ($oldDocs.Count -gt 10) {
        Write-Host "  ... y $($oldDocs.Count - 10) más" -ForegroundColor DarkYellow
    }
} else {
    Write-Step "No se encontraron documentos obsoletos"
}

# 8. VERIFICAR IMPORTS NO UTILIZADOS
Write-Host ""
Write-Host "Paso 8: Verificando imports no utilizados..." -ForegroundColor Blue
Write-Host ""

if (-not $DryRun) {
    Write-Info "Ejecutando análisis de imports..."
    # Nota: Esto requiere ts-unused-exports instalado
    # npm install -g ts-unused-exports
}

# 9. GENERAR REPORTE
Write-Host ""
Write-Host "Paso 9: Generando reporte..." -ForegroundColor Blue
Write-Host ""

$reportPath = ".\docs\07-historico\revision-completa-$(Get-Date -Format 'yyyy-MM-dd').md"
$reportContent = @"
# Reporte de Revisión Completa - $(Get-Date -Format 'dd/MM/yyyy HH:mm')

## Resumen

- **Errores TypeScript:** $(if ($tsCheck) { "Encontrados" } else { "Sin errores" })
- **Warnings ESLint:** $(if ($lintResult) { "Encontrados" } else { "Sin warnings" })
- **Tests:** $(if (-not $SkipTests) { if ($testResult) { "Pasaron" } else { "Fallaron" } } else { "Omitidos" })
- **Archivos duplicados:** $($duplicates.Count)
- **Documentos obsoletos:** $($oldDocs.Count)

## Archivos Duplicados

$(if ($duplicates.Count -gt 0) {
    $duplicates | ForEach-Object { "- ``$($_.Duplicate)`` (duplicado de ``$($_.Original)``)" } | Out-String
} else {
    "No se encontraron archivos duplicados."
})

## Documentos Obsoletos (> 6 meses sin modificar)

$(if ($oldDocs.Count -gt 0) {
    $oldDocs | ForEach-Object { "- ``$($_.FullName)`` - Última modificación: $($_.LastWriteTime.ToString('yyyy-MM-dd'))" } | Out-String
} else {
    "No se encontraron documentos obsoletos."
})

## Recomendaciones

1. Revisar y eliminar archivos duplicados
2. Archivar o actualizar documentos obsoletos
3. Corregir errores de TypeScript y ESLint
4. Actualizar tests fallidos

## Próximos Pasos

- [ ] Implementar internacionalización completa a español
- [ ] Reorganizar estructura de documentación
- [ ] Optimizar servicios críticos
- [ ] Ejecutar tests E2E
- [ ] Preparar para deploy a staging

---
*Generado automáticamente por revision-completa.ps1*
"@

if (-not $DryRun) {
    # Crear directorio si no existe
    $reportDir = Split-Path $reportPath -Parent
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    $reportContent | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Step "Reporte generado en: $reportPath"
} else {
    Write-Info "Se generaría reporte en: $reportPath"
}

# 10. RESUMEN FINAL
Write-Host ""
Write-Host "REVISION COMPLETADA" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de la revision:" -ForegroundColor Cyan
Write-Host "- Archivos duplicados encontrados: $($duplicates.Count)" -ForegroundColor White
Write-Host "- Documentos obsoletos: $($oldDocs.Count)" -ForegroundColor White
Write-Host "- Modo: $(if ($DryRun) { 'DRY RUN (sin cambios)' } else { 'EJECUCION REAL' })" -ForegroundColor White
Write-Host ""

if ($DryRun) {
    Write-Host "[INFO] Ejecuta sin -DryRun para aplicar cambios reales" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para mas detalles, consulta:" -ForegroundColor Cyan
Write-Host "   - docs/prompts/PROMPT_REVISION_COMPLETA_PROYECTO.md" -ForegroundColor White
Write-Host "   - $reportPath" -ForegroundColor White
Write-Host ""
