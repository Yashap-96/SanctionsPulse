import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-data-dir',
      configureServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const filePath = path.resolve('data', (req.url ?? '').replace(/^\//, ''))
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'application/json')
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
      closeBundle() {
        const srcDir = path.resolve('data')
        const destDir = path.resolve('dist', 'data')
        if (fs.existsSync(srcDir)) {
          copyDirRecursive(srcDir, destDir)
          console.log('Copied data/ to dist/data/')
        }
      },
    },
  ],
})
