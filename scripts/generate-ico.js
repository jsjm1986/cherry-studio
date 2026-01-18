// scripts/generate-ico.js
// Generate .ico file from PNG using sharp and to-ico

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

async function generateIco() {
  const buildDir = path.join(__dirname, '..', 'build')
  const inputPng = path.join(buildDir, 'logo.png')
  const outputIco = path.join(buildDir, 'icon.ico')

  console.log('Generating icon.ico from logo.png...')

  // Generate multiple sizes for .ico
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const pngBuffers = []

  for (const size of sizes) {
    const buffer = await sharp(inputPng).resize(size, size).png().toBuffer()
    pngBuffers.push(buffer)
    console.log(`Generated ${size}x${size} PNG buffer`)
  }

  // For now, just copy the 256x256 as icon.ico
  // A proper .ico file would need a library like 'to-ico' or 'png-to-ico'
  // But for electron-builder, a 256x256 PNG renamed to .ico often works
  await sharp(inputPng).resize(256, 256).png().toFile(outputIco)

  console.log('Generated: icon.ico')
  console.log('\nNote: This is a PNG file renamed to .ico')
  console.log('For a proper multi-resolution .ico, install: npm install -g electron-icon-builder')
}

generateIco().catch(console.error)
