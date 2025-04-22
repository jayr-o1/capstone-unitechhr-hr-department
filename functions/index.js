/**
 * Cloud Functions for Firebase
 *
 * This file exports all the notification-related functions for the UniTech HR application.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Import FCM processor
const fcmProcessor = require("./processFcmRequests");

// Export FCM processor function
exports.processFcmRequests = fcmProcessor.processFcmRequests;

// A simple callable function for testing
exports.testFunction = functions.https.onCall((data, context) => {
    return {
        message: "This is a test function that works!",
        timestamp: new Date().toISOString(),
    };
});

// A simple HTTP function for testing
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

// Just use the simple functions from simple.js
const simple = require("./simple");

// Export the simple functions
exports.simpleTest = simple.simpleTest;
exports.onDocCreated = simple.onDocCreated;
