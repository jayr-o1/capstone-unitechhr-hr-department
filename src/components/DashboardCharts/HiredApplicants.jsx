import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, getDocs, or } from "firebase/firestore";

const HiredApplicants = () => {
    const [hiredApplicants, setHiredApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHiredApplicants = async () => {
            try {
                const onboardingApplicants = [];
                // Get all jobs
                const jobsSnapshot = await getDocs(collection(db, "jobs"));

                // For each job, get applicants in onboarding and hired status
                for (const jobDoc of jobsSnapshot.docs) {
                    const jobId = jobDoc.id;
                    const applicantsQuery = query(
                        collection(db, "jobs", jobId, "applicants"),
                        or(
                            where("status", "==", "In Onboarding"),
                            where("status", "==", "Hired")
                        )
                    );

                    const applicantsSnapshot = await getDocs(applicantsQuery);

                    applicantsSnapshot.docs.forEach((doc) => {
                        onboardingApplicants.push({
                            id: doc.id,
                            jobId: jobId,
                            jobTitle: jobDoc.data().title,
                            ...doc.data(),
                            hiredAt:
                                doc.data().onboardingStartedAt?.toDate() ||
                                new Date(),
                        });
                    });
                }

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

        fetchHiredApplicants();
    }, []);

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
