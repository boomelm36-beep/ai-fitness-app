// worker.js
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "AI Fit";
  const options = {
    body: data.body || "You have a new notification.",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});