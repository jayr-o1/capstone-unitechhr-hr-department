import { db } from "../firebase";
import {
    doc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

// Soft delete a job by setting isDeleted flag to true
export const softDeleteJob = async (jobId) => {
    try {
        const jobRef = doc(db, "jobs", jobId);

        // Update the job document with isDeleted flag and deletion timestamp
        await updateDoc(jobRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            scheduledForDeletion: Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            ),
        });

        return { success: true };
    } catch (error) {
        console.error("Error soft deleting job:", error);
        return { success: false, message: error.message };
    }
};

// Hard delete a job and its subcollections
export const hardDeleteJob = async (jobId) => {
    try {
        // First, delete all applicants subcollection documents
        const applicantsRef = collection(db, "jobs", jobId, "applicants");
        const applicantsSnapshot = await getDocs(applicantsRef);

        // For each applicant, delete any subcollections they might have (like interviews)
        for (const applicantDoc of applicantsSnapshot.docs) {
            const interviewsRef = collection(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantDoc.id,
                "interviews"
            );
            const interviewsSnapshot = await getDocs(interviewsRef);

            // Delete all interviews for this applicant
            for (const interviewDoc of interviewsSnapshot.docs) {
                await deleteDoc(
                    doc(
                        db,
                        "jobs",
                        jobId,
                        "applicants",
                        applicantDoc.id,
                        "interviews",
                        interviewDoc.id
                    )
                );
            }

            // Delete the applicant document
            await deleteDoc(
                doc(db, "jobs", jobId, "applicants", applicantDoc.id)
            );
        }

        // Finally, delete the job document itself
        const jobRef = doc(db, "jobs", jobId);
        await deleteDoc(jobRef);

        return { success: true };
    } catch (error) {
        console.error("Error hard deleting job:", error);
        return { success: false, message: error.message };
    }
};

// Update a job
export const updateJob = async (jobId, jobData) => {
    try {
        const jobRef = doc(db, "jobs", jobId);

        // If job has isDeleted flag true and is being updated, reset deletion flags
        const jobDoc = await getDoc(jobRef);
        if (jobDoc.exists() && jobDoc.data().isDeleted) {
            jobData = {
                ...jobData,
                isDeleted: false,
                deletedAt: null,
                scheduledForDeletion: null,
                lastUpdated: serverTimestamp(),
            };
        } else {
            jobData = {
                ...jobData,
                lastUpdated: serverTimestamp(),
            };
        }

        await updateDoc(jobRef, jobData);
        return { success: true };
    } catch (error) {
        console.error("Error updating job:", error);
        return { success: false, message: error.message };
    }
};

// Get jobs including deleted ones (for admin purposes)
export const getAllJobs = async (includeDeleted = false) => {
    try {
        let jobsQuery;

        if (!includeDeleted) {
            // Only get jobs that are not deleted or where isDeleted doesn't exist
            jobsQuery = query(
                collection(db, "jobs"),
                where("isDeleted", "!=", true)
            );
        } else {
            // Get all jobs
            jobsQuery = collection(db, "jobs");
        }

        const querySnapshot = await getDocs(jobsQuery);
        const jobs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, jobs };
    } catch (error) {
        console.error("Error getting jobs:", error);
        return { success: false, message: error.message, jobs: [] };
    }
};

// Function to cleanup expired deleted jobs (to be run by a cloud function/cron job)
export const cleanupExpiredJobs = async () => {
    try {
        // Get all jobs scheduled for deletion where the time has passed
        const currentTime = Timestamp.now();
        const expiredJobsQuery = query(
            collection(db, "jobs"),
            where("isDeleted", "==", true),
            where("scheduledForDeletion", "<=", currentTime)
        );

        const expiredJobsSnapshot = await getDocs(expiredJobsQuery);

        // Hard delete each expired job
        const deletePromises = [];
        for (const jobDoc of expiredJobsSnapshot.docs) {
            deletePromises.push(hardDeleteJob(jobDoc.id));
        }

        await Promise.all(deletePromises);

        return {
            success: true,
            deletedCount: expiredJobsSnapshot.size,
        };
    } catch (error) {
        console.error("Error cleaning up expired jobs:", error);
        return { success: false, message: error.message };
    }
};
