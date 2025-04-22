const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Simple callable function
exports.simpleTest = functions.https.onCall((data, context) => {
    return {
        message: "Simple test function works!",
        timestamp: new Date().toISOString(),
    };
});

// Simple HTTP function
exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send("Hello from Firebase!");
});

// Simple Firestore trigger
exports.onDocCreated = functions.firestore
    .document("test_collection/{docId}")
    .onCreate((snapshot, context) => {
        console.log("New document created:", context.params.docId);
        return null;
    });
