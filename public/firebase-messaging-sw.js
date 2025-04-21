// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
importScripts(
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"
);
importScripts(
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js"
);

/**
 * Firebase configuration needs to match the one in your app
 * Make sure to replace with your actual Firebase configuration
 */
firebase.initializeApp({
    apiKey: "AIzaSyDF8HgLVsPAbNjCATP7v6pMjhKslOnAjOc",
    authDomain: "com-capstone-unitechhr-cecca.firebaseapp.com",
    projectId: "com-capstone-unitechhr-cecca",
    storageBucket: "com-capstone-unitechhr-cecca.appspot.com",
    messagingSenderId: "1087281687437",
    appId: "1:1087281687437:web:cf6caf25d1a1f5be042bc4",
    measurementId: "G-P9TZQKWPJ0",
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

/**
 * Handle background messages
 * This will be called when the app is in the background or closed
 */
messaging.onBackgroundMessage((payload) => {
    console.log("Received background message:", payload);

    // Customize notification here
    const notificationTitle = payload.notification.title || "New Notification";
    const notificationOptions = {
        body: payload.notification.body || "You have a new notification",
        icon: "/favicon.png",
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 * Open the app and focus on correct page based on notification data
 */
self.addEventListener("notificationclick", (event) => {
    console.log("Notification clicked:", event);

    event.notification.close();

    const urlToOpen = new URL("/notifications", self.location.origin).href;

    // Check if specific route should be opened based on notification data
    if (event.notification.data && event.notification.data.type === "new_job") {
        const jobId = event.notification.data.jobId;
        if (jobId) {
            urlToOpen = new URL(`/jobs/${jobId}`, self.location.origin).href;
        }
    }

    // Focus or open window with the URL
    event.waitUntil(
        clients.matchAll({ type: "window" }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If so, focus it
                if (client.url === urlToOpen && "focus" in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
