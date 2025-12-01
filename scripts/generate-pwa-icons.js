/**
 * Generate PWA Icon Placeholders
 * Creates basic placeholder icons for PWA manifest
 * For production, use real icons generated from a logo
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// SVG template for placeholder icon
function createSVGIcon(size, color = '#0ea5e9') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">
    R
  </text>
</svg>`;
}

// Maskable icon with safe zone
function createMaskableIcon(size) {
  const safeZone = size * 0.8; // 80% safe zone
  const offset = (size - safeZone) / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Full background -->
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  <!-- Safe zone content -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${safeZone / 2.5}" fill="white" opacity="0.9"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${safeZone * 0.35}" font-weight="bold" fill="#0ea5e9" text-anchor="middle" dominant-baseline="central">
    R
  </text>
</svg>`;
}

// Badge icon (small icon for notifications)
function createBadgeIcon(size = 96) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#0ea5e9"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="white"/>
</svg>`;
}

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Generating PWA icon placeholders...\n');

// Generate regular icons
ICON_SIZES.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png.svg`;
  const filepath = path.join(PUBLIC_DIR, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created ${filename}`);
});

// Generate maskable icon
const maskableSVG = createMaskableIcon(512);
fs.writeFileSync(path.join(PUBLIC_DIR, 'maskable-icon.png.svg'), maskableSVG);
console.log('✅ Created maskable-icon.png.svg');

// Generate badge icon
const badgeSVG = createBadgeIcon(72);
fs.writeFileSync(path.join(PUBLIC_DIR, 'badge-72x72.png.svg'), badgeSVG);
console.log('✅ Created badge-72x72.png.svg');

console.log('\n📝 Icon placeholders created!');
console.log('\n⚠️  IMPORTANT:');
console.log('These are SVG placeholders. For production:');
console.log('1. Design proper icons with your brand');
console.log('2. Convert SVG to PNG using a tool like:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/');
console.log('   - npm package: pwa-asset-generator');
console.log('\n💡 To generate PNG icons from your logo:');
console.log('   npm install -g pwa-asset-generator');
console.log('   pwa-asset-generator logo.svg public --icon-only --favicon');
console.log('\n📸 Don\'t forget to create screenshots:');
console.log('   - Desktop: 1280x720 (wide)');
console.log('   - Mobile: 750x1334 (narrow)');
console.log('   Save them in /public/screenshots/');
