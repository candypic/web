importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyBEgzrJvL-AZtTSWq4STQs9WBaI5YwVass",
  authDomain: "candypic-62248.firebaseapp.com",
  projectId: "candypic-62248",
  storageBucket: "candypic-62248.firebasestorage.app",
  messagingSenderId: "644765402718",
  appId: "1:644765402718:web:e884b7380c5bf165ab16cf",
  measurementId: "G-8H49XB5XM7"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Candy Pic Studio';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo-nonsquare.png', // Uses your app logo
    badge: '/logo-nonsquare.png', // Small icon in status bar
    data: {
        url: payload.data?.url || payload.data?.click_action || '/crew/calendar'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click listener: focus an already-open crew portal window if one exists
// (so tapping the notification never stacks a second window), otherwise
// open a fresh one straight into the crew member's own calendar. Because
// the deep link carries ?email=..., opening it also resolves + persists
// their identity on this device — a 1-tap "login" with no separate step.
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/crew/calendar';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                const clientUrl = new URL(client.url);
                if (clientUrl.origin === self.location.origin) {
                    if ('navigate' in client) client.navigate(targetUrl).catch(() => {});
                    return client.focus();
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});