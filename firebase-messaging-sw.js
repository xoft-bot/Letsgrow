// ── firebase-messaging-sw.js ─────────────────────────────────
// Firebase Cloud Messaging service worker.
// Place this file in your PUBLIC root (same folder as index.html).
// It must be at / for push notifications to work.
// ─────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBAqSyHIn8IfwOKzWf0whgWwFP3-YUQ3vQ",
  authDomain: "letsgrowinvestmentclub-26878.firebaseapp.com",
  projectId: "letsgrowinvestmentclub-26878",
  storageBucket: "letsgrowinvestmentclub-26878.firebasestorage.app",
  messagingSenderId: "209749782294",
  appId: "1:209749782294:web:069f8353e806da0d6a2a37"
});

const messaging = firebase.messaging();

// Handle background push messages — shown as native phone notification
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || "Let's Grow Club";
  const body  = payload.notification?.body  || 'You have a new message';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',   // add your app icon at this path
    badge: '/icon-72.png',
    data: { url: '/' },
  });
});

// Clicking the notification opens the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
