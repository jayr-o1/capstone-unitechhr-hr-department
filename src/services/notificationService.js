import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    where,
    getDoc,
    onSnapshot,
    serverTimestamp,
    addDoc,
    writeBatch,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { getRelativeTime } from "../utils/dateUtils";

// Constants
const GENERAL_NOTIFICATIONS_COLLECTION = "applicants_general_notifications";
const USER_NOTIFICATIONS_COLLECTION = "userNotifications";

/**
 * Fetch general notifications
 * @param {number} count - Number of notifications to fetch
 * @returns {Promise<Array>} - Array of notification objects
 */
export const fetchGeneralNotifications = async (count = 8) => {
    try {
        const notificationsRef = collection(
            db,
            GENERAL_NOTIFICATIONS_COLLECTION
        );
        const q = query(
            notificationsRef,
            orderBy("timestamp", "desc"),
            limit(count)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isUserSpecific: false,
        }));
    } catch (error) {
        console.error("Error fetching general notifications:", error);
        throw error;
    }
};

/**
 * Check the role of a user
 * @param {string} userId - User ID
 * @returns {Promise<string>} - The user's role
 */
export const checkUserRole = async (userId) => {
    try {
        if (!userId) return null;

        // Get the user document to check their role
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data().role || null;
        }

        return null;
    } catch (error) {
        console.error("Error checking user role:", error);
        throw error;
    }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of unread notifications
 */
export const getUnreadNotificationCount = async (userId) => {
    try {
        if (!userId) return 0;

        // First check user role
        const userRole = await checkUserRole(userId);
        const isApplicant = userRole === "applicant";

        let generalUnreadCount = 0;
        // Only count general notifications for applicants
        if (isApplicant) {
            // Get unread general notifications
            const generalNotificationsRef = collection(
                db,
                GENERAL_NOTIFICATIONS_COLLECTION
            );
            const generalQuery = query(
                generalNotificationsRef,
                where("read", "==", false)
            );
            const generalSnapshot = await getDocs(generalQuery);
            generalUnreadCount = generalSnapshot.size;
        }

        // Get unread user notifications
        const userNotificationsRef = collection(
            db,
            USER_NOTIFICATIONS_COLLECTION
        );
        const userQuery = query(
            userNotificationsRef,
            where("userId", "==", userId),
            where("read", "==", false)
        );
        const userSnapshot = await getDocs(userQuery);

        return generalUnreadCount + userSnapshot.size;
    } catch (error) {
        console.error("Error getting unread notification count:", error);
        throw error;
    }
};

/**
 * Mark all general notifications as read
 * @param {string} userId - User ID needed to check role
 * @returns {Promise<void>}
 */
export const markAllGeneralNotificationsAsRead = async (userId) => {
    try {
        if (!userId) return;

        // First check user role - only applicants can mark general notifications
        const userRole = await checkUserRole(userId);
        if (userRole !== "applicant") return;

        const notificationsRef = collection(
            db,
            GENERAL_NOTIFICATIONS_COLLECTION
        );
        const q = query(notificationsRef, where("read", "==", false));

        const snapshot = await getDocs(q);
        const batch = db.batch();

        snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
    } catch (error) {
        console.error(
            "Error marking all general notifications as read:",
            error
        );
        throw error;
    }
};

/**
 * Send a push notification via Firebase Cloud Messaging using the newer HTTP v1 API
 * This is a client-side implementation that requires OAuth authentication
 * NOTE: In production, this should be done on a backend server for security
 * @param {string} topic - The FCM topic to send to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} - Response from FCM API
 */
export const sendPushNotificationToTopic = async (
    topic,
    title,
    body,
    data = {}
) => {
    try {
        console.log(`Attempting to send notification to topic: ${topic}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);

        // Create a structured request document that works with the FCM extension
        // See: https://firebase.google.com/products/extensions/firestore-send-fcm
        const fcmRequestsRef = collection(db, "fcm_send_requests");
        await addDoc(fcmRequestsRef, {
            // Topic targeting - the extension will look for either 'topic' or 'tokens'
            topic: topic,

            // Notification contents
            notification: {
                title: title,
                body: body,
            },

            // Data payload for additional information
            data: data,

            // Metadata
            created: serverTimestamp(),
            status: "pending",
        });

        console.log(`FCM request saved to Firestore for processing`);
        console.log(
            "When the FCM extension is installed, this notification will be processed automatically"
        );

        return { success: true, message: "FCM request queued" };
    } catch (error) {
        console.error(
            `Error creating FCM notification request for topic ${topic}:`,
            error
        );
        return { success: false, error: error.message };
    }
};

/**
 * Create a notification when a new job is posted
 * This function handles creating the notification entries in Firestore
 * and sending the Firebase Cloud Messaging notifications to applicants
 * @param {object} jobData - The job data
 * @param {string} universityId - The university ID
 * @returns {Promise<object>} - Success or error result
 */
export const sendJobCreationNotification = async (jobData, universityId) => {
    try {
        if (!jobData || !jobData.id || !universityId) {
            console.error("Missing required job data or university ID");
            return { success: false, message: "Missing required job data" };
        }

        // Get university name
        let universityName = "A university";
        try {
            const universityRef = doc(db, "universities", universityId);
            const universitySnap = await getDoc(universityRef);
            if (universitySnap.exists()) {
                universityName = universitySnap.data().name || universityName;
            }
        } catch (err) {
            console.error("Error fetching university name:", err);
        }

        // Create notification data
        const notificationData = {
            title: "New Job Opportunity!",
            message: `${universityName} has posted a new job: ${jobData.title}`,
            type: "new_job",
            jobId: jobData.id,
            universityId: universityId,
            jobTitle: jobData.title,
            universityName: universityName,
            timestamp: serverTimestamp(),
            read: false,
        };

        // Create notification in general collection
        const generalNotifRef = collection(
            db,
            GENERAL_NOTIFICATIONS_COLLECTION
        );
        await addDoc(generalNotifRef, notificationData);
        console.log("Added notification to general collection");

        // Find all applicant users
        const applicantsQuery = query(
            collection(db, "users"),
            where("role", "==", "applicant")
        );
        const applicantsSnapshot = await getDocs(applicantsQuery);

        // Create batch write for adding notifications to each applicant
        if (!applicantsSnapshot.empty) {
            const batch = writeBatch(db);

            applicantsSnapshot.forEach((applicantDoc) => {
                const userId = applicantDoc.id;
                const userNotifRef = doc(
                    collection(db, "users", userId, "notifications")
                );
                batch.set(userNotifRef, notificationData);
            });

            await batch.commit();
            console.log(
                `Added notifications to ${applicantsSnapshot.size} applicants`
            );
        }

        // Send FCM notification to topics using our updated approach
        try {
            const title = "New Job Opportunity!";
            const body = `${universityName} has posted a new job: ${jobData.title}`;
            const data = {
                type: "new_job",
                jobId: jobData.id,
                universityId: universityId,
            };

            // Queue FCM notifications for different topics
            await sendPushNotificationToTopic("job_seekers", title, body, data);
            await sendPushNotificationToTopic(
                "all_applicants",
                title,
                body,
                data
            );
            await sendPushNotificationToTopic(
                `university_${universityId}_applicants`,
                title,
                body,
                data
            );

            console.log(
                "Successfully queued push notification requests for new job"
            );
        } catch (err) {
            console.error("Error queuing FCM notifications:", err);
        }

        return { success: true };
    } catch (error) {
        console.error("Error creating job notification:", error);
        return { success: false, message: error.message };
    }
};
