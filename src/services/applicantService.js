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

        // Update the status
        await updateDoc(applicantRef, {
            status: status,
            statusUpdatedAt: serverTimestamp(),
        });

        // If the applicant is hired, update any related collections or fields
        if (status === "Hired") {
            // Get the applicant data
            const applicantDoc = await getDoc(applicantRef);
            if (applicantDoc.exists()) {
                const applicantData = applicantDoc.data();

                // Create a new employee record in the 'employees' collection
                await addDoc(collection(db, "employees"), {
                    name: applicantData.name,
                    email: applicantData.email,
                    phone: applicantData.phone || "",
                    position: applicantData.applyingFor || "",
                    department: applicantData.department || "",
                    dateHired: serverTimestamp(),
                    formerApplicant: true,
                    jobId: jobId,
                    applicantId: applicantId,
                    status: "New Hire",
                    onboardingStatus: "Pending",
                });
            }
        }

        return { success: true };
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
