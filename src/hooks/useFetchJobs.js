import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchJobs = async () => {
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

                    // Debugging: Log each job and its applicants
                    console.log("Job:", { id: doc.id, ...job });
                    console.log("Applicants:", applicants);
                }

                console.log("Fetched Jobs:", jobsData); // Debugging: Log fetched jobs
                setJobs(jobsData);
            } catch (error) {
                setError("Failed to fetch jobs. Please try again.");
                console.error("Error fetching jobs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return { jobs, loading, error };
};

export default useFetchJobs;