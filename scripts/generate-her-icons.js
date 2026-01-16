// scripts/generate-her-icons.js
// Run with: node scripts/generate-her-icons.js

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

// Roome brand logo - R with door design
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="roomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- 圆角方形背景 -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="url(#roomeGrad)"/>
  <!-- R 主体竖线 -->
  <rect x="120" y="96" width="56" height="320" rx="8" fill="white"/>
  <!-- R 头部弧线 -->
  <path d="M176 96 L280 96 C344 96 392 144 392 208 C392 272 344 320 280 320 L176 320 L176 264 L272 264 C304 264 328 240 328 208 C328 176 304 152 272 152 L176 152 L176 96Z" fill="white"/>
  <!-- R 的右腿变成门框 -->
  <rect x="260" y="300" width="120" height="116" rx="8" fill="white"/>
  <!-- 门（打开状态，有透视感） -->
  <path d="M268 308 L340 320 L340 400 L268 408 Z" fill="url(#roomeGrad)" opacity="0.8"/>
  <!-- 门把手 -->
  <circle cx="328" cy="360" r="8" fill="white"/>
</svg>`

// Tray icon SVG (smaller, simpler - just R)
const trayIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="trayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="30" height="30" rx="6" fill="url(#trayGradient)"/>
  <text x="16" y="23"
        font-family="Arial, sans-serif"
        font-size="18"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
    R
  </text>
</svg>`

// Dark tray icon (white outline)
const trayIconDarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="white" stroke-width="2"/>
  <text x="16" y="23"
        font-family="Arial, sans-serif"
        font-size="18"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
    R
  </text>
</svg>`

// Light tray icon (gradient outline)
const trayIconLightSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="url(#lightGradient)" stroke-width="2"/>
  <text x="16" y="23"
        font-family="Arial, sans-serif"
        font-size="18"
        font-weight="bold"
        fill="url(#lightGradient)"
        text-anchor="middle">
    R
  </text>
</svg>`

async function generateIcons() {
  const buildDir = path.join(__dirname, '..', 'build')
  const iconsDir = path.join(buildDir, 'icons')
  const assetsDir = path.join(__dirname, '..', 'src', 'renderer', 'src', 'assets', 'images')

  // Ensure directories exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  console.log('Generating Roome brand icons...')

  // Generate main icon at various sizes
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `${size}x${size}.png`)
    await sharp(Buffer.from(svgContent)).resize(size, size).png().toFile(outputPath)
    console.log(`Generated: ${size}x${size}.png`)
  }

  // Generate main icon.png (512x512)
  await sharp(Buffer.from(svgContent)).resize(512, 512).png().toFile(path.join(buildDir, 'icon.png'))
  console.log('Generated: icon.png')

  // Generate logo.png for build
  await sharp(Buffer.from(svgContent)).resize(512, 512).png().toFile(path.join(buildDir, 'logo.png'))
  console.log('Generated: build/logo.png')

  // Generate assets logo.png
  await sharp(Buffer.from(svgContent)).resize(512, 512).png().toFile(path.join(assetsDir, 'logo.png'))
  console.log('Generated: assets/logo.png')

  // Generate tray icons
  await sharp(Buffer.from(trayIconSvg)).resize(32, 32).png().toFile(path.join(buildDir, 'tray_icon.png'))
  console.log('Generated: tray_icon.png')

  await sharp(Buffer.from(trayIconDarkSvg)).resize(32, 32).png().toFile(path.join(buildDir, 'tray_icon_dark.png'))
  console.log('Generated: tray_icon_dark.png')

  await sharp(Buffer.from(trayIconLightSvg)).resize(32, 32).png().toFile(path.join(buildDir, 'tray_icon_light.png'))
  console.log('Generated: tray_icon_light.png')

  console.log('\nAll Roome icons generated successfully!')
  console.log('\nNote: Run "yarn generate:icons" to generate .ico and .icns files from build/logo.png')
}

generateIcons().catch(console.error)
