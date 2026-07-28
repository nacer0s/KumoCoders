export default function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/studio/sw.js').then(
        (registration) => {
          console.log('SW registered:', registration.scope);
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('SW update available');
                }
              });
            }
          });
        },
        (err) => {
          console.warn('SW registration failed:', err);
        }
      );
    });
  }
}
