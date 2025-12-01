/**
 * Generate iOS-specific PWA assets
 * Apple Touch Icons and Splash Screens
 */

const fs = require('fs');
const path = require('path');

// Apple Touch Icon sizes
const APPLE_ICON_SIZES = [
  { size: 180, name: 'apple-touch-icon.png' }, // iPhone Retina, iPad Retina
  { size: 167, name: 'apple-touch-icon-167x167.png' }, // iPad Pro
  { size: 152, name: 'apple-touch-icon-152x152.png' }, // iPad Air
  { size: 120, name: 'apple-touch-icon-120x120.png' }, // iPhone SE, 6, 7, 8
];

// iOS Splash Screen sizes (Portrait only for simplicity)
const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'apple-splash-640-1136.png', device: 'iPhone SE' },
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png', device: 'iPhone 8' },
  { width: 1242, height: 2208, name: 'apple-splash-1242-2208.png', device: 'iPhone 8 Plus' },
  { width: 828, height: 1792, name: 'apple-splash-828-1792.png', device: 'iPhone 11' },
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png', device: 'iPhone 11 Pro Max' },
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png', device: 'iPhone 11 Pro, X, XS' },
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png', device: 'iPad Mini, Air' },
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png', device: 'iPad Pro 11"' },
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png', device: 'iPad Pro 12.9"' },
];

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/**
 * Create Apple Touch Icon SVG
 */
function createAppleTouchIcon(size) {
  const padding = size * 0.1; // 10% padding for safe zone
  const iconSize = size - (padding * 2);
  const fontSize = iconSize * 0.6;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with gradient -->
  <defs>
    <linearGradient id="bgGrad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow-${size}">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge> 
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/> 
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad-${size})" />
  
  <!-- Letter R -->
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
    filter="url(#shadow-${size})"
  >R</text>
  
  <!-- Border for depth -->
  <rect 
    width="${size}" 
    height="${size}" 
    fill="none" 
    stroke="rgba(255,255,255,0.2)" 
    stroke-width="2"
  />
</svg>`;
}

/**
 * Create iOS Splash Screen SVG
 */
function createSplashScreen(width, height, device) {
  const centerX = width / 2;
  const centerY = height / 2;
  const logoSize = Math.min(width, height) * 0.25; // 25% of smallest dimension
  const fontSize = logoSize * 0.6;
  const titleY = centerY + logoSize / 2 + 60;
  const subtitleY = titleY + 40;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <defs>
    <linearGradient id="splashGrad-${width}x${height}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#splashGrad-${width}x${height})" />
  
  <!-- Logo circle -->
  <circle 
    cx="${centerX}" 
    cy="${centerY}" 
    r="${logoSize / 2}" 
    fill="rgba(255,255,255,0.15)" 
    filter="url(#glow)"
  />
  
  <!-- Logo letter -->
  <text 
    x="${centerX}" 
    y="${centerY}" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
  >R</text>
  
  <!-- App name -->
  <text 
    x="${centerX}" 
    y="${titleY}" 
    font-family="Arial, sans-serif" 
    font-size="32" 
    font-weight="600" 
    fill="white" 
    text-anchor="middle"
  >Restaurant QR</text>
  
  <!-- Subtitle -->
  <text 
    x="${centerX}" 
    y="${subtitleY}" 
    font-family="Arial, sans-serif" 
    font-size="18" 
    fill="rgba(255,255,255,0.8)" 
    text-anchor="middle"
  >Sistema de Gestión</text>
  
  <!-- Loading indicator -->
  <circle 
    cx="${centerX}" 
    cy="${height - 100}" 
    r="20" 
    fill="none" 
    stroke="white" 
    stroke-width="3" 
    stroke-dasharray="100" 
    opacity="0.5"
  >
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 ${centerX} ${height - 100}"
      to="360 ${centerX} ${height - 100}"
      dur="1s"
      repeatCount="indefinite"
    />
  </circle>
</svg>`;
}

/**
 * Main generation function
 */
function generateIOSAssets() {
  console.log('🍎 Generating iOS PWA assets...\n');
  
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  // Generate Apple Touch Icons
  console.log('📱 Creating Apple Touch Icons:');
  APPLE_ICON_SIZES.forEach(({ size, name }) => {
    const svg = createAppleTouchIcon(size);
    const filePath = path.join(PUBLIC_DIR, name);
    fs.writeFileSync(filePath, svg);
    console.log(`  ✓ ${name} (${size}x${size})`);
  });
  
  console.log('\n🖼️  Creating Splash Screens:');
  SPLASH_SIZES.forEach(({ width, height, name, device }) => {
    const svg = createSplashScreen(width, height, device);
    const filePath = path.join(PUBLIC_DIR, name);
    fs.writeFileSync(filePath, svg);
    console.log(`  ✓ ${name} (${width}x${height} - ${device})`);
  });
  
  console.log('\n✅ iOS assets generated successfully!\n');
  console.log('⚠️  NOTE: These are SVG placeholders for development.');
  console.log('📝 For production, use proper PNG files generated from your logo.');
  console.log('🔧 Tools: pwa-asset-generator, Photoshop, Figma, or online generators\n');
  console.log('📖 See docs/PWA_ASSETS_GUIDE.md for detailed instructions.\n');
}

// Run if called directly
if (require.main === module) {
  generateIOSAssets();
}

module.exports = { generateIOSAssets };
