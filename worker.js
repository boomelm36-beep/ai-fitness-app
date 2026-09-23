// worker.js
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "AI Fit";
  const options = {
    body: data.body || "You have a new notification.",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard" // Save the URL inside the event data
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  // Retrieve the URL we passed in, default to dashboard
  const urlToOpen = event.notification.data.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open in a tab, focus it and navigate
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If the app is closed, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});