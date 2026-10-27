// Registers the service worker (public/sw.js) so the installed app launches offline.
// Production builds only: in development a worker would cache stale modules.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app works the same without it; it just will not launch offline.
    })
  })
}
