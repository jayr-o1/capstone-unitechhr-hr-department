const functions = require("firebase-functions");
const admin = require("firebase-admin");

// This function will be triggered when a new document is created in the 'fcm_send_requests' collection
exports.processFcmRequests = functions.firestore
    .document("fcm_send_requests/{requestId}")
    .onCreate(async (snapshot, context) => {
        try {
            // Get the request data
            const requestData = snapshot.data();
            const requestId = context.params.requestId;

            console.log(`Processing FCM request ${requestId}`);

            // Check if the request has already been processed
            if (requestData.status !== "pending") {
                console.log(
                    `Request ${requestId} is not pending (status: ${requestData.status}). Skipping.`
                );
                return null;
            }

            // Get the notification data
            const { topic, notification, data } = requestData;

            if (!topic) {
                console.error(`Request ${requestId} is missing topic field`);
                // Update the status to 'error'
                await snapshot.ref.update({
                    status: "error",
                    error: "Missing topic field",
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return null;
            }

            // Prepare the message
            const message = {
                notification: notification,
                data: data || {},
                topic: topic,
            };

            console.log(`Sending FCM message to topic: ${topic}`);
            console.log("Message:", JSON.stringify(message));

            // Send the message
            const response = await admin.messaging().send(message);

            console.log(`Successfully sent message: ${response}`);

            // Update the status to 'sent'
            await snapshot.ref.update({
                status: "sent",
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                fcmResponse: response,
            });

            return response;
        } catch (error) {
            console.error("Error sending message:", error);

            // Update the status to 'error'
            await snapshot.ref.update({
                status: "error",
                error: error.message,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return null;
        }
    });
