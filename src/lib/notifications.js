// Shared notification display helper.
//
// vite-plugin-pwa auto-registers its own service worker (sw.js) at the root
// scope for offline caching — `navigator.serviceWorker.ready` resolves to
// THAT worker, not firebase-messaging-sw.js (which Firebase registers at the
// separate scope '/firebase-cloud-messaging-push-scope'). Only
// firebase-messaging-sw.js has our `notificationclick` handler, so any
// notification shown via the wrong registration is untappable — it just
// sits there. This helper always prefers the Firebase registration so every
// notification (foreground Realtime alert or background FCM push) opens the
// crew member's calendar on tap.
export async function showCrewNotification(title, { body, url = '/crew/calendar', vibrate } = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const options = {
    body,
    icon: '/logo-nonsquare.png',
    badge: '/logo-nonsquare.png',
    data: { url },
    vibrate: vibrate || [200, 100, 200],
  };

  try {
    if ('serviceWorker' in navigator) {
      let reg = await navigator.serviceWorker
        .getRegistration('/firebase-cloud-messaging-push-scope')
        .catch(() => null);
      if (!reg) reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (e) {
    console.warn('Notification display error:', e);
  }
}
