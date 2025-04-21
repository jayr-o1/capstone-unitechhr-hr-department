const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

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

        // Send the notification
        const response = await admin.messaging().send(message);
        console.log(
            "Successfully sent notification to topic:",
            topic,
            response
        );
        return true;
    } catch (error) {
        console.error("Error sending notification to topic:", topic, error);
        return false;
    }
};

// Trigger when a new job is created
exports.onNewJobCreated = functions.firestore
    .document("jobs/{jobId}")
    .onCreate(async (snapshot, context) => {
        const jobData = snapshot.data();
        const jobId = context.params.jobId;
        const universityId = jobData.universityId || "";

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
                }
            } catch (err) {
                console.error("Error getting university name:", err);
            }
        }

        const notificationTitle = "New Job Available";
        const notificationBody = `${universityName} has posted a new job: ${jobData.title}`;

        // Send notification to all job seekers
        await sendNotificationToTopic(
            "job_seekers",
            notificationTitle,
            notificationBody,
            {
                type: "new_job",
                jobId: jobId,
                universityId: universityId,
            }
        );

        // Also send notification to university-specific topic if available
        if (universityId) {
            await sendNotificationToTopic(
                `university_${universityId}`,
                notificationTitle,
                notificationBody,
                {
                    type: "new_job",
                    jobId: jobId,
                    universityId: universityId,
                }
            );
        }

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
