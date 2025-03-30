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
        console.log(`Updating applicant status - Job ID: ${jobId}, Applicant ID: ${applicantId}, New Status: ${status}, University ID: ${universityId || 'none'}`);
        
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

        if (universityId) {
            // Prioritize university collection when universityId is provided
            const universityApplicantRef = doc(
                db, 
                "universities", 
                universityId, 
                "jobs", 
                jobId, 
                "applicants", 
                applicantId
            );
            
            // Get the university applicant data
            const universityApplicantDoc = await getDoc(universityApplicantRef);
            
            if (!universityApplicantDoc.exists()) {
                console.error("❌ Applicant not found in university collection");
                return { success: false, message: "Applicant not found in university collection" };
            }
            
            const applicantData = universityApplicantDoc.data();
            console.log("Current university applicant data:", { status: applicantData.status, name: applicantData.name });
            
            // Update in university collection
            await updateDoc(universityApplicantRef, updateData);
            console.log("✅ Updated applicant status in university collection");
            
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
        } else {
            // Reference to the applicant document in the main collection
            const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);
            
            // Get the applicant data
            const applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                console.error("❌ Applicant not found in global collection");
                return { success: false, message: "Applicant not found in global collection" };
            }
            
            const applicantData = applicantDoc.data();
            console.log("Current global applicant data:", { status: applicantData.status, name: applicantData.name });
            
            // Update in global collection
            await updateDoc(applicantRef, updateData);
            console.log("✅ Updated applicant status in global collection");
            
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
        }
    } catch (error) {
        console.error("❌ Error updating applicant status:", error);
        return { success: false, message: error.message };
    }
};

// Schedule an interview for an applicant
export const scheduleInterview = async (jobId, applicantId, interviewData, universityId = null) => {
    try {
        console.log(`Scheduling interview - Job ID: ${jobId}, Applicant ID: ${applicantId}, University ID: ${universityId || 'none'}`);
        
        // Add interview data with metadata
        const interviewWithMetadata = {
            ...interviewData,
            scheduledAt: serverTimestamp(),
            status: "Scheduled", // Scheduled, Completed, Canceled
        };
        
        // Get applicant reference based on whether we're in university context or global
        let applicantRef;
        let applicantDoc;
        let applicantData;
        
        if (universityId) {
            // Use university's collection if universityId is provided
            applicantRef = doc(db, "universities", universityId, "jobs", jobId, "applicants", applicantId);
            applicantDoc = await getDoc(applicantRef);
            
            if (!applicantDoc.exists()) {
                console.error("❌ Applicant not found in university collection");
                return { success: false, message: "Applicant not found in university collection" };
            }
            
            applicantData = applicantDoc.data();
            console.log("Current university applicant data:", { status: applicantData.status, name: applicantData.name });
            
            // Create a new interview in the university collection
            const interviewsRef = collection(
                db,
                "universities", 
                universityId,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews"
            );
            
            // Generate a document reference with an ID
            const newInterviewRef = doc(interviewsRef);
            const interviewId = newInterviewRef.id;
            
            console.log(`Created interview with ID: ${interviewId} in university collection`);
            
            // Save the interview data to university collection
            await setDoc(newInterviewRef, interviewWithMetadata);
            console.log("✅ Interview saved to university collection");
            
            // Update applicant status in university collection
            try {
                console.log(`Updating university applicant status from ${applicantData.status} to Interviewing...`);
                
                const updateData = {
                    status: "Interviewing",
                    statusUpdatedAt: serverTimestamp()
                };
                
                await updateDoc(applicantRef, updateData);
                console.log("✅ Status updated in university collection");
            } catch (statusError) {
                console.error("❌ Error updating university applicant status:", statusError);
                // Continue with interview creation even if status update fails
            }
            
            return { success: true, interviewId };
        } else {
            // Use global collection when no universityId is provided
            applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);
            applicantDoc = await getDoc(applicantRef);
            
            if (!applicantDoc.exists()) {
                console.error("❌ Applicant not found in global collection");
                return { success: false, message: "Applicant not found" };
            }
            
            applicantData = applicantDoc.data();
            console.log("Current global applicant data:", { status: applicantData.status, name: applicantData.name });
            
            // Add a new interview to the interviews subcollection in global collection
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
            
            console.log(`Created interview with ID: ${interviewId} in global collection`);
            
            // Save the interview data to global collection
            await setDoc(newInterviewRef, interviewWithMetadata);
            console.log("✅ Interview saved to global collection");
            
            // Update applicant status in global collection
            try {
                console.log(`Updating global applicant status from ${applicantData.status} to Interviewing...`);
                
                const updateData = {
                    status: "Interviewing",
                    statusUpdatedAt: serverTimestamp()
                };
                
                await updateDoc(applicantRef, updateData);
                console.log("✅ Status updated in global collection");
            } catch (statusError) {
                console.error("❌ Error updating global applicant status:", statusError);
                // Continue with interview creation even if status update fails
            }
            
            return { success: true, interviewId };
        }
    } catch (error) {
        console.error("❌ Error scheduling interview:", error);
        return { success: false, message: error.message };
    }
};

// Get all interviews for an applicant
export const getApplicantInterviews = async (jobId, applicantId, universityId = null) => {
    try {
        // Reference to the interviews subcollection
        let interviewsRef;
        
        if (universityId) {
            // Prioritize university collection when universityId is provided
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
            
            console.log(`Getting interviews from university collection - Job ID: ${jobId}, Applicant ID: ${applicantId}, University ID: ${universityId}`);
        } else {
            // Fall back to global collection
            interviewsRef = collection(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId,
                "interviews"
            );
            
            console.log(`Getting interviews from global collection - Job ID: ${jobId}, Applicant ID: ${applicantId}`);
        }
        
        const querySnapshot = await getDocs(interviewsRef);

        // Map the interview documents to an array
        const interviews = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        
        console.log(`Found ${interviews.length} interviews`);

        return { success: true, interviews };
    } catch (error) {
        console.error("❌ Error getting interviews:", error);
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
        
        if (universityId) {
            // Prioritize university collection when universityId is provided
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
            console.log("✅ Applicant notes updated in university collection");
            
            return { success: true };
        } else {
            // Update in global collection
            const applicantRef = doc(db, "jobs", jobId, "applicants", applicantId);
            await updateDoc(applicantRef, updateData);
            console.log("✅ Applicant notes updated in global collection");
            
            return { success: true };
        }
    } catch (error) {
        console.error("❌ Error updating applicant notes:", error);
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
        
        if (universityId) {
            // Prioritize university collection when universityId is provided
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
            console.log("✅ Interview updated in university collection");
            
            return { success: true };
        } else {
            // Update in global collection
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
            console.log("✅ Interview updated in global collection");
            
            return { success: true };
        }
    } catch (error) {
        console.error("❌ Error updating interview:", error);
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

        if (universityId) {
            // Prioritize university collection when universityId is provided
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
            console.log("✅ Interview notes updated in university collection");
            
            return { success: true };
        } else {
            // Update in global collection
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
            console.log("✅ Interview notes updated in global collection");
            
            return { success: true };
        }
    } catch (error) {
        console.error("❌ Error updating interview notes:", error);
        return { success: false, message: error.message };
    }
};
