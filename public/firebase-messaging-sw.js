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
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-nonsquare.png', // Uses your app logo
    badge: '/logo-nonsquare.png', // Small icon in status bar
    data: {
        url: payload.data?.click_action || '/calendar'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click listener to open the app
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});