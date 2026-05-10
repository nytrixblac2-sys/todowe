// Generates solid lime-green PWA icons using only Node.js built-ins
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

function crc32(buf) {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF]
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const len  = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t    = Buffer.from(type)
  const crcN = Buffer.alloc(4); crcN.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcN])
}

function createPNG(size, r, g, b) {
  const sig  = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB

  const row = Buffer.alloc(1 + size * 3)
  row[0] = 0 // filter: None
  for (let x = 0; x < size; x++) { row[1+x*3]=r; row[2+x*3]=g; row[3+x*3]=b }
  const raw  = Buffer.concat(Array.from({ length: size }, () => row))
  const idat = zlib.deflateSync(raw)

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir)

// Todowe accent: lime green #c8f56a = rgb(200, 245, 106)
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 200, 245, 106))
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 200, 245, 106))
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 200, 245, 106))
console.log('PWA icons created in public/')
