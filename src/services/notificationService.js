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
 * Create a notification for all applicants when a new job is posted
 * @param {Object} jobData - Job data
 * @param {string} universityId - University ID
 * @returns {Promise<Object>} - Success or error message
 */
export const createJobNotification = async (jobData, universityId) => {
    try {
        if (!jobData || !universityId) {
            return {
                success: false,
                message: "Missing job data or university ID",
            };
        }

        // Get university name for the notification
        const universityRef = doc(db, "universities", universityId);
        const universitySnap = await getDoc(universityRef);

        if (!universitySnap.exists()) {
            return { success: false, message: "University not found" };
        }

        const universityName = universitySnap.data().name || "A university";

        // Create notification data
        const notificationData = {
            title: "New Job Opportunity!",
            message: `${universityName} has posted a new job: ${jobData.title}`,
            timestamp: serverTimestamp(),
            read: false,
            type: "new_job",
            jobId: jobData.id,
            universityId: universityId,
            data: {
                jobId: jobData.id,
                universityId: universityId,
                jobTitle: jobData.title,
                universityName: universityName,
            },
        };

        // Add to general notifications collection
        await addDoc(
            collection(db, GENERAL_NOTIFICATIONS_COLLECTION),
            notificationData
        );

        // We could also send a push notification here if we had FCM set up
        // For now, we'll just return success
        return { success: true };
    } catch (error) {
        console.error("Error creating job notification:", error);
        throw error;
    }
};
