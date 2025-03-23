import { cleanupExpiredJobs } from "../services/jobService";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";

/**
 * Utility to clean up expired soft-deleted jobs
 * This function can be called manually or scheduled to run periodically
 *
 * @returns {Promise<Object>} Result of the cleanup operation
 */
export const runJobsCleanup = async () => {
    try {
        // Show loading message
        const result = await cleanupExpiredJobs();

        if (result.success) {
            if (result.deletedCount > 0) {
                showSuccessAlert(
                    `Successfully cleaned up ${result.deletedCount} expired job(s).`
                );
            }
            return {
                success: true,
                message: `Cleanup completed. ${result.deletedCount} job(s) deleted.`,
                count: result.deletedCount,
            };
        } else {
            throw new Error(
                result.message || "Failed to clean up expired jobs"
            );
        }
    } catch (error) {
        showErrorAlert(`Error cleaning up jobs: ${error.message}`);
        return {
            success: false,
            message: error.message,
        };
    }
};

/**
 * Schedule cleanup to run automatically
 * This is typically called once when the application starts
 *
 * @param {number} intervalMinutes Interval in minutes between cleanup runs
 * @returns {function} Function to stop the scheduled cleanup
 */
export const scheduleJobsCleanup = (intervalMinutes = 1440) => {
    // Default: once a day
    // Convert minutes to milliseconds
    const interval = intervalMinutes * 60 * 1000;

    // Set up interval for cleanup
    const timerId = setInterval(async () => {
        console.log("Running scheduled job cleanup...");
        await runJobsCleanup();
    }, interval);

    // Return function to stop the scheduled cleanup
    return () => {
        clearInterval(timerId);
    };
};
