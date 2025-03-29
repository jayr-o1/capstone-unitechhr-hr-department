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
    setDoc,
} from "firebase/firestore";

// Soft delete a job by setting isDeleted flag to true
export const softDeleteJob = async (jobId) => {
    try {
        const jobRef = doc(db, "jobs", jobId);
        
        // Get the job to check if it has a university ID
        const jobDoc = await getDoc(jobRef);
        if (!jobDoc.exists()) {
            return { success: false, message: "Job not found" };
        }
        
        const jobInfo = jobDoc.data();
        const universityId = jobInfo.universityId;
        
        // Update with deletion metadata
        const deleteData = {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            scheduledForDeletion: Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            ),
        };

        // Update in main collection
        await updateDoc(jobRef, deleteData);
        
        // If job belongs to a university, update in university's subcollection too
        if (universityId) {
            const universityJobRef = doc(db, "universities", universityId, "jobs", jobId);
            await updateDoc(universityJobRef, deleteData);
        }

        return { success: true };
    } catch (error) {
        console.error("Error soft deleting job:", error);
        return { success: false, message: error.message };
    }
};

// Hard delete a job and its subcollections
export const hardDeleteJob = async (jobId) => {
    try {
        // Get the job first to check if it has a university ID
        const jobRef = doc(db, "jobs", jobId);
        const jobDoc = await getDoc(jobRef);
        
        if (!jobDoc.exists()) {
            return { success: false, message: "Job not found" };
        }
        
        const jobInfo = jobDoc.data();
        const universityId = jobInfo.universityId;
        
        // Delete applicants and interviews in main collection
        const applicantsRef = collection(db, "jobs", jobId, "applicants");
        const applicantsSnapshot = await getDocs(applicantsRef);

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

            // Delete all interviews
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

            // Delete the applicant
            await deleteDoc(
                doc(db, "jobs", jobId, "applicants", applicantDoc.id)
            );
        }

        // Delete the job from main collection
        await deleteDoc(jobRef);
        
        // If job belongs to a university, also delete from university subcollection
        if (universityId) {
            // Delete from university's jobs subcollection
            const universityJobRef = doc(db, "universities", universityId, "jobs", jobId);
            await deleteDoc(universityJobRef);
            
            // Also delete applicants and interviews in university's subcollection if they exist
            const universityApplicantsRef = collection(db, "universities", universityId, "jobs", jobId, "applicants");
            const universityApplicantsSnapshot = await getDocs(universityApplicantsRef);
            
            for (const applicantDoc of universityApplicantsSnapshot.docs) {
                // Delete interviews if they exist
                const universityInterviewsRef = collection(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantDoc.id,
                    "interviews"
                );
                const universityInterviewsSnapshot = await getDocs(universityInterviewsRef);
                
                for (const interviewDoc of universityInterviewsSnapshot.docs) {
                    await deleteDoc(
                        doc(
                            db,
                            "universities",
                            universityId,
                            "jobs",
                            jobId,
                            "applicants",
                            applicantDoc.id,
                            "interviews",
                            interviewDoc.id
                        )
                    );
                }
                
                // Delete the applicant
                await deleteDoc(
                    doc(db, "universities", universityId, "jobs", jobId, "applicants", applicantDoc.id)
                );
            }
        }

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

        // First get the job to check if it has a university ID
        const jobDoc = await getDoc(jobRef);
        if (!jobDoc.exists()) {
            return { success: false, message: "Job not found" };
        }
        
        const jobInfo = jobDoc.data();
        const universityId = jobInfo.universityId;
        
        // If job has isDeleted flag true and is being updated, reset deletion flags
        if (jobInfo.isDeleted) {
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

        // Update in main collection
        await updateDoc(jobRef, jobData);
        
        // If job belongs to a university, update in university's subcollection too
        if (universityId) {
            const universityJobRef = doc(db, "universities", universityId, "jobs", jobId);
            await updateDoc(universityJobRef, jobData);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error updating job:", error);
        return { success: false, message: error.message };
    }
};

// Get jobs including deleted ones (for admin purposes)
export const getAllJobs = async (includeDeleted = false, universityId = null) => {
    try {
        // If university ID is provided, always use the university-specific function
        if (universityId) {
            return getUniversityJobs(universityId, includeDeleted);
        }

        // WARNING: This retrieves jobs from the root collection and should only be used
        // by admin functions or when universityId is not available. Most components
        // should use getUniversityJobs instead.
        let jobs = [];

        if (!includeDeleted) {
            // First, get jobs where isDeleted is explicitly false
            const explicitlyNotDeletedQuery = query(
                collection(db, "jobs"),
                where("isDeleted", "==", false)
            );
            const explicitlyNotDeletedSnapshot = await getDocs(explicitlyNotDeletedQuery);
            
            // Then, get jobs where isDeleted field doesn't exist
            const allJobsSnapshot = await getDocs(collection(db, "jobs"));
            
            // Combine both results, avoiding duplicates
            const explicitlyNotDeletedIds = new Set();
            
            // Add explicitly not deleted jobs
            explicitlyNotDeletedSnapshot.forEach(doc => {
                jobs.push({
                    id: doc.id,
                    ...doc.data()
                });
                explicitlyNotDeletedIds.add(doc.id);
            });
            
            // Add jobs where isDeleted doesn't exist or is not true
            allJobsSnapshot.forEach(doc => {
                const data = doc.data();
                if (!explicitlyNotDeletedIds.has(doc.id) && data.isDeleted !== true) {
                    jobs.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
        } else {
            // Get all jobs
            const querySnapshot = await getDocs(collection(db, "jobs"));
            jobs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        }

        return { success: true, jobs };
    } catch (error) {
        console.error("Error getting jobs:", error);
        return { success: false, message: error.message, jobs: [] };
    }
};

// Function to cleanup expired deleted jobs (to be run by a cloud function/cron job)
export const cleanupExpiredJobs = async (universityId = null) => {
    try {
        if (!universityId) {
            return { 
                success: false, 
                message: "University ID is required to clean up expired jobs", 
                deletedCount: 0 
            };
        }
        
        // Get all jobs scheduled for deletion where the time has passed from university collection
        const currentTime = Timestamp.now();
        const jobsRef = collection(db, "universities", universityId, "jobs");
        const expiredJobsQuery = query(
            jobsRef,
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
        return { success: false, message: error.message, deletedCount: 0 };
    }
};

// Create a new job that's associated with a university
export const createJob = async (jobData, universityId) => {
    try {
        if (!universityId) {
            return { success: false, message: "University ID is required to create a job" };
        }
        
        // Create a job ID
        const jobRef = doc(collection(db, "jobs"));
        const jobId = jobRef.id;
        
        // Add university ID to job data
        const jobWithMetadata = {
            ...jobData,
            universityId,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            isDeleted: false
        };
        
        // Save job to main jobs collection for cross-university search
        await setDoc(jobRef, jobWithMetadata);
        
        // Also save job to university's jobs subcollection (primary source of truth)
        const universityJobRef = doc(db, "universities", universityId, "jobs", jobId);
        await setDoc(universityJobRef, jobWithMetadata);
        
        return { success: true, jobId };
    } catch (error) {
        console.error("Error creating job:", error);
        return { success: false, message: error.message };
    }
};

// Get jobs for a specific university
export const getUniversityJobs = async (universityId, includeDeleted = false) => {
    try {
        if (!universityId) {
            return { success: false, message: "Missing university ID", jobs: [] };
        }
        
        const jobsRef = collection(db, "universities", universityId, "jobs");
        let jobsQuery;
        
        if (!includeDeleted) {
            // Get only active jobs
            jobsQuery = query(jobsRef, where("isDeleted", "==", false));
        } else {
            // Get all jobs including deleted ones
            jobsQuery = query(jobsRef);
        }
        
        const querySnapshot = await getDocs(jobsQuery);
        
        const jobs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return { success: true, jobs };
    } catch (error) {
        console.error("Error getting university jobs:", error);
        return { success: false, message: error.message, jobs: [] };
    }
};
