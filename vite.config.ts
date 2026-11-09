import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'child_process'
import type { IncomingMessage, ServerResponse } from 'http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'open-file-handler',
      configureServer(server) {
        // ファイルを開くAPI（ショートカットスロット用）
        server.middlewares.use('/api/open-file', (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: Buffer) => { body += chunk.toString() })
            req.on('end', () => {
              try {
                const { filePath } = JSON.parse(body)
                if (!filePath || typeof filePath !== 'string') {
                  res.statusCode = 400
                  res.end(JSON.stringify({ ok: false, error: 'パスが無効です', path: '' }))
                  return
                }

                const ext = filePath.split('.').pop()?.toLowerCase() ?? ''

                if (ext === 'exe') {
                  // .exe は直接実行
                  execFile(filePath, [], { detached: true } as never, (err: Error | null) => {
                    if (err) console.error('[open-file] execFile err:', err.message)
                  })
                } else {
                  // .lnk / その他は explorer.exe 経由
                  execFile('explorer.exe', [filePath], (err: Error | null) => {
                    if (err) console.error('[open-file] explorer err:', err.message)
                  })
                }
                res.end(JSON.stringify({ ok: true, path: filePath }))

              } catch (e) {
                res.statusCode = 500
                res.end(JSON.stringify({ ok: false, error: String(e) }))
              }
            })
          } else {
            res.statusCode = 405
            res.end()
          }
        })
      }
    }
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    open: true
  }
})
