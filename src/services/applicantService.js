import { db } from "../firebase";
import {
    doc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp,
    getDoc,
    getDocs,
    setDoc,
} from "firebase/firestore";

// Update applicant status (Pending, Interviewing, Hired, Failed)
export const updateApplicantStatus = async (jobId, applicantId, status, universityId = null) => {
    try {
        // Reference to the applicant document in the main collection
        const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);

        // Get the applicant data for potential onboarding
        const applicantDoc = await getDoc(applicantRef);
        if (!applicantDoc.exists()) {
            return { success: false, message: "Applicant not found" };
        }

        const applicantData = applicantDoc.data();
        const updatedStatus = status === "Hired" ? "In Onboarding" : status;
        
        // Update data to be applied
        const updateData = {
            status: updatedStatus,
            statusUpdatedAt: serverTimestamp(),
            // For onboarding applicants, add onboarding metadata
            ...(updatedStatus === "In Onboarding" && {
                onboardingStartedAt: serverTimestamp(),
                onboardingStatus: "Not Started",
            }),
        };

        // Update in main collection
        await updateDoc(applicantRef, updateData);
        
        // If university ID is provided, also update in university's subcollection
        if (universityId) {
            const universityApplicantRef = doc(
                db, 
                "universities", 
                universityId, 
                "jobs", 
                jobId, 
                "applicants", 
                applicantId
            );
            await updateDoc(universityApplicantRef, updateData);
        }

        // Return success with the applicant ID and job info for navigation
        return {
            success: true,
            applicantId: applicantId,
            applicantData: {
                name: applicantData.name,
                email: applicantData.email,
                phone: applicantData.phone || "",
                position: applicantData.applyingFor || "",
                department: applicantData.department || "",
                dateStarted: new Date(),
            },
        };
    } catch (error) {
        console.error("Error updating applicant status:", error);
        return { success: false, message: error.message };
    }
};

// Schedule an interview for an applicant
export const scheduleInterview = async (jobId, applicantId, interviewData, universityId = null) => {
    try {
        // Add interview data
        const interviewWithMetadata = {
            ...interviewData,
            scheduledAt: serverTimestamp(),
            status: "Scheduled", // Scheduled, Completed, Canceled
        };
        
        // Add a new interview to the interviews subcollection in main collection
        const interviewsRef = collection(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews"
        );
        
        // Generate a document reference with an ID
        const newInterviewRef = doc(interviewsRef);
        const interviewId = newInterviewRef.id;
        
        // Save the interview data to main collection
        await setDoc(newInterviewRef, interviewWithMetadata);
        
        // If university ID is provided, also save to university's subcollection
        if (universityId) {
            const universityInterviewRef = doc(
                db,
                "universities", 
                universityId,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews",
                interviewId
            );
            await setDoc(universityInterviewRef, interviewWithMetadata);
        }

        // Update applicant status to "Interviewing" if currently "Pending"
        await updateApplicantStatus(jobId, applicantId, "Interviewing", universityId);

        return { success: true, interviewId };
    } catch (error) {
        console.error("Error scheduling interview:", error);
        return { success: false, message: error.message };
    }
};

// Get all interviews for an applicant
export const getApplicantInterviews = async (jobId, applicantId, universityId = null) => {
    try {
        // Reference to the interviews subcollection
        let interviewsRef;
        
        if (universityId) {
            // Use university's subcollection if universityId is provided
            interviewsRef = collection(
                db,
                "universities",
                universityId,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews"
            );
        } else {
            // Fall back to main collection
            interviewsRef = collection(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews"
            );
        }
        
        const querySnapshot = await getDocs(interviewsRef);

        // Map the interview documents to an array
        const interviews = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, interviews };
    } catch (error) {
        console.error("Error getting interviews:", error);
        return { success: false, message: error.message, interviews: [] };
    }
};

// Add or update notes for an applicant
export const updateApplicantNotes = async (jobId, applicantId, notes, universityId = null) => {
    try {
        const updateData = {
            notes: notes,
            notesUpdatedAt: serverTimestamp(),
        };
        
        // Update in main collection
        const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);
        await updateDoc(applicantRef, updateData);
        
        // If university ID is provided, also update in university's subcollection
        if (universityId) {
            const universityApplicantRef = doc(
                db,
                "universities",
                universityId,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );
            await updateDoc(universityApplicantRef, updateData);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating applicant notes:", error);
        return { success: false, message: error.message };
    }
};

// Update an existing interview
export const updateInterview = async (
    jobId,
    applicantId,
    interviewId,
    interviewData,
    universityId = null
) => {
    try {
        const updateData = {
            ...interviewData,
            lastUpdated: serverTimestamp(),
        };
        
        // Update in main collection
        const interviewRef = doc(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews",
            interviewId
        );
        await updateDoc(interviewRef, updateData);
        
        // If university ID is provided, also update in university's subcollection
        if (universityId) {
            const universityInterviewRef = doc(
                db,
                "universities",
                universityId,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews",
                interviewId
            );
            await updateDoc(universityInterviewRef, updateData);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating interview:", error);
        return { success: false, message: error.message };
    }
};

// Update interview notes
export const updateInterviewNotes = async (
    jobId,
    applicantId,
    interviewId,
    notes,
    status,
    universityId = null
) => {
    try {
        // Create update data object
        const updateData = {
            notes: notes,
            notesUpdatedAt: serverTimestamp(),
        };

        // Only include status if it's provided
        if (status) {
            updateData.status = status;
        }

        // Update in main collection
        const interviewRef = doc(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews",
            interviewId
        );
        await updateDoc(interviewRef, updateData);
        
        // If university ID is provided, also update in university's subcollection
        if (universityId) {
            const universityInterviewRef = doc(
                db,
                "universities",
                universityId,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews",
                interviewId
            );
            await updateDoc(universityInterviewRef, updateData);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating interview notes:", error);
        return { success: false, message: error.message };
    }
};
