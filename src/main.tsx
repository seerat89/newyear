import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Analytics } from '@vercel/analytics/react'
import { registerServiceWorker } from './pwa'

// Optional local-only helpers: anything in src/dev/ (git-ignored, so absent on a
// fresh clone and in every deployed build) is loaded first, in development only.
if (import.meta.env.DEV) {
  await Promise.all(Object.values(import.meta.glob('./dev/*.ts')).map((load) => load()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)

registerServiceWorker()
