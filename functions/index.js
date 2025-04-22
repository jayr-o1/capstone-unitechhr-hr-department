/**
 * Cloud Functions for Firebase
 *
 * This file exports all the notification-related functions for the UniTech HR application.
 */

// Import the notification functions
const notificationFunctions = require("./notificationFunctions");

// Export all the functions
exports.onNewJobCreated = notificationFunctions.onNewJobCreated;
exports.onInterviewScheduled = notificationFunctions.onInterviewScheduled;
exports.onApplicantHired = notificationFunctions.onApplicantHired;
exports.onOnboardingTasksUpdated =
    notificationFunctions.onOnboardingTasksUpdated;
exports.subscribeToTopics = notificationFunctions.subscribeToTopics;
