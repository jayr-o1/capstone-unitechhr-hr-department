import { db } from "../firebase";
import {
    doc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp,
    getDoc,
    getDocs,
} from "firebase/firestore";

// Update applicant status (Pending, Interviewing, Hired, Failed)
export const updateApplicantStatus = async (jobId, applicantId, status) => {
    try {
        // Reference to the applicant document
        const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);

        // Get the applicant data for potential onboarding
        const applicantDoc = await getDoc(applicantRef);
        if (!applicantDoc.exists()) {
            return { success: false, message: "Applicant not found" };
        }

        const applicantData = applicantDoc.data();
        const updatedStatus = status === "Hired" ? "In Onboarding" : status;

        // Update the status
        await updateDoc(applicantRef, {
            status: updatedStatus,
            statusUpdatedAt: serverTimestamp(),
            // For onboarding applicants, add onboarding metadata
            ...(updatedStatus === "In Onboarding" && {
                onboardingStartedAt: serverTimestamp(),
                onboardingStatus: "Not Started",
            }),
        });

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
export const scheduleInterview = async (jobId, applicantId, interviewData) => {
    try {
        // Add a new interview to the interviews subcollection
        const interviewsRef = collection(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews"
        );

        // Save the interview data
        const newInterview = await addDoc(interviewsRef, {
            ...interviewData,
            scheduledAt: serverTimestamp(),
            status: "Scheduled", // Scheduled, Completed, Canceled
        });

        // Update applicant status to "Interviewing" if currently "Pending"
        const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);
        const applicantDoc = await getDoc(applicantRef);

        if (applicantDoc.exists() && applicantDoc.data().status === "Pending") {
            await updateDoc(applicantRef, {
                status: "Interviewing",
                statusUpdatedAt: serverTimestamp(),
            });
        }

        return { success: true, interviewId: newInterview.id };
    } catch (error) {
        console.error("Error scheduling interview:", error);
        return { success: false, message: error.message };
    }
};

// Get all interviews for an applicant
export const getApplicantInterviews = async (jobId, applicantId) => {
    try {
        // Reference to the interviews subcollection
        const interviewsRef = collection(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews"
        );
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
export const updateApplicantNotes = async (jobId, applicantId, notes) => {
    try {
        const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);

        await updateDoc(applicantRef, {
            notes: notes,
            notesUpdatedAt: serverTimestamp(),
        });

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
    interviewData
) => {
    try {
        // Reference to the interview document
        const interviewRef = doc(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews",
            interviewId
        );

        // Update the interview data
        await updateDoc(interviewRef, {
            ...interviewData,
            lastUpdated: serverTimestamp(),
        });

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
    status
) => {
    try {
        // Reference to the interview document
        const interviewRef = doc(
            db,
            "jobs",
            jobId,
            "applicants",
            applicantId,
            "interviews",
            interviewId
        );

        // Create update data object
        const updateData = {
            notes: notes,
            notesUpdatedAt: serverTimestamp(),
        };

        // Only include status if it's provided
        if (status) {
            updateData.status = status;
        }

        // Update the interview document
        await updateDoc(interviewRef, updateData);

        return { success: true };
    } catch (error) {
        console.error("Error updating interview notes:", error);
        return { success: false, message: error.message };
    }
};
