/**
 * Lighthouse PWA Audit Script
 * Runs Lighthouse audit and generates report
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../lighthouse-reports');

// Lighthouse configuration
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['pwa', 'performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
  },
};

async function runLighthouse() {
  console.log('🚀 Starting Lighthouse audit...\n');
  console.log(`📍 Target URL: ${TARGET_URL}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  try {
    // Run Lighthouse
    const runnerResult = await lighthouse(TARGET_URL, {
      port: chrome.port,
      output: ['json', 'html'],
    }, config);

    // Extract results
    const { lhr, report } = runnerResult;
    const [jsonReport, htmlReport] = report;

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Save HTML report
    const htmlPath = path.join(OUTPUT_DIR, `lighthouse-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`\n📄 HTML Report saved: ${htmlPath}`);

    // Save JSON report
    const jsonPath = path.join(OUTPUT_DIR, `lighthouse-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2));
    console.log(`📄 JSON Report saved: ${jsonPath}\n`);

    // Print scores
    console.log('📊 Lighthouse Scores:\n');
    console.log(`   PWA:             ${Math.round(lhr.categories.pwa.score * 100)}/100 ${getScoreEmoji(lhr.categories.pwa.score)}`);
    console.log(`   Performance:     ${Math.round(lhr.categories.performance.score * 100)}/100 ${getScoreEmoji(lhr.categories.performance.score)}`);
    console.log(`   Accessibility:   ${Math.round(lhr.categories.accessibility.score * 100)}/100 ${getScoreEmoji(lhr.categories.accessibility.score)}`);
    console.log(`   Best Practices:  ${Math.round(lhr.categories['best-practices'].score * 100)}/100 ${getScoreEmoji(lhr.categories['best-practices'].score)}`);
    console.log(`   SEO:             ${Math.round(lhr.categories.seo.score * 100)}/100 ${getScoreEmoji(lhr.categories.seo.score)}\n`);

    // Check if all scores meet threshold
    const threshold = 0.9; // 90/100
    const allPassed = Object.values(lhr.categories).every(
      category => category.score >= threshold
    );

    if (allPassed) {
      console.log('✅ All scores meet the threshold (>90)!\n');
    } else {
      console.log('⚠️  Some scores are below threshold (90):\n');
      
      Object.entries(lhr.categories).forEach(([key, category]) => {
        if (category.score < threshold) {
          console.log(`   ${category.title}: ${Math.round(category.score * 100)}/100`);
        }
      });
      console.log('');
    }

    // Print PWA audit details
    console.log('🔍 PWA Audit Details:\n');
    const pwaAudits = lhr.categories.pwa.auditRefs;
    
    for (const auditRef of pwaAudits) {
      const audit = lhr.audits[auditRef.id];
      const status = audit.score === 1 ? '✅' : audit.score === null ? '⚠️' : '❌';
      console.log(`   ${status} ${audit.title}`);
      
      if (audit.score !== 1 && audit.description) {
        console.log(`      ${audit.description}`);
      }
    }
    console.log('');

    // Print actionable recommendations
    if (!allPassed) {
      console.log('💡 Recommendations:\n');
      
      Object.entries(lhr.categories).forEach(([key, category]) => {
        if (category.score < threshold) {
          console.log(`   ${category.title}:`);
          
          category.auditRefs
            .filter(ref => {
              const audit = lhr.audits[ref.id];
              return audit.score !== null && audit.score < 1;
            })
            .slice(0, 3) // Top 3 issues
            .forEach(ref => {
              const audit = lhr.audits[ref.id];
              console.log(`     - ${audit.title}`);
              if (audit.description) {
                console.log(`       ${audit.description}`);
              }
            });
          console.log('');
        }
      });
    }

    // Print performance metrics
    console.log('⚡ Performance Metrics:\n');
    const metrics = lhr.audits['metrics'];
    if (metrics && metrics.details) {
      const items = metrics.details.items[0];
      console.log(`   First Contentful Paint:  ${Math.round(items.firstContentfulPaint)}ms`);
      console.log(`   Largest Contentful Paint: ${Math.round(items.largestContentfulPaint)}ms`);
      console.log(`   Speed Index:             ${Math.round(items.speedIndex)}ms`);
      console.log(`   Time to Interactive:     ${Math.round(items.interactive)}ms`);
      console.log(`   Total Blocking Time:     ${Math.round(items.totalBlockingTime)}ms`);
      console.log(`   Cumulative Layout Shift: ${items.cumulativeLayoutShift.toFixed(3)}\n`);
    }

    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error);
    process.exit(1);
  } finally {
    await chrome.kill();
  }
}

function getScoreEmoji(score) {
  if (score >= 0.9) return '✅';
  if (score >= 0.5) return '⚠️';
  return '❌';
}

// Run if called directly
if (require.main === module) {
  runLighthouse().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { runLighthouse };
