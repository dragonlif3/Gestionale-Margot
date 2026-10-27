/* Gestione delle notifiche push nel service worker.
 *
 * Questo file viene importato dal service worker che genera vite-plugin-pwa
 * (vedi "importScripts" in vite.config.js). Non viene compilato da Vite:
 * va scritto in JavaScript semplice, senza import.
 */

// Arriva una push dal server: va SEMPRE mostrata una notifica visibile
// (i browser, iPhone compreso, lo pretendono; altrimenti revocano il permesso).
self.addEventListener('push', (event) => {
  let dati = {};
  try {
    dati = event.data ? event.data.json() : {};
  } catch {
    dati = { testo: event.data ? event.data.text() : '' };
  }

  const titolo = dati.titolo || 'Gestionale Cantina';
  const opzioni = {
    body: dati.testo || '',
    icon: '/icon-192.png',
    data: { url: dati.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(titolo, opzioni));
});

// L'utente tocca la notifica: porta in primo piano l'app se è già aperta,
// altrimenti la apre.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const finestre = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const finestra of finestre) {
        if ('focus' in finestra) {
          await finestra.focus();
          if ('navigate' in finestra) await finestra.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
