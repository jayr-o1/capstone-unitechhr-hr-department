const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Function to send notification to a specific user by user ID
const sendNotificationToUser = async (userId, title, body, data = {}) => {
    try {
        // Get the user's FCM token from the users collection
        const userDoc = await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .get();

        if (!userDoc.exists) {
            console.log(`User with ID ${userId} not found.`);
            return false;
        }

        const fcmToken = userDoc.data().fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token found for user ${userId}`);
            return false;
        }

        // Create the notification message
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                ...data,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            token: fcmToken,
        };

        // Send the notification
        const response = await admin.messaging().send(message);
        console.log(
            "Successfully sent notification to user:",
            userId,
            response
        );
        return true;
    } catch (error) {
        console.error("Error sending notification to user:", userId, error);
        return false;
    }
};

// Function to send notification to a topic (e.g., all users, university-specific users)
const sendNotificationToTopic = async (topic, title, body, data = {}) => {
    try {
        console.log(`📣 Attempting to send notification to topic: ${topic}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log(`Data: ${JSON.stringify(data)}`);

        // Create the notification message
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                ...data,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            topic: topic,
        };

        console.log(`Full message payload: ${JSON.stringify(message)}`);

        // Send the notification
        const response = await admin.messaging().send(message);
        console.log(
            "✅ Successfully sent notification to topic:",
            topic,
            response
        );
        return true;
    } catch (error) {
        console.error("❌ Error sending notification to topic:", topic, error);
        // Log more details about the error
        if (error.code) {
            console.error(`Error code: ${error.code}`);
        }
        if (error.message) {
            console.error(`Error message: ${error.message}`);
        }
        if (error.stack) {
            console.error(`Error stack: ${error.stack}`);
        }
        return false;
    }
};

// Trigger when a new job is created
exports.onNewJobCreated = functions
    .runWith({
        serviceAccount:
            "compute-sa@com-capstone-unitechhr-cecca.iam.gserviceaccount.com",
    })
    .firestore.document("jobs/{jobId}")
    .onCreate(async (snapshot, context) => {
        const jobData = snapshot.data();
        const jobId = context.params.jobId;
        const universityId = jobData.universityId || "";

        console.log(`🔔 Job creation trigger fired for job ID: ${jobId}`);
        console.log(`Job data: ${JSON.stringify(jobData)}`);

        // Get university name if available
        let universityName = "A company";
        if (universityId) {
            try {
                const universityDoc = await admin
                    .firestore()
                    .collection("universities")
                    .doc(universityId)
                    .get();
                if (universityDoc.exists) {
                    universityName =
                        universityDoc.data().name || universityName;
                    console.log(`Found university name: ${universityName}`);
                } else {
                    console.log(
                        `University doc doesn't exist for ID: ${universityId}`
                    );
                }
            } catch (err) {
                console.error("Error getting university name:", err);
            }
        }

        const notificationTitle = "New Job Available";
        const notificationBody = `${universityName} has posted a new job: ${jobData.title}`;

        // Create a general notification entry that will be visible to applicants
        try {
            console.log("Creating notification in Firestore...");

            // Create notification data
            const notificationData = {
                title: notificationTitle,
                message: notificationBody,
                type: "new_job",
                jobId: jobId,
                universityId: universityId,
                jobTitle: jobData.title,
                companyName: universityName,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
            };

            // 1. Explicitly create collection if it doesn't exist
            const applicantsNotifRef = admin
                .firestore()
                .collection("applicants_general_notifications");

            // Add the notification document
            const newNotifDoc = await applicantsNotifRef.add(notificationData);

            console.log(
                `✅ Created general notification document with ID: ${newNotifDoc.id} for job: ${jobId}`
            );

            // 2. Query all users with "applicant" role to add personalized notifications
            console.log("Finding applicant users to send notifications to...");
            const usersSnapshot = await admin
                .firestore()
                .collection("users")
                .where("role", "==", "applicant")
                .get();

            console.log(`Found ${usersSnapshot.size} applicant users`);

            // Create a batch to efficiently write multiple notifications
            if (usersSnapshot.size > 0) {
                const batch = admin.firestore().batch();

                usersSnapshot.forEach((userDoc) => {
                    const userId = userDoc.id;
                    const notificationRef = admin
                        .firestore()
                        .collection("users")
                        .doc(userId)
                        .collection("notifications")
                        .doc(); // Auto-generated ID

                    batch.set(notificationRef, notificationData);
                    console.log(`Adding notification for user: ${userId}`);
                });

                // Commit the batch
                await batch.commit();
                console.log(
                    `✅ Added job notifications to ${usersSnapshot.size} applicant users`
                );
            }
        } catch (error) {
            console.error("❌ Error creating notifications:", error);
        }

        // Send notification to all job seekers (which are only applicants)
        try {
            console.log("Sending push notification to job_seekers topic...");

            // Log the message being sent
            console.log(
                `Notification payload: ${JSON.stringify({
                    title: notificationTitle,
                    body: notificationBody,
                    data: {
                        type: "new_job",
                        jobId: jobId,
                        universityId: universityId,
                    },
                })}`
            );

            const result = await sendNotificationToTopic(
                "job_seekers",
                notificationTitle,
                notificationBody,
                {
                    type: "new_job",
                    jobId: jobId,
                    universityId: universityId,
                }
            );

            console.log(
                `✅ Push notification to job_seekers topic sent: ${result}`
            );
        } catch (error) {
            console.error(
                "❌ Error sending notification to job_seekers topic:",
                error
            );
        }

        // Also send notification to university-specific topic if available
        if (universityId) {
            try {
                console.log(
                    `Sending push notification to university_${universityId}_applicants topic...`
                );
                await sendNotificationToTopic(
                    `university_${universityId}_applicants`,
                    notificationTitle,
                    notificationBody,
                    {
                        type: "new_job",
                        jobId: jobId,
                        universityId: universityId,
                    }
                );
            } catch (error) {
                console.error(
                    `Error sending notification to university_${universityId}_applicants topic:`,
                    error
                );
            }
        }

        // Also send to all applicants topic
        try {
            console.log("Sending push notification to all_applicants topic...");
            await sendNotificationToTopic(
                "all_applicants",
                notificationTitle,
                notificationBody,
                {
                    type: "new_job",
                    jobId: jobId,
                    universityId: universityId,
                }
            );
        } catch (error) {
            console.error(
                "Error sending notification to all_applicants topic:",
                error
            );
        }

        console.log(
            `Job creation notification process completed for job ID: ${jobId}`
        );
        return null;
    });

// Trigger when an interview is scheduled
exports.onInterviewScheduled = functions.firestore
    .document("jobs/{jobId}/applicants/{applicantId}/interviews/{interviewId}")
    .onCreate(async (snapshot, context) => {
        const interviewData = snapshot.data();
        const jobId = context.params.jobId;
        const applicantId = context.params.applicantId;
        const interviewId = context.params.interviewId;

        // Only proceed if the interview status is "Scheduled"
        if (interviewData.status !== "Scheduled") {
            return null;
        }

        try {
            // Get applicant data to find the userId
            const applicantDoc = await admin
                .firestore()
                .collection("jobs")
                .doc(jobId)
                .collection("applicants")
                .doc(applicantId)
                .get();

            if (!applicantDoc.exists) {
                console.log(
                    `Applicant ${applicantId} not found for job ${jobId}`
                );
                return null;
            }

            const applicantData = applicantDoc.data();
            const userId = applicantData.userId;

            if (!userId) {
                console.log(`No user ID found for applicant ${applicantId}`);
                return null;
            }

            // Get job details
            const jobDoc = await admin
                .firestore()
                .collection("jobs")
                .doc(jobId)
                .get();

            if (!jobDoc.exists) {
                console.log(`Job ${jobId} not found`);
                return null;
            }

            const jobData = jobDoc.data();

            // Format date for better readability
            const interviewDate = interviewData.scheduledDate
                ? new Date(
                      interviewData.scheduledDate.toDate()
                  ).toLocaleString()
                : "soon";

            const notificationTitle = "Interview Scheduled";
            const notificationBody = `You have been scheduled for an interview for the position: ${jobData.title} on ${interviewDate}`;

            // Send notification to the specific applicant
            await sendNotificationToUser(
                userId,
                notificationTitle,
                notificationBody,
                {
                    type: "interview_scheduled",
                    interviewId: interviewId,
                    jobId: jobId,
                    applicantId: applicantId,
                }
            );

            // Also save a notification in the applicant's notifications subcollection
            await admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("notifications")
                .add({
                    title: notificationTitle,
                    message: notificationBody,
                    type: "interview_scheduled",
                    interviewId: interviewId,
                    jobId: jobId,
                    applicantId: applicantId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                });
        } catch (error) {
            console.error(
                "Error processing interview scheduled notification:",
                error
            );
        }

        return null;
    });

// Trigger when an applicant status is updated to "Hired"
exports.onApplicantHired = functions.firestore
    .document("jobs/{jobId}/applicants/{applicantId}")
    .onUpdate(async (change, context) => {
        const afterData = change.after.data();
        const beforeData = change.before.data();

        const jobId = context.params.jobId;
        const applicantId = context.params.applicantId;

        // Only proceed if status changed to "Hired" or "In Onboarding"
        if (
            beforeData.status !== "Hired" &&
            beforeData.status !== "In Onboarding" &&
            (afterData.status === "Hired" ||
                afterData.status === "In Onboarding")
        ) {
            try {
                // Get the user ID associated with this applicant
                const userId = afterData.userId;

                if (!userId) {
                    console.log(
                        `No user ID found for applicant ${applicantId}`
                    );
                    return null;
                }

                // Get job details
                const jobDoc = await admin
                    .firestore()
                    .collection("jobs")
                    .doc(jobId)
                    .get();

                if (!jobDoc.exists) {
                    console.log(`Job ${jobId} not found`);
                    return null;
                }

                const jobData = jobDoc.data();

                const notificationTitle = "Congratulations! You've Been Hired";
                const notificationBody = `You have been hired for the position: ${jobData.title}. Check your email for next steps.`;

                // Send notification to the specific applicant
                await sendNotificationToUser(
                    userId,
                    notificationTitle,
                    notificationBody,
                    {
                        type: "applicant_hired",
                        jobId: jobId,
                        applicantId: applicantId,
                    }
                );

                // Also save a notification in the applicant's notifications subcollection
                await admin
                    .firestore()
                    .collection("users")
                    .doc(userId)
                    .collection("notifications")
                    .add({
                        title: notificationTitle,
                        message: notificationBody,
                        type: "applicant_hired",
                        jobId: jobId,
                        applicantId: applicantId,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        read: false,
                    });
            } catch (error) {
                console.error(
                    "Error processing applicant hired notification:",
                    error
                );
            }
        }

        return null;
    });

// Trigger when onboarding tasks are added or updated
exports.onOnboardingTasksUpdated = functions.firestore
    .document("onboarding/{onboardingId}")
    .onUpdate(async (change, context) => {
        const afterData = change.after.data();
        const beforeData = change.before.data();

        const onboardingId = context.params.onboardingId;
        const employeeId = afterData.employeeId;

        // Check if tasks were added or updated
        const beforeTasks = beforeData.tasks || [];
        const afterTasks = afterData.tasks || [];

        if (afterTasks.length <= beforeTasks.length) {
            // No new tasks added
            return null;
        }

        try {
            // Get the employee document to find the user ID
            const employeeDoc = await admin
                .firestore()
                .collection("employees")
                .doc(employeeId)
                .get();

            if (!employeeDoc.exists) {
                console.log(`Employee ${employeeId} not found`);
                return null;
            }

            const employeeData = employeeDoc.data();
            const userId = employeeData.userId;

            if (!userId) {
                console.log(`No user ID found for employee ${employeeId}`);
                return null;
            }

            // Count new tasks
            const newTasksCount = afterTasks.length - beforeTasks.length;

            const notificationTitle = "New Onboarding Tasks";
            const notificationBody = `${newTasksCount} new onboarding ${
                newTasksCount === 1 ? "task has" : "tasks have"
            } been assigned to you.`;

            // Send notification to the specific employee
            await sendNotificationToUser(
                userId,
                notificationTitle,
                notificationBody,
                {
                    type: "onboarding_tasks",
                    onboardingId: onboardingId,
                }
            );

            // Also save a notification in the user's notifications subcollection
            await admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("notifications")
                .add({
                    title: notificationTitle,
                    message: notificationBody,
                    type: "onboarding_tasks",
                    onboardingId: onboardingId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    read: false,
                });
        } catch (error) {
            console.error(
                "Error processing onboarding tasks notification:",
                error
            );
        }

        return null;
    });

// Function to subscribe a user to FCM topics
exports.subscribeToTopics = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to subscribe to topics"
        );
    }

    const userId = context.auth.uid;
    const { fcmToken } = data;

    if (!fcmToken) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "FCM token is required"
        );
    }

    try {
        // Get user data to determine role
        const userDoc = await admin
            .firestore()
            .collection("users")
            .doc(userId)
            .get();

        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User not found");
        }

        const userData = userDoc.data();
        const userRole = userData.role;

        // Success response
        const response = {
            success: true,
            subscribedTopics: [],
        };

        // Subscribe to topics based on user role
        if (userRole === "applicant") {
            // Subscribe to job seekers topic
            await admin.messaging().subscribeToTopic(fcmToken, "job_seekers");
            response.subscribedTopics.push("job_seekers");

            // Subscribe to all applicants topic
            await admin
                .messaging()
                .subscribeToTopic(fcmToken, "all_applicants");
            response.subscribedTopics.push("all_applicants");

            // Subscribe to university-specific topics if user has preferences
            if (
                userData.preferredUniversities &&
                userData.preferredUniversities.length > 0
            ) {
                for (const universityId of userData.preferredUniversities) {
                    const topicName = `university_${universityId}_applicants`;
                    await admin
                        .messaging()
                        .subscribeToTopic(fcmToken, topicName);
                    response.subscribedTopics.push(topicName);
                }
            }
        }

        return response;
    } catch (error) {
        console.error("Error subscribing to topics:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Failed to subscribe to topics",
            error.message
        );
    }
});
