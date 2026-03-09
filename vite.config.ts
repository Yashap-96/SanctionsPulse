import { defineConfig, loadEnv } from 'vite'
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-data-and-api',
        configureServer(server) {
          // Serve /data directory as static JSON
          server.middlewares.use('/data', (req, res, next) => {
            const filePath = path.resolve('data', (req.url ?? '').replace(/^\//, ''))
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.setHeader('Content-Type', 'application/json')
              fs.createReadStream(filePath).pipe(res)
            } else {
              next()
            }
          })

          // Proxy /api/ai-summary to Groq API in dev mode
          server.middlewares.use('/api/ai-summary', (req, res) => {
            const groqKey = env.GROQ_API_KEY
            if (!groqKey) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                error: 'AI service not configured',
                message: 'Set GROQ_API_KEY in .env to enable the AI chat in dev mode',
              }))
              return
            }

            if (req.method === 'OPTIONS') {
              res.writeHead(204)
              res.end()
              return
            }

            let body = ''
            req.on('data', (chunk: Buffer) => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body)
                const messages = [
                  {
                    role: 'system',
                    content: 'You are a sanctions intelligence analyst for SanctionsPulse, an OFAC sanctions monitoring platform. Provide concise, professional analysis of sanctions data, programs, and compliance implications.',
                  },
                  ...parsed.messages,
                ]

                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 2048,
                  }),
                })

                const data = await groqRes.json()
                res.writeHead(groqRes.status, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(data))
              } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  error: 'Dev proxy error',
                  message: err instanceof Error ? err.message : 'Unknown error',
                }))
              }
            })
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
  }
})
