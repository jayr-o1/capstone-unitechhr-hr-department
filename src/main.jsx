import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initializeFCM } from "./utils/fcmUtils";

// Request permission for notifications and initialize FCM
// if browser supports service workers
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/firebase-messaging-sw.js")
            .then((registration) => {
                console.log(
                    "ServiceWorker registration successful with scope: ",
                    registration.scope
                );
                // Initialize FCM after service worker is registered
                initializeFCM().then((token) => {
                    if (token) {
                        console.log("FCM initialized successfully");
                    }
                });
            })
            .catch((err) => {
                console.log("ServiceWorker registration failed: ", err);
            });
    });
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);
