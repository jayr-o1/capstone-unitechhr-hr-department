import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "../firebase";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    where,
} from "firebase/firestore";
import { getAllJobs, getUniversityJobs } from "../services/jobService";
import { auth } from "../firebase";
import { getUserData } from "../services/userService";

const useFetchJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [universityId, setUniversityId] = useState(null);
    
    // Cache mechanism to prevent too frequent refreshes
    const lastFetchTimeRef = useRef(0);
    const cacheTimeoutMs = 10000; // 10 seconds cache timeout
    const jobsCacheRef = useRef(null);
    
    // Track if the initial fetch has completed
    const initialFetchCompletedRef = useRef(false);

    // Function to calculate "n days ago"
    const getDaysAgo = (date) => {
        const currentDate = new Date();
        const postedDate = new Date(date);
        const timeDifference = currentDate - postedDate; // Difference in milliseconds
        const daysDifference = Math.floor(
            timeDifference / (1000 * 60 * 60 * 24)
        ); // Convert to days

        if (daysDifference === 0) {
            return "Today";
        } else if (daysDifference === 1) {
            return "1 day ago";
        } else {
            return `${daysDifference} days ago`;
        }
    };

    // Get the current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.log("No authenticated user found");
                    setLoading(false); // Still set loading to false even without a user
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    const newUniversityId = userDataResult.data.universityId;
                    console.log("User belongs to university:", newUniversityId);
                    setUniversityId(newUniversityId);
                } else {
                    console.log("User doesn't have a university association");
                    setLoading(false); // Set loading to false if no university association
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setLoading(false);
                setError("Error loading user data");
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    // Helper function to check for pending applicants and update newApplicants flag
    const checkForPendingApplicants = async (
        jobId,
        applicants,
        currentNewApplicantsStatus,
        jobUniversityId = null
    ) => {
        try {
            // Check if there are any pending applicants
            const hasPendingApplicants = applicants.some(
                (applicant) => applicant.status === "Pending"
            );
            
            console.log(`Job ${jobId}: Has pending applicants? ${hasPendingApplicants}`);

            // If the newApplicants status needs to be updated
            if (hasPendingApplicants !== currentNewApplicantsStatus) {
                console.log(`Updating newApplicants for job ${jobId} from ${currentNewApplicantsStatus} to ${hasPendingApplicants}`);
                
                // Update in main collection
                const jobRef = doc(db, "jobs", jobId);
                await updateDoc(jobRef, {
                    newApplicants: hasPendingApplicants,
                });
                
                // If job belongs to a university, also update in university's subcollection
                if (jobUniversityId) {
                    const universityJobRef = doc(db, "universities", jobUniversityId, "jobs", jobId);
                    await updateDoc(universityJobRef, {
                        newApplicants: hasPendingApplicants,
                    });
                    console.log(`Updated newApplicants flag in university collection for job ${jobId}`);
                }
            }

            // Always return the actual status based on pending applicants
            return hasPendingApplicants;
        } catch (error) {
            console.error(`Error updating newApplicants flag for job ${jobId}:`, error);
            // Return the actual status even if update fails
            return applicants.some((applicant) => applicant.status === "Pending");
        }
    };

    // Fetch jobs
    const fetchJobs = useCallback(async (force = false) => {
        // Skip fetch if we already have data and it's not a forced refresh
        // and the cache is still valid
        const currentTime = Date.now();
        if (!force && 
            jobsCacheRef.current && 
            currentTime - lastFetchTimeRef.current < cacheTimeoutMs) {
            console.log("Using cached jobs data");
            return jobsCacheRef.current;
        }
        
        // Only set loading to true if it's the initial fetch or a forced refresh
        if (!initialFetchCompletedRef.current || force) {
            setLoading(true);
        }
        
        try {
            console.log("Fetching jobs...");
            
            let result;
            // If universityId is available, use it to fetch university-specific jobs
            if (universityId) {
                console.log(`Fetching jobs for university: ${universityId}`);
                result = await getUniversityJobs(universityId, false);
            } else {
                // Check if user is authenticated - if so, they should have a universityId
                if (auth.currentUser) {
                    console.warn("User is authenticated but no universityId found. Jobs may not be filtered correctly.");
                }
                // Fallback to all jobs if no university ID - this should only happen for unauthenticated users
                console.log("No university ID found, fetching all jobs");
                result = await getAllJobs(false);
            }

            console.log("Jobs result:", result);

            if (!result.success) {
                throw new Error(result.message || "Failed to fetch jobs");
            }

            const jobsData = [];

            for (const job of result.jobs) {
                // Skip jobs that are marked as deleted
                if (job.isDeleted) {
                    console.log(`Skipping deleted job: ${job.id}`);
                    continue;
                }

                console.log(`Processing job: ${job.id}, title: ${job.title}`);

                // Convert Firestore Timestamps to JavaScript Date objects
                if (
                    job.datePosted &&
                    typeof job.datePosted.toDate === "function"
                ) {
                    const datePosted = job.datePosted.toDate();
                    job.datePosted = getDaysAgo(datePosted); // Convert to "n days ago" format
                }

                // Determine the collection path for applicants based on whether the job belongs to a university
                let applicantsPath;
                if (universityId && job.universityId === universityId) {
                    // Always prefer the university subcollection path when universityId matches
                    applicantsPath = collection(
                        db,
                        "universities",
                        universityId,
                        "jobs",
                        job.id,
                        "applicants"
                    );
                } else {
                    // Fallback to root collection only when necessary
                    applicantsPath = collection(
                        db,
                        "jobs",
                        job.id,
                        "applicants"
                    );
                }

                // Fetch applicants from the correct collection
                const applicantsSnapshot = await getDocs(applicantsPath);
                const applicants = applicantsSnapshot.docs.map(
                    (applicantDoc) => ({
                        id: applicantDoc.id,
                        ...applicantDoc.data(),
                        dateApplied:
                            applicantDoc.data().dateApplied?.toDate() || null, // Convert Timestamp to Date
                    })
                );

                console.log(`Job ${job.id} has ${applicants.length} applicants`);
                
                // Log pending applicants count
                const pendingApplicants = applicants.filter(applicant => applicant.status === "Pending");
                console.log(`Job ${job.id} has ${pendingApplicants.length} pending applicants`);

                // Check for pending applicants and update the flag if needed
                const newApplicantsStatus = await checkForPendingApplicants(
                    job.id,
                    applicants,
                    job.newApplicants || false,
                    job.universityId
                );
                
                console.log(`Job ${job.id} newApplicants flag set to: ${newApplicantsStatus}`);

                jobsData.push({
                    id: job.id,
                    ...job,
                    applicants,
                    newApplicants: newApplicantsStatus,
                });
            }

            console.log(`Total jobs processed: ${jobsData.length}`);
            
            // Update cache timestamp and cache data
            lastFetchTimeRef.current = Date.now();
            jobsCacheRef.current = [...jobsData];
            
            // Mark initial fetch as completed
            initialFetchCompletedRef.current = true;
            
            setJobs([...jobsData]); // Create a new array reference to ensure React detects the change
            return jobsData;
        } catch (error) {
            console.error("Error in fetchJobs:", error);
            setError("Failed to fetch jobs. Please try again.");
            return [];
        } finally {
            setLoading(false);
        }
    }, [universityId]);

    // More efficient refresh function - only updates the jobs without changing loading state
    // unless specifically requested
    const refreshJobs = useCallback(async (forceRefresh = false) => {
        console.log("Refreshing jobs, force refresh:", forceRefresh);
        
        // Set loading state if requested or if it's a forced refresh
        if (forceRefresh) {
            setLoading(true);
            // Clear the cache when forcing a refresh
            lastFetchTimeRef.current = 0;
            jobsCacheRef.current = null;
        }
        
        try {
            // Always force the fetch when refreshing
            const jobsData = await fetchJobs(true); 
            console.log(`Refreshed ${jobsData.length} jobs`);
            
            // Log applicant status for debugging
            if (forceRefresh) {
                jobsData.forEach(job => {
                    if (job.applicants && job.applicants.length > 0) {
                        console.log(`Job ${job.id} (${job.title}) has ${job.applicants.length} applicants:`);
                        job.applicants.forEach(app => 
                            console.log(`  - ${app.name}: ${app.status}`)
                        );
                    }
                });
            }
            
            return jobsData.length > 0;
        } catch (error) {
            console.error("Error refreshing jobs:", error);
            setError("Failed to refresh jobs. Please try again.");
            return false;
        } finally {
            if (forceRefresh) {
                setLoading(false);
            }
        }
    }, [fetchJobs]);

    // Manual function to set jobs with proper reference change
    const updateJobs = useCallback((newJobs) => {
        if (typeof newJobs === "function") {
            setJobs((prevJobs) => {
                const result = newJobs(prevJobs);
                return [...result]; // Create a new array reference
            });
        } else {
            setJobs([...newJobs]); // Create a new array reference
        }
    }, []);

    // Fetch jobs when the component mounts or universityId changes
    useEffect(() => {
        if (universityId) {
            fetchJobs();
        }
    }, [universityId, fetchJobs]);

    return { 
        jobs, 
        loading, 
        error, 
        setJobs: updateJobs, 
        refreshJobs, 
        universityId,
        fetchJobs // Export the fetchJobs function to allow forced refreshes
    };
};

export default useFetchJobs;
