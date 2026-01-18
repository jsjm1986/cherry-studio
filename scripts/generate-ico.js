// scripts/generate-ico.js
// Generate proper .ico file from PNG using sharp and manual ICO format

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// ICO file format structure
function createIcoFile(images) {
  // ICO header (6 bytes)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved, must be 0
  header.writeUInt16LE(1, 2) // Image type: 1 for ICO
  header.writeUInt16LE(images.length, 4) // Number of images

  // Calculate directory entries and image data
  let offset = 6 + images.length * 16 // Header + directory entries
  const directoryEntries = []
  const imageData = []

  for (const img of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0) // Width (0 means 256)
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1) // Height (0 means 256)
    entry.writeUInt8(0, 2) // Color palette (0 for PNG)
    entry.writeUInt8(0, 3) // Reserved
    entry.writeUInt16LE(1, 4) // Color planes
    entry.writeUInt16LE(32, 6) // Bits per pixel
    entry.writeUInt32LE(img.data.length, 8) // Image data size
    entry.writeUInt32LE(offset, 12) // Offset to image data

    directoryEntries.push(entry)
    imageData.push(img.data)
    offset += img.data.length
  }

  return Buffer.concat([header, ...directoryEntries, ...imageData])
}

async function generateIco() {
  const buildDir = path.join(__dirname, '..', 'build')
  const inputPng = path.join(buildDir, 'logo.png')
  const outputIco = path.join(buildDir, 'icon.ico')

  console.log('Generating proper icon.ico from logo.png...')

  // Generate multiple sizes for .ico (Windows standard sizes)
  const sizes = [16, 32, 48, 256]
  const images = []

  for (const size of sizes) {
    const buffer = await sharp(inputPng)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer()

    images.push({ size, data: buffer })
    console.log(`Generated ${size}x${size} PNG`)
  }

  // Create proper ICO file
  const icoBuffer = createIcoFile(images)
  fs.writeFileSync(outputIco, icoBuffer)

  console.log(`Generated: icon.ico (${icoBuffer.length} bytes)`)
  console.log('✓ Proper multi-resolution ICO file created')
}

generateIco().catch(console.error)
