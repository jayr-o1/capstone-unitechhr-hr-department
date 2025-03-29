import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, or, getDoc, doc } from "firebase/firestore";
import { getUserData } from "../../services/userService";

const HiredApplicants = () => {
    const [hiredApplicants, setHiredApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [universityId, setUniversityId] = useState(null);
    const navigate = useNavigate();

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found");
                    setLoading(false);
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setLoading(false);
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    // Fetch hired applicants when universityId changes
    useEffect(() => {
        if (universityId) {
            fetchHiredApplicants();
        }
    }, [universityId]);

    const fetchHiredApplicants = async () => {
        try {
            console.log("Fetching hired applicants with universityId:", universityId);
            const onboardingApplicants = [];
            
            // Check if the jobs collection exists
            const jobsRef = collection(db, "universities", universityId, "jobs");
            
            // Get all jobs from university collection
            const jobsQuery = query(
                jobsRef,
                where("isDeleted", "!=", true) // Exclude deleted jobs
            );
            
            console.log("Executing jobs query...");
            const jobsSnapshot = await getDocs(jobsQuery);
            console.log(`Found ${jobsSnapshot.size} total jobs`);

            // For each job, get applicants in onboarding and hired status
            for (const jobDoc of jobsSnapshot.docs) {
                const jobId = jobDoc.id;
                const jobData = jobDoc.data();
                console.log(`Processing job: ${jobId}, title: ${jobData.title || 'Unknown'}`);
                
                // Check if the job has applicants
                const applicantsCollectionPath = `universities/${universityId}/jobs/${jobId}/applicants`;
                console.log(`Checking applicants at: ${applicantsCollectionPath}`);
                
                const applicantsRef = collection(db, applicantsCollectionPath);
                
                // First check if the applicants collection exists and has any docs
                const applicantsTest = await getDocs(applicantsRef);
                console.log(`Job ${jobId} has ${applicantsTest.size} total applicants`);
                
                if (applicantsTest.size > 0) {
                    const applicantsQuery = query(
                        applicantsRef,
                        or(
                            where("status", "==", "In Onboarding"),
                            where("status", "==", "Hired")
                        )
                    );

                    const applicantsSnapshot = await getDocs(applicantsQuery);
                    console.log(`Job ${jobId} has ${applicantsSnapshot.size} hired/onboarding applicants`);

                    applicantsSnapshot.docs.forEach((doc) => {
                        onboardingApplicants.push({
                            id: doc.id,
                            jobId: jobId,
                            jobTitle: jobData.title || "Unknown Position",
                            ...doc.data(),
                            hiredAt:
                                doc.data().onboardingStartedAt?.toDate() ||
                                new Date(),
                        });
                    });
                }
            }

            console.log(`Total hired applicants found: ${onboardingApplicants.length}`);
            
            // Sort by hire date (newest first)
            onboardingApplicants.sort((a, b) => b.hiredAt - a.hiredAt);

            // Take only the most recent 3 applicants
            setHiredApplicants(onboardingApplicants.slice(0, 3));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching hired applicants:", error);
            setLoading(false);
        }
    };

    const handleApplicantClick = (jobId, applicantId) => {
        navigate(`/recruitment/${jobId}/${applicantId}`);
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto py-4">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className="h-16 bg-gray-200 rounded-lg"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (hiredApplicants.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto py-4">
                <div className="text-center text-gray-500">
                    No recent hires found
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-4">
            <div className="space-y-3">
                {hiredApplicants.map((applicant) => (
                    <div
                        key={`${applicant.jobId}-${applicant.id}`}
                        onClick={() =>
                            handleApplicantClick(applicant.jobId, applicant.id)
                        }
                        className="p-3 rounded-lg bg-[#ecfdf5] cursor-pointer hover:bg-[#d1fae5] transition-colors duration-200"
                    >
                        <p className="text-[#065f46]">
                            <span className="font-medium">
                                {applicant.name}
                            </span>{" "}
                            hired for the position of{" "}
                            <span className="font-medium">
                                {applicant.jobTitle}
                            </span>
                            {applicant.status === "Hired" && 
                                <span className="ml-1 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">
                                    New Hire
                                </span>
                            }
                        </p>
                        <p className="text-xs text-[#059669]">
                            {applicant.hiredAt.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HiredApplicants;
