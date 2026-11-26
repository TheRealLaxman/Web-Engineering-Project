import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const source = fileURLToPath(new URL('../../backend/photo.png', import.meta.url))
const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const output = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

await mkdir(publicDir, { recursive: true })

await sharp(source)
  .resize(2000, 1333, { fit: 'cover', position: 'attention' })
  .png({ compressionLevel: 0 })
  .toFile(output('hero-heavy.png'))

for (const width of [480, 800, 1200]) {
  await sharp(source)
    .resize(width, Math.round((width * 2) / 3), { fit: 'cover', position: 'attention' })
    .webp({ quality: 75 })
    .toFile(output(`hero-${width}.webp`))
}
