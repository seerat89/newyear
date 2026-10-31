import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })

/**
 * Fills in public/sw.js after a build: the list of files to precache (everything in
 * the build except the worker itself and the font licence/readme) and a build id
 * hashed from their contents, so each deploy gets its own cache.
 */
function serviceWorker(): Plugin {
  let outDir = ''
  return {
    name: 'service-worker-precache',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const all = files(outDir)
        .map((path) => ({ path, url: '/' + relative(outDir, path).split('\\').join('/') }))
        // The audio is large; the worker keeps it in its own cache on first use instead.
        .filter(({ url }) => url !== '/sw.js' && url !== '/og-image.png' && url !== '/sitemap.xml' && !url.startsWith('/audio/') && !/\.(md|txt)$/.test(url))
        .sort((a, b) => a.url.localeCompare(b.url))
      const urls = ['/', ...all.map(({ url }) => url).filter((url) => url !== '/index.html')]
      const hash = createHash('sha1')
      all.forEach(({ path }) => hash.update(readFileSync(path)))
      const worker = join(outDir, 'sw.js')
      const source = readFileSync(worker, 'utf8')
      hash.update(source)
      writeFileSync(
        worker,
        source
          .replace("'__BUILD__'", JSON.stringify(hash.digest('hex').slice(0, 10)))
          .replace("'__PRECACHE__'", JSON.stringify(urls)),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
})
