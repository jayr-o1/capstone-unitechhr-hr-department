import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

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

        jobsData.push({ id: doc.id, ...job, applicants });
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

        jobsData.push({ id: doc.id, ...job, applicants });
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