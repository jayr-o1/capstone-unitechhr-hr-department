import { cleanupExpiredJobs } from "../services/jobService";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";

/**
 * Utility to clean up expired soft-deleted jobs
 * This function can be called manually or scheduled to run periodically
 *
 * @param {string} universityId - The ID of the university to clean up jobs for
 * @returns {Promise<Object>} Result of the cleanup operation
 */
export const runJobsCleanup = async (universityId) => {
    try {
        if (!universityId) {
            throw new Error("University ID is required to clean up expired jobs");
        }
        
        // Run the cleanup with the specific university ID
        const result = await cleanupExpiredJobs(universityId);

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
 * @param {string} universityId The ID of the university to clean up jobs for
 * @returns {function} Function to stop the scheduled cleanup
 */
export const scheduleJobsCleanup = (intervalMinutes = 1440, universityId = null) => {
    // Don't schedule if no universityId is provided
    if (!universityId) {
        console.warn("No university ID provided. Cleanup will not be scheduled.");
        return () => {};
    }
    
    // Default: once a day
    // Convert minutes to milliseconds
    const interval = intervalMinutes * 60 * 1000;

    // Set up interval for cleanup
    const timerId = setInterval(async () => {
        console.log(`Running scheduled job cleanup for university: ${universityId}...`);
        await runJobsCleanup(universityId);
    }, interval);

    // Return function to stop the scheduled cleanup
    return () => {
        clearInterval(timerId);
    };
};
