import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { db, auth } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// FCM Vapid Key - you'll need to replace this with your actual key from Firebase console
const VAPID_KEY =
    "BK0DtFnDBGLnEBMfZ_fUg1iL7KzwtRNheV-78jz9c66_JwlGtvlay2keSQRGxnqkTHbHwzIoDB9vcfzz-1V6iCU"; // Replace with your key

/**
 * Initialize FCM and request permission
 * @returns {Promise<string|null>} FCM token or null if permission denied
 */
export const initializeFCM = async () => {
    try {
        const messaging = getMessaging();

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        // Get FCM token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
            console.log("FCM token:", token);
            await saveTokenToDatabase(token);

            // Subscribe to relevant topics based on user role
            await subscribeToTopics(token);

            return token;
        } else {
            console.log("Failed to get FCM token");
            return null;
        }
    } catch (error) {
        console.error("Error initializing FCM:", error);
        return null;
    }
};

/**
 * Save FCM token to user's document in Firestore
 * @param {string} token - FCM token
 * @returns {Promise<void>}
 */
export const saveTokenToDatabase = async (token) => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.log("No user logged in, can't save token");
            return;
        }

        const userId = currentUser.uid;
        const userRef = doc(db, "users", userId);

        // Check if token is already saved
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().fcmToken === token) {
            console.log("Token already saved, no need to update");
            return;
        }

        // Update user document with token
        await updateDoc(userRef, {
            fcmToken: token,
            tokenUpdatedAt: new Date(),
        });

        console.log("Token saved to database");
    } catch (error) {
        console.error("Error saving token to database:", error);
    }
};

/**
 * Subscribe to FCM topics based on user role
 * @param {string} token - FCM token
 * @returns {Promise<void>}
 */
export const subscribeToTopics = async (token) => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.log("No user logged in, can't subscribe to topics");
            return;
        }

        if (!token) {
            console.log("No FCM token available");
            return;
        }

        // Use Cloud Function to subscribe to topics
        const functions = getFunctions();
        const subscribeToTopicsFunction = httpsCallable(
            functions,
            "subscribeToTopics"
        );

        // Call the function with the token
        const result = await subscribeToTopicsFunction({ fcmToken: token });

        console.log(
            "Successfully subscribed to topics:",
            result.data.subscribedTopics
        );
    } catch (error) {
        console.error("Error subscribing to topics:", error);
    }
};

/**
 * Handle FCM messages when app is in foreground
 * @param {function} callback - Function to call when a message is received
 * @returns {function} Unsubscribe function
 */
export const setupForegroundMessageHandler = (callback) => {
    try {
        const messaging = getMessaging();

        return onMessage(messaging, (payload) => {
            console.log("Message received in foreground:", payload);

            // Create notification options
            const notificationTitle =
                payload.notification?.title || "New Notification";
            const notificationOptions = {
                body:
                    payload.notification?.body || "You have a new notification",
                icon: "/logo192.png",
            };

            // Show notification
            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {
                const notification = new Notification(
                    notificationTitle,
                    notificationOptions
                );

                // Handle notification click
                notification.onclick = () => {
                    // Navigate based on notification data
                    if (payload.data?.type === "new_job") {
                        window.location.href = `/jobs/${payload.data.jobId}`;
                    } else {
                        window.location.href = "/notifications";
                    }
                };
            }

            // Call provided callback
            if (callback && typeof callback === "function") {
                callback(payload);
            }
        });
    } catch (error) {
        console.error("Error setting up foreground message handler:", error);
        return () => {};
    }
};
