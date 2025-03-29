import React, { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { hardDeleteJob, updateJob, getUniversityJobs } from "../services/jobService";
import { runJobsCleanup } from "../utils/cleanupUtil";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";
import showWarningAlert from "../components/Alerts/WarningAlert";
import PageLoader from "../components/PageLoader";
import { auth } from "../firebase";
import { getUserData } from "../services/userService";

const HRHeadPanel = () => {
    const [deletedJobs, setDeletedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cleanupRunning, setCleanupRunning] = useState(false);
    const [universityId, setUniversityId] = useState(null);
    const [universityName, setUniversityName] = useState("");

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setError("You must be logged in to access this page");
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                    
                    // Get university name
                    const universityRef = doc(db, "universities", userDataResult.data.universityId);
                    const universityDoc = await getDoc(universityRef);
                    if (universityDoc.exists()) {
                        setUniversityName(universityDoc.data().name || "My University");
                    }
                    
                } else {
                    setError("You don't have permission to access this page");
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setError("Failed to verify your permissions");
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    // Fetch deleted jobs for the current university
    const fetchDeletedJobs = async () => {
        if (!universityId) return;
        
        setLoading(true);
        try {
            // Get all jobs for this university including deleted ones
            const result = await getUniversityJobs(universityId, true);
            
            if (!result.success) {
                throw new Error(result.message || "Failed to fetch jobs");
            }
            
            // Filter to only include deleted jobs
            const deletedJobsList = result.jobs.filter(job => job.isDeleted === true);
            
            // Sort by deletion date (most recent first)
            deletedJobsList.sort((a, b) => {
                const dateA = a.deletedAt?.toDate?.() || new Date(0);
                const dateB = b.deletedAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });
            
            setDeletedJobs(deletedJobsList);
        } catch (err) {
            console.error("Error fetching deleted jobs:", err);
            setError("Failed to load deleted jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Load data when universityId changes
    useEffect(() => {
        if (universityId) {
            fetchDeletedJobs();
        }
    }, [universityId]);

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return "Unknown";

        const date = timestamp.toDate?.() || new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Calculate days remaining until permanent deletion
    const getDaysRemaining = (timestamp) => {
        if (!timestamp) return "Unknown";

        const deletionDate = timestamp.toDate?.() || new Date(timestamp);
        const now = new Date();
        const diffTime = deletionDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? `${diffDays} days` : "Expiring soon";
    };

    // Handle job restoration
    const handleRestoreJob = (job) => {
        showWarningAlert(
            `Are you sure you want to restore "${job.title}"?`,
            async () => {
                try {
                    // Update the job to remove deletion flags
                    const result = await updateJob(job.id, {
                        isDeleted: false,
                        deletedAt: null,
                        scheduledForDeletion: null,
                    });

                    if (result.success) {
                        showSuccessAlert("Job restored successfully!");
                        // Refresh the deleted jobs list
                        fetchDeletedJobs();
                    } else {
                        throw new Error(
                            result.message || "Failed to restore job"
                        );
                    }
                } catch (error) {
                    showErrorAlert(`Error restoring job: ${error.message}`);
                }
            },
            "Yes, restore it",
            "Cancel"
        );
    };

    // Handle permanent job deletion
    const handlePermanentDelete = (job) => {
        showWarningAlert(
            `Are you sure you want to permanently delete "${job.title}"? This action cannot be undone.`,
            async () => {
                try {
                    // Hard delete the job
                    const result = await hardDeleteJob(job.id);

                    if (result.success) {
                        showSuccessAlert("Job permanently deleted!");
                        // Refresh the deleted jobs list
                        fetchDeletedJobs();
                    } else {
                        throw new Error(
                            result.message || "Failed to delete job"
                        );
                    }
                } catch (error) {
                    showErrorAlert(`Error deleting job: ${error.message}`);
                }
            },
            "Yes, delete permanently",
            "Cancel"
        );
    };

    // Run manual cleanup for this university's jobs
    const handleRunCleanup = async () => {
        setCleanupRunning(true);
        try {
            // Call the utility function with the university ID
            const result = await runJobsCleanup(universityId);
            
            if (result.success) {
                // Refresh the deleted jobs list
                fetchDeletedJobs();
            }
        } catch (error) {
            showErrorAlert(`Error running cleanup: ${error.message}`);
        } finally {
            setCleanupRunning(false);
        }
    };

    if (loading) {
        return <PageLoader message="Loading deleted jobs..." />;
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-red-500 text-xl font-bold mb-4">{error}</h2>
                {universityId && (
                    <button
                        onClick={fetchDeletedJobs}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                HR Department Management
            </h1>
            <h2 className="text-xl text-gray-600 mb-6">
                {universityName}
            </h2>

            <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-600">
                    {deletedJobs.length} deleted jobs in trash
                </p>
                <button
                    onClick={handleRunCleanup}
                    disabled={cleanupRunning}
                    className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition ${
                        cleanupRunning ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    {cleanupRunning ? "Running Cleanup..." : "Run Cleanup Now"}
                </button>
            </div>

            {deletedJobs.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <p className="text-gray-600">No deleted jobs found.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Job Title
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Deleted On
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Permanent Deletion In
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deletedJobs.map((job) => (
                                <tr key={job.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {job.title}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {job.department}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(job.deletedAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                getDaysRemaining(
                                                    job.scheduledForDeletion
                                                ) === "Expiring soon"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {getDaysRemaining(
                                                job.scheduledForDeletion
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() =>
                                                handleRestoreJob(job)
                                            }
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={() =>
                                                handlePermanentDelete(job)
                                            }
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete Permanently
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HRHeadPanel;
