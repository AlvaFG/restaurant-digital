/**
 * i18n Auditor Script
 * Scans the codebase for hardcoded Spanish text that should be translated
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect hardcoded Spanish text
const hardcodedPatterns = [
  // Common Spanish words
  /["'`]Pedido[s]?["'`]/g,
  /["'`]Mesa[s]?["'`]/g,
  /["'`]Guardar["'`]/g,
  /["'`]Eliminar["'`]/g,
  /["'`]Usuario[s]?["'`]/g,
  /["'`]Zona[s]?["'`]/g,
  /["'`]Menú["'`]/g,
  /["'`]Carrito["'`]/g,
  /["'`]Total["'`]/g,
  /["'`]Cancelar["'`]/g,
  /["'`]Confirmar["'`]/g,
  /["'`]Agregar["'`]/g,
  /["'`]Editar["'`]/g,
  /["'`]Buscar["'`]/g,
  /["'`]Filtrar["'`]/g,
  /["'`]Configuración["'`]/g,
  /["'`]Personal["'`]/g,
  /["'`]Staff["'`]/g,
  /["'`]Analítica["'`]/g,
  /["'`]Reportes["'`]/g,
  /["'`]Ventas["'`]/g,
  /["'`]Ingresos["'`]/g,
  /["'`]Activo[s]?["'`]/g,
  /["'`]Disponible[s]?["'`]/g,
  /["'`]Preparando["'`]/g,
  /["'`]Listo["'`]/g,
  /["'`]Error["'`]/g,
  /["'`]Éxito["'`]/g,
  /["'`]Cargando["'`]/g,
  /["'`]Vacío["'`]/g,
  /["'`]Nombre["'`]/g,
  /["'`]Descripción["'`]/g,
  /["'`]Precio["'`]/g,
  /["'`]Cantidad["'`]/g,
  /["'`]Categoría[s]?["'`]/g,
];

// Directories to scan
const directoriesToScan = [
  './components',
  './app',
  './lib',
  './contexts',
];

// Files to ignore
const ignorePatterns = [
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /\.next/,
  /messages\//,
  /locales\//,
  /i18n/,
];

let totalIssues = 0;
const issuesByFile = new Map();

/**
 * Check if file should be scanned
 */
function shouldScanFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    return false;
  }
  
  return !ignorePatterns.some(pattern => pattern.test(filePath));
}

/**
 * Scan a single file for hardcoded text
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    hardcodedPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        // Get line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        issues.push({
          pattern: pattern.toString(),
          match: match[0],
          line: lineNumber,
        });
      }
    });

    if (issues.length > 0) {
      issuesByFile.set(filePath, issues);
      totalIssues += issues.length;
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!ignorePatterns.some(pattern => pattern.test(fullPath))) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile() && shouldScanFile(fullPath)) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n🔍 i18n Audit Report\n');
  console.log('═'.repeat(80));
  console.log(`\nTotal hardcoded strings found: ${totalIssues}\n`);

  if (totalIssues === 0) {
    console.log('✅ No hardcoded Spanish text detected!\n');
    return;
  }

  console.log('Files with issues:\n');

  // Sort by number of issues (descending)
  const sortedFiles = Array.from(issuesByFile.entries())
    .sort((a, b) => b[1].length - a[1].length);

  sortedFiles.forEach(([filePath, issues]) => {
    console.log(`\n📄 ${filePath} (${issues.length} issue${issues.length > 1 ? 's' : ''})`);
    console.log('─'.repeat(80));

    // Group by match
    const grouped = new Map();
    issues.forEach(issue => {
      if (!grouped.has(issue.match)) {
        grouped.set(issue.match, []);
      }
      grouped.get(issue.match).push(issue.line);
    });

    grouped.forEach((lines, match) => {
      console.log(`  ❌ ${match}`);
      console.log(`     Lines: ${lines.join(', ')}`);
    });
  });

  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 Recommendations:');
  console.log('  1. Replace hardcoded strings with useTranslations() hook');
  console.log('  2. Add missing keys to appropriate message files');
  console.log('  3. Use formatCurrency(), formatDate() from lib/format.ts');
  console.log('\n');
}

/**
 * Main execution
 */
console.log('🚀 Starting i18n audit...\n');

directoriesToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning ${dir}...`);
    scanDirectory(dir);
  }
});

generateReport();

// Exit with error code if issues found
process.exit(totalIssues > 0 ? 1 : 0);
