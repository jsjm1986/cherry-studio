// scripts/generate-her-icons.js
// Run with: node scripts/generate-her-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="herMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="50%" style="stop-color:#E91E8C"/>
      <stop offset="100%" style="stop-color:#9C27B0"/>
    </linearGradient>
    <linearGradient id="herLightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFB6D1"/>
      <stop offset="100%" style="stop-color:#E091FF"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#herMainGradient)"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="url(#herLightGradient)" stroke-width="3" opacity="0.5"/>
  <text x="256" y="290"
        font-family="Arial, Helvetica, sans-serif"
        font-size="180"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        letter-spacing="-8">
    Her
  </text>
</svg>`;

// Tray icon SVG (smaller, simpler)
const trayIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="trayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="100%" style="stop-color:#9C27B0"/>
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="14" fill="url(#trayGradient)"/>
  <text x="16" y="21"
        font-family="Arial, sans-serif"
        font-size="14"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
    H
  </text>
</svg>`;

// Dark tray icon (white outline)
const trayIconDarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="none" stroke="white" stroke-width="2"/>
  <text x="16" y="21"
        font-family="Arial, sans-serif"
        font-size="14"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
    H
  </text>
</svg>`;

// Light tray icon (dark outline)
const trayIconLightSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B9D"/>
      <stop offset="100%" style="stop-color:#9C27B0"/>
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="14" fill="none" stroke="url(#lightGradient)" stroke-width="2"/>
  <text x="16" y="21"
        font-family="Arial, sans-serif"
        font-size="14"
        font-weight="bold"
        fill="url(#lightGradient)"
        text-anchor="middle">
    H
  </text>
</svg>`;

async function generateIcons() {
  const buildDir = path.join(__dirname, '..', 'build');
  const iconsDir = path.join(buildDir, 'icons');
  const assetsDir = path.join(__dirname, '..', 'src', 'renderer', 'src', 'assets', 'images');

  // Ensure directories exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating Her brand icons...');

  // Generate main icon at various sizes
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `${size}x${size}.png`);
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${size}x${size}.png`);
  }

  // Generate main icon.png (512x512)
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(buildDir, 'icon.png'));
  console.log('Generated: icon.png');

  // Generate logo.png for build
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(buildDir, 'logo.png'));
  console.log('Generated: build/logo.png');

  // Generate assets logo.png
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'logo.png'));
  console.log('Generated: assets/logo.png');

  // Generate tray icons
  await sharp(Buffer.from(trayIconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(buildDir, 'tray_icon.png'));
  console.log('Generated: tray_icon.png');

  await sharp(Buffer.from(trayIconDarkSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(buildDir, 'tray_icon_dark.png'));
  console.log('Generated: tray_icon_dark.png');

  await sharp(Buffer.from(trayIconLightSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(buildDir, 'tray_icon_light.png'));
  console.log('Generated: tray_icon_light.png');

  console.log('\nAll icons generated successfully!');
  console.log('\nNote: Run "yarn generate:icons" to generate .ico and .icns files from build/logo.png');
}

generateIcons().catch(console.error);
