import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const useFetchJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to calculate "n days ago"
  const getDaysAgo = (date) => {
    const currentDate = new Date();
    const postedDate = new Date(date);
    const timeDifference = currentDate - postedDate; // Difference in milliseconds
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days

    if (daysDifference === 0) {
      return "Today";
    } else if (daysDifference === 1) {
      return "1 day ago";
    } else {
      return `${daysDifference} days ago`;
    }
  };

  // Helper function to check for pending applicants and update newApplicants flag
  const checkForPendingApplicants = async (jobId, applicants, currentNewApplicantsStatus) => {
    try {
      // Check if there are any pending applicants
      const hasPendingApplicants = applicants.some(applicant => applicant.status === "Pending");
      
      // If the newApplicants status needs to be updated
      if (hasPendingApplicants !== currentNewApplicantsStatus) {
        const jobRef = doc(db, "jobs", jobId);
        // Only update the newApplicants field, DO NOT include the applicants array
        await updateDoc(jobRef, {
          newApplicants: hasPendingApplicants
        });
        return hasPendingApplicants;
      }
      
      return currentNewApplicantsStatus;
    } catch (error) {
      console.error("Error updating newApplicants flag:", error);
      return currentNewApplicantsStatus;
    }
  };

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const jobsData = [];

      for (const doc of querySnapshot.docs) {
        const job = doc.data();

        // Convert Firestore Timestamps to JavaScript Date objects
        if (job.datePosted && typeof job.datePosted.toDate === "function") {
          const datePosted = job.datePosted.toDate();
          job.datePosted = getDaysAgo(datePosted); // Convert to "n days ago" format
        }

        // Fetch applicants from the subcollection
        const applicantsRef = collection(db, "jobs", doc.id, "applicants");
        const applicantsSnapshot = await getDocs(applicantsRef);
        const applicants = applicantsSnapshot.docs.map((applicantDoc) => ({
          id: applicantDoc.id,
          ...applicantDoc.data(),
          dateApplied: applicantDoc.data().dateApplied?.toDate() || null, // Convert Timestamp to Date
        }));
        
        // Check for pending applicants and update the flag if needed
        const newApplicantsStatus = await checkForPendingApplicants(
          doc.id, 
          applicants, 
          job.newApplicants || false
        );

        jobsData.push({ 
          id: doc.id, 
          ...job, 
          applicants,
          newApplicants: newApplicantsStatus
        });
      }

      setJobs([...jobsData]); // Create a new array reference to ensure React detects the change
    } catch (error) {
      setError("Failed to fetch jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // More efficient refresh function - only updates the jobs without changing loading state
  const refreshJobs = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      const jobsData = [];

      for (const doc of querySnapshot.docs) {
        const job = doc.data();

        // Convert Firestore Timestamps to JavaScript Date objects
        if (job.datePosted && typeof job.datePosted.toDate === "function") {
          const datePosted = job.datePosted.toDate();
          job.datePosted = getDaysAgo(datePosted); // Convert to "n days ago" format
        }

        // Fetch applicants from the subcollection
        const applicantsRef = collection(db, "jobs", doc.id, "applicants");
        const applicantsSnapshot = await getDocs(applicantsRef);
        const applicants = applicantsSnapshot.docs.map((applicantDoc) => ({
          id: applicantDoc.id,
          ...applicantDoc.data(),
          dateApplied: applicantDoc.data().dateApplied?.toDate() || null, 
        }));
        
        // Check for pending applicants and update the flag if needed
        const newApplicantsStatus = await checkForPendingApplicants(
          doc.id, 
          applicants, 
          job.newApplicants || false
        );

        jobsData.push({ 
          id: doc.id, 
          ...job, 
          applicants,
          newApplicants: newApplicantsStatus
        });
      }

      setJobs([...jobsData]); 
      return jobsData;
    } catch (error) {
      return [];
    }
  }, []);

  // Manual function to set jobs with proper reference change
  const updateJobs = useCallback((newJobs) => {
    if (typeof newJobs === "function") {
      setJobs(prevJobs => {
        const result = newJobs(prevJobs);
        return [...result]; // Create a new array reference
      });
    } else {
      setJobs([...newJobs]); // Create a new array reference
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, setJobs: updateJobs, refreshJobs: refreshJobs };
};

export default useFetchJobs;