import express from 'express'
import path from 'node:path'

const app = express()
const dist = path.resolve('dist')

app.use(
  '/assets',
  express.static(path.join(dist, 'assets'), {
    immutable: true,
    maxAge: '1y',
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'),
  }),
)
app.use(
  express.static(dist, {
    setHeaders: (res, file) => {
      if (file.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      } else if (/\.(?:webp|png|jpe?g|svg)$/.test(file)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
      }
    },
  }),
)
app.get('/{*splat}', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.join(dist, 'index.html'))
})
app.listen(4000, () => console.log('http://localhost:4000'))
